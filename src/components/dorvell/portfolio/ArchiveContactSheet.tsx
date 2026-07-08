"use client";

import { getCategoryDef } from "@/lib/portfolio-taxonomy";
import { WorkArchive } from "../WorkArchive";
import { useFilteredImages } from "./PortfolioModeProvider";
import { usePortfolioFilters } from "./portfolioMode";

/**
 * Archive mode — the full contact-sheet browser. Reuses the battle-tested
 * WorkArchive engine (grid / focus / contact / carousel sub-views, cursor map,
 * infinite scroll, lightbox) scoped to the active category filter.
 */
export function ArchiveContactSheet() {
  const images = useFilteredImages();
  const { category } = usePortfolioFilters();
  const scopeLabel = category === "All" ? undefined : getCategoryDef(category).label;

  return (
    <div className="pf-archive" id="pf-archive">
      <WorkArchive images={images} scopeLabel={scopeLabel} variant="full" />
    </div>
  );
}
