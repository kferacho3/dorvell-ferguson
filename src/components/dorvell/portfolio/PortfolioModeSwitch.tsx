"use client";

import { cn } from "@/lib/cn";
import { PORTFOLIO_MODES, usePortfolioMode } from "./portfolioMode";

/**
 * The gallery-mode control: Cinematic / Calm / Archive / Story.
 * A real radiogroup so the active mode is announced and keyboard-operable.
 */
export function PortfolioModeSwitch({ className }: { className?: string }) {
  const { mode, setMode } = usePortfolioMode();
  return (
    <div className={cn("pf-modeswitch", className)} role="group" aria-label="Gallery view mode">
      {PORTFOLIO_MODES.map((option) => {
        const active = mode === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            className={cn("pf-modeswitch__btn", active && "is-active")}
            onClick={() => setMode(option.key)}
          >
            <strong>{option.label}</strong>
            <small>{option.tagline}</small>
          </button>
        );
      })}
    </div>
  );
}
