"use client";

import { cn } from "@/lib/cn";
import { CREATIVE_MODES, useCreativeMode } from "./creativeMode";

export function CreativeModeSwitch() {
  const { mode, setMode } = useCreativeMode();

  return (
    <div
      className="cw-modeswitch !p-0.5"
      role="group"
      aria-label="Creative experience mode"
    >
      {CREATIVE_MODES.map((option) => {
        const active = mode === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            className={cn(
              "cw-modeswitch__btn !min-h-11 !px-2.5 text-xs font-semibold sm:!px-3",
              active && "is-active",
            )}
            onClick={() => setMode(option.key)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
