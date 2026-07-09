#!/usr/bin/env node
/**
 * optimize-dorvell-videos.mjs
 * ---------------------------------------------------------------------------
 * Turns the raw TikTok/reel/cinematic clips Dorvell drops into
 *   assets/raw/dorvell ferguson videos/
 * into web-safe, brand-consistent media for the /creative page (and any other
 * surface a clip is tagged for, e.g. /modeling).
 *
 * For every source clip it produces, under
 *   public/dorvell/videos/dorvell-ferguson-videos/<slug>/
 *     video.mp4        H.264 / yuv420p / +faststart / AAC   (universal)
 *     video.webm       VP9 / Opus                            (bandwidth win; optional)
 *     poster.jpg       representative frame, <=1280 long edge
 *     poster.webp      same frame, webp
 *     thumb.webp       small card thumbnail, <=640 long edge
 *     blur.jpg         tiny blurred placeholder (LQIP)
 *     original-info.json  probe + derived facts for this clip
 *
 * ...and a merged manifest the data layer imports:
 *   src/content/creative.media.generated.json   (keyed by slug)
 *
 * Design notes
 * - Source is HEVC in several files (the hero .mov, Misc-Creative2/5) which will
 *   NOT play in Chrome/Firefox — transcoding to H.264 is mandatory, not cosmetic.
 * - We KEEP audio in the mp4/webm so the lightbox can offer unmute; autoplay
 *   contexts simply set the `muted` attribute (no separate muted render needed).
 * - Long edge is capped at 1280 (never upscaled) — good quality, web-safe weight.
 *
 * Usage
 *   node scripts/optimize-dorvell-videos.mjs                 # posters + encodes, skip existing
 *   node scripts/optimize-dorvell-videos.mjs --only=posters  # fast: metadata + poster/thumb/blur only
 *   node scripts/optimize-dorvell-videos.mjs --only=encode   # mp4 + webm only
 *   node scripts/optimize-dorvell-videos.mjs --force         # re-generate even if outputs exist
 *   node scripts/optimize-dorvell-videos.mjs --concurrency=4
 *   node scripts/optimize-dorvell-videos.mjs path/to/one.mov # process specific files
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir, mkdir, writeFile, readFile, stat, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const execFileP = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const RAW_DIR = path.join(ROOT, "assets/raw/dorvell ferguson videos");
const OUT_DIR = path.join(ROOT, "public/dorvell/videos/dorvell-ferguson-videos");
const PUBLIC_BASE = "/dorvell/videos/dorvell-ferguson-videos";
const MANIFEST_PATH = path.join(ROOT, "src/content/creative.media.generated.json");
const SOURCE_FOLDER_LABEL = "dorvell ferguson videos";
const SUPPORTED = new Set([".mov", ".mp4", ".m4v", ".webm"]);
const MAX_LONG_EDGE = 1280; // poster long-edge cap
const THUMB_LONG_EDGE = 640;
// Two H.264 renditions per clip: desktop gets the near-original HD, mobile a
// lighter compressed cut. The player picks by viewport (see VideoPlayer).
const HD_LONG_EDGE = 1920; // desktop — never upscaled, so most clips stay source res
const MOBILE_LONG_EDGE = 854;

// ---- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
};
const FORCE = flag("force");
const ONLY = opt("only", "all"); // posters | encode | all
const CONCURRENCY = Math.max(1, Number(opt("concurrency", "3")) || 3);
const explicitFiles = argv.filter((a) => !a.startsWith("--"));

// ---- known-clip slug overrides (media only; editorial curation lives in creative.ts) ----
const SLUG_ALIASES = {
  "Dorvell Ferguson - Movie": "the-threshold",
};

/** camelCase / spaced / trailing-digit → clean kebab slug. */
function slugify(name) {
  if (SLUG_ALIASES[name]) return SLUG_ALIASES[name];
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2") // camelCase → camel-Case
    .replace(/([a-zA-Z])(\d)/g, "$1-$2") // letter+digit → letter-digit
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function orientationOf(w, h) {
  if (!w || !h) return "landscape";
  if (h > w) return "portrait";
  if (w > h) return "landscape";
  return "square";
}

async function ffprobe(input) {
  const { stdout } = await execFileP("ffprobe", [
    "-v", "error",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    input,
  ]);
  const data = JSON.parse(stdout);
  const v = data.streams.find((s) => s.codec_type === "video") || {};
  const a = data.streams.find((s) => s.codec_type === "audio");
  const width = Number(v.width) || 0;
  const height = Number(v.height) || 0;
  const duration = Number(data.format?.duration || v.duration || 0);
  return {
    width,
    height,
    duration: Math.round(duration * 100) / 100,
    codec: v.codec_name || "unknown",
    bitrate: Number(data.format?.bit_rate) || 0,
    fps: v.r_frame_rate || null,
    hasAudio: Boolean(a),
    orientation: orientationOf(width, height),
  };
}

/**
 * ffmpeg scale filter: cap long edge at MAX without upscaling, force even dims.
 * Passed via execFile (no shell) so commas need no escaping.
 */
function scaleFilter(max = MAX_LONG_EDGE) {
  return (
    `scale=w='if(gte(iw,ih),min(${max},iw),-2)':h='if(gt(ih,iw),min(${max},ih),-2)'` +
    `,scale=trunc(iw/2)*2:trunc(ih/2)*2`
  );
}

async function assertFfmpeg() {
  try {
    await execFileP("ffmpeg", ["-version"]);
    await execFileP("ffprobe", ["-version"]);
  } catch {
    console.error(
      "\n✖ ffmpeg / ffprobe not found on PATH.\n" +
        "  Install it (macOS: `brew install ffmpeg`) or run this optimization step\n" +
        "  in the deployment/dev environment where ffmpeg is available, then re-run:\n" +
        "    node scripts/optimize-dorvell-videos.mjs\n"
    );
    process.exit(1);
  }
}

const bytesOf = async (p) => (existsSync(p) ? (await stat(p)).size : 0);
const mb = (n) => (n ? `${(n / 1024 / 1024).toFixed(1)}MB` : "—");

async function makePoster(input, dir, meta) {
  const posterJpg = path.join(dir, "poster.jpg");
  const posterWebp = path.join(dir, "poster.webp");
  const thumbWebp = path.join(dir, "thumb.webp");
  const blurJpg = path.join(dir, "blur.jpg");
  if (!FORCE && existsSync(posterJpg) && existsSync(posterWebp) && existsSync(thumbWebp) && existsSync(blurJpg)) {
    const buf = await readFile(blurJpg);
    return { skipped: true, blurDataURL: `data:image/jpeg;base64,${buf.toString("base64")}` };
  }
  // representative frame: 15% in, clamped to [1.0s, 3.0s]
  const t = Math.min(Math.max(meta.duration * 0.15, 1.0), 3.0);
  const tmp = path.join(dir, "_frame.png");
  await execFileP("ffmpeg", ["-y", "-ss", String(t), "-i", input, "-frames:v", "1", "-q:v", "2", tmp]);

  const base = sharp(tmp).rotate();
  await base
    .clone()
    .resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(posterJpg);
  await base
    .clone()
    .resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(posterWebp);
  await base
    .clone()
    .resize({ width: THUMB_LONG_EDGE, height: THUMB_LONG_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(thumbWebp);
  const blurBuf = await base
    .clone()
    .resize({ width: 24, height: 24, fit: "inside" })
    .blur(1.1)
    .jpeg({ quality: 45 })
    .toBuffer();
  await writeFile(blurJpg, blurBuf);
  await rm(tmp, { force: true });
  return { skipped: false, blurDataURL: `data:image/jpeg;base64,${blurBuf.toString("base64")}` };
}

async function encodeMp4Variant(input, out, longEdge, crf, audioBitrate) {
  if (!FORCE && existsSync(out)) return { skipped: true, path: out };
  await execFileP("ffmpeg", [
    "-y", "-i", input,
    "-map", "0:v:0", "-map", "0:a?",
    "-vf", scaleFilter(longEdge),
    "-c:v", "libx264", "-preset", "medium", "-crf", String(crf), "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", audioBitrate,
    out,
  ], { maxBuffer: 1024 * 1024 * 32 });
  return { skipped: false, path: out };
}

async function processClip(input) {
  const originalFileName = path.basename(input);
  const stem = originalFileName.replace(/\.[^.]+$/, "");
  const slug = slugify(stem);
  const dir = path.join(OUT_DIR, slug);
  await mkdir(dir, { recursive: true });

  const meta = await ffprobe(input);
  const pubDir = `${PUBLIC_BASE}/${slug}`;

  let blurDataURL = null;
  if (ONLY === "posters" || ONLY === "all") {
    const poster = await makePoster(input, dir, meta);
    blurDataURL = poster.blurDataURL;
  }
  let mp4Done = false;
  if (ONLY === "encode" || ONLY === "all") {
    await encodeMp4Variant(input, path.join(dir, "video.mp4"), HD_LONG_EDGE, 20, "128k"); // desktop / HD
    await encodeMp4Variant(input, path.join(dir, "video-mobile.mp4"), MOBILE_LONG_EDGE, 27, "96k"); // mobile
    await rm(path.join(dir, "video.webm"), { force: true }); // legacy — no longer served
    mp4Done = true;
  }

  const record = {
    slug,
    originalFileName,
    sourceFolderLabel: SOURCE_FOLDER_LABEL,
    codec: meta.codec,
    width: meta.width,
    height: meta.height,
    orientation: meta.orientation,
    duration: meta.duration,
    hasAudio: meta.hasAudio,
    publicDir: pubDir,
    mp4Src: `${pubDir}/video.mp4`, // desktop / HD (near-original)
    mobileSrc: `${pubDir}/video-mobile.mp4`, // mobile / compressed
    posterSrc: `${pubDir}/poster.jpg`,
    posterWebpSrc: `${pubDir}/poster.webp`,
    thumbSrc: `${pubDir}/thumb.webp`,
    blurSrc: `${pubDir}/blur.jpg`,
  };
  if (blurDataURL) record.blurDataURL = blurDataURL;

  // per-clip info file (merge-preserve blurDataURL if we didn't regenerate it)
  const infoPath = path.join(dir, "original-info.json");
  if (!record.blurDataURL && existsSync(infoPath)) {
    try {
      const prev = JSON.parse(await readFile(infoPath, "utf8"));
      if (prev.blurDataURL) record.blurDataURL = prev.blurDataURL;
    } catch {
      /* ignore */
    }
  }
  await writeFile(infoPath, JSON.stringify(record, null, 2));

  const sizes = {
    hd: await bytesOf(path.join(dir, "video.mp4")),
    mobile: await bytesOf(path.join(dir, "video-mobile.mp4")),
  };
  return { record, sizes, mp4Done };
}

async function pool(items, worker, concurrency) {
  const results = new Array(items.length);
  let i = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  await assertFfmpeg();
  await mkdir(OUT_DIR, { recursive: true });

  let inputs;
  if (explicitFiles.length) {
    inputs = explicitFiles.map((f) => path.resolve(ROOT, f));
  } else {
    if (!existsSync(RAW_DIR)) {
      console.error(`✖ Raw folder not found: ${RAW_DIR}\n  Drop clips into "assets/raw/${SOURCE_FOLDER_LABEL}/" and re-run.`);
      process.exit(1);
    }
    const entries = await readdir(RAW_DIR);
    inputs = entries
      .filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()))
      .sort()
      .map((f) => path.join(RAW_DIR, f));
  }

  if (!inputs.length) {
    console.log("No source clips found. Nothing to do.");
    return;
  }

  console.log(`\n🎬 Optimizing ${inputs.length} clip(s)  [only=${ONLY}  force=${FORCE}  concurrency=${CONCURRENCY}]\n`);

  const t0 = Date.now();
  const processed = await pool(
    inputs,
    async (input, idx) => {
      const name = path.basename(input);
      try {
        const out = await processClip(input);
        // single atomic line — workers run concurrently, so never split writes
        console.log(`  [${idx + 1}/${inputs.length}] ${name} → ${out.record.slug} (${out.record.orientation} ${out.record.duration}s)`);
        return out;
      } catch (err) {
        console.error(`  [${idx + 1}/${inputs.length}] ${name} FAILED: ${err.message?.split("\n")[0] || err}`);
        return null;
      }
    },
    CONCURRENCY
  );

  const ok = processed.filter(Boolean);

  // merge manifest (keyed by slug) — preserve records for clips not in this run
  let manifest = {};
  if (existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
    } catch {
      manifest = {};
    }
  }
  // full replace for regenerated slugs (record is complete, incl. blurDataURL) so
  // no stale keys (e.g. legacy webmSrc) survive; other clips' records are untouched.
  for (const { record } of ok) manifest[record.slug] = record;
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  // summary table
  console.log(`\n  ${"slug".padEnd(22)} ${"orient".padEnd(9)} ${"dur".padStart(6)} ${"hd".padStart(8)} ${"mobile".padStart(8)}`);
  console.log(`  ${"-".repeat(22)} ${"-".repeat(9)} ${"-".repeat(6)} ${"-".repeat(8)} ${"-".repeat(8)}`);
  for (const { record, sizes } of ok) {
    console.log(
      `  ${record.slug.padEnd(22)} ${record.orientation.padEnd(9)} ${String(record.duration).padStart(6)} ${mb(sizes.hd).padStart(8)} ${mb(sizes.mobile).padStart(8)}`
    );
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(
    `\n✔ ${ok.length}/${inputs.length} clip(s) processed in ${secs}s → ${path.relative(ROOT, OUT_DIR)}` +
      `\n  Manifest: ${path.relative(ROOT, MANIFEST_PATH)}\n`
  );
  if (ok.length < inputs.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
