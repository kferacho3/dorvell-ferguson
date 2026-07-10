"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  creativeCategories,
  creativeItems,
  type CreativeCategoryKey,
  type CreativeItem,
  type CreativeOrientation,
} from "@/content/creative";
import { CreativeMediaCard } from "./CreativeMediaCard";

type CategoryFilter = "all" | CreativeCategoryKey;
type FormatFilter = "all" | CreativeOrientation;
type SortKey = "featured" | "newest" | "longest" | "mood";

const FORMATS: { key: FormatFilter; label: string }[] = [
  { key: "all", label: "All formats" },
  { key: "portrait", label: "9:16" },
  { key: "landscape", label: "16:9" },
  { key: "square", label: "1:1" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "longest", label: "Longest" },
  { key: "mood", label: "Mood" },
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
      if (category !== "all" && item.categoryKey !== category) return false;
      if (format !== "all" && item.orientation !== format) return false;
      return true;
    });
    const sorted = [...filtered];
    if (sort === "featured") {
      sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    } else if (sort === "longest") {
      sorted.sort((a, b) => b.duration - a.duration);
    } else if (sort === "mood") {
      sorted.sort((a, b) => (a.moods[0] ?? "").localeCompare(b.moods[0] ?? ""));
    }
    // "newest" keeps the authored (newest-first) order
    return sorted;
  }, [category, format, sort]);

  const categoryOptions: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: "All worlds" },
    ...creativeCategories.map((c) => ({ key: c.key as CategoryFilter, label: c.label })),
  ];

  return (
    <section id="cw-archive" className="cw-section cw-archive" aria-labelledby="cw-archive-title">
      <div className="cw-container cw-container--wide">
        <div className="cw-section__head">
          <p className="cw-eyebrow">Creative Archive</p>
          <h2 id="cw-archive-title" className="cw-h2">
            A living index of videos, shoots, and fragments.
          </h2>
          <p className="cw-lede">
            {creativeItems.length} pieces and counting — filter by world and format, sort, open any frame.
          </p>
        </div>

        <div className="cw-archive__controls">
          <div className="cw-chips" role="group" aria-label="Filter by world">
            {categoryOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={cn("cw-chip cw-chip--btn", category === option.key && "is-active")}
                aria-pressed={category === option.key}
                onClick={() => setCategory(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="cw-archive__controls-row">
            <div className="cw-chips" role="group" aria-label="Filter by format">
              {FORMATS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={cn("cw-chip cw-chip--btn", format === option.key && "is-active")}
                  aria-pressed={format === option.key}
                  onClick={() => setFormat(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="cw-archive__sort">
              <span className="cw-archive__sort-label">Sort</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                {SORTS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="cw-archive__count" aria-live="polite">
          {results.length} {results.length === 1 ? "piece" : "pieces"}
        </p>

        {results.length ? (
          <div className="cw-archive__grid">
            {results.map((item: CreativeItem) => (
              <div key={item.slug} className="cw-archive__cell">
                <CreativeMediaCard item={item} list={results} />
              </div>
            ))}
          </div>
        ) : (
          <div className="cw-archive__empty">
            <p>No pieces in this world yet — it&rsquo;s a concept still being built.</p>
            <button
              type="button"
              className="cw-btn cw-btn--ghost"
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
