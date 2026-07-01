import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "playwright";
import sharp from "sharp";
import type { DorvellCategory, DorvellImage, DorvellSiteContent } from "../src/content/dorvell.schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const originalsDir = path.join(publicDir, "dorvell", "originals");
const manifestPath = path.join(rootDir, "src", "content", "dorvell.generated.json");
const profileUrl = "https://www.instagram.com/fergphotography/";
const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const minimumImageEdge = Number(process.env.DORVELL_INSTAGRAM_MIN_EDGE ?? 900);

type InstagramCandidate = {
  url: string;
  postUrl: string;
  caption: string;
  alt: string;
  width: number;
  height: number;
  category: DorvellCategory;
  projectSlug: string;
  projectTitle: string;
  tags: string[];
};

type InstagramApiMediaNode = {
  __typename?: string;
  shortcode?: string;
  display_url?: string;
  display_resources?: Array<{
    src?: string;
    config_width?: number;
    config_height?: number;
  }>;
  dimensions?: {
    width?: number;
    height?: number;
  };
  accessibility_caption?: string;
  edge_media_to_caption?: {
    edges?: Array<{
      node?: {
        text?: string;
      };
    }>;
  };
  edge_sidecar_to_children?: {
    edges?: Array<{
      node?: InstagramApiMediaNode;
    }>;
  };
};

type InstagramProfileApiResponse = {
  data?: {
    user?: {
      id?: string;
      username?: string;
      edge_owner_to_timeline_media?: {
        count?: number;
        page_info?: {
          has_next_page?: boolean;
          end_cursor?: string;
        };
        edges?: Array<{
          node?: InstagramApiMediaNode;
        }>;
      };
    };
  };
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function postCodeFromUrl(url: string) {
  const match = url.match(/instagram\.com\/(?:[^/]+\/)?(?:p|reel)\/([^/?#]+)/);
  return match?.[1] ?? createHash("sha1").update(url).digest("hex").slice(0, 10);
}

function instagramImageKey(url: string) {
  const filename = url.split("?")[0]?.split("/").pop();
  return filename || createHash("sha1").update(url).digest("hex");
}

function categoryForCaption(caption: string, postUrl: string): DorvellCategory {
  const text = `${caption} ${postUrl}`.toLowerCase();
  if (/(concert|live|music|artist|swae|waka|trippie|ye|kanye|rolling loud|cuban club|wallstreet)/.test(text)) return "Music";
  if (/(nike|hibbett|athlete|athletic|sports|basketball|march madness|team|youth|game)/.test(text)) return "Athletics";
  if (/(fashion|style|fits|runway|model|garden|presence|coffee shop|portrait|bookings|collaborations)/.test(text)) return "Fashion";
  return "Portraits";
}

function laneForCategory(category: DorvellCategory) {
  if (category === "Music") {
    return { projectSlug: "concerts-musical-artist", projectTitle: "Ferg Photography / Music & Live" };
  }
  if (category === "Athletics") {
    return { projectSlug: "sports", projectTitle: "Ferg Photography / Sports & Athletics" };
  }
  if (category === "Fashion") {
    return { projectSlug: "fashioncreative-direction-coming-soon", projectTitle: "Ferg Photography / Fashion & Creative Direction" };
  }
  return { projectSlug: "fashion-shoots-2023", projectTitle: "Ferg Photography / Portraits" };
}

function tagsForCandidate(category: DorvellCategory, caption: string) {
  const tags = new Set<string>([category, "Instagram", "Ferg Photography"]);
  const text = caption.toLowerCase();
  if (text.includes("concert")) tags.add("Concerts");
  if (text.includes("fashion") || text.includes("style") || text.includes("fits")) tags.add("Fashion");
  if (text.includes("model")) tags.add("Modeling");
  if (text.includes("nike") || text.includes("athlete")) tags.add("Sports");
  if (text.includes("booking")) tags.add("Booking");
  return Array.from(tags);
}

function instagramRequestHeaders() {
  return {
    "user-agent": userAgent,
    "x-ig-app-id": "936619743392459",
    accept: "application/json,text/plain,*/*",
    referer: profileUrl,
  };
}

function bestApiImageResource(node: InstagramApiMediaNode) {
  const resources = (node.display_resources ?? [])
    .filter((resource) => resource.src)
    .sort((a, b) => (b.config_width ?? 0) * (b.config_height ?? 0) - (a.config_width ?? 0) * (a.config_height ?? 0));
  const best = resources[0];
  return {
    url: best?.src ?? node.display_url ?? "",
    width: best?.config_width ?? node.dimensions?.width ?? 640,
    height: best?.config_height ?? node.dimensions?.height ?? 640,
  };
}

function captionForApiNode(node: InstagramApiMediaNode) {
  return normalizeText(node.edge_media_to_caption?.edges?.[0]?.node?.text ?? "");
}

function addApiCandidate(
  candidates: Map<string, InstagramCandidate>,
  node: InstagramApiMediaNode,
  postUrl: string,
  caption: string,
) {
  if (node.__typename === "GraphVideo") return;

  const resource = bestApiImageResource(node);
  if (!resource.url || !/scontent|cdninstagram|fbcdn/.test(resource.url) || !/t51\.82787-15/.test(resource.url)) return;

  const alt = normalizeText(node.accessibility_caption ?? "") || `Dorvell Ferguson Jr. image from @fergphotography`;
  const category = categoryForCaption(`${caption} ${alt}`, postUrl);
  const lane = laneForCategory(category);
  const candidate: InstagramCandidate = {
    url: resource.url,
    postUrl,
    caption: caption.slice(0, 600),
    alt,
    width: resource.width,
    height: resource.height,
    category,
    projectSlug: lane.projectSlug,
    projectTitle: lane.projectTitle,
    tags: tagsForCandidate(category, `${caption} ${alt}`),
  };
  const key = instagramImageKey(resource.url);
  const current = candidates.get(key);
  if (!current || candidate.width * candidate.height > current.width * current.height) candidates.set(key, candidate);
}

async function collectProfileApiCandidates() {
  const response = await fetch("https://www.instagram.com/api/v1/users/web_profile_info/?username=fergphotography", {
    headers: instagramRequestHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Instagram profile API failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as InstagramProfileApiResponse;
  const media = payload.data?.user?.edge_owner_to_timeline_media;
  const postUrls: string[] = [];
  const candidates = new Map<string, InstagramCandidate>();

  for (const edge of media?.edges ?? []) {
    const post = edge.node;
    if (!post?.shortcode) continue;
    const postUrl = `https://www.instagram.com/fergphotography/p/${post.shortcode}/`;
    const caption = captionForApiNode(post);
    postUrls.push(postUrl);

    if (post.__typename === "GraphSidecar") {
      for (const childEdge of post.edge_sidecar_to_children?.edges ?? []) {
        if (childEdge.node) addApiCandidate(candidates, childEdge.node, postUrl, caption);
      }
      continue;
    }

    addApiCandidate(candidates, post, postUrl, caption);
  }

  return {
    postUrls,
    candidates: Array.from(candidates.values()),
    hasNextPage: media?.page_info?.has_next_page ?? false,
    totalPosts: media?.count ?? postUrls.length,
  };
}

async function collectProfilePosts(page: Page) {
  await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(6000);
  let lastCount = 0;
  let stablePasses = 0;
  const maxScrollPasses = Number(process.env.DORVELL_INSTAGRAM_PROFILE_SCROLL_PASSES ?? 32);

  for (let index = 0; index < maxScrollPasses; index += 1) {
    const count = await page.evaluate(
      () =>
        new Set(
          Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
            .map((anchor) => anchor.href)
            .filter((href) => /instagram\.com\/fergphotography\/(?:p|reel)\//.test(href)),
        ).size,
    );
    stablePasses = count === lastCount ? stablePasses + 1 : 0;
    lastCount = count;
    if (stablePasses >= 6) break;
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(750);
  }

  const posts = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
      .map((anchor) => anchor.href)
      .filter((href) => /instagram\.com\/fergphotography\/(?:p|reel)\//.test(href)),
  );

  return Array.from(new Set(posts)).slice(0, Number(process.env.DORVELL_INSTAGRAM_POST_LIMIT ?? 18));
}

async function collectPostCandidates(page: Page, postUrl: string) {
  const networkUrls = new Set<string>();
  const onResponse = (response: { url: () => string; headers: () => Record<string, string> }) => {
    const url = response.url();
    const contentType = response.headers()["content-type"] || "";
    if (contentType.startsWith("image/") && /scontent|cdninstagram|fbcdn/.test(url) && /t51\.82787-15/.test(url)) {
      networkUrls.add(url);
    }
  };

  page.on("response", onResponse);
  try {
    await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(4200);
    for (let index = 0; index < 12; index += 1) {
      const clicked = await page
        .locator('button[aria-label="Next"]')
        .last()
        .click({ timeout: 900 })
        .then(() => true)
        .catch(() => false);
      if (!clicked) break;
      await page.waitForTimeout(900);
    }

    const dom = await page.evaluate(() => {
      const caption = document.body.innerText || "";
      return Array.from(document.querySelectorAll<HTMLImageElement>("article img, main img"))
        .map((image) => ({
          url: image.currentSrc || image.src,
          alt: image.alt || "",
          width: image.naturalWidth || 0,
          height: image.naturalHeight || 0,
          caption,
        }))
        .filter((image) => image.url && image.width >= 420 && image.height >= 420 && !/profile picture/i.test(image.alt));
    });

    const candidates = new Map<string, InstagramCandidate>();
    const add = (url: string, width = 640, height = 640, alt = "", caption = "") => {
      if (!/scontent|cdninstagram|fbcdn/.test(url) || !/t51\.82787-15/.test(url)) return;
      if (/s150x150|profile_pic/.test(url)) return;
      const category = categoryForCaption(`${caption} ${alt}`, postUrl);
      const lane = laneForCategory(category);
      const candidate: InstagramCandidate = {
        url,
        postUrl,
        caption: normalizeText(caption).slice(0, 600),
        alt: normalizeText(alt) || `Dorvell Ferguson Jr. ${category.toLowerCase()} image from @fergphotography`,
        width,
        height,
        category,
        projectSlug: lane.projectSlug,
        projectTitle: lane.projectTitle,
        tags: tagsForCandidate(category, `${caption} ${alt}`),
      };
      const key = instagramImageKey(url);
      const current = candidates.get(key);
      if (!current || width * height > current.width * current.height) candidates.set(key, candidate);
    };

    dom.forEach((image) => add(image.url, image.width, image.height, image.alt, image.caption));
    networkUrls.forEach((url) => add(url));
    return Array.from(candidates.values());
  } finally {
    page.off("response", onResponse);
  }
}

async function downloadCandidate(candidate: InstagramCandidate) {
  const response = await fetch(candidate.url, {
    headers: {
      "user-agent": userAgent,
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      referer: candidate.postUrl,
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(bytes).metadata();
  const width = metadata.width ?? candidate.width;
  const height = metadata.height ?? candidate.height;
  if (Math.min(width, height) < minimumImageEdge) return null;

  const hash = createHash("sha256").update(bytes).digest("hex");
  const ext = metadata.format === "webp" ? "webp" : "jpg";
  const filename = `${hash.slice(0, 16)}-instagram-${postCodeFromUrl(candidate.postUrl)}.${ext}`;
  await writeFile(path.join(originalsDir, filename), bytes);
  return { hash, localOriginal: `/dorvell/originals/${filename}`, width, height };
}

function categoryCounts(images: DorvellImage[]) {
  return images.reduce<Record<string, number>>((counts, image) => {
    counts[image.category] = (counts[image.category] ?? 0) + 1;
    return counts;
  }, {});
}

async function main() {
  await mkdir(originalsDir, { recursive: true });

  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as DorvellSiteContent;
  const startingImageCount = manifest.images.length;
  const existingHashes = new Set(manifest.images.map((image) => image.hash));
  const warnings = (manifest.scrapeSummary?.warnings ?? []).filter(
    (warning) =>
      !warning.startsWith("Instagram image download failed") &&
      !warning.startsWith("Instagram scrape failed") &&
      !warning.startsWith("Instagram public profile API exposed"),
  );
  const apiResult = await collectProfileApiCandidates().catch((error) => {
    warnings.push(String(error));
    return { postUrls: [], candidates: [], hasNextPage: false, totalPosts: 0 };
  });
  if (apiResult.hasNextPage) {
    warnings.push(
      `Instagram public profile API exposed ${apiResult.postUrls.length} of ${apiResult.totalPosts} posts. Older-page pagination currently requires login/session access.`,
    );
  }
  const browserOptions = existsSync(chromePath)
    ? { headless: true, executablePath: chromePath, args: ["--disable-gpu", "--no-sandbox"] }
    : { headless: true };

  const { chromium } = await import("playwright");
  const browser: Browser = await chromium.launch(browserOptions);
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, userAgent });

  const postUrls = Array.from(new Set([...apiResult.postUrls, ...(await collectProfilePosts(page))])).slice(
    0,
    Number(process.env.DORVELL_INSTAGRAM_POST_LIMIT ?? 24),
  );
  const allCandidates: InstagramCandidate[] = [...apiResult.candidates];
  for (const postUrl of postUrls) {
    try {
      const candidates = await collectPostCandidates(page, postUrl);
      allCandidates.push(...candidates);
    } catch (error) {
      warnings.push(`Instagram scrape failed for ${postUrl}: ${String(error)}`);
    }
  }
  await browser.close();

  const candidateMap = allCandidates.reduce((map, candidate) => {
      const key = instagramImageKey(candidate.url);
      const current = map.get(key);
      if (!current || candidate.width * candidate.height > current.width * current.height) map.set(key, candidate);
      return map;
    }, new Map<string, InstagramCandidate>());
  const uniqueCandidates = Array.from(candidateMap.values()).slice(0, Number(process.env.DORVELL_INSTAGRAM_IMAGE_LIMIT ?? 120));

  let downloaded = 0;
  let duplicates = 0;
  let skippedSmall = 0;
  for (const candidate of uniqueCandidates) {
    try {
      const result = await downloadCandidate(candidate);
      if (!result) {
        skippedSmall += 1;
        continue;
      }
      if (existingHashes.has(result.hash)) {
        duplicates += 1;
        continue;
      }
      existingHashes.add(result.hash);
      const id = `ig-${result.hash.slice(0, 12)}`;
      manifest.images.push({
        id,
        sourceUrl: candidate.url,
        sourcePage: candidate.postUrl,
        localOriginal: result.localOriginal,
        localOptimized: { sm: "", md: "", lg: "" },
        width: result.width,
        height: result.height,
        aspectRatio: result.width / result.height,
        alt: candidate.alt,
        caption: candidate.caption,
        category: candidate.category,
        tags: candidate.tags,
        detectedFrom: "network",
        hash: result.hash,
        needsAltReview: false,
        needsCreditReview: true,
        projectSlug: candidate.projectSlug,
        projectTitle: candidate.projectTitle,
      });
      downloaded += 1;
    } catch (error) {
      warnings.push(`Instagram image download failed for ${candidate.postUrl}: ${String(error)}`);
    }
  }

  const instagramPage = {
    url: profileUrl,
    title: "Tampa-Based Photographer (@fergphotography)",
    headings: ["Portraits", "Music", "Fashion", "Tampa, FL"],
    paragraphs: ["Public Instagram scrape source for additional Dorvell Ferguson Jr. photography frames."],
    links: postUrls.map((href) => ({ text: postCodeFromUrl(href), href })),
  };
  manifest.pages = [...manifest.pages.filter((pageRecord) => pageRecord.url !== profileUrl), instagramPage];
  manifest.scrapedAt = new Date().toISOString();
  manifest.contacts.instagram = Array.from(new Set([...(manifest.contacts.instagram ?? []), profileUrl]));
  manifest.scrapeSummary = {
    pagesScraped: manifest.pages.length,
    imagesFound: startingImageCount + uniqueCandidates.length,
    imagesDownloaded: manifest.images.length,
    duplicatesRemoved: (manifest.scrapeSummary?.duplicatesRemoved ?? 0) + duplicates,
    missingAltText: manifest.images.filter((image) => image.needsAltReview).length,
    categories: categoryCounts(manifest.images),
    warnings,
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        profileUrl,
        postsVisited: postUrls.length,
        candidatesFound: uniqueCandidates.length,
        imagesAdded: downloaded,
        duplicates,
        skippedSmall,
        totalImages: manifest.images.length,
        categories: manifest.scrapeSummary.categories,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
