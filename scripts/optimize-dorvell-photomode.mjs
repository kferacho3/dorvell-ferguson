#!/usr/bin/env node
/**
 * optimize-dorvell-photomode.mjs
 * ---------------------------------------------------------------------------
 * Optimizes the @2kferg TikTok "photomode" stills into web-safe, responsive
 * WebP for the Creative page's Polaroid moment (live-printed, loosely stacked,
 * flip-through). Source stills are big portrait JPGs (up to 2160×3240, ~2MB).
 *
 * Reads:   assets/raw/dorvell-2kferg-photomode/<effect>/*.jpg
 * Writes:  public/dorvell/creative/photomode/<effect-slug>/<n>.{lg,md}.webp + blur.jpg
 * Manifest: src/content/creative.photomode.generated.json  (keyed by effect slug)
 *
 * Usage: node scripts/optimize-dorvell-photomode.mjs [--force]
 */

import { readdir, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT, "assets/raw/dorvell-2kferg-photomode");
const OUT_DIR = path.join(ROOT, "public/dorvell/creative/photomode");
const PUBLIC_BASE = "/dorvell/creative/photomode";
const MANIFEST_PATH = path.join(ROOT, "src/content/creative.photomode.generated.json");
const FORCE = process.argv.includes("--force");

// human folder name → clean effect slug + editorial label
const EFFECT_MAP = {
  "custom effect 1": { slug: "effect-1", label: "Photomode · Set I" },
  "custom effect 2": { slug: "effect-2", label: "Photomode · Set II" },
};

const orientationOf = (w, h) => (h > w ? "portrait" : w > h ? "landscape" : "square");

async function processImage(srcPath, outDir, pubDir, index) {
  const slug = String(index + 1).padStart(2, "0");
  const lg = path.join(outDir, `${slug}.lg.webp`);
  const md = path.join(outDir, `${slug}.md.webp`);
  const blur = path.join(outDir, `${slug}.blur.jpg`);

  const base = sharp(srcPath).rotate();
  const meta = await base.metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;

  if (FORCE || !existsSync(lg)) {
    await base.clone().resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(lg);
  }
  if (FORCE || !existsSync(md)) {
    await base.clone().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toFile(md);
  }
  const blurBuf = await base.clone().resize({ width: 24, height: 24, fit: "inside" }).blur(1.1).jpeg({ quality: 45 }).toBuffer();
  await writeFile(blur, blurBuf);

  return {
    slug,
    originalFileName: path.basename(srcPath),
    width,
    height,
    orientation: orientationOf(width, height),
    lgSrc: `${pubDir}/${slug}.lg.webp`,
    mdSrc: `${pubDir}/${slug}.md.webp`,
    blurSrc: `${pubDir}/${slug}.blur.jpg`,
    blurDataURL: `data:image/jpeg;base64,${blurBuf.toString("base64")}`,
  };
}

async function main() {
  if (!existsSync(RAW_DIR)) {
    console.error(`✖ Raw folder not found: ${RAW_DIR}`);
    process.exit(1);
  }
  const effects = (await readdir(RAW_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const manifest = {};
  for (const effect of effects) {
    const mapping = EFFECT_MAP[effect] || { slug: effect.replace(/[^a-z0-9]+/gi, "-").toLowerCase(), label: effect };
    const outDir = path.join(OUT_DIR, mapping.slug);
    const pubDir = `${PUBLIC_BASE}/${mapping.slug}`;
    await mkdir(outDir, { recursive: true });

    const files = (await readdir(path.join(RAW_DIR, effect)))
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();

    console.log(`\n📸 ${effect} → ${mapping.slug}  (${files.length} image(s))`);
    const items = [];
    for (let i = 0; i < files.length; i++) {
      const rec = await processImage(path.join(RAW_DIR, effect, files[i]), outDir, pubDir, i);
      console.log(`   ${rec.slug}  ${rec.width}×${rec.height}  ${rec.orientation}`);
      items.push(rec);
    }
    manifest[mapping.slug] = { slug: mapping.slug, label: mapping.label, sourceFolder: effect, items };
  }

  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n✔ Photomode optimized → ${path.relative(ROOT, OUT_DIR)}\n  Manifest: ${path.relative(ROOT, MANIFEST_PATH)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
