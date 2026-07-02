import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DorvellImage } from "@/content/dorvell.schema";
import { laneKeyForImage } from "@/lib/gallery-lanes";

export const photoCategorizationLedgerPath = path.join(process.cwd(), "src/content/dorvell-photo-categorization.md");

export const manualPhotoCategories = [
  "Fashion / Creative Direction",
  "Runway / Modeling",
  "Portraits",
  "Music & Live",
  "Sports / Athletics",
  "Graphic Design",
  "Behind The Scenes",
  "Uncategorized",
] as const;

export type ManualPhotoCategory = (typeof manualPhotoCategories)[number];
export type PhotoCategorizationAssignments = Record<string, ManualPhotoCategory>;
export type PhotoScrapDecision = "landing" | "site";
export type PhotoScrapDecisions = Record<string, PhotoScrapDecision>;
export type PhotoCategorizationLedger = {
  assignments: PhotoCategorizationAssignments;
  scrapDecisions: PhotoScrapDecisions;
};

const jsonStart = "<!-- dorvell-photo-categorization-json";
const jsonEnd = "dorvell-photo-categorization-json -->";

function isManualPhotoCategory(value: unknown): value is ManualPhotoCategory {
  return typeof value === "string" && manualPhotoCategories.includes(value as ManualPhotoCategory);
}

function isPhotoScrapDecision(value: unknown): value is PhotoScrapDecision {
  return value === "landing" || value === "site";
}

function escapeTableCell(value: string | undefined) {
  return (value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceLabel(image: DorvellImage) {
  try {
    const sourceUrl = new URL(image.sourcePage);
    return `${sourceUrl.hostname}${sourceUrl.pathname}`;
  } catch {
    return image.sourcePage;
  }
}

export async function readPhotoCategorizationAssignments(): Promise<PhotoCategorizationAssignments> {
  return (await readPhotoCategorizationLedger()).assignments;
}

function parsePhotoCategorizationLedger(markdown: string): PhotoCategorizationLedger {
  const match = markdown.match(new RegExp(`${jsonStart}\\n([\\s\\S]*?)\\n${jsonEnd}`));
  if (!match?.[1]) return { assignments: {}, scrapDecisions: {} };

  const parsed = JSON.parse(match[1]) as {
    assignments?: Record<string, unknown>;
    scrapDecisions?: Record<string, unknown>;
  };
  const assignments: PhotoCategorizationAssignments = {};
  const scrapDecisions: PhotoScrapDecisions = {};

  Object.entries(parsed.assignments ?? {}).forEach(([imageId, category]) => {
    if (isManualPhotoCategory(category)) assignments[imageId] = category;
  });
  Object.entries(parsed.scrapDecisions ?? {}).forEach(([imageId, scrapDecision]) => {
    if (isPhotoScrapDecision(scrapDecision)) scrapDecisions[imageId] = scrapDecision;
  });

  return { assignments, scrapDecisions };
}

export async function readPhotoCategorizationLedger(): Promise<PhotoCategorizationLedger> {
  try {
    const markdown = await readFile(photoCategorizationLedgerPath, "utf8");
    return parsePhotoCategorizationLedger(markdown);
  } catch {
    return { assignments: {}, scrapDecisions: {} };
  }
}

export function readPhotoCategorizationLedgerSync(): PhotoCategorizationLedger {
  try {
    const markdown = readFileSync(photoCategorizationLedgerPath, "utf8");
    return parsePhotoCategorizationLedger(markdown);
  } catch {
    return { assignments: {}, scrapDecisions: {} };
  }
}

export function renderPhotoCategorizationMarkdown(
  images: DorvellImage[],
  assignments: PhotoCategorizationAssignments,
  scrapDecisions: PhotoScrapDecisions = {},
) {
  const imageIds = new Set(images.map((image) => image.id));
  const cleanAssignments = Object.fromEntries(
    Object.entries(assignments).filter(([imageId, category]) => imageIds.has(imageId) && isManualPhotoCategory(category)),
  );
  const cleanScrapDecisions = Object.fromEntries(
    Object.entries(scrapDecisions).filter(([imageId, scrapDecision]) => imageIds.has(imageId) && isPhotoScrapDecision(scrapDecision)),
  );
  const updatedAt = new Date().toISOString();
  const reviewedCount = new Set([...Object.keys(cleanAssignments), ...Object.keys(cleanScrapDecisions)]).size;
  const landingScrapCount = Object.values(cleanScrapDecisions).filter((decision) => decision === "landing").length;
  const siteScrapCount = Object.values(cleanScrapDecisions).filter((decision) => decision === "site").length;

  const metadata = JSON.stringify(
    {
      updatedAt,
      reviewedCount,
      categorizedCount: Object.keys(cleanAssignments).length,
      landingScrapCount,
      siteScrapCount,
      totalImages: images.length,
      assignments: cleanAssignments,
      scrapDecisions: cleanScrapDecisions,
    },
    null,
    2,
  );

  const rows = images.map((image, index) => {
    const category = cleanAssignments[image.id] ?? "Unreviewed";
    const scrapDecision = cleanScrapDecisions[image.id] ?? "Keep";
    return [
      String(index + 1),
      `\`${escapeTableCell(image.id)}\``,
      escapeTableCell(category),
      escapeTableCell(scrapDecision),
      escapeTableCell(image.category),
      escapeTableCell(laneKeyForImage(image)),
      escapeTableCell(image.projectTitle ?? image.projectSlug ?? "Archive"),
      escapeTableCell(image.localOptimized.lg || image.localOptimized.md || image.localOptimized.sm || image.localOriginal || image.sourceUrl),
      escapeTableCell(sourceLabel(image)),
      escapeTableCell(image.alt),
    ].join(" | ");
  });

  return `# Dorvell Photo Categorization Ledger

Updated: ${updatedAt}

Reviewed: ${reviewedCount} / ${images.length}

Categorized: ${Object.keys(cleanAssignments).length} / ${images.length}

Scrap from landing: ${landingScrapCount}

Scrap entirely: ${siteScrapCount}

This file is generated by the private local categorizer. The JSON block is the source of truth for code, and the table gives each photo name/path plus the manual category and scrap decision selected in the UI.

${jsonStart}
${metadata}
${jsonEnd}

| # | Image ID | Manual category | Scrap decision | Scraped category | Current lane guess | Project | Local image | Source | Alt / name |
|---|---|---|---|---|---|---|---|---|---|
${rows.map((row) => `| ${row} |`).join("\n")}
`;
}

export async function writePhotoCategorizationLedger(
  images: DorvellImage[],
  assignments: PhotoCategorizationAssignments,
  scrapDecisions: PhotoScrapDecisions = {},
) {
  await mkdir(path.dirname(photoCategorizationLedgerPath), { recursive: true });
  const markdown = renderPhotoCategorizationMarkdown(images, assignments, scrapDecisions);
  await writeFile(photoCategorizationLedgerPath, markdown, "utf8");
  return {
    path: photoCategorizationLedgerPath,
    reviewedCount: new Set([...Object.keys(assignments), ...Object.keys(scrapDecisions)]).size,
    categorizedCount: Object.keys(assignments).length,
    landingScrapCount: Object.values(scrapDecisions).filter((decision) => decision === "landing").length,
    siteScrapCount: Object.values(scrapDecisions).filter((decision) => decision === "site").length,
    totalImages: images.length,
  };
}
