"use client";

import dynamic from "next/dynamic";
import type { DorvellImage } from "@/content/dorvell.schema";
import { getCategoryDef } from "@/lib/portfolio-taxonomy";
import { ArchiveContactSheet } from "./ArchiveContactSheet";
import { CalmGallery } from "./CalmGallery";
import { FeaturedGradientCarousel } from "./FeaturedGradientCarousel";
import { HorizontalStoryStrips } from "./HorizontalStoryStrips";
import { PortfolioCategoryChips } from "./PortfolioCategoryChips";
import { PortfolioCategoryNav } from "./PortfolioCategoryNav";
import { PortfolioCTA } from "./PortfolioCTA";
import { PortfolioHero } from "./PortfolioHero";
import { PortfolioModeProvider, useFilteredImages } from "./PortfolioModeProvider";
import { PortfolioModeSwitch } from "./PortfolioModeSwitch";
import { ScrollFormationChapters } from "./ScrollFormationChapters";
import { SelectedWorkRing } from "./SelectedWorkRing";
import { usePortfolioFilters, usePortfolioMode } from "./portfolioMode";

// WebGL room is client-only + loaded on demand (only in Cinematic mode).
const ImmersiveImageRoom = dynamic(
  () => import("./ImmersiveImageRoom").then((mod) => mod.ImmersiveImageRoom),
  { ssr: false, loading: () => <div className="pf-room-skeleton" aria-hidden="true" /> },
);

function CalmBody({ images }: { images: DorvellImage[] }) {
  const { category } = usePortfolioFilters();
  const label = category === "All" ? "the full archive" : getCategoryDef(category).label;
  return (
    <section className="pf-section pf-calm" aria-labelledby="pf-calm-title">
      <div className="pf-container">
        <div className="pf-section__head">
          <div>
            <p className="pf-eyebrow">Calm</p>
            <h2 id="pf-calm-title">Less interface. More photograph.</h2>
            <p>
              {images.length} {images.length === 1 ? "frame" : "frames"} in {label}, laid out clean and
              quiet — no motion, easy to scan.
            </p>
          </div>
        </div>
        <CalmGallery images={images} />
      </div>
    </section>
  );
}

function PortfolioBody() {
  const { mode } = usePortfolioMode();
  const filtered = useFilteredImages();

  if (mode === "calm") return <CalmBody images={filtered} />;
  if (mode === "archive") return <ArchiveContactSheet />;
  if (mode === "story") {
    return (
      <>
        <section className="pf-section pf-section--stories" aria-labelledby="pf-stories-title">
          <div className="pf-container">
            <div className="pf-section__head">
              <div>
                <p className="pf-eyebrow">Stories</p>
                <h2 id="pf-stories-title">Work in context.</h2>
                <p>Editorial strips per lane — scroll to move through each set, click any frame for the full story.</p>
              </div>
            </div>
            <HorizontalStoryStrips />
          </div>
        </section>
        <section className="pf-section pf-section--chapters" aria-label="Category chapters">
          <div className="pf-container">
            <ScrollFormationChapters />
          </div>
        </section>
      </>
    );
  }

  // Cinematic (default on desktop) — self-contained immersive sections.
  return (
    <>
      <FeaturedGradientCarousel images={filtered} />
      <ImmersiveImageRoom images={filtered} />
      <SelectedWorkRing />
    </>
  );
}

/** Sticky control rail — mode switch + category chips, always reachable. */
function PortfolioControlBar() {
  return (
    <div className="pf-controlbar">
      <div className="pf-container pf-controlbar__inner">
        <PortfolioModeSwitch />
        <PortfolioCategoryChips className="pf-controlbar__chips" />
      </div>
    </div>
  );
}

export function PortfolioExperience({
  images,
  projectCount,
}: {
  images: DorvellImage[];
  projectCount: number;
}) {
  return (
    <PortfolioModeProvider images={images} projectCount={projectCount}>
      <div className="pf-experience">
        <PortfolioHero />
        <PortfolioCategoryNav />
        <div id="pf-gallery" className="pf-gallery">
          <PortfolioControlBar />
          <PortfolioBody />
        </div>
        <PortfolioCTA />
      </div>
    </PortfolioModeProvider>
  );
}
