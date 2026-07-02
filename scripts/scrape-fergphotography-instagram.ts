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
const instagramUsername = "fergphotography";
const instagramUserId = process.env.DORVELL_INSTAGRAM_USER_ID ?? "7363334431";
const profileUrl = `https://www.instagram.com/${instagramUsername}/`;
const timelineDocId = "7950326061742207";
const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const minimumImageEdge = Number(process.env.DORVELL_INSTAGRAM_MIN_EDGE ?? 1);
const postLimit = Number(process.env.DORVELL_INSTAGRAM_POST_LIMIT ?? 360);
const imageLimit = Number(process.env.DORVELL_INSTAGRAM_IMAGE_LIMIT ?? 2200);
const graphqlPageLimit = Number(process.env.DORVELL_INSTAGRAM_GRAPHQL_PAGE_LIMIT ?? 40);
const detailPostLimit = Number(process.env.DORVELL_INSTAGRAM_DETAIL_POST_LIMIT ?? 24);
const timelinePageSize = Number(process.env.DORVELL_INSTAGRAM_GRAPHQL_PAGE_SIZE ?? 12);
const timelinePageDelayMs = Number(process.env.DORVELL_INSTAGRAM_GRAPHQL_PAGE_DELAY_MS ?? 450);

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

type InstagramCollectionResult = {
  postUrls: string[];
  candidates: InstagramCandidate[];
  hasNextPage: boolean;
  totalPosts: number;
  userId?: string;
  pagesScanned?: number;
  limitedByPostLimit?: boolean;
  limitedByPageLimit?: boolean;
};

function emptyCollectionResult(): InstagramCollectionResult {
  return { postUrls: [], candidates: [], hasNextPage: false, totalPosts: 0 };
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function postCodeFromUrl(url: string) {
  const match = url.match(/instagram\.com\/(?:[^/]+\/)?(?:p|reel)\/([^/?#]+)/);
  return match?.[1] ?? createHash("sha1").update(url).digest("hex").slice(0, 10);
}

function instagramPostUrl(shortcode: string) {
  return `https://www.instagram.com/${instagramUsername}/p/${shortcode}/`;
}

function normalizeInstagramPostUrl(url: string) {
  const match = url.match(/instagram\.com\/(?:[^/]+\/)?(?:p|reel)\/([^/?#]+)/);
  return match?.[1] ? instagramPostUrl(match[1]) : url;
}

function instagramImageKey(url: string) {
  const filename = url.split("?")[0]?.split("/").pop();
  return filename || createHash("sha1").update(url).digest("hex");
}

function isInstagramPhotoCdnUrl(url: string) {
  return (
    /scontent|cdninstagram|fbcdn/.test(url) &&
    /\/v\/t(?:39|51)\.[^/]+\/[^/?]+\.(?:jpe?g|webp)/i.test(url) &&
    !/s150x150|profile_pic/i.test(url)
  );
}

function categoryForCaption(caption: string, postUrl: string): DorvellCategory {
  const text = `${caption} ${postUrl}`.toLowerCase();
  if (
    /(concert|performance|performing|performer|stage|live|music|artist|rapper|dj|song|album|festival|rolling\s*loud|tampa\s*bay\s*live|cuban\s*club|wallstreet|rebelwrld|trippie|swae|waka|kanye|\bye\b|jodyhighroller|riff\s*raff|smokepurpp|domusquintus)/.test(text)
  ) {
    return "Music";
  }
  if (
    /(nike|hibbett|athlete|athletic|sports|basketball|football|soccer|volleyball|march\s*madness|team|youth|game|tournament|training|coach|high\s*school|gt\s*cut|drenchman|kingbb|lions|clinic|camp|court|league)/.test(text)
  ) {
    return "Athletics";
  }
  if (
    /(fashion|style|fits?\b|runway|model|modeling|designer|lookbook|editorial|collection|styled|styling|vintage\s*market|thetampavintagemarket|lillilyresale|bellateebagy|balenciaga|clothing|wardrobe|outfit|garment|fit\s*check|bookings|collaborations)/.test(text)
  ) {
    return "Fashion";
  }
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
  if (/concert|performance|stage|live|festival|artist|music/.test(text)) tags.add("Concerts");
  if (/fashion|style|fits?\b|runway|lookbook|editorial|vintage\s*market|outfit/.test(text)) tags.add("Fashion");
  if (/model|modeling|runway/.test(text)) tags.add("Modeling");
  if (/nike|athlete|sports|basketball|football|team|court|training/.test(text)) tags.add("Sports");
  if (text.includes("booking")) tags.add("Booking");
  return Array.from(tags);
}

function applyCandidateMetadata(image: DorvellImage, candidate: InstagramCandidate) {
  image.category = candidate.category;
  image.tags = candidate.tags;
  image.projectSlug = candidate.projectSlug;
  image.projectTitle = candidate.projectTitle;
  if (candidate.caption) image.caption = candidate.caption;
  if (candidate.alt) image.alt = candidate.alt;
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
  if (!resource.url || !isInstagramPhotoCdnUrl(resource.url)) return;

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

function addApiPostCandidates(candidates: Map<string, InstagramCandidate>, post: InstagramApiMediaNode) {
  if (!post.shortcode) return;
  const postUrl = instagramPostUrl(post.shortcode);
  const caption = captionForApiNode(post);

  if (post.__typename === "GraphSidecar") {
    for (const childEdge of post.edge_sidecar_to_children?.edges ?? []) {
      if (childEdge.node) addApiCandidate(candidates, childEdge.node, postUrl, caption);
    }
    return;
  }

  addApiCandidate(candidates, post, postUrl, caption);
}

async function collectProfileApiCandidates(): Promise<InstagramCollectionResult> {
  const response = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${instagramUsername}`, {
    headers: instagramRequestHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Instagram profile API failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as InstagramProfileApiResponse;
  const user = payload.data?.user;
  const media = user?.edge_owner_to_timeline_media;
  const postUrls: string[] = [];
  const candidates = new Map<string, InstagramCandidate>();

  for (const edge of media?.edges ?? []) {
    const post = edge.node;
    if (!post?.shortcode) continue;
    const postUrl = instagramPostUrl(post.shortcode);
    postUrls.push(postUrl);
    addApiPostCandidates(candidates, post);
  }

  return {
    postUrls,
    candidates: Array.from(candidates.values()),
    hasNextPage: media?.page_info?.has_next_page ?? false,
    totalPosts: media?.count ?? postUrls.length,
    userId: user?.id,
  };
}

async function fetchTimelinePage(userId: string, after?: string) {
  const variables: Record<string, string | number | boolean> = {
    id: userId,
    include_clips_attribution_info: false,
    first: timelinePageSize,
  };
  if (after) variables.after = after;

  const query = new URLSearchParams({
    doc_id: timelineDocId,
    variables: JSON.stringify(variables),
  });
  const response = await fetch(`https://www.instagram.com/graphql/query/?${query.toString()}`, {
    headers: instagramRequestHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Instagram GraphQL timeline failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as InstagramProfileApiResponse;
}

async function collectTimelineGraphqlCandidates(userId?: string): Promise<InstagramCollectionResult> {
  if (!userId) {
    return { postUrls: [], candidates: [], hasNextPage: false, totalPosts: 0 };
  }

  const postUrlSet = new Set<string>();
  const candidates = new Map<string, InstagramCandidate>();
  let after: string | undefined;
  let totalPosts = 0;
  let hasNextPage = false;
  let pagesScanned = 0;

  for (let pageIndex = 0; pageIndex < graphqlPageLimit && postUrlSet.size < postLimit; pageIndex += 1) {
    const payload = await fetchTimelinePage(userId, after);
    const media = payload.data?.user?.edge_owner_to_timeline_media;
    if (!media) throw new Error("Instagram GraphQL timeline response did not include media edges.");

    totalPosts = media.count ?? totalPosts;
    pagesScanned += 1;
    for (const edge of media.edges ?? []) {
      const post = edge.node;
      if (!post?.shortcode || postUrlSet.size >= postLimit) continue;
      postUrlSet.add(instagramPostUrl(post.shortcode));
      addApiPostCandidates(candidates, post);
    }

    hasNextPage = media.page_info?.has_next_page ?? false;
    after = media.page_info?.end_cursor;
    if (!hasNextPage || !after) break;
    if (timelinePageDelayMs > 0) await wait(timelinePageDelayMs);
  }

  return {
    postUrls: Array.from(postUrlSet),
    candidates: Array.from(candidates.values()),
    hasNextPage,
    totalPosts,
    pagesScanned,
    limitedByPostLimit: totalPosts > 0 && postUrlSet.size < totalPosts && postUrlSet.size >= postLimit,
    limitedByPageLimit: hasNextPage && pagesScanned >= graphqlPageLimit,
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

  return Array.from(new Set(posts.map(normalizeInstagramPostUrl))).slice(0, postLimit);
}

async function collectPostCandidates(page: Page, postUrl: string) {
  const networkUrls = new Set<string>();
  const onResponse = (response: { url: () => string; headers: () => Record<string, string> }) => {
    const url = response.url();
    const contentType = response.headers()["content-type"] || "";
    if (contentType.startsWith("image/") && isInstagramPhotoCdnUrl(url)) {
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
      if (!isInstagramPhotoCdnUrl(url)) return;
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
  const previousScrapeSummary = manifest.scrapeSummary;
  const existingHashes = new Set(manifest.images.map((image) => image.hash));
  const existingSourceKeys = new Set(manifest.images.map((image) => instagramImageKey(image.sourceUrl)));
  const existingBySourceKey = new Map(manifest.images.map((image) => [instagramImageKey(image.sourceUrl), image]));
  const existingInstagramPostUrls = [
    ...manifest.images
      .map((image) => image.sourcePage)
      .filter((sourcePage) => sourcePage.includes("instagram.com")),
    ...(manifest.pages.find((pageRecord) => pageRecord.url === profileUrl)?.links.map((link) => link.href) ?? []),
  ].map(normalizeInstagramPostUrl);
  const warnings = (manifest.scrapeSummary?.warnings ?? []).filter(
    (warning) =>
      !warning.startsWith("Instagram image download failed") &&
      !warning.startsWith("Instagram scrape failed") &&
      !warning.startsWith("Instagram public profile API exposed") &&
      !warning.startsWith("Instagram GraphQL") &&
      !warning.includes("Instagram GraphQL timeline failed"),
  );
  let apiWarning: string | undefined;
  let timelineWarning: string | undefined;
  const apiResult: InstagramCollectionResult = await collectProfileApiCandidates().catch((error) => {
    apiWarning = String(error);
    warnings.push(apiWarning);
    return emptyCollectionResult();
  });

  const timelineResult: InstagramCollectionResult = await collectTimelineGraphqlCandidates(apiResult.userId ?? instagramUserId).catch((error) => {
    timelineWarning = String(error);
    warnings.push(timelineWarning);
    return emptyCollectionResult();
  });
  if (timelineResult.limitedByPostLimit) {
    warnings.push(
      `Instagram GraphQL pagination stopped at DORVELL_INSTAGRAM_POST_LIMIT=${postLimit} of ${timelineResult.totalPosts} posts.`,
    );
  } else if (timelineResult.limitedByPageLimit) {
    warnings.push(
      `Instagram GraphQL pagination stopped at DORVELL_INSTAGRAM_GRAPHQL_PAGE_LIMIT=${graphqlPageLimit} after ${timelineResult.postUrls.length} of ${timelineResult.totalPosts} posts.`,
    );
  } else if (!timelineWarning && apiResult.hasNextPage && timelineResult.postUrls.length <= apiResult.postUrls.length) {
    warnings.push(
      `Instagram public profile API exposed ${apiResult.postUrls.length} of ${apiResult.totalPosts} posts and GraphQL pagination did not return older pages.`,
    );
  }

  const browserOptions = existsSync(chromePath)
    ? { headless: true, executablePath: chromePath, args: ["--disable-gpu", "--no-sandbox"] }
    : { headless: true };

  const allCandidates: InstagramCandidate[] = [...timelineResult.candidates, ...apiResult.candidates];
  let browserPostUrls: string[] = [];
  let detailPostUrls: string[] = [];

  try {
    const { chromium } = await import("playwright");
    const browser: Browser = await chromium.launch(browserOptions);
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, userAgent });

    try {
      browserPostUrls = await collectProfilePosts(page);
      detailPostUrls = Array.from(new Set([...timelineResult.postUrls, ...apiResult.postUrls, ...browserPostUrls, ...existingInstagramPostUrls]))
        .slice(0, postLimit)
        .slice(0, detailPostLimit);

      for (const postUrl of detailPostUrls) {
        try {
          const candidates = await collectPostCandidates(page, postUrl);
          allCandidates.push(...candidates);
        } catch (error) {
          warnings.push(`Instagram scrape failed for ${postUrl}: ${String(error)}`);
        }
      }
    } finally {
      await browser.close();
    }
  } catch (error) {
    warnings.push(`Instagram browser scrape failed: ${String(error)}`);
  }

  const postUrls = Array.from(new Set([...timelineResult.postUrls, ...apiResult.postUrls, ...browserPostUrls, ...existingInstagramPostUrls])).slice(
    0,
    postLimit,
  );

  const candidateMap = allCandidates.reduce((map, candidate) => {
    const key = instagramImageKey(candidate.url);
    const current = map.get(key);
    if (!current || candidate.width * candidate.height > current.width * current.height) map.set(key, candidate);
    return map;
  }, new Map<string, InstagramCandidate>());
  const uniqueCandidates = Array.from(candidateMap.values()).slice(0, imageLimit);

  let downloaded = 0;
  let duplicates = 0;
  let alreadyKnown = 0;
  let metadataRefreshed = 0;
  let skippedSmall = 0;
  for (const candidate of uniqueCandidates) {
    try {
      const sourceKey = instagramImageKey(candidate.url);
      if (existingSourceKeys.has(sourceKey)) {
        const existingImage = existingBySourceKey.get(sourceKey);
        if (existingImage) {
          applyCandidateMetadata(existingImage, candidate);
          metadataRefreshed += 1;
        }
        alreadyKnown += 1;
        continue;
      }
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
      existingSourceKeys.add(sourceKey);
      const id = `ig-${result.hash.slice(0, 12)}`;
      const imageRecord: DorvellImage = {
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
      };
      existingBySourceKey.set(sourceKey, imageRecord);
      manifest.images.push(imageRecord);
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
  const preservePreviousWarnings =
    (apiWarning || timelineWarning) &&
    downloaded === 0 &&
    metadataRefreshed === 0 &&
    previousScrapeSummary?.warnings &&
    previousScrapeSummary.warnings.length > 0;

  manifest.scrapeSummary = {
    pagesScraped: manifest.pages.length,
    imagesFound: manifest.images.length + skippedSmall,
    imagesDownloaded: manifest.images.length,
    duplicatesRemoved: (manifest.scrapeSummary?.duplicatesRemoved ?? 0) + duplicates,
    missingAltText: manifest.images.filter((image) => image.needsAltReview).length,
    categories: categoryCounts(manifest.images),
    warnings: preservePreviousWarnings ? previousScrapeSummary.warnings : warnings,
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        profileUrl,
        postsFound: postUrls.length,
        postsVisitedForDetail: detailPostUrls.length,
        graphQlPagesScanned: timelineResult.pagesScanned ?? 0,
        candidatesFound: uniqueCandidates.length,
        imagesAdded: downloaded,
        alreadyKnown,
        metadataRefreshed,
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
