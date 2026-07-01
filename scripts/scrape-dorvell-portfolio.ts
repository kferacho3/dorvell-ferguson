import * as cheerio from "cheerio";
import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DorvellCategory, DorvellImage, DorvellSiteContent } from "../src/content/dorvell.schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const baseUrl = "https://dorvellferguson.myportfolio.com";
const sourceUrl = `${baseUrl}/home-2`;
const publicDir = path.join(rootDir, "public");
const originalsDir = path.join(publicDir, "dorvell", "originals");
const manifestPath = path.join(rootDir, "src", "content", "dorvell.generated.json");
const htmlCacheDir = path.join(rootDir, "tmp", "scrape-html");

type DetectedFrom = DorvellImage["detectedFrom"];

type ImageCandidate = {
  url: string;
  sourcePage: string;
  projectSlug?: string;
  projectTitle?: string;
  category: DorvellCategory;
  tags: string[];
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  detectedFrom: DetectedFrom;
  score: number;
};

type PageRecord = DorvellSiteContent["pages"][number];

const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const startPaths = ["/home-2", "/work", "/about", "/contact"];
const skippedInternalPrefixes = ["/dist", "/site", "/cdn-cgi"];

function absoluteUrl(value: string, pageUrl: string) {
  try {
    const url = new URL(value, pageUrl);
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function slugFromUrl(url: string) {
  const pathname = new URL(url).pathname;
  return pathname.replace(/^\/+/, "").replace(/\/+$/, "") || "home";
}

function projectTitleFromPage(title: string, url: string) {
  const stripped = title.replace(/^Dorvell Ferguson\s*-\s*/i, "").trim();
  if (stripped && stripped !== "Portfolio") return stripped;

  const slug = slugFromUrl(url)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return slug === "Home 2" ? "Opening Archive" : slug;
}

function categoryForPage(url: string, title: string): DorvellCategory {
  const haystack = `${url} ${title}`.toLowerCase();
  if (haystack.includes("concert") || haystack.includes("music") || haystack.includes("artist")) return "Music";
  if (haystack.includes("sport") || haystack.includes("athletic")) return "Athletics";
  if (haystack.includes("fashion") || haystack.includes("creative-direction")) return "Fashion";
  if (haystack.includes("portrait")) return "Portraits";
  if (haystack.includes("about")) return "Modeling";
  if (haystack.includes("contact")) return "Behind The Scenes";
  if (haystack.includes("home")) return "Modeling";
  return "Uncategorized";
}

function tagsForPage(category: DorvellCategory, title: string) {
  const tags = new Set<string>([category]);
  const lower = title.toLowerCase();
  if (lower.includes("portrait")) tags.add("Portraits");
  if (lower.includes("fashion")) tags.add("Fashion");
  if (lower.includes("creative")) tags.add("Creative Direction");
  if (lower.includes("concert")) tags.add("Concerts");
  if (lower.includes("artist")) tags.add("Artists");
  if (lower.includes("sport")) tags.add("Sports");
  if (lower.includes("about")) tags.add("Portrait");
  return Array.from(tags);
}

function parseSrcset(srcset: string, pageUrl: string) {
  return srcset
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((entry) => {
      const [rawUrl, rawWidth] = entry.split(/\s+/);
      const width = rawWidth?.endsWith("w") ? Number.parseInt(rawWidth, 10) : undefined;
      return { url: absoluteUrl(rawUrl, pageUrl), width: Number.isFinite(width) ? width : undefined };
    })
    .filter((item) => item.url);
}

function imageKeyFromUrl(url: string) {
  const withoutQuery = url.split("?")[0] ?? url;
  const file = withoutQuery.split("/").pop() ?? withoutQuery;
  const uuid = file.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)?.[1];
  return uuid ?? withoutQuery;
}

function fileExtFromUrl(url: string, contentType?: string | null) {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg";
  const ext = url.split("?")[0]?.match(/\.(jpe?g|png|webp|gif|avif)$/i)?.[1]?.toLowerCase();
  if (ext === "jpeg") return "jpg";
  return ext && ["jpg", "png", "webp", "gif", "avif"].includes(ext) ? ext : "jpg";
}

function isPortfolioImage(url: string) {
  return /^https:\/\/cdn\.myportfolio\.com\/2a0c4d72-ce76-4a34-ae1b-e6ac3e0cfed7\//.test(url) &&
    /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url);
}

function bestCandidate(current: ImageCandidate | undefined, next: ImageCandidate) {
  if (!current) return next;
  if (next.score > current.score) return next;
  if ((next.width ?? 0) > (current.width ?? 0)) return next;
  return current;
}

async function fetchText(url: string, warnings: string[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      headers: { "user-agent": userAgent, accept: "text/html,application/xhtml+xml" },
      signal: controller.signal,
    });

    if (!response.ok) {
      warnings.push(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
      return "";
    }

    return await response.text();
  } catch (error) {
    warnings.push(`Fetch failed for ${url}: ${String(error)}`);
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverWithPlaywright(warnings: string[]) {
  if (process.env.DORVELL_USE_PLAYWRIGHT !== "1") {
    warnings.push("Playwright browser pass skipped. Set DORVELL_USE_PLAYWRIGHT=1 to enable it.");
    return new Set<string>();
  }

  try {
    const { chromium } = await import("playwright");
    const executablePath = existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined;
    const browser = await chromium.launch({
      headless: true,
      executablePath,
      args: ["--disable-gpu", "--no-sandbox"],
      timeout: 20000,
    });
    const page = await browser.newPage({ userAgent, viewport: { width: 1440, height: 1200 } });
    const urls = new Set<string>();

    page.on("requestfinished", (request) => {
      const url = request.url();
      if (request.resourceType() === "image" && isPortfolioImage(url)) urls.add(url);
    });

    await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    for (let index = 0; index < 12; index += 1) {
      await page.mouse.wheel(0, 650);
      await page.waitForTimeout(120);
    }
    await browser.close();
    return urls;
  } catch (error) {
    warnings.push(`Playwright browser pass failed; static HTML fallback used. ${String(error)}`);
    return new Set<string>();
  }
}

function extractPage(html: string, pageUrl: string) {
  const $ = cheerio.load(html);
  const title = normalizeText($("title").first().text()) || "Dorvell Ferguson";
  const projectTitle = projectTitleFromPage(title, pageUrl);
  const projectSlug = slugFromUrl(pageUrl);
  const category = categoryForPage(pageUrl, title);
  const tags = tagsForPage(category, projectTitle);
  const pageRecord: PageRecord = {
    url: pageUrl,
    title,
    headings: $("h1,h2,h3,h4,.title")
      .map((_, el) => normalizeText($(el).text()))
      .get()
      .filter(Boolean),
    paragraphs: $("p,li,.rich-text div,.module-text")
      .map((_, el) => normalizeText($(el).text()))
      .get()
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index),
    links: $("a[href]")
      .map((_, el) => ({
        text: normalizeText($(el).text()),
        href: absoluteUrl($(el).attr("href") ?? "", pageUrl),
      }))
      .get()
      .filter((link) => link.href),
  };

  const candidates = new Map<string, ImageCandidate>();
  const addCandidate = (
    rawUrl: string,
    detectedFrom: DetectedFrom,
    score: number,
    width?: number,
    height?: number,
    alt?: string,
  ) => {
    const url = absoluteUrl(rawUrl, pageUrl);
    if (!isPortfolioImage(url)) return;
    const key = imageKeyFromUrl(url);
    const candidate: ImageCandidate = {
      url,
      sourcePage: pageUrl,
      projectSlug,
      projectTitle,
      category,
      tags,
      width,
      height,
      alt: normalizeText(alt ?? ""),
      detectedFrom,
      score,
    };
    candidates.set(key, bestCandidate(candidates.get(key), candidate));
  };

  $("meta[property='og:image'], meta[name='twitter:image']").each((_, el) => {
    addCandidate($(el).attr("content") ?? "", "img", 10);
  });

  $("[data-src], img[src], .js-lightbox[data-src]").each((_, el) => {
    const node = $(el);
    const container = node.closest("[data-width][data-height]");
    const width = Number.parseInt(container.attr("data-width") ?? "", 10);
    const height = Number.parseInt(container.attr("data-height") ?? "", 10);
    const detectedFrom: DetectedFrom = node.attr("data-src") ? "img" : "img";
    addCandidate(
      node.attr("data-src") ?? node.attr("src") ?? "",
      detectedFrom,
      80,
      Number.isFinite(width) ? width : undefined,
      Number.isFinite(height) ? height : undefined,
      node.attr("alt") ?? "",
    );
  });

  $("[data-srcset], img[srcset], source[srcset]").each((_, el) => {
    const node = $(el);
    const container = node.closest("[data-width][data-height]");
    const height = Number.parseInt(container.attr("data-height") ?? "", 10);
    const srcset = node.attr("data-srcset") ?? node.attr("srcset") ?? "";
    parseSrcset(srcset, pageUrl).forEach((entry) => {
      addCandidate(
        entry.url,
        "srcset",
        60 + Math.min((entry.width ?? 0) / 100, 45),
        entry.width,
        Number.isFinite(height) && entry.width ? Math.round((height / Number(container.attr("data-width"))) * entry.width) : undefined,
        node.attr("alt") ?? "",
      );
    });
  });

  const backgroundMatches = html.matchAll(/url\((["']?)(https?:\/\/[^"')]+\.(?:jpe?g|png|webp|gif|avif)(?:\?[^"')]+)?)\1\)/gi);
  for (const match of backgroundMatches) addCandidate(match[2] ?? "", "background", 45);

  const rawMatches = html.matchAll(/https?:\/\/[^"' <>)]+\.(?:jpe?g|png|webp|gif|avif)(?:\?[^"' <>)]+)?/gi);
  for (const match of rawMatches) addCandidate(match[0], "json", 25);

  return {
    pageRecord,
    links: pageRecord.links.map((link) => link.href),
    candidates: Array.from(candidates.values()),
  };
}

function shouldVisit(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== baseUrl) return false;
    if (skippedInternalPrefixes.some((prefix) => parsed.pathname.startsWith(prefix))) return false;
    if (parsed.pathname === "/" || parsed.pathname === "") return false;
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(candidate: ImageCandidate, warnings: string[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(candidate.url, {
      headers: { "user-agent": userAgent, accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" },
      signal: controller.signal,
    });
    if (!response.ok) {
      warnings.push(`Image download failed for ${candidate.url}: ${response.status} ${response.statusText}`);
      return null;
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    const hash = createHash("sha256").update(bytes).digest("hex");
    const ext = fileExtFromUrl(candidate.url, response.headers.get("content-type"));
    const safeProject = (candidate.projectSlug ?? "archive").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const filename = `${hash.slice(0, 16)}-${safeProject}.${ext}`;
    const localFile = path.join(originalsDir, filename);
    await writeFile(localFile, bytes);

    return {
      hash,
      localOriginal: `/dorvell/originals/${filename}`,
    };
  } catch (error) {
    warnings.push(`Image download failed for ${candidate.url}: ${String(error)}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function categoryCounts(images: DorvellImage[]) {
  return images.reduce<Record<string, number>>((counts, image) => {
    counts[image.category] = (counts[image.category] ?? 0) + 1;
    return counts;
  }, {});
}

async function main() {
  const warnings: string[] = [];
  await mkdir(originalsDir, { recursive: true });
  await mkdir(htmlCacheDir, { recursive: true });

  const browserDiscovered = await discoverWithPlaywright(warnings);
  const queue = new Set(startPaths.map((pagePath) => `${baseUrl}${pagePath}`));
  const visited = new Set<string>();
  const pages: PageRecord[] = [];
  const candidates = new Map<string, ImageCandidate>();

  for (const pageUrl of queue) {
    if (visited.has(pageUrl) || !shouldVisit(pageUrl)) continue;
    visited.add(pageUrl);
    const html = await fetchText(pageUrl, warnings);
    if (!html) continue;
    await writeFile(path.join(htmlCacheDir, `${slugFromUrl(pageUrl)}.html`), html);

    const extracted = extractPage(html, pageUrl);
    pages.push(extracted.pageRecord);

    extracted.links.filter(shouldVisit).forEach((link) => {
      if (!visited.has(link)) queue.add(link);
    });

    extracted.candidates.forEach((candidate) => {
      const key = imageKeyFromUrl(candidate.url);
      candidates.set(key, bestCandidate(candidates.get(key), candidate));
    });
  }

  browserDiscovered.forEach((url) => {
    const key = imageKeyFromUrl(url);
    candidates.set(
      key,
      bestCandidate(candidates.get(key), {
        url,
        sourcePage: sourceUrl,
        projectSlug: "home-2",
        projectTitle: "Opening Archive",
        category: "Uncategorized",
        tags: ["Network"],
        detectedFrom: "network",
        score: 40,
      }),
    );
  });

  const rawCandidates = Array.from(candidates.values()).sort((a, b) => a.sourcePage.localeCompare(b.sourcePage));
  if (rawCandidates.length === 0) {
    const blockedPath = path.join(rootDir, "SCRAPE_BLOCKED.md");
    await writeFile(
      blockedPath,
      [
        "# Dorvell Portfolio Scrape Blocked",
        "",
        "The scraper found zero image candidates from the Adobe Portfolio source.",
        "",
        "Fallback: export the Adobe Portfolio assets into `manual-import/` and create an importer that maps those files to `src/content/dorvell.generated.json`.",
      ].join("\n"),
    );
    throw new Error("No image candidates were found. See SCRAPE_BLOCKED.md.");
  }

  const images: DorvellImage[] = [];
  const hashes = new Set<string>();
  let duplicateCount = 0;

  for (let index = 0; index < rawCandidates.length; index += 1) {
    const candidate = rawCandidates[index];
    const downloaded = await downloadImage(candidate, warnings);
    if (!downloaded) continue;
    if (hashes.has(downloaded.hash)) {
      duplicateCount += 1;
      await unlink(path.join(publicDir, downloaded.localOriginal.replace(/^\//, ""))).catch(() => undefined);
      continue;
    }
    hashes.add(downloaded.hash);

    const id = `df-${downloaded.hash.slice(0, 12)}`;
    const width = candidate.width && candidate.width > 0 ? candidate.width : 1;
    const height = candidate.height && candidate.height > 0 ? candidate.height : 1;
    const category = candidate.category;
    const fallbackAlt = `${candidate.projectTitle ?? "Dorvell Ferguson Jr. portfolio"} image`;
    const alt = candidate.alt || fallbackAlt;

    images.push({
      id,
      sourceUrl: candidate.url,
      sourcePage: candidate.sourcePage,
      localOriginal: downloaded.localOriginal,
      localOptimized: {
        sm: "",
        md: "",
        lg: "",
      },
      width,
      height,
      aspectRatio: width / height,
      alt,
      caption: candidate.caption,
      category,
      tags: candidate.tags,
      detectedFrom: candidate.detectedFrom,
      hash: downloaded.hash,
      needsAltReview: !candidate.alt,
      needsCreditReview: true,
      projectSlug: candidate.projectSlug,
      projectTitle: candidate.projectTitle,
    });
  }

  const contacts = {
    email: "fergusondorvell2@gmail.com",
    phone: "251-623-4376",
    instagram: ["https://www.instagram.com/2kferg/", "https://www.instagram.com/fergphotography/"],
  };

  const existing = existsSync(manifestPath)
    ? JSON.parse(await readFile(manifestPath, "utf8")) as Partial<DorvellSiteContent>
    : {};

  const manifest: DorvellSiteContent = {
    source: sourceUrl,
    scrapedAt: new Date().toISOString(),
    pages,
    images,
    contacts: {
      ...contacts,
      ...existing.contacts,
      instagram: contacts.instagram,
    },
    scrapeSummary: {
      pagesScraped: pages.length,
      imagesFound: rawCandidates.length,
      imagesDownloaded: images.length,
      duplicatesRemoved: duplicateCount,
      missingAltText: images.filter((image) => image.needsAltReview).length,
      categories: categoryCounts(images),
      warnings,
    },
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        pagesScraped: manifest.scrapeSummary?.pagesScraped,
        imagesFound: manifest.scrapeSummary?.imagesFound,
        imagesDownloaded: manifest.scrapeSummary?.imagesDownloaded,
        duplicatesRemoved: manifest.scrapeSummary?.duplicatesRemoved,
        missingAltText: manifest.scrapeSummary?.missingAltText,
        categories: manifest.scrapeSummary?.categories,
        warnings,
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
