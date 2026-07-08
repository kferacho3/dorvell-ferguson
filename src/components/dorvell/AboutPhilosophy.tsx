import type { CSSProperties } from "react";
import { philosophyLines } from "@/content/about.data";

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
        const chars = Array.from(line.text);
        const last = chars.length - 1;
        return (
          <blockquote
            className="about-philosophy__line about-philosophy__line--kinetic"
            data-reveal-group
            data-kinetic
            key={index}
            aria-label={line.text}
          >
            <span aria-hidden="true">
              {chars.map((char, ci) => {
                // triangle factor: 0 at the ends, 1 at the centre of the line
                const cf = last > 0 ? 1 - Math.abs(ci / last - 0.5) * 2 : 1;
                const cs = ci % 2 === 0 ? 1 : -1;
                return (
                  <span
                    className="about-phil__char"
                    key={ci}
                    style={{ "--ci": ci, "--cf": cf.toFixed(3), "--cs": cs } as CSSProperties}
                  >
                    {char}
                  </span>
                );
              })}
            </span>
          </blockquote>
        );
      })}
    </section>
  );
}
