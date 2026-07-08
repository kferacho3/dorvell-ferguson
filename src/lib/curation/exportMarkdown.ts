import {
  CURATION_SCHEMA,
  type CurationPhoto,
  type CurationState,
  type CurationSummary,
  type PhotoDecision,
} from "@/lib/curation/types";
import { categoryCounts, summarize, validateForFinalization } from "@/lib/curation/validation";

export type ReportPayload = {
  schema: typeof CURATION_SCHEMA;
  exportedAt: string;
  finalized: boolean;
  summary: CurationSummary;
  categories: Record<string, number>;
  customCategories: string[];
  photos: PhotoDecision[];
};

function cell(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildReportPayload(
  photos: CurationPhoto[],
  state: CurationState,
  exportedAt: string,
): ReportPayload {
  const summary = summarize(photos, state.decisions);
  const orderedDecisions = photos
    .map((photo) => state.decisions[photo.photo_id])
    .filter((d): d is PhotoDecision => Boolean(d));
  // Decisions for photos no longer in the manifest are preserved, not dropped.
  const knownIds = new Set(photos.map((p) => p.photo_id));
  const orphanDecisions = Object.values(state.decisions).filter((d) => !knownIds.has(d.photo_id));

  return {
    schema: CURATION_SCHEMA,
    exportedAt,
    finalized: Boolean(state.finalizedAt),
    summary,
    categories: categoryCounts(photos, state.decisions),
    customCategories: state.customCategories,
    photos: [...orderedDecisions, ...orphanDecisions],
  };
}

/**
 * Canonical curation report. The JSON block at the end is the machine-readable
 * source of truth; the table is the human-readable companion. Importing this
 * exact file restores progress.
 */
export function exportMarkdownReport(
  photos: CurationPhoto[],
  state: CurationState,
  exportedAt: string,
): string {
  const payload = buildReportPayload(photos, state, exportedAt);
  const { summary } = payload;
  const validation = validateForFinalization(photos, state.decisions);
  const blocked = validation.blockers.length + validation.unreviewed.length;

  const categoryLines = Object.entries(payload.categories)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `- ${name}: ${count}`)
    .join("\n");

  const rows = payload.photos.map((d) =>
    [
      cell(d.photo_id),
      cell(d.filename),
      cell(d.status),
      cell(d.category_primary ?? ""),
      cell(d.category_tags.join(", ")),
      d.portfolio_assigned ? "yes" : "no",
      d.model_assigned ? "yes" : "no",
      d.project_assigned ? "yes" : "no",
      cell(d.status === "scrapped" ? d.scrap_reason || "" : ""),
      cell(d.notes),
      cell(d.reviewed_at ?? ""),
    ].join(" | "),
  );

  return `# Dorvell Ferguson Photo Curation Report

Exported: ${exportedAt}
Schema: ${CURATION_SCHEMA}

## Summary

Total photos: ${summary.total}
Reviewed: ${summary.reviewed}
Remaining: ${summary.remaining}
Kept: ${summary.kept}
Scrapped: ${summary.scrapped}
Categorized: ${summary.categorized}
Added to Portfolio: ${summary.portfolio}
Added to Modeling: ${summary.modeling}
Added to Projects: ${summary.projects}
Percent complete: ${summary.percentComplete}%

## Validation

Status: ${payload.finalized ? "Finalized" : validation.readyToFinalize ? "Ready to finalize" : "Draft"}
Blocked items: ${blocked}
Notes: Kept photos must have a primary category before finalization.

## Categories

${categoryLines || "- No categorized photos yet."}

## How To Use This File

1. Keep this file safe — it is the source of truth for photo decisions.
2. To resume work later, open the Photo Curation Studio and use “Import Report” with this file.
3. Decisions are matched by photo_id first, then by filename if ids changed.
4. For photos you uploaded from your own computer, re-upload the same folder after importing so previews reconnect. Your decisions are already saved in this file.
5. The JSON block at the end is machine-readable — do not edit it by hand.

## Photo Decisions

| photo_id | filename | status | category_primary | category_tags | portfolio_assigned | model_assigned | project_assigned | scrap_reason | notes | reviewed_at |
|---|---|---|---|---|---|---|---|---|---|---|
${rows.map((row) => `| ${row} |`).join("\n")}

## Machine Readable State

\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`
`;
}

export function downloadTextFile(filename: string, content: string, mime = "text/markdown") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
