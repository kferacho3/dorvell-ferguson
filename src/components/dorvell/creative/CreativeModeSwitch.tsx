"use client";

import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { CREATIVE_MODES, useCreativeMode, type CreativeMode } from "./creativeMode";

/**
 * Cinematic / Calm toggle. Picking a mode from the hero variant smooth-scrolls
 * to the gallery body so the change is unmistakable; the bar variant lives in
 * the sticky control rail.
 */
export function CreativeModeSwitch({
  className,
  variant = "bar",
}: {
  className?: string;
  variant?: "hero" | "bar";
}) {
  const { mode, setMode } = useCreativeMode();
  const reducedMotion = usePrefersReducedMotion();

  const onSelect = (next: CreativeMode) => {
    setMode(next);
    if (variant === "hero" && typeof document !== "undefined") {
      document.getElementById("cw-body")?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className={cn("cw-modeswitch", className)} role="group" aria-label="Creative experience mode">
      {CREATIVE_MODES.map((option) => {
        const active = mode === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            className={cn("cw-modeswitch__btn", active && "is-active")}
            onClick={() => onSelect(option.key)}
          >
            <span className="cw-modeswitch__label">
              <strong>{option.label}</strong>
              <small>{option.tagline}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
