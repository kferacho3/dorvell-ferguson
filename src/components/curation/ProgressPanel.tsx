"use client";

import type { CurationSummary, ValidationResult } from "@/lib/curation/types";
import type { SaveStatus } from "@/components/curation/studioTypes";

type ProgressPanelProps = {
  summary: CurationSummary;
  validation: ValidationResult;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  finalized: boolean;
  onSaveNow: () => void;
};

const SAVE_LABELS: Record<SaveStatus, string> = {
  saved: "Saved",
  saving: "Saving…",
  unsaved: "Unsaved changes",
  error: "Save failed — download a report to be safe",
};

function formatTime(iso: string | null) {
  if (!iso) return "not yet";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function ProgressPanel({
  summary,
  validation,
  saveStatus,
  lastSavedAt,
  finalized,
  onSaveNow,
}: ProgressPanelProps) {
  const readiness = finalized
    ? { label: "Finalized", tone: "final" }
    : validation.readyToFinalize
      ? { label: "Ready to finalize", tone: "ready" }
      : {
          label: `${validation.blockers.length + validation.unreviewed.length} to resolve`,
          tone: "blocked",
        };

  const counters: Array<{ label: string; value: number; tone?: string }> = [
    { label: "Total", value: summary.total },
    { label: "Reviewed", value: summary.reviewed },
    { label: "Remaining", value: summary.remaining, tone: summary.remaining > 0 ? "warn" : undefined },
    { label: "Kept", value: summary.kept, tone: "keep" },
    { label: "Scrapped", value: summary.scrapped, tone: "scrap" },
    { label: "Categorized", value: summary.categorized },
    { label: "Portfolio", value: summary.portfolio, tone: "dest" },
    { label: "Modeling", value: summary.modeling, tone: "dest" },
    { label: "Projects", value: summary.projects, tone: "dest" },
  ];

  return (
    <section className="studio-progress" aria-label="Curation progress">
      <div className="studio-progress__bar-row">
        <div
          className="studio-progress__bar"
          role="progressbar"
          aria-valuenow={summary.percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Percent of photos fully decided"
        >
          <span className="studio-progress__bar-fill" style={{ width: `${summary.percentComplete}%` }} />
        </div>
        <strong className="studio-progress__percent">{summary.percentComplete}%</strong>
        <span className={`studio-progress__readiness studio-progress__readiness--${readiness.tone}`}>
          {readiness.label}
        </span>
      </div>

      <dl className="studio-progress__counters">
        {counters.map((counter) => (
          <div
            key={counter.label}
            className={`studio-progress__counter${counter.tone ? ` studio-progress__counter--${counter.tone}` : ""}`}
          >
            <dt>{counter.label}</dt>
            <dd>{counter.value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>

      <div className="studio-progress__save-row">
        <span
          className={`studio-progress__save-status studio-progress__save-status--${saveStatus}`}
          role="status"
          aria-live="polite"
        >
          {SAVE_LABELS[saveStatus]}
          {saveStatus === "saved" ? ` · ${formatTime(lastSavedAt)}` : ""}
        </span>
        <button type="button" className="studio-button studio-button--ghost" onClick={onSaveNow}>
          Save now
        </button>
      </div>
    </section>
  );
}
