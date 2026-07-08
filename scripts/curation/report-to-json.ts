/**
 * Converts a Photo Curation Studio report (photos_report.md) into the public
 * classification JSON consumed by the site.
 *
 * Usage:
 *   npm run curation:build                       # reads the synced report
 *   npx tsx scripts/curation/report-to-json.ts path/to/photos_report.md
 *
 * Default input:  src/content/dorvell-photo-curation-report.md
 * Output:         src/content/curatedPhotos.generated.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { convertReportMarkdownToPublicJson } from "../../src/lib/curation/publicJson";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..", "..");

const inputPath = path.resolve(
  process.argv[2] ?? path.join(rootDir, "src/content/dorvell-photo-curation-report.md"),
);
const outputPath = path.join(rootDir, "src/content/curatedPhotos.generated.json");

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

let markdown: string;
try {
  markdown = readFileSync(inputPath, "utf8");
} catch {
  fail(
    `Could not read report at ${inputPath}.\n  Export photos_report.md from the Photo Curation Studio and save it there, or pass its path as an argument.`,
  );
}

const result = convertReportMarkdownToPublicJson(markdown, new Date().toISOString());
if (!result.ok) fail(result.error);

writeFileSync(outputPath, `${JSON.stringify(result.output, null, 2)}\n`, "utf8");

const { output, warnings } = result;
const kept = output.photos.filter((p) => p.status === "kept").length;
console.log(`\n✔ Wrote ${outputPath}`);
console.log(`  Finalized: ${output.finalized ? "yes" : "no (draft — public pages keep fallback imagery)"}`);
console.log(`  Decisions: ${output.photos.length} (kept ${kept}, scrapped ${output.photos.length - kept})`);
console.log(
  `  Portfolio ${output.photos.filter((p) => p.portfolio).length} · Modeling ${output.photos.filter((p) => p.modeling).length} · Projects ${output.photos.filter((p) => p.projects).length}`,
);
for (const warning of warnings) console.log(`  ⚠ ${warning}`);
console.log("");
