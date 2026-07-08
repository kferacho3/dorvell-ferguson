import { CURATION_SCHEMA, type CurationPhoto, type CurationState, type ImportSummaryResult, type PhotoDecision } from "@/lib/curation/types";
import { parseCurationState } from "@/lib/curation/storage";
import { syncDestinationMirrors } from "@/lib/curation/types";

type ImportOutcome = {
  summary: ImportSummaryResult;
  state: CurationState | null;
};

function failure(error: string, hint: string): ImportOutcome {
  return {
    state: null,
    summary: {
      ok: false,
      error,
      errorHint: hint,
      totalInReport: 0,
      restored: 0,
      matchedById: 0,
      matchedByFilename: 0,
      missingFromCurrent: [],
      newSinceReport: [],
      conflicts: [],
      validationIssues: [],
    },
  };
}

/**
 * Extracts the fenced JSON block under “## Machine Readable State”.
 * The closing fence is the LAST ``` in the file (the block is always the final
 * section), so backtick runs inside notes/JSON strings cannot truncate it.
 */
function extractJsonBlock(markdown: string): string | null {
  const sectionIndex = markdown.indexOf("## Machine Readable State");
  const searchFrom = sectionIndex >= 0 ? sectionIndex : 0;
  const fenceStart = markdown.indexOf("```json", searchFrom);
  if (fenceStart === -1) return null;
  const bodyStart = markdown.indexOf("\n", fenceStart);
  if (bodyStart === -1) return null;
  const fenceEnd = markdown.lastIndexOf("```");
  if (fenceEnd <= bodyStart) return null;
  return markdown.slice(bodyStart + 1, fenceEnd).trim();
}

/**
 * Restores progress from an exported photos_report.md.
 * Matches by photo_id first, then filename/relativePath. Never mutates the
 * caller's state — returns a fresh state for the caller to confirm and commit.
 */
export function importMarkdownReport(
  markdown: string,
  photos: CurationPhoto[],
  currentState: CurationState,
  now: string,
): ImportOutcome {
  const jsonBlock = extractJsonBlock(markdown);
  if (!jsonBlock) {
    return failure(
      "Could not find the “Machine Readable State” JSON block in this file.",
      "Make sure you selected a photos_report.md exported from this studio, and that the end of the file was not edited or truncated.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonBlock);
  } catch (error) {
    return failure(
      `The JSON block could not be parsed: ${error instanceof Error ? error.message : "invalid JSON"}.`,
      "The section under “## Machine Readable State” was likely edited. Re-export a fresh report or restore the original file.",
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return failure("The machine-readable block is not a JSON object.", "Re-export the report from the studio.");
  }

  const record = parsed as Record<string, unknown>;
  if (record.schema !== CURATION_SCHEMA) {
    return failure(
      `Unsupported schema: ${String(record.schema ?? "missing")}.`,
      `This studio reads ${CURATION_SCHEMA}. Older ledger files are not curation reports.`,
    );
  }
  if (!Array.isArray(record.photos)) {
    return failure("The report contains no photo decision list.", "The “photos” array is missing from the JSON block.");
  }

  // Reuse the storage sanitizer by round-tripping through the persisted shape.
  const sanitized = parseCurationState(
    JSON.stringify({
      schema: CURATION_SCHEMA,
      decisions: Object.fromEntries(
        (record.photos as unknown[])
          .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
          .map((p) => [String(p.photo_id ?? ""), p]),
      ),
      customCategories: record.customCategories,
      uploads: [],
      updatedAt: now,
    }),
    now,
  );

  const reportDecisions = Object.values(sanitized.decisions);
  if (reportDecisions.length === 0) {
    return failure("The report parsed, but no valid photo decisions were found.", "The photos array may be empty or malformed.");
  }

  const byId = new Map(photos.map((p) => [p.photo_id, p]));
  const byFilename = new Map<string, CurationPhoto[]>();
  for (const photo of photos) {
    const list = byFilename.get(photo.filename) ?? [];
    list.push(photo);
    byFilename.set(photo.filename, list);
  }

  const nextDecisions: Record<string, PhotoDecision> = { ...currentState.decisions };
  const missingFromCurrent: string[] = [];
  const conflicts: string[] = [];
  const validationIssues: string[] = [];
  let matchedById = 0;
  let matchedByFilename = 0;
  let restoredCount = 0;

  for (const decision of reportDecisions) {
    let target: CurationPhoto | undefined = byId.get(decision.photo_id);
    let matchKind: "id" | "filename" | "none" = target ? "id" : "none";
    if (!target) {
      const candidates =
        byFilename.get(decision.filename) ??
        (decision.relativePath
          ? photos.filter((p) => p.relativePath === decision.relativePath)
          : []);
      if (candidates.length === 1) {
        target = candidates[0];
        matchKind = "filename";
      } else if (candidates.length > 1) {
        conflicts.push(
          `"${decision.filename}" matches ${candidates.length} current photos — skipped to avoid a wrong match.`,
        );
        continue;
      }
    }

    const targetId = target?.photo_id ?? decision.photo_id;
    const existing = currentState.decisions[targetId];
    if (existing && existing.status !== "unknown" && existing.updated_at > decision.updated_at) {
      conflicts.push(
        `"${decision.filename}": your local decision is newer than the report — kept the local one.`,
      );
      continue;
    }

    if (matchKind === "id") matchedById += 1;
    else if (matchKind === "filename") matchedByFilename += 1;
    else missingFromCurrent.push(decision.filename || decision.photo_id);

    // Preserve the report's own timestamp so a later, genuinely newer report
    // can still win the conflict check on the next import.
    const restored = syncDestinationMirrors({
      ...decision,
      photo_id: targetId,
      filename: target?.filename ?? decision.filename,
      batch: target?.batch ?? decision.batch,
      imported_from_report: true,
    });
    if (restored.status === "kept" && !restored.category_primary) {
      validationIssues.push(`"${restored.filename}" is kept but has no primary category.`);
    }
    nextDecisions[targetId] = restored;
    restoredCount += 1;
  }

  const reportIds = new Set(reportDecisions.map((d) => d.photo_id));
  const reportFilenames = new Set(reportDecisions.map((d) => d.filename));
  const newSinceReport = photos
    .filter((p) => !reportIds.has(p.photo_id) && !reportFilenames.has(p.filename))
    .map((p) => p.filename);

  const nextState: CurationState = {
    ...currentState,
    decisions: nextDecisions,
    customCategories: Array.from(
      new Set([...currentState.customCategories, ...sanitized.customCategories]),
    ),
    updatedAt: now,
  };

  return {
    state: nextState,
    summary: {
      ok: true,
      totalInReport: reportDecisions.length,
      restored: restoredCount,
      matchedById,
      matchedByFilename,
      missingFromCurrent,
      newSinceReport,
      conflicts,
      validationIssues,
    },
  };
}
