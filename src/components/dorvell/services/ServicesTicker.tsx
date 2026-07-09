"use client";

import { useState } from "react";
import { DISCIPLINES } from "@/lib/services-content";

/**
 * Infinite-scrolling strip of discipline word-marks (the DF-native replacement
 * for the reference's partner-logo ticker). The list is rendered twice so the
 * translate loop is seamless; the duplicate is hidden from assistive tech.
 *
 * A visible, keyboard-operable pause/play toggle satisfies WCAG 2.2.2 (Pause,
 * Stop, Hide) independently of the OS reduced-motion preference.
 */
export function ServicesTicker({ active }: { active: boolean }) {
  const [paused, setPaused] = useState(false);

  const classNames = ["svc-ticker", active ? "is-in" : "", paused ? "is-paused" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classNames} aria-label="Disciplines">
      <div className="svc-ticker__mask">
        <div className="svc-ticker__track">
          <ul className="svc-ticker__row">
            {DISCIPLINES.map((label) => (
              <li key={label} className="svc-ticker__item">
                {label}
              </li>
            ))}
          </ul>
          <ul className="svc-ticker__row" aria-hidden="true">
            {DISCIPLINES.map((label) => (
              <li key={`dup-${label}`} className="svc-ticker__item">
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button
        type="button"
        className="svc-ticker__toggle"
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? "Play the discipline ticker" : "Pause the discipline ticker"}
      </button>
    </section>
  );
}
