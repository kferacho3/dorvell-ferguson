"use client";

import { Reveal } from "./Reveal";

const LINES = [
  "Some shoots are assignments.",
  "Some are scenes.",
  "Some are experiments in pressure,",
  "light, body language, and atmosphere.",
];

/**
 * Section 2 — Manifesto / big-type statement. Line-by-line blur-to-sharp
 * reveal (native, reduced-motion safe).
 */
export function CreativeManifesto() {
  return (
    <section className="cw-section cw-mani" aria-label="Creative manifesto">
      <div className="cw-container">
        <p className="cw-eyebrow">Manifesto</p>
        <p className="cw-mani__statement">
          {LINES.map((line, index) => (
            <Reveal
              key={line}
              as="span"
              className="cw-mani__line"
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              {line}
            </Reveal>
          ))}
        </p>
        <Reveal as="p" className="cw-mani__coda">
          This is Dorvell&rsquo;s creative hub — the place for cinematic shorts, surreal photoshoots,
          modeling studies, and visual worlds still being built.
        </Reveal>
      </div>
    </section>
  );
}
