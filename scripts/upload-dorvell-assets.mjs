#!/usr/bin/env node
/**
 * Upload only assets the site actually renders — no originals, no blur sidecars.
 *
 * Sources of truth:
 *   src/content/dorvell.generated.json          → portfolio sm/md/lg webp
 *   src/content/creative.media.generated.json   → video.mp4 (HD), video-mobile.mp4, poster.jpg, thumb.webp
 *   src/content/creative.photomode.generated.json → md.webp only
 *   services reel paths (hardcoded below)
 *
 * Usage:
 *   node scripts/upload-dorvell-assets.mjs              # upload everything used
 *   node scripts/upload-dorvell-assets.mjs --dry-run    # list counts, no upload
 *   node scripts/upload-dorvell-assets.mjs --only=portfolio
 *   node scripts/upload-dorvell-assets.mjs --only=creative
 *
 * Requires: aws cli configured (aws configure), bucket in env or default below.
 */

import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

const DEFAULT_BUCKET = "dorvell-ferguson";
const DEFAULT_REGION = "us-east-2";
const CACHE = "public,max-age=31536000,immutable";

const REEL_PATHS = [
  "/dorvell/media/dorvell-reel.mp4",
  "/dorvell/media/dorvell-reel.webm",
  "/dorvell/media/dorvell-reel.jpg",
];

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const ONLY = argv.find((a) => a.startsWith("--only="))?.split("=")[1] ?? "all";
const BUCKET = process.env.DORVELL_ASSET_BUCKET ?? DEFAULT_BUCKET;
const REGION = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? DEFAULT_REGION;

/** @param {string} publicPath */
function toLocal(publicPath) {
  return path.join(PUBLIC, publicPath.replace(/^\//, ""));
}

/** @param {unknown} value */
function addPath(set, value) {
  if (typeof value !== "string" || !value.startsWith("/dorvell/")) return;
  set.add(value);
}

/** @returns {Promise<Set<string>>} */
async function collectUsedPaths() {
  const paths = new Set();

  if (ONLY === "all" || ONLY === "portfolio") {
    const raw = JSON.parse(await readFile(path.join(ROOT, "src/content/dorvell.generated.json"), "utf8"));
    for (const image of raw.images ?? []) {
      addPath(paths, image.localOptimized?.sm);
      addPath(paths, image.localOptimized?.md);
      addPath(paths, image.localOptimized?.lg);
    }
  }

  if (ONLY === "all" || ONLY === "creative") {
    const videos = JSON.parse(await readFile(path.join(ROOT, "src/content/creative.media.generated.json"), "utf8"));
    for (const clip of Object.values(videos)) {
      addPath(paths, clip.mp4Src);
      addPath(paths, clip.mobileSrc);
      addPath(paths, clip.posterSrc);
      addPath(paths, clip.thumbSrc);
    }

    const photomode = JSON.parse(await readFile(path.join(ROOT, "src/content/creative.photomode.generated.json"), "utf8"));
    for (const set of Object.values(photomode)) {
      for (const item of set.items ?? []) {
        addPath(paths, item.mdSrc);
      }
    }

    for (const reelPath of REEL_PATHS) addPath(paths, reelPath);
  }

  return paths;
}

/** @param {Set<string>} paths */
async function validatePaths(paths) {
  const missing = [];
  let bytes = 0;
  for (const publicPath of paths) {
    const local = toLocal(publicPath);
    if (!existsSync(local)) {
      missing.push(publicPath);
      continue;
    }
    const info = await stat(local);
    bytes += info.size;
  }
  return { missing, bytes };
}

/** @param {string} publicPath */
async function uploadOne(publicPath) {
  const local = toLocal(publicPath);
  const key = publicPath.replace(/^\//, "");
  const dest = `s3://${BUCKET}/${key}`;
  await execFileP(
    "aws",
    ["s3", "cp", local, dest, "--region", REGION, "--cache-control", CACHE, "--only-show-errors"],
    { maxBuffer: 10 * 1024 * 1024 },
  );
}

async function main() {
  const paths = await collectUsedPaths();
  const sorted = [...paths].sort();
  const { missing, bytes } = await validatePaths(paths);

  const byKind = {
    portfolio: sorted.filter((p) => p.startsWith("/dorvell/optimized/")).length,
    video: sorted.filter((p) => p.startsWith("/dorvell/videos/")).length,
    photomode: sorted.filter((p) => p.startsWith("/dorvell/creative/")).length,
    reel: sorted.filter((p) => p.startsWith("/dorvell/media/")).length,
  };

  console.log(
    JSON.stringify(
      {
        mode: DRY_RUN ? "dry-run" : "upload",
        filter: ONLY,
        bucket: BUCKET,
        region: REGION,
        files: sorted.length,
        breakdown: byKind,
        sizeMB: Math.round((bytes / 1024 / 1024) * 10) / 10,
        missing: missing.length,
      },
      null,
      2,
    ),
  );

  if (missing.length) {
    console.error("\nMissing on disk (will skip):");
    for (const p of missing.slice(0, 20)) console.error(`  ${p}`);
    if (missing.length > 20) console.error(`  … and ${missing.length - 20} more`);
  }

  if (DRY_RUN) {
    console.log("\nExcluded automatically (not in manifests):");
    console.log("  public/dorvell/originals/     raw scrape downloads");
    console.log("  public/dorvell/blur/          tiny placeholder sidecars");
    console.log("  */blur.jpg, */original-info.json, */poster.webp, photomode *.lg.webp");
    return;
  }

  const toUpload = sorted.filter((p) => existsSync(toLocal(p)));
  let done = 0;
  const CONCURRENCY = 8;

  for (let i = 0; i < toUpload.length; i += CONCURRENCY) {
    const batch = toUpload.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (publicPath) => {
        await uploadOne(publicPath);
        done += 1;
        if (done % 100 === 0 || done === toUpload.length) {
          process.stdout.write(`\rUploaded ${done}/${toUpload.length}`);
        }
      }),
    );
  }

  if (toUpload.length) process.stdout.write("\n");
  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
