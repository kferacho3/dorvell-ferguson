/**
 * Scrapes Dorvell's dedicated modeling portfolio —
 * https://fergusondorvell.myportfolio.com (a second Adobe Portfolio site:
 * /photos, /runway, /digitals, /brand-recognitions) — and APPENDS the
 * frames to src/content/dorvell.generated.json. Unlike scrape:portfolio,
 * this never rebuilds the manifest: the existing library is preserved and
 * duplicates (by content hash) are skipped.
 *
 * New images get `fd-<sha256[:12]>` ids and `<hash16>-fd-<page>.<ext>`
 * filenames so their provenance stays legible next to the df-/ig- pools.
 * Category is Modeling (Runway for the runway page) with a "Gigs" tag.
 *
 * Usage:
 *   npm run scrape:modeling
 *
 * Follow with: npm run process:images
 */
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DorvellCategory, DorvellImage, DorvellSiteContent } from "../src/content/dorvell.schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const baseUrl = "https://fergusondorvell.myportfolio.com";
const cdnPrefix = "https://cdn.myportfolio.com/eb25dba4-e46b-4790-ac2b-29d835a59177/";
const publicDir = path.join(rootDir, "public");
const originalsDir = path.join(publicDir, "dorvell", "originals");
const manifestPath = path.join(rootDir, "src", "content", "dorvell.generated.json");

const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const startPaths = ["/", "/work", "/photos", "/runway", "/digitals", "/brand-recognitions", "/bio"];
const skippedInternalPrefixes = ["/dist", "/site", "/cdn-cgi"];

type Candidate = {
  url: string;
  page: string;
  slug: string;
  /** Resize variant quality: full renditions (_rw_) beat crops (_rwc_/_carw_). */
  rank: number;
  width: number;
  alt: string;
};

function slugFromUrl(url: string) {
  const pathname = new URL(url).pathname;
  return pathname.replace(/^\/+/, "").replace(/\/+$/, "") || "home";
}

function categoryForSlug(slug: string): DorvellCategory {
  return slug === "runway" ? "Runway" : "Modeling";
}

function variantRank(file: string) {
  if (/_rw_\d+/.test(file)) return 3;
  if (/_rwc_/.test(file)) return 2;
  if (/_carw_/.test(file)) return 1;
  return 2;
}

function variantWidth(file: string) {
  const rw = file.match(/_rw_(\d+)/)?.[1] ?? file.match(/x(\d+)\.[a-z]+$/i)?.[1];
  const parsed = Number.parseInt(rw ?? "0", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function uuidFromUrl(url: string) {
  const file = (url.split("?")[0] ?? url).split("/").pop() ?? url;
  return file.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)?.[1] ?? file;
}

function extFromUrl(url: string, contentType?: string | null) {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg";
  const ext = url.split("?")[0]?.match(/\.(jpe?g|png|webp|gif|avif)$/i)?.[1]?.toLowerCase();
  if (ext === "jpeg") return "jpg";
  return ext && ["jpg", "png", "webp", "gif", "avif"].includes(ext) ? ext : "jpg";
}

function isModelingImage(url: string) {
  return url.startsWith(cdnPrefix) && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url);
}

async function fetchText(url: string, warnings: string[]) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": userAgent, accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      warnings.push(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
      return "";
    }
    return await response.text();
  } catch (error) {
    warnings.push(`Fetch failed for ${url}: ${String(error)}`);
    return "";
  }
}

function collectCandidates(html: string, pageUrl: string, into: Map<string, Candidate>) {
  const $ = cheerio.load(html);
  const slug = slugFromUrl(pageUrl);
  const add = (rawUrl: string | undefined, alt = "") => {
    if (!rawUrl) return;
    let url: string;
    try {
      const parsed = new URL(rawUrl, pageUrl);
      parsed.hash = "";
      url = parsed.toString();
    } catch {
      return;
    }
    if (!isModelingImage(url)) return;
    const file = (url.split("?")[0] ?? url).split("/").pop() ?? "";
    const candidate: Candidate = {
      url,
      page: pageUrl,
      slug,
      rank: variantRank(file),
      width: variantWidth(file),
      alt: alt.replace(/\s+/g, " ").trim(),
    };
    const key = uuidFromUrl(url);
    const current = into.get(key);
    // Covers on / and /work re-crop gallery frames — keep the gallery page's
    // (later-crawled pages never displace a same-quality earlier claim).
    if (
      !current ||
      candidate.rank > current.rank ||
      (candidate.rank === current.rank && candidate.width > current.width)
    ) {
      into.set(key, candidate);
    }
  };

  $("[data-src], img[src]").each((_, el) => {
    add($(el).attr("data-src") ?? $(el).attr("src") ?? "", $(el).attr("alt") ?? "");
  });
  $("[data-srcset], img[srcset], source[srcset]").each((_, el) => {
    const srcset = $(el).attr("data-srcset") ?? $(el).attr("srcset") ?? "";
    for (const entry of srcset.split(",")) {
      add(entry.trim().split(/\s+/)[0], $(el).attr("alt") ?? "");
    }
  });
  $("meta[property='og:image'], meta[name='twitter:image']").each((_, el) => {
    add($(el).attr("content") ?? "");
  });
  for (const match of html.matchAll(/https?:\/\/[^"' <>)\\]+\.(?:jpe?g|png|webp|gif|avif)(?:\?[^"' <>)\\]*)?/gi)) {
    add(match[0]);
  }

  return $("a[href]")
    .map((_, el) => {
      try {
        const href = new URL($(el).attr("href") ?? "", pageUrl);
        href.hash = "";
        return href.toString();
      } catch {
        return "";
      }
    })
    .get()
    .filter(Boolean);
}

function shouldVisit(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== baseUrl) return false;
    return !skippedInternalPrefixes.some((prefix) => parsed.pathname.startsWith(prefix));
  } catch {
    return false;
  }
}

async function download(candidate: Candidate, warnings: string[]) {
  // Crops (covers, og:image) hide pixels — ask the CDN for the full-width
  // rendition of the same asset first, then fall back to what the page had.
  const uuid = uuidFromUrl(candidate.url);
  const ext = extFromUrl(candidate.url);
  const urls =
    candidate.rank < 3 && /^[0-9a-f-]{36}$/i.test(uuid)
      ? [`${cdnPrefix}${uuid}_rw_3840.${ext}`, candidate.url]
      : [candidate.url];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": userAgent, accept: "image/*,*/*;q=0.8" },
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 1024) continue;
      return { bytes, ext: extFromUrl(url, response.headers.get("content-type")) };
    } catch (error) {
      warnings.push(`Download failed for ${url}: ${String(error)}`);
    }
  }
  warnings.push(`No variant of ${candidate.url} could be downloaded.`);
  return null;
}

async function main() {
  const warnings: string[] = [];
  await mkdir(originalsDir, { recursive: true });

  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as DorvellSiteContent;
  const existingHashes = new Set(manifest.images.map((image) => image.hash));
  const existingIds = new Set(manifest.images.map((image) => image.id));

  const queue = new Set(startPaths.map((p) => `${baseUrl}${p}`));
  const visited = new Set<string>();
  const candidates = new Map<string, Candidate>();

  for (const pageUrl of queue) {
    const normalized = pageUrl.replace(/\/$/, "") || pageUrl;
    if (visited.has(normalized) || !shouldVisit(pageUrl)) continue;
    visited.add(normalized);
    const html = await fetchText(pageUrl, warnings);
    if (!html) continue;
    for (const link of collectCandidates(html, pageUrl, candidates)) {
      if (shouldVisit(link)) queue.add(link);
    }
  }

  const added: DorvellImage[] = [];
  let duplicates = 0;
  for (const candidate of Array.from(candidates.values()).sort((a, b) => a.slug.localeCompare(b.slug))) {
    const downloaded = await download(candidate, warnings);
    if (!downloaded) continue;

    const hash = createHash("sha256").update(downloaded.bytes).digest("hex");
    const id = `fd-${hash.slice(0, 12)}`;
    if (existingHashes.has(hash) || existingIds.has(id)) {
      duplicates += 1;
      continue;
    }
    existingHashes.add(hash);
    existingIds.add(id);

    const safeSlug = candidate.slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const filename = `${hash.slice(0, 16)}-fd-${safeSlug}.${downloaded.ext}`;
    const localFile = path.join(originalsDir, filename);
    // Resume-friendly on a tight disk: a byte-identical file from an
    // interrupted run is kept; a size mismatch (truncated write) is redone.
    const alreadyIntact =
      existsSync(localFile) && (await stat(localFile)).size === downloaded.bytes.length;
    if (!alreadyIntact) {
      await writeFile(localFile, downloaded.bytes);
    }

    const category = categoryForSlug(candidate.slug);
    added.push({
      id,
      sourceUrl: candidate.url,
      sourcePage: candidate.page,
      localOriginal: `/dorvell/originals/${filename}`,
      localOptimized: { sm: "", md: "", lg: "" },
      // Real dimensions are stamped by process:images from sharp metadata.
      width: candidate.width || 1,
      height: 1,
      aspectRatio: 1,
      alt: candidate.alt || `Dorvell Ferguson Jr. modeling — ${candidate.slug.replace(/-/g, " ")}`,
      category,
      tags: ["Modeling", "Gigs", ...(category !== "Modeling" ? [category] : [])],
      detectedFrom: "img",
      hash,
      needsAltReview: !candidate.alt,
      needsCreditReview: true,
      projectSlug: `fd-${safeSlug}`,
      projectTitle: `Modeling — ${candidate.slug.replace(/-/g, " ")}`,
    });
  }

  manifest.images = [...manifest.images, ...added];
  manifest.scrapedAt = new Date().toISOString();
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        pagesVisited: visited.size,
        uniqueCandidates: candidates.size,
        imagesAdded: added.length,
        duplicatesSkipped: duplicates,
        totalImages: manifest.images.length,
        perPage: added.reduce<Record<string, number>>((acc, image) => {
          const slug = image.projectSlug ?? "unknown";
          acc[slug] = (acc[slug] ?? 0) + 1;
          return acc;
        }, {}),
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
