"use client";

import { useState } from "react";
import type { DorvellCategory } from "@/content/dorvell.schema";
import type {
  ActivePortfolioCategory,
  PortfolioCategoryFilter,
} from "@/lib/portfolio-taxonomy";
import { PhotoGallery, type PhotoGalleryImage } from "./PhotoGallery";

type PortfolioExperienceProps = {
  images: readonly (PhotoGalleryImage & {
    categories: readonly DorvellCategory[];
  })[];
  categories: readonly Pick<ActivePortfolioCategory, "category" | "label">[];
};

export function PortfolioExperience({
  images,
  categories,
}: PortfolioExperienceProps) {
  const [category, setCategory] = useState<PortfolioCategoryFilter>("All");
  const filtered =
    category === "All"
      ? images
      : images.filter((image) => image.categories.includes(category));
  const categoryLabel = categories.find(
    (option) => option.category === category,
  )?.label;

  return (
    <div id="pf-gallery">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-12 gap-y-4 sm:mb-7">
        <h1 className="text-[clamp(2.75rem,7vw,5.75rem)] font-bold leading-[0.96] tracking-tight [font-family:var(--font-display)]">
          Photography
        </h1>
        <label className="flex w-full max-w-sm items-center gap-3 text-sm font-medium sm:w-auto">
          Category
          <select
            value={category}
            className="min-h-11 min-w-0 flex-1 border border-[var(--df-line-strong)] bg-[var(--df-bg-2)] px-3 text-sm text-[var(--df-text)] sm:min-w-44"
            onChange={(event) => {
              const option = categories.find(
                (entry) => entry.category === event.target.value,
              );
              setCategory(option?.category ?? "All");
            }}
          >
            <option value="All">All photography</option>
            {categories.map((option) => (
              <option value={option.category} key={option.category}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>
      <p className="sr-only" role="status">
        {filtered.length.toLocaleString("en-US")}{" "}
        {filtered.length === 1 ? "photo" : "photos"}
        {categoryLabel ? ` in ${categoryLabel}` : ""}
      </p>
      <div id="archive">
        <PhotoGallery
          key={category}
          images={filtered}
          label={
            categoryLabel ? `${categoryLabel} gallery` : "Photography gallery"
          }
        />
      </div>
    </div>
  );
}
