import type { CSSProperties } from "react";
import { proofPoints } from "@/content/about.data";

/**
 * Section 7 — Selected credits. A terse press/proof strip (not a brag wall):
 * a sticky label beside stacked credit rows with proof-state coloring. Rows
 * reveal on scroll; `needsVerification` entries carry a muted "· pending" tag
 * so nothing unconfirmed reads as fact. Server component.
 */
export function AboutCredits() {
  return (
    <section className="about-block about-credits">
      <div className="about-credits__head">
        <p className="about-eyebrow">.02 Recognition</p>
        <h2 className="about-credits__title">Selected credits.</h2>
      </div>

      <ul className="about-credits__list">
        {proofPoints.map((point, index) => (
          <li
            className="about-credit"
            data-reveal-group
            key={point.name}
            style={{ "--reveal-i": index } as CSSProperties}
          >
            <span className="about-credit__mask">
              <span className="about-credit__name">{point.name}</span>
            </span>
            <span
              className={
                point.proof === "needsVerification"
                  ? "about-credit__label about-credit__label--pending"
                  : "about-credit__label"
              }
              title={point.proof === "needsVerification" ? "Pending verification" : undefined}
            >
              {point.label}
            </span>
            <p className="about-credit__detail">{point.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
