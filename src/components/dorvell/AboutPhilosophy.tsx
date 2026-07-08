import type { CSSProperties } from "react";
import { philosophyLines } from "@/content/about.data";
import { CharWords } from "@/components/dorvell/about-split";

/**
 * Section 6 — Philosophy pull-quotes. Two-to-three large editorial lines, one
 * thought per screen. The single `kinetic` line dominates (weight 900, gold)
 * and is split per-letter: each glyph carries a triangle weight `--cf` (peaks
 * mid-line) and alternating sign `--cs`, so the shared eased scroll-velocity
 * var (`--about-veln`, written by AboutRevealController) bends/rotates the
 * letters and stretches the line as you scroll — OnScroll letter-animation
 * idiom, amplitude-capped. Flanking lines are demoted so one line leads.
 * Fully server-rendered; the one client controller owns the velocity var.
 */
export function AboutPhilosophy() {
  return (
    <section className="about-block about-philosophy" aria-label="Working philosophy">
      {philosophyLines.map((line, index) => {
        if (!line.kinetic) {
          return (
            <blockquote
              className="about-philosophy__line about-philosophy__line--muted"
              data-reveal
              key={index}
              style={{ "--reveal-i": index } as CSSProperties}
            >
              {line.text}
            </blockquote>
          );
        }
        return (
          <blockquote
            className="about-philosophy__line about-philosophy__line--kinetic"
            data-reveal-group
            data-kinetic
            key={index}
            aria-label={line.text}
          >
            <CharWords
              text={line.text}
              charClass="about-phil__char"
              extra={(i, total) => ({
                // triangle factor: 0 at the ends, 1 at the centre of the line
                "--cf": (total > 1 ? 1 - Math.abs(i / (total - 1) - 0.5) * 2 : 1).toFixed(3),
                "--cs": i % 2 === 0 ? 1 : -1,
              })}
            />
          </blockquote>
        );
      })}
    </section>
  );
}
