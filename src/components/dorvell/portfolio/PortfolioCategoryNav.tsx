"use client";

import Image from "next/image";
import { useMemo, useRef, type CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { cn } from "@/lib/cn";
import { blurImageProps } from "@/lib/images";
import { filterByCategory } from "@/lib/portfolio-taxonomy";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { usePortfolioData } from "./PortfolioModeProvider";
import { usePortfolioFilters, usePortfolioMode } from "./portfolioMode";
import { useHoverTrail } from "./useHoverTrail";
import { galleryDisclosureSummary } from "./GallerySelect";

/**
 * Section 2 — the elevated category navigator / proof strip. Each card shows a
 * flip preview (base + hover frame, pure CSS), label, count and descriptor, and
 * sets the active filter. On fine-pointer, non-calm views an ambient image trail
 * follows the cursor across the grid.
 */
export function PortfolioCategoryNav() {
  const { images, categories } = usePortfolioData();
  const { category, setCategory } = usePortfolioFilters();
  const { mode } = usePortfolioMode();
  const reducedMotion = usePrefersReducedMotion();
  const gridRef = useRef<HTMLDivElement | null>(null);

  const samples = useMemo(() => {
    const map = new Map<string, DorvellImage[]>();
    for (const def of categories) {
      map.set(def.category, filterByCategory(images, def.category).slice(0, 3));
    }
    return map;
  }, [images, categories]);

  const trailSrcs = useMemo(
    () =>
      categories.flatMap((def) =>
        (samples.get(def.category) ?? [])
          .slice(0, 2)
          .map((image) => image.localOptimized.sm),
      ),
    [categories, samples],
  );

  useHoverTrail(gridRef, {
    images: trailSrcs,
    enabled: mode !== "calm" && !reducedMotion,
  });

  if (categories.length === 0) return null;

  return (
    <details className="group min-w-0 open:basis-full">
      <summary className={galleryDisclosureSummary}>
        Browse by image
        <span aria-hidden="true" className="group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <div className="pf-catnav mt-4">
        <div className="pf-catnav__grid" ref={gridRef}>
          {categories.map((def) => {
            const frames = samples.get(def.category) ?? [];
            const active = category === def.category;
            return (
              <button
                key={def.category}
                type="button"
                aria-pressed={active}
                className={cn("pf-catcard", active && "is-active")}
                style={{ "--lane-accent": def.accent } as CSSProperties}
                onClick={(event) => {
                  setCategory(active ? "All" : def.category);
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open");
                  document.getElementById("portfolio-category-filter")?.focus();
                }}
              >
                <span
                  className="pf-catcard__frames pf-frame pf-frame--cover"
                  aria-hidden="true"
                >
                  {frames[0] ? (
                    <Image
                      className="pf-catcard__base"
                      src={frames[0].localOptimized.sm}
                      alt=""
                      width={480}
                      height={600}
                      unoptimized
                      {...blurImageProps(frames[0])}
                    />
                  ) : null}
                  {frames[1] ? (
                    <Image
                      className="pf-catcard__flip"
                      src={frames[1].localOptimized.sm}
                      alt=""
                      width={480}
                      height={600}
                      unoptimized
                    />
                  ) : null}
                </span>
                <span className="pf-catcard__body">
                  <strong>{def.label}</strong>
                  <span className="pf-catcard__count">
                    {def.count} {def.count === 1 ? "frame" : "frames"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}
