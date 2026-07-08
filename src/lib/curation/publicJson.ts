import { CURATION_SCHEMA } from "@/lib/curation/types";

export const PUBLIC_JSON_SCHEMA = "dorvell-photo-curation-public/v1";

export type PublicJsonPhoto = {
  photo_id: string;
  filename: string;
  status: "kept" | "scrapped";
  category_primary: string | null;
  category_tags: string[];
  portfolio: boolean;
  modeling: boolean;
  projects: boolean;
};

export type PublicJsonOutput = {
  schema: typeof PUBLIC_JSON_SCHEMA;
  generatedAt: string;
  finalized: boolean;
  sourceReportExportedAt: string | null;
  photos: PublicJsonPhoto[];
};

export type ConversionResult =
  | { ok: true; output: PublicJsonOutput; warnings: string[] }
  | { ok: false; error: string };

/**
 * Pure converter: photos_report.md → public classification JSON.
 * Shared by scripts/curation/report-to-json.ts and the dev sync API route.
 */
export function convertReportMarkdownToPublicJson(
  markdown: string,
  generatedAt: string,
): ConversionResult {
  const sectionIndex = markdown.indexOf("## Machine Readable State");
  const fenceStart = markdown.indexOf("```json", sectionIndex >= 0 ? sectionIndex : 0);
  if (fenceStart === -1) {
    return { ok: false, error: "No “Machine Readable State” JSON block found in the report." };
  }
  const bodyStart = markdown.indexOf("\n", fenceStart);
  // Last fence in the file — the JSON block is the final section, so backticks
  // inside notes/JSON strings cannot truncate it.
  const fenceEnd = markdown.lastIndexOf("```");
  if (fenceEnd <= bodyStart) {
    return { ok: false, error: "The JSON block is not closed (missing ``` fence)." };
  }

  let payload: { schema?: unknown; exportedAt?: unknown; finalized?: unknown; photos?: unknown };
  try {
    payload = JSON.parse(markdown.slice(bodyStart + 1, fenceEnd));
  } catch (error) {
    return {
      ok: false,
      error: `The machine-readable JSON could not be parsed: ${error instanceof Error ? error.message : "invalid JSON"}`,
    };
  }

  if (payload.schema !== CURATION_SCHEMA) {
    return { ok: false, error: `Unsupported schema "${String(payload.schema)}" — expected ${CURATION_SCHEMA}.` };
  }
  if (!Array.isArray(payload.photos)) {
    return { ok: false, error: "The report has no photos array." };
  }

  const photos: PublicJsonPhoto[] = [];
  for (const raw of payload.photos as Record<string, unknown>[]) {
    if (typeof raw !== "object" || raw === null) continue;
    if (typeof raw.photo_id !== "string") continue;
    if (raw.status !== "kept" && raw.status !== "scrapped") continue;
    photos.push({
      photo_id: raw.photo_id,
      filename: typeof raw.filename === "string" ? raw.filename : "",
      status: raw.status,
      category_primary: typeof raw.category_primary === "string" ? raw.category_primary : null,
      category_tags: Array.isArray(raw.category_tags)
        ? raw.category_tags.filter((t): t is string => typeof t === "string")
        : [],
      portfolio: raw.portfolio_assigned === true,
      modeling: raw.model_assigned === true,
      projects: raw.project_assigned === true,
    });
  }

  const warnings: string[] = [];
  const finalized = payload.finalized === true;
  const keptCount = photos.filter((p) => p.status === "kept").length;
  if (finalized && keptCount === 0) {
    return {
      ok: false,
      error:
        "Report says finalized but keeps zero photos — publishing it would blank the public site. Keep at least one photo, or export a draft report instead.",
    };
  }
  const keptWithoutCategory = photos.filter((p) => p.status === "kept" && !p.category_primary);
  if (keptWithoutCategory.length > 0) {
    if (finalized) {
      return {
        ok: false,
        error: `Report says finalized, but ${keptWithoutCategory.length} kept photo(s) have no primary category.`,
      };
    }
    warnings.push(`${keptWithoutCategory.length} kept photo(s) still need a primary category before finalization.`);
  }

  return {
    ok: true,
    warnings,
    output: {
      schema: PUBLIC_JSON_SCHEMA,
      generatedAt,
      finalized,
      sourceReportExportedAt: typeof payload.exportedAt === "string" ? payload.exportedAt : null,
      photos,
    },
  };
}
