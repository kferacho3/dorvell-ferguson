"use client";

import dynamic from "next/dynamic";
import type { DorvellImage } from "@/content/dorvell.schema";
import { getCategoryDef } from "@/lib/portfolio-taxonomy";
import { ArchiveContactSheet } from "./ArchiveContactSheet";
import { CalmGallery } from "./CalmGallery";
import { FeaturedGradientCarousel } from "./FeaturedGradientCarousel";
import { GallerySelect } from "./GallerySelect";
import { HorizontalStoryStrips } from "./HorizontalStoryStrips";
import { PhotographyCollections } from "./PhotographyCollections";
import { PortfolioCategoryNav } from "./PortfolioCategoryNav";
import { PortfolioCTA } from "./PortfolioCTA";
import { PortfolioHero } from "./PortfolioHero";
import {
  PortfolioModeProvider,
  useFilteredImages,
  usePortfolioData,
} from "./PortfolioModeProvider";
import { ScrollFormationChapters } from "./ScrollFormationChapters";
import { SelectedWorkRing } from "./SelectedWorkRing";
import {
  PORTFOLIO_MODES,
  usePortfolioFilters,
  usePortfolioMode,
} from "./portfolioMode";

// WebGL room is client-only + loaded on demand (only in Cinematic mode).
const ImmersiveImageRoom = dynamic(
  () => import("./ImmersiveImageRoom").then((mod) => mod.ImmersiveImageRoom),
  {
    ssr: false,
    loading: () => <div className="pf-room-skeleton" aria-hidden="true" />,
  },
);

function CalmBody({ images }: { images: DorvellImage[] }) {
  const { category } = usePortfolioFilters();
  const label =
    category === "All" ? "All photos" : getCategoryDef(category).label;
  return (
    <section
      id="archive"
      className="pf-section pf-calm"
      aria-labelledby="pf-calm-title"
    >
      <div className="pf-container">
        <div className="pf-section__head">
          <div>
            <h2 id="pf-calm-title">{label}</h2>
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
        <section
          id="archive"
          className="pf-section pf-section--stories"
          aria-labelledby="pf-stories-title"
        >
          <div className="pf-container">
            <div className="pf-section__head">
              <h2 id="pf-stories-title">Photo stories</h2>
            </div>
            <HorizontalStoryStrips />
          </div>
        </section>
        <section
          className="pf-section pf-section--chapters"
          aria-label="Category chapters"
        >
          <div className="pf-container">
            <ScrollFormationChapters />
          </div>
        </section>
      </>
    );
  }

  // Cinematic (default on desktop) — self-contained immersive sections.
  return (
    <div id="archive">
      <FeaturedGradientCarousel images={filtered} />
      <ImmersiveImageRoom images={filtered} />
      <SelectedWorkRing />
    </div>
  );
}

const viewOptions = PORTFOLIO_MODES.map(({ key, label }) => ({
  value: key,
  label,
}));

function PortfolioControlBar() {
  const { categories } = usePortfolioData();
  const { category, setCategory } = usePortfolioFilters();
  const { mode, setMode } = usePortfolioMode();
  const filterOptions = [
    { value: "All" as const, label: "All photos" },
    ...categories.map(({ category, label }) => ({ value: category, label })),
  ];

  return (
    <div className="sticky top-[calc(98px+env(safe-area-inset-top))] z-20 border-y border-[var(--df-line)] bg-[var(--df-bg)] py-2.5 md:top-[calc(65px+env(safe-area-inset-top))]">
      <div className="pf-container grid max-w-full grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3 sm:flex sm:[&>label]:min-w-40">
        <GallerySelect
          id="portfolio-category-filter"
          label="Category"
          value={category}
          options={filterOptions}
          onChange={setCategory}
        />
        <GallerySelect
          label="View"
          value={mode}
          options={viewOptions}
          onChange={setMode}
        />
      </div>
    </div>
  );
}

export function PortfolioExperience({ images }: { images: DorvellImage[] }) {
  return (
    <PortfolioModeProvider images={images}>
      <div className="pf-experience">
        <PortfolioHero />
        <div id="pf-gallery" className="pf-gallery !scroll-mt-0">
          <PortfolioControlBar />
          <div className="pf-container flex flex-wrap items-start gap-2 pt-4">
            <PortfolioCategoryNav />
            <PhotographyCollections />
          </div>
          <PortfolioBody />
        </div>
        <PortfolioCTA />
      </div>
    </PortfolioModeProvider>
  );
}
