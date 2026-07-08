"use client";

import { useRef, useState } from "react";
import type { ReviewFilter, StudioMode } from "@/components/curation/studioTypes";
import { REVIEW_FILTER_LABELS } from "@/components/curation/studioTypes";
import type { DestinationKey } from "@/components/curation/curationReducer";

type CurationToolbarProps = {
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  reviewFilter: ReviewFilter;
  onReviewFilterChange: (filter: ReviewFilter) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  batchFilter: string;
  onBatchFilterChange: (batch: string) => void;
  batches: string[];
  categories: readonly string[];
  search: string;
  onSearchChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  visibleCount: number;
  totalCount: number;
  selectedCount: number;
  onSelectAllVisible: () => void;
  onClearSelection: () => void;
  onBulkKeep: () => void;
  onBulkScrap: () => void;
  onBulkCategory: (category: string) => void;
  onBulkTag: (tag: string) => void;
  onBulkDestination: (destination: DestinationKey, value: boolean) => void;
  onAddCategory: (name: string) => void;
};

const FILTERS: ReviewFilter[] = [
  "all",
  "unreviewed",
  "reviewed",
  "kept",
  "scrapped",
  "needs-category",
  "modeling",
  "projects",
  "portfolio",
];

export function CurationToolbar({
  mode,
  onModeChange,
  reviewFilter,
  onReviewFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  batchFilter,
  onBatchFilterChange,
  batches,
  categories,
  search,
  onSearchChange,
  searchInputRef,
  visibleCount,
  totalCount,
  selectedCount,
  onSelectAllVisible,
  onClearSelection,
  onBulkKeep,
  onBulkScrap,
  onBulkCategory,
  onBulkTag,
  onBulkDestination,
  onAddCategory,
}: CurationToolbarProps) {
  const [newCategory, setNewCategory] = useState("");
  const [bulkTag, setBulkTag] = useState("");
  const bulkCategoryRef = useRef<HTMLSelectElement>(null);

  const hasSelection = selectedCount > 0;

  return (
    <div className="studio-toolbar" role="region" aria-label="Filters and actions">
      <div className="studio-toolbar__row">
        <div className="studio-toolbar__modes" role="group" aria-label="Review mode">
          {(["grid", "focus", "queue"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              className={`studio-toolbar__mode${mode === m ? " is-active" : ""}`}
              onClick={() => onModeChange(m)}
            >
              {m === "grid" ? "Grid review" : m === "focus" ? "Focus review" : "Finalize queue"}
            </button>
          ))}
        </div>

        <label className="studio-toolbar__search">
          <span className="sr-only">Search by filename, notes, or tags</span>
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search filename, notes, tags…  ( / )"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>

      <div className="studio-toolbar__row studio-toolbar__row--filters">
        <div className="studio-toolbar__chips" role="group" aria-label="Review status filter">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`studio-chip${reviewFilter === filter ? " is-active" : ""}`}
              aria-pressed={reviewFilter === filter}
              onClick={() => onReviewFilterChange(filter)}
            >
              {REVIEW_FILTER_LABELS[filter]}
            </button>
          ))}
        </div>

        <label className="studio-toolbar__select">
          <span>Category</span>
          <select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="studio-toolbar__select">
          <span>Batch</span>
          <select value={batchFilter} onChange={(event) => onBatchFilterChange(event.target.value)}>
            <option value="">All batches</option>
            {batches.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
        </label>

        <form
          className="studio-toolbar__add-category"
          onSubmit={(event) => {
            event.preventDefault();
            if (newCategory.trim()) {
              onAddCategory(newCategory.trim());
              setNewCategory("");
            }
          }}
        >
          <label>
            <span className="sr-only">New category name</span>
            <input
              type="text"
              placeholder="New category…"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              maxLength={40}
            />
          </label>
          <button type="submit" className="studio-button studio-button--ghost" disabled={!newCategory.trim()}>
            Add Category
          </button>
        </form>

        <p className="studio-toolbar__count" role="status">
          Showing {visibleCount.toLocaleString()} of {totalCount.toLocaleString()}
        </p>
      </div>

      <div
        className={`studio-toolbar__bulk${hasSelection ? " is-open" : ""}`}
        role="region"
        aria-label="Bulk actions"
        hidden={!hasSelection && undefined}
      >
        <div className="studio-toolbar__bulk-info">
          <strong>{selectedCount.toLocaleString()} selected</strong>
          <button type="button" className="studio-button studio-button--ghost" onClick={onSelectAllVisible}>
            Select all visible
          </button>
          <button
            type="button"
            className="studio-button studio-button--ghost"
            onClick={onClearSelection}
            disabled={!hasSelection}
          >
            Clear selection
          </button>
        </div>

        {hasSelection ? (
          <div className="studio-toolbar__bulk-actions">
            <button type="button" className="studio-button studio-button--keep" onClick={onBulkKeep}>
              Mark KEEP
            </button>
            <button type="button" className="studio-button studio-button--scrap" onClick={onBulkScrap}>
              Mark SCRAP
            </button>

            <label className="studio-toolbar__select">
              <span className="sr-only">Assign category to selected</span>
              <select
                ref={bulkCategoryRef}
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) {
                    onBulkCategory(event.target.value);
                    event.target.value = "";
                  }
                }}
              >
                <option value="">Assign category…</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <form
              className="studio-toolbar__bulk-tag"
              onSubmit={(event) => {
                event.preventDefault();
                if (bulkTag.trim()) {
                  onBulkTag(bulkTag.trim());
                  setBulkTag("");
                }
              }}
            >
              <label>
                <span className="sr-only">Tag to add to selected</span>
                <input
                  type="text"
                  placeholder="Add tag…"
                  value={bulkTag}
                  onChange={(event) => setBulkTag(event.target.value)}
                  maxLength={40}
                />
              </label>
              <button type="submit" className="studio-button studio-button--ghost" disabled={!bulkTag.trim()}>
                Tag
              </button>
            </form>

            <span className="studio-toolbar__bulk-divider" aria-hidden="true" />

            <button type="button" className="studio-dest studio-dest--modeling" onClick={() => onBulkDestination("modeling", true)}>
              + MODELING
            </button>
            <button type="button" className="studio-dest" onClick={() => onBulkDestination("modeling", false)}>
              − Modeling
            </button>
            <button type="button" className="studio-dest studio-dest--projects" onClick={() => onBulkDestination("projects", true)}>
              + PROJECTS
            </button>
            <button type="button" className="studio-dest" onClick={() => onBulkDestination("projects", false)}>
              − Projects
            </button>
            <button type="button" className="studio-dest studio-dest--portfolio" onClick={() => onBulkDestination("portfolio", true)}>
              + PORTFOLIO
            </button>
            <button type="button" className="studio-dest" onClick={() => onBulkDestination("portfolio", false)}>
              − Portfolio
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
