"use client";

import { useState } from "react";

const STEPS = [
  "Every photo starts as “Unreviewed.”",
  "For each photo, choose KEEP or SCRAP.",
  "If you KEEP a photo, choose one primary category.",
  "Add optional tags or notes only when helpful.",
  "Press MODELING for any photo that should appear in the Modeling section.",
  "Press PROJECTS for any college or project-related photo.",
  "Use the progress counters to track what is done and what is left.",
  "Download the .md and .pdf report regularly — the .md file is your backup.",
  "When returning later, upload the saved .md report to restore your exact progress.",
  "Use a laptop or desktop — these photos are high-resolution and not optimized yet.",
] as const;

type InstructionsPanelProps = {
  defaultOpen?: boolean;
};

export function InstructionsPanel({ defaultOpen = false }: InstructionsPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="studio-instructions" aria-labelledby="studio-instructions-title">
      <button
        type="button"
        className="studio-instructions__toggle"
        aria-expanded={open}
        aria-controls="studio-instructions-body"
        onClick={() => setOpen((v) => !v)}
      >
        <span id="studio-instructions-title">How to review photos</span>
        <span className="studio-instructions__chevron" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      <div id="studio-instructions-body" hidden={!open}>
        <ol className="studio-instructions__list">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="studio-instructions__footnote">
          Progress autosaves in this browser. The exported <code>photos_report.md</code> is the
          source of truth — keep a copy somewhere safe.
        </p>
      </div>
    </section>
  );
}
