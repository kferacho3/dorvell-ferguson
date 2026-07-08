import type { CSSProperties } from "react";
import { aboutTimeline } from "@/content/about.data";

/**
 * Section 4 — Proof timeline. Numbered chapters (CSS counter) with headlines
 * that resolve blur-to-sharp per character on entrance (Codrops fx10, one-shot
 * per row). The visual char spans are aria-hidden; the accessible name comes
 * from aria-label on the heading (SlicedTitle idiom). `needsVerification`
 * milestones render a muted "pending" chip. Server component.
 */
export function AboutTimeline() {
  return (
    <section className="about-section about-timeline">
      <div className="about-roles__head">
        <p className="about-eyebrow">Proof of work</p>
        <h2 className="about-roles__title">A record, not a résumé.</h2>
      </div>

      <ol className="about-timeline__list">
        {aboutTimeline.map((item, index) => (
          <li
            className="about-timeline__row"
            data-reveal
            key={item.title}
            style={{ "--reveal-i": index } as CSSProperties}
          >
            <div>
              <span className="about-timeline__index" aria-hidden="true" />
              <span className="about-timeline__era">{item.era}</span>
            </div>

            <div className="about-timeline__main">
              <h3 className="about-timeline__title" aria-label={item.title}>
                <span aria-hidden="true">
                  {Array.from(item.title).map((char, ci) => (
                    <span className="about-char" key={ci} style={{ "--ci": ci } as CSSProperties}>
                      {char}
                    </span>
                  ))}
                </span>
              </h3>
              <p className="about-timeline__org">{item.org}</p>
              <p className="about-timeline__blurb">{item.blurb}</p>
              {item.proof === "verified" ? (
                <span className="about-chip about-chip--verified">Verified</span>
              ) : (
                <span className="about-chip about-chip--pending" title="Pending verification">
                  Pending
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
