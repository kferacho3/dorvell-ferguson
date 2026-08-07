"use client";

import { CATEGORY_IMPLICATIONS, withImpliedTags } from "@/lib/curation/autoTag";
import type { PhotoDecision } from "@/lib/curation/types";

type CategoryChipsProps = {
  photoId: string;
  decision: PhotoDecision | undefined;
  categories: readonly string[];
  /** Wider gaps for the focus-review layout. */
  focus?: boolean;
  onToggleCategory: (id: string, category: string) => void;
};

/**
 * Multi-select category grid: the first pick is the primary (★), further
 * picks add tags. Implied tags (Music ⇒ Event, Modeling ⇒ Portrait) are
 * locked while their trigger is selected — the reducer would re-add them
 * on the next edit anyway, so the chip says so instead of lying.
 */
export function CategoryChips({
  photoId,
  decision,
  categories,
  focus = false,
  onToggleCategory,
}: CategoryChipsProps) {
  const primary = decision?.category_primary ?? null;
  const tags = decision?.category_tags ?? [];

  return (
    <div className={`studio-card__categories${focus ? " studio-card__categories--focus" : ""}`}>
      {categories.map((category) => {
        const isPrimary = primary === category;
        const isTag = tags.includes(category);
        const locked =
          isTag &&
          withImpliedTags(primary, tags.filter((t) => t !== category)).includes(category);
        const impliedBy = locked
          ? Object.entries(CATEGORY_IMPLICATIONS)
              .filter(
                ([source, implied]) =>
                  implied.includes(category) && (primary === source || tags.includes(source)),
              )
              .map(([source]) => source)
              .join(", ")
          : "";
        return (
          <button
            key={category}
            type="button"
            className={`studio-cat${isPrimary ? " is-primary" : isTag ? " is-on" : ""}${locked ? " is-locked" : ""}`}
            aria-pressed={isPrimary || isTag}
            aria-label={
              isPrimary
                ? `${category} — primary category`
                : locked
                  ? `${category} — auto-tag, follows ${impliedBy}`
                  : isTag
                    ? `${category} — tagged`
                    : category
            }
            aria-disabled={locked || undefined}
            title={
              isPrimary
                ? "Primary category — click to remove (the first tag takes over)"
                : locked
                  ? `Auto-tag — stays on while ${impliedBy} is selected`
                  : isTag
                    ? "Tagged — click to remove"
                    : "Click to add"
            }
            onClick={() => {
              if (!locked) onToggleCategory(photoId, category);
            }}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
