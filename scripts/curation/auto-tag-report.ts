/**
 * Auto-tags every kept photo in the curation report with the additional
 * categories it belongs to, then finalizes the report:
 *
 *   1. Source-page membership (from the scraped filename suffix):
 *      concerts-musical-artist → Music, sports → Athletics,
 *      fashion-shoots-2023 / fashioncreative-direction → Fashion.
 *   2. Scraped set membership (tags in dorvell.generated.json):
 *      Portraits, Fashion, Concerts, Sports, Modeling, @2kferg, …
 *   3. Implication rules: Music ⇒ Event, Modeling ⇒ Portrait.
 *
 * Primary categories are never changed, tags only ever grow, and each
 * decision keeps its original updated_at (so the studio importer's
 * "local is newer" conflict protection still works) — safe to re-run.
 * Always run it on the LATEST studio export. The updated report is
 * written back to the input path and to
 * src/content/dorvell-photo-curation-report.md.
 *
 * Usage:
 *   npm run curation:autotag                       # reads photos_report.md
 *   npx tsx scripts/curation/auto-tag-report.ts path/to/report.md
 *
 * Follow with `npm run curation:build` to refresh the public JSON.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DorvellImage } from "../../src/content/dorvell.schema";
import { withImpliedTags } from "../../src/lib/curation/autoTag";
import { exportMarkdownReport } from "../../src/lib/curation/exportMarkdown";
import { siteManifest } from "../../src/lib/curation/manifest";
import { parseCurationState } from "../../src/lib/curation/storage";
import { CURATION_SCHEMA, emptyDecision, type CurationState } from "../../src/lib/curation/types";
import { validateForFinalization } from "../../src/lib/curation/validation";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..", "..");

const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const inputPath = path.resolve(positionalArgs[0] ?? path.join(rootDir, "photos_report.md"));
const syncedPath = path.join(rootDir, "src/content/dorvell-photo-curation-report.md");
const generatedPath = path.join(rootDir, "src/content/dorvell.generated.json");

/** Portfolio pages named in the curation brief → the category they imply. */
const PAGE_TO_CATEGORY: Record<string, string> = {
  "concerts-musical-artist": "Music",
  sports: "Athletics",
  "fashion-shoots-2023": "Fashion",
  "fashioncreative-direction-coming-soon": "Fashion",
};

/** Scraped set/tag vocabulary → studio categories. Unlisted tags are noise. */
const SCRAPED_TAG_TO_CATEGORY: Record<string, string> = {
  Portraits: "Portrait",
  Portrait: "Portrait",
  Fashion: "Fashion",
  "Creative Direction": "Fashion",
  Music: "Music",
  Concerts: "Music",
  Athletics: "Athletics",
  Sports: "Athletics",
  Modeling: "Modeling",
  "@2kferg": "Modeling",
};

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function pageCategory(filename: string): string | null {
  const match = filename.match(/^[0-9a-f]{16}-(.+)\.[a-z0-9]+$/i);
  return match ? (PAGE_TO_CATEGORY[match[1]] ?? null) : null;
}

let markdown: string;
try {
  markdown = readFileSync(inputPath, "utf8");
} catch {
  fail(`Could not read the report at ${inputPath}.`);
}

const sectionIndex = markdown.indexOf("## Machine Readable State");
const fenceStart = markdown.indexOf("```json", sectionIndex >= 0 ? sectionIndex : 0);
const bodyStart = fenceStart >= 0 ? markdown.indexOf("\n", fenceStart) : -1;
const fenceEnd = markdown.lastIndexOf("```");
if (fenceStart === -1 || fenceEnd <= bodyStart) {
  fail("No “Machine Readable State” JSON block found in the report.");
}

let payload: { schema?: unknown; customCategories?: unknown; photos?: unknown };
try {
  payload = JSON.parse(markdown.slice(bodyStart + 1, fenceEnd));
} catch (error) {
  fail(`The report JSON could not be parsed: ${error instanceof Error ? error.message : "invalid JSON"}`);
}
if (payload.schema !== CURATION_SCHEMA) {
  fail(`Unsupported schema "${String(payload.schema)}" — expected ${CURATION_SCHEMA}.`);
}
if (!Array.isArray(payload.photos)) fail("The report has no photos array.");

const now = new Date().toISOString();

// Round-trip through the storage sanitizer so every decision is well-formed.
const state: CurationState = parseCurationState(
  JSON.stringify({
    schema: CURATION_SCHEMA,
    decisions: Object.fromEntries(
      (payload.photos as { photo_id?: unknown }[])
        .filter((p) => typeof p?.photo_id === "string")
        .map((p) => [p.photo_id as string, p]),
    ),
    customCategories: payload.customCategories,
    uploads: [],
    desktopWarningDismissed: true,
    updatedAt: now,
  }),
  now,
);
const decisionCount = Object.keys(state.decisions).length;
if (decisionCount === 0) fail("The report parsed, but no valid photo decisions were found.");

let images: DorvellImage[];
try {
  const generated = JSON.parse(readFileSync(generatedPath, "utf8")) as { images?: DorvellImage[] };
  images = Array.isArray(generated.images) ? generated.images : [];
} catch {
  fail(`Could not read the generated image data at ${generatedPath}.`);
}
if (images.length === 0) fail("dorvell.generated.json has no images.");

const manifest = siteManifest(images);

// --adopt=<prefix>: manifest photos with no decision yet whose id starts
// with the prefix are adopted as kept Modeling frames. Built for the
// fergusondorvell modeling-site imports (fd- ids) — every frame on that
// site is a modeling gig, so review-by-default would only hide them.
const adoptPrefix = process.argv.find((arg) => arg.startsWith("--adopt="))?.split("=")[1];
let adopted = 0;
if (adoptPrefix) {
  for (const photo of manifest) {
    if (!photo.photo_id.startsWith(adoptPrefix) || state.decisions[photo.photo_id]) continue;
    const decision = emptyDecision(photo, now);
    decision.status = "kept";
    decision.category_primary = "Modeling";
    decision.category_tags =
      photo.scrapedCategory && photo.scrapedCategory !== "Modeling" ? [photo.scrapedCategory] : [];
    decision.reviewed_at = now;
    state.decisions[photo.photo_id] = decision;
    adopted += 1;
  }
}

const scrapedById = new Map<string, string[]>();
for (const image of images) {
  const mapped = [image.category, ...(image.tags ?? [])]
    .map((tag) => SCRAPED_TAG_TO_CATEGORY[tag])
    .filter((category): category is string => Boolean(category));
  if (mapped.length > 0) scrapedById.set(image.id, mapped);
}

const stats = {
  kept: 0,
  changed: 0,
  fromPage: 0,
  fromScrape: 0,
  musicToEvent: 0,
  modelingToPortrait: 0,
  tagCounts: {} as Record<string, number>,
};

for (const decision of Object.values(state.decisions)) {
  if (decision.status !== "kept") continue;
  stats.kept += 1;

  const candidates = [...decision.category_tags];
  const fromPage = pageCategory(decision.filename);
  if (fromPage) candidates.push(fromPage);
  candidates.push(...(scrapedById.get(decision.photo_id) ?? []));

  const nextTags = withImpliedTags(decision.category_primary, candidates);
  const before = decision.category_tags;
  const changed = nextTags.length !== before.length || nextTags.some((tag, i) => tag !== before[i]);
  if (!changed) continue;

  const added = new Set(nextTags.filter((tag) => !before.includes(tag)));
  if (fromPage && added.has(fromPage)) stats.fromPage += 1;
  if ((scrapedById.get(decision.photo_id) ?? []).some((tag) => added.has(tag))) stats.fromScrape += 1;
  const all = new Set([decision.category_primary, ...nextTags]);
  if (all.has("Music") && added.has("Event")) stats.musicToEvent += 1;
  if (all.has("Modeling") && added.has("Portrait")) stats.modelingToPortrait += 1;

  // updated_at is deliberately NOT bumped: a fresh stamp would let a stale
  // report silently beat newer studio work in the importer's conflict check.
  decision.category_tags = nextTags;
  stats.changed += 1;
}

for (const decision of Object.values(state.decisions)) {
  if (decision.status !== "kept") continue;
  for (const tag of decision.category_tags) {
    stats.tagCounts[tag] = (stats.tagCounts[tag] ?? 0) + 1;
  }
}

const validation = validateForFinalization(manifest, state.decisions);
if (validation.blockers.length > 0 || validation.unreviewed.length > 0) {
  fail(
    `Cannot finalize: ${validation.blockers.length} kept photo(s) missing a primary category and ` +
      `${validation.unreviewed.length} photo(s) unreviewed. Finish the review in the studio, ` +
      `export a fresh report, and re-run.`,
  );
}

const finalState: CurationState = { ...state, finalizedAt: now, updatedAt: now };
const report = exportMarkdownReport(manifest, finalState, now);

writeFileSync(inputPath, report, "utf8");
writeFileSync(syncedPath, report, "utf8");

const orphans =
  Object.keys(state.decisions).length - manifest.filter((p) => state.decisions[p.photo_id]).length;
console.log(`\n✔ Auto-tagged and finalized the curation report.`);
console.log(`  Report:   ${inputPath}`);
console.log(`  Synced:   ${syncedPath}`);
console.log(`  Kept photos: ${stats.kept} (${stats.changed} gained tags${adopted > 0 ? `, ${adopted} newly adopted as Modeling` : ""})`);
console.log(`  Tagged from source page: ${stats.fromPage} · from scraped sets: ${stats.fromScrape}`);
console.log(`  Music ⇒ Event applied: ${stats.musicToEvent} · Modeling ⇒ Portrait applied: ${stats.modelingToPortrait}`);
console.log(`  Decisions preserved for ${orphans} photos no longer in the site manifest.`);
console.log(`  Tag totals: ${Object.entries(stats.tagCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([tag, count]) => `${tag} ${count}`)
  .join(" · ")}`);
console.log(`\n  Next: npm run curation:build\n`);
