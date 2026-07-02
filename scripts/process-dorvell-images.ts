import sharp from "sharp";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dorvellSiteContentSchema, type DorvellSiteContent } from "../src/content/dorvell.schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const optimizedDir = path.join(publicDir, "dorvell", "optimized");
const blurDir = path.join(publicDir, "dorvell", "blur");
const manifestPath = path.join(rootDir, "src", "content", "dorvell.generated.json");

function publicFileExists(publicPath: string) {
  return existsSync(path.join(publicDir, publicPath.replace(/^\//, "")));
}

async function main() {
  await mkdir(optimizedDir, { recursive: true });
  await mkdir(blurDir, { recursive: true });

  const raw = JSON.parse(await readFile(manifestPath, "utf8"));
  const parsed = dorvellSiteContentSchema.partial({ images: true }).safeParse(raw);
  if (!parsed.success) {
    console.error(parsed.error.flatten());
    process.exit(1);
  }

  const manifest = raw as DorvellSiteContent;
  if (!manifest.images?.length) {
    throw new Error("No images found in manifest. Run npm run scrape:portfolio first.");
  }

  let processed = 0;
  let skipped = 0;
  for (const image of manifest.images) {
    const optimizedReady =
      image.localOptimized.sm &&
      image.localOptimized.md &&
      image.localOptimized.lg &&
      publicFileExists(image.localOptimized.sm) &&
      publicFileExists(image.localOptimized.md) &&
      publicFileExists(image.localOptimized.lg);
    if (optimizedReady && image.blur) {
      skipped += 1;
      continue;
    }

    const originalPath = path.join(publicDir, image.localOriginal.replace(/^\//, ""));
    const pipeline = sharp(originalPath).rotate();
    const metadata = await pipeline.metadata();
    const width = metadata.width ?? image.width;
    const height = metadata.height ?? image.height;
    const sizes = [
      { key: "sm", width: 640 },
      { key: "md", width: 1280 },
      { key: "lg", width: 1920 },
    ] as const;

    for (const size of sizes) {
      const filename = `${image.id}-${size.key}.webp`;
      const outputPath = path.join(optimizedDir, filename);
      await sharp(originalPath)
        .rotate()
        .resize({ width: size.width, withoutEnlargement: true })
        .webp({ quality: size.key === "lg" ? 82 : 76 })
        .toFile(outputPath);
      image.localOptimized[size.key] = `/dorvell/optimized/${filename}`;
    }

    const blurBuffer = await sharp(originalPath)
      .rotate()
      .resize({ width: 28, withoutEnlargement: true })
      .webp({ quality: 32 })
      .toBuffer();
    const blurData = `data:image/webp;base64,${blurBuffer.toString("base64")}`;
    const blurPath = path.join(blurDir, `${image.id}.json`);
    await writeFile(blurPath, `${JSON.stringify({ dataUrl: blurData }, null, 2)}\n`);

    image.blur = blurData;
    image.width = width;
    image.height = height;
    image.aspectRatio = width / height;
    processed += 1;
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        imagesProcessed: processed,
        imagesSkipped: skipped,
        imagesTotal: manifest.images.length,
        optimizedDir: "/public/dorvell/optimized",
        blurDir: "/public/dorvell/blur",
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
