import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dorvellSiteContentSchema } from "../src/content/dorvell.schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const manifestPath = path.join(rootDir, "src", "content", "dorvell.generated.json");

function publicFileExists(publicPath: string) {
  return existsSync(path.join(publicDir, publicPath.replace(/^\//, "")));
}

async function main() {
  const manifest = dorvellSiteContentSchema.parse(JSON.parse(await readFile(manifestPath, "utf8")));
  if (manifest.images.length === 0) {
    throw new Error("Portfolio manifest has zero images.");
  }

  const missingFiles = manifest.images.flatMap((image) => {
    const paths = [image.localOriginal, image.localOptimized.sm, image.localOptimized.md, image.localOptimized.lg];
    return paths.filter((assetPath) => !assetPath || !publicFileExists(assetPath));
  });

  if (missingFiles.length > 0) {
    throw new Error(`Missing ${missingFiles.length} generated asset files:\n${missingFiles.slice(0, 20).join("\n")}`);
  }

  const categoryCounts = manifest.images.reduce<Record<string, number>>((counts, image) => {
    counts[image.category] = (counts[image.category] ?? 0) + 1;
    return counts;
  }, {});

  console.log(
    JSON.stringify(
      {
        ok: true,
        pages: manifest.pages.length,
        images: manifest.images.length,
        missingAltText: manifest.images.filter((image) => image.needsAltReview).length,
        needsCreditReview: manifest.images.filter((image) => image.needsCreditReview).length,
        categories: categoryCounts,
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
