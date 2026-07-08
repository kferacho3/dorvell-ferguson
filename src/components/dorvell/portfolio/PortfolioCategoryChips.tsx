"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { usePortfolioData } from "./PortfolioModeProvider";
import { usePortfolioFilters } from "./portfolioMode";

/** Compact category filter chips (All + every populated category). */
export function PortfolioCategoryChips({ className }: { className?: string }) {
  const { images, categories } = usePortfolioData();
  const { category, setCategory } = usePortfolioFilters();

  return (
    <ul className={cn("pf-chips", className)} aria-label="Filter by category">
      <li>
        <button
          type="button"
          aria-pressed={category === "All"}
          className={cn("pf-chip", category === "All" && "is-active")}
          onClick={() => setCategory("All")}
        >
          <span className="pf-chip__dot" aria-hidden="true" />
          All
          <span className="pf-chip__count">{images.length}</span>
        </button>
      </li>
      {categories.map((def) => (
        <li key={def.category}>
          <button
            type="button"
            aria-pressed={category === def.category}
            className={cn("pf-chip", category === def.category && "is-active")}
            style={{ "--lane-accent": def.accent } as CSSProperties}
            onClick={() => setCategory(def.category)}
          >
            <span className="pf-chip__dot" aria-hidden="true" />
            {def.label}
            <span className="pf-chip__count">{def.count}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
