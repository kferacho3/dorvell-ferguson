import type { RunwayPressEntry } from "@/content/dorvell.manual";

export function PressFeatures({ entries }: { entries: RunwayPressEntry[] }) {
  const verifiedEntries = entries.filter((entry) => entry.proof !== "needsVerification");

  if (verifiedEntries.length === 0) return null;

  return (
    <section className="press-section" aria-labelledby="press-title">
      <div className="section-heading">
        <p className="eyebrow">Press / Mentions</p>
        <h2 id="press-title">Clean credits, no borrowed shine.</h2>
        <p>Only source-locked mentions land here.</p>
      </div>
      <div className="press-grid">
        {verifiedEntries.map((entry) => (
          <article key={entry.title}>
            <span>{entry.label}</span>
            <h3>{entry.title}</h3>
            {entry.year ? <p>{entry.year}</p> : null}
            <small>{entry.proof}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
