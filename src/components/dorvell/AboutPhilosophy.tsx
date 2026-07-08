import type { CSSProperties } from "react";
import { philosophyLines } from "@/content/about.data";
import { PhilosophyLines } from "@/components/dorvell/PhilosophyLines";

/**
 * Section 6 — Philosophy pull-quotes. Two-to-three large editorial lines, one
 * thought per screen of scroll. Each reveals on entrance; exactly one line is
 * flagged `kinetic` and gets the velocity-reactive stretch owned by the
 * PhilosophyLines controller. Server markup + one small client controller.
 */
export function AboutPhilosophy() {
  return (
    <section className="about-block about-philosophy" aria-label="Working philosophy">
      {philosophyLines.map((line, index) => (
        <blockquote
          className={
            line.kinetic
              ? "about-philosophy__line about-philosophy__line--kinetic"
              : "about-philosophy__line"
          }
          data-reveal
          key={index}
          style={{ "--reveal-i": index } as CSSProperties}
        >
          {line.text}
        </blockquote>
      ))}
      <PhilosophyLines />
    </section>
  );
}
