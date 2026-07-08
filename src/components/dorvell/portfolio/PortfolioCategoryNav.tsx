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
        (samples.get(def.category) ?? []).slice(0, 2).map((image) => image.localOptimized.sm),
      ),
    [categories, samples],
  );

  useHoverTrail(gridRef, {
    images: trailSrcs,
    enabled: mode !== "calm" && !reducedMotion,
  });

  if (categories.length === 0) return null;

  const proof = categories.slice(0, 6).map((def) => def.label).join(" • ");

  return (
    <section className="pf-section pf-catnav" aria-labelledby="pf-catnav-title">
      <div className="pf-container">
        <div className="pf-section__head">
          <div>
            <p className="pf-eyebrow">The Range</p>
            <h2 id="pf-catnav-title">Choose a way in.</h2>
            <p>Every category is a live room. Pick one to filter the whole page, or keep it on All.</p>
          </div>
          <p className="pf-proofline">
            <span>{proof}</span>
          </p>
        </div>

        <div className="pf-catnav__grid" ref={gridRef}>
          {categories.map((def, index) => {
            const frames = samples.get(def.category) ?? [];
            const active = category === def.category;
            return (
              <button
                key={def.category}
                type="button"
                aria-pressed={active}
                className={cn("pf-catcard", active && "is-active")}
                style={{ "--lane-accent": def.accent } as CSSProperties}
                onClick={() => setCategory(active ? "All" : def.category)}
              >
                <span className="pf-catcard__frames pf-frame pf-frame--cover" aria-hidden="true">
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
                  <em>{String(index + 1).padStart(2, "0")}</em>
                  <strong>{def.label}</strong>
                  <small>{def.descriptor}</small>
                  <span className="pf-catcard__count">
                    {def.count} {def.count === 1 ? "frame" : "frames"}
                    {def.crossLinkHref ? " · also on Modeling" : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
