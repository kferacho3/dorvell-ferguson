"use client";

import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { PORTFOLIO_MODES, usePortfolioMode, type PortfolioMode } from "./portfolioMode";

/**
 * The gallery-mode control: Cinematic / Calm / Archive / Story.
 * A toggle-button group (aria-pressed). Two variants:
 *  - "hero": a prominent full-width segmented selector; picking a mode smooth-
 *    scrolls to the gallery body so the change is unmistakable.
 *  - "bar": the compact version used in the sticky control rail.
 */
export function PortfolioModeSwitch({
  className,
  variant = "bar",
}: {
  className?: string;
  variant?: "hero" | "bar";
}) {
  const { mode, setMode } = usePortfolioMode();
  const reducedMotion = usePrefersReducedMotion();

  const onSelect = (next: PortfolioMode) => {
    setMode(next);
    if (variant === "hero" && typeof document !== "undefined") {
      document.getElementById("pf-gallery")?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  return (
    <div
      className={cn("pf-modeswitch", `pf-modeswitch--${variant}`, className)}
      role="group"
      aria-label="Gallery view mode"
    >
      {PORTFOLIO_MODES.map((option, index) => {
        const active = mode === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            className={cn("pf-modeswitch__btn", active && "is-active")}
            onClick={() => onSelect(option.key)}
          >
            <span className="pf-modeswitch__index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="pf-modeswitch__label">
              <strong>{option.label}</strong>
              <small>{option.tagline}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
