"use client";

import { useMemo, useState } from "react";
import {
  creativeCategories,
  creativeItems,
  type CreativeCategoryKey,
  type CreativeItem,
  type CreativeOrientation,
} from "@/content/creative";
import { GallerySelect } from "../portfolio/GallerySelect";
import { CreativeMediaCard } from "./CreativeMediaCard";

type CategoryFilter = "all" | CreativeCategoryKey;
type FormatFilter = "all" | CreativeOrientation;
type SortKey = "featured" | "newest" | "longest" | "mood";

const FORMATS: { value: FormatFilter; label: string }[] = [
  { value: "all", label: "All formats" },
  { value: "portrait", label: "Portrait (9:16)" },
  { value: "landscape", label: "Landscape (16:9)" },
  { value: "square", label: "Square (1:1)" },
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "longest", label: "Longest" },
  { value: "mood", label: "Mood" },
];

const categoryOptions: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All categories" },
  ...creativeCategories.map(({ key, label }) => ({ value: key, label })),
];

/**
 * Section 8 — Creative archive / filterable index. Practical library of every
 * clip: filter by room + format, sort, open any card in the lightbox.
 */
export function CreativeArchive() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [format, setFormat] = useState<FormatFilter>("all");
  const [sort, setSort] = useState<SortKey>("featured");

  const results = useMemo(() => {
    const filtered = creativeItems.filter((item) => {
      // categoryKeys, not categoryKey — a piece can live in several rooms
      if (category !== "all" && !item.categoryKeys.includes(category))
        return false;
      if (format !== "all" && item.orientation !== format) return false;
      return true;
    });
    const sorted = [...filtered];
    if (sort === "featured") {
      sorted.sort(
        (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
      );
    } else if (sort === "longest") {
      sorted.sort((a, b) => b.duration - a.duration);
    } else if (sort === "mood") {
      sorted.sort((a, b) => (a.moods[0] ?? "").localeCompare(b.moods[0] ?? ""));
    }
    // "newest" keeps the authored (newest-first) order
    return sorted;
  }, [category, format, sort]);

  return (
    <section
      id="cw-archive"
      className="cw-section cw-archive scroll-mt-0"
      aria-labelledby="cw-archive-title"
    >
      <div className="cw-container cw-container--wide">
        <div className="cw-section__head">
          <h2 id="cw-archive-title" className="cw-h2">
            Creative archive
          </h2>
        </div>

        <div
          role="group"
          aria-label="Archive filters"
          className="mb-4 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3"
        >
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <GallerySelect<CategoryFilter>
              label="Category"
              value={category}
              options={categoryOptions}
              onChange={setCategory}
            />
          </div>
          <GallerySelect<FormatFilter>
            label="Format"
            value={format}
            options={FORMATS}
            onChange={setFormat}
          />
          <GallerySelect<SortKey>
            label="Sort"
            value={sort}
            options={SORTS}
            onChange={setSort}
          />
        </div>

        <p className="cw-archive__count" aria-live="polite">
          {results.length} {results.length === 1 ? "piece" : "pieces"}
        </p>

        {results.length ? (
          <div className="cw-archive__grid">
            {results.map((item: CreativeItem) => (
              <div key={item.slug} className="cw-archive__cell">
                <CreativeMediaCard item={item} list={results} compact />
              </div>
            ))}
          </div>
        ) : (
          <div className="cw-archive__empty">
            <p>No clips match these filters.</p>
            <button
              type="button"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--cw-ink)] underline underline-offset-4"
              onClick={() => {
                setCategory("all");
                setFormat("all");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
