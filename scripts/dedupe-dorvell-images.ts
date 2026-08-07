/**
 * Remove duplicate portfolio/Instagram frames, keeping the higher-quality copy.
 *
 * Passes:
 *   1. Same Instagram CDN filename (re-encodes / host variants) — definitive
 *   2. Same Instagram post + near-identical dHash — burst/carousel near-dupes
 *   3. Portfolio (df-) vs Instagram (ig-) near-identical dHash — keep sharper
 *
 * Quality score: width*height, then optimized lg bytes, then original bytes.
 *
 * Usage:
 *   npx tsx scripts/dedupe-dorvell-images.ts --dry-run
 *   npx tsx scripts/dedupe-dorvell-images.ts
 *   npx tsx scripts/dedupe-dorvell-images.ts --delete-files
 */

import { readFile, writeFile, unlink, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import type { DorvellImage, DorvellSiteContent } from "../src/content/dorvell.schema";
import {
  readPhotoCategorizationLedgerSync,
  writePhotoCategorizationLedger,
} from "../src/lib/dorvell-photo-categorization-ledger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "src/content/dorvell.generated.json");
const PUBLIC = path.join(ROOT, "public");

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const DELETE_FILES = argv.includes("--delete-files");
const DHASH_THRESHOLD = 4;

function cdnFilename(url: string) {
  try {
    return path.basename(new URL(url).pathname);
  } catch {
    return url;
  }
}

function postKey(image: DorvellImage) {
  return (image.sourcePage || "").replace(/\?.*$/, "");
}

async function fileSize(publicPath: string | undefined) {
  if (!publicPath) return 0;
  const local = path.join(PUBLIC, publicPath.replace(/^\//, ""));
  if (!existsSync(local)) return 0;
  return (await stat(local)).size;
}

async function qualityScore(image: DorvellImage) {
  const pixels = (image.width || 0) * (image.height || 0);
  const lg = await fileSize(image.localOptimized?.lg);
  const original = await fileSize(image.localOriginal);
  const sourceBonus = image.id.startsWith("df-") ? 1 : 0;
  return pixels * 1_000_000 + lg * 10 + original + sourceBonus;
}

async function dhash(image: DorvellImage): Promise<bigint | null> {
  const candidates = [image.localOptimized?.sm, image.localOptimized?.md, image.localOriginal].filter(
    Boolean,
  ) as string[];
  for (const publicPath of candidates) {
    const local = path.join(PUBLIC, publicPath.replace(/^\//, ""));
    if (!existsSync(local)) continue;
    try {
      const { data } = await sharp(local)
        .rotate()
        .resize(9, 8, { fit: "fill" })
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let bits = 0n;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          if (data[y * 9 + x] < data[y * 9 + x + 1]) bits |= 1n << BigInt(y * 8 + x);
        }
      }
      return bits;
    } catch {
      /* try next */
    }
  }
  return null;
}

function hamming(a: bigint, b: bigint) {
  let x = a ^ b;
  let c = 0;
  while (x) {
    c += Number(x & 1n);
    x >>= 1n;
  }
  return c;
}

function similarAspect(a: DorvellImage, b: DorvellImage) {
  const ra = a.width / Math.max(a.height, 1);
  const rb = b.width / Math.max(b.height, 1);
  return Math.abs(ra - rb) / Math.max(ra, rb) <= 0.08;
}

function dropAllButBest(
  group: DorvellImage[],
  scores: Map<string, number>,
  drop: Map<string, { keepId: string; reason: string }>,
  reason: string,
) {
  const alive = group.filter((img) => !drop.has(img.id));
  if (alive.length < 2) return;
  alive.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
  const keep = alive[0];
  for (const img of alive.slice(1)) {
    drop.set(img.id, { keepId: keep.id, reason });
  }
}

async function main() {
  const raw = JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as DorvellSiteContent;
  const images = raw.images;
  console.log(`Loaded ${images.length} images`);

  const scores = new Map<string, number>();
  for (const img of images) {
    scores.set(img.id, await qualityScore(img));
  }

  const drop = new Map<string, { keepId: string; reason: string }>();

  // Pass 1 — Instagram CDN filename
  const byFilename = new Map<string, DorvellImage[]>();
  for (const img of images) {
    if (!img.id.startsWith("ig-")) continue;
    const key = cdnFilename(img.sourceUrl);
    if (!byFilename.has(key)) byFilename.set(key, []);
    byFilename.get(key)!.push(img);
  }
  let pass1Groups = 0;
  for (const group of byFilename.values()) {
    if (group.length < 2) continue;
    pass1Groups += 1;
    dropAllButBest(group, scores, drop, "cdn-filename");
  }

  console.log("Computing perceptual hashes…");
  const hashes = new Map<string, bigint>();
  let hashed = 0;
  for (const img of images) {
    if (drop.has(img.id)) continue;
    const h = await dhash(img);
    if (h != null) hashes.set(img.id, h);
    hashed += 1;
    if (hashed % 250 === 0) process.stdout.write(`\r  hashed ${hashed}`);
  }
  if (hashed) process.stdout.write(`\r  hashed ${hashed}\n`);

  // Pass 2 — same Instagram post, near-identical frame
  const byPost = new Map<string, DorvellImage[]>();
  for (const img of images) {
    if (drop.has(img.id) || !hashes.has(img.id)) continue;
    if (!img.sourcePage?.includes("instagram.com")) continue;
    const key = postKey(img);
    if (!byPost.has(key)) byPost.set(key, []);
    byPost.get(key)!.push(img);
  }
  let pass2Groups = 0;
  for (const group of byPost.values()) {
    if (group.length < 2) continue;
    const used = new Set<string>();
    for (let i = 0; i < group.length; i++) {
      if (used.has(group[i].id) || drop.has(group[i].id)) continue;
      const cluster = [group[i]];
      used.add(group[i].id);
      const hi = hashes.get(group[i].id);
      for (let j = i + 1; j < group.length; j++) {
        if (used.has(group[j].id) || drop.has(group[j].id)) continue;
        const hj = hashes.get(group[j].id);
        if (hj == null || hi == null) continue;
        if (hamming(hi, hj) <= DHASH_THRESHOLD && similarAspect(group[i], group[j])) {
          cluster.push(group[j]);
          used.add(group[j].id);
        }
      }
      if (cluster.length > 1) {
        pass2Groups += 1;
        dropAllButBest(cluster, scores, drop, "same-post-visual");
      }
    }
  }

  // Pass 3 — portfolio vs Instagram reupload
  const portfolio = images.filter((img) => img.id.startsWith("df-") && !drop.has(img.id) && hashes.has(img.id));
  const instagram = images.filter((img) => img.id.startsWith("ig-") && !drop.has(img.id) && hashes.has(img.id));
  let pass3Pairs = 0;
  for (const df of portfolio) {
    const hd = hashes.get(df.id);
    if (hd == null) continue;
    const matches: DorvellImage[] = [];
    for (const ig of instagram) {
      if (drop.has(ig.id)) continue;
      const hi = hashes.get(ig.id);
      if (hi == null) continue;
      if (hamming(hd, hi) <= DHASH_THRESHOLD && similarAspect(df, ig)) {
        matches.push(ig);
      }
    }
    if (matches.length === 0) continue;
    pass3Pairs += 1;
    dropAllButBest([df, ...matches], scores, drop, "portfolio-vs-instagram");
  }

  const dropIds = [...drop.keys()];
  const kept = images.filter((img) => !drop.has(img.id));
  const byReason: Record<string, number> = {};
  for (const { reason } of drop.values()) byReason[reason] = (byReason[reason] || 0) + 1;

  console.log(
    JSON.stringify(
      {
        mode: DRY_RUN ? "dry-run" : "apply",
        before: images.length,
        after: kept.length,
        removed: dropIds.length,
        byReason,
        pass1CdnFilenameGroups: pass1Groups,
        pass2SamePostGroups: pass2Groups,
        pass3PortfolioIgClusters: pass3Pairs,
      },
      null,
      2,
    ),
  );

  console.log(
    "sample removals:",
    dropIds.slice(0, 12).map((id) => {
      const meta = drop.get(id)!;
      const loser = images.find((i) => i.id === id);
      const winner = images.find((i) => i.id === meta.keepId);
      return {
        drop: id,
        keep: meta.keepId,
        reason: meta.reason,
        dropDims: loser ? `${loser.width}x${loser.height}` : "?",
        keepDims: winner ? `${winner.width}x${winner.height}` : "?",
      };
    }),
  );

  if (DRY_RUN) {
    console.log("\nDry run only — re-run without --dry-run to apply.");
    return;
  }

  raw.images = kept;
  if (raw.scrapeSummary) {
    raw.scrapeSummary.imagesDownloaded = kept.length;
    raw.scrapeSummary.duplicatesRemoved = (raw.scrapeSummary.duplicatesRemoved ?? 0) + dropIds.length;
  }
  await writeFile(MANIFEST_PATH, `${JSON.stringify(raw, null, 2)}\n`);
  console.log(`Wrote ${MANIFEST_PATH}`);

  const ledger = readPhotoCategorizationLedgerSync();
  await writePhotoCategorizationLedger(kept, ledger.assignments, ledger.scrapDecisions);
  console.log("Refreshed categorization ledger");

  if (DELETE_FILES) {
    let deleted = 0;
    for (const id of dropIds) {
      const img = images.find((i) => i.id === id);
      if (!img) continue;
      const paths = [
        img.localOriginal,
        img.localOptimized?.sm,
        img.localOptimized?.md,
        img.localOptimized?.lg,
        `/dorvell/blur/${img.id}.json`,
      ].filter(Boolean);
      for (const publicPath of new Set(paths)) {
        const local = path.join(PUBLIC, publicPath.replace(/^\//, ""));
        if (!existsSync(local)) continue;
        await unlink(local);
        deleted += 1;
      }
    }
    console.log(`Deleted ${deleted} orphaned asset files`);
  } else {
    console.log("Manifest updated. Re-run with --delete-files to remove orphaned originals/optimized/blur.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
