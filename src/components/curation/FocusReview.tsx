"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CurationPhoto, PhotoDecision, ScrapReason } from "@/lib/curation/types";
import { SCRAP_REASONS } from "@/lib/curation/types";
import type { DestinationKey } from "@/components/curation/curationReducer";

type FocusReviewProps = {
  photo: CurationPhoto;
  decision: PhotoDecision | undefined;
  index: number;
  total: number;
  categories: readonly string[];
  onKeep: (id: string) => void;
  onScrap: (id: string) => void;
  onSetCategory: (id: string, category: string | null) => void;
  onSetScrapReason: (id: string, reason: ScrapReason) => void;
  onToggleDestination: (id: string, destination: DestinationKey, value: boolean) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onSetNotes: (id: string, notes: string) => void;
  onToggleLock: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
};

export function FocusReview({
  photo,
  decision,
  index,
  total,
  categories,
  onKeep,
  onScrap,
  onSetCategory,
  onSetScrapReason,
  onToggleDestination,
  onAddTag,
  onRemoveTag,
  onSetNotes,
  onToggleLock,
  onPrev,
  onNext,
  onExit,
}: FocusReviewProps) {
  const [tagDraft, setTagDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState(decision?.notes ?? "");
  const [draftPhotoId, setDraftPhotoId] = useState(photo.photo_id);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNotes = useRef<{ id: string; value: string } | null>(null);

  // Reset drafts when navigating to a different photo (adjust-during-render).
  if (draftPhotoId !== photo.photo_id) {
    setDraftPhotoId(photo.photo_id);
    setNotesDraft(decision?.notes ?? "");
    setTagDraft("");
  }

  // Flush (not discard) a pending debounced note on unmount.
  useEffect(() => () => {
    if (notesTimer.current) clearTimeout(notesTimer.current);
    if (pendingNotes.current) {
      onSetNotes(pendingNotes.current.id, pendingNotes.current.value);
      pendingNotes.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isKept = decision?.status === "kept";
  const isScrapped = decision?.status === "scrapped";
  const needsCategory = isKept && !decision?.category_primary;
  const destinations = decision?.destinations ?? { portfolio: false, modeling: false, projects: false };

  const handleNotesChange = (value: string) => {
    setNotesDraft(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => onSetNotes(photo.photo_id, value), 400);
  };

  return (
    <section className="studio-focus" aria-label={`Focus review — photo ${index + 1} of ${total}`}>
      <div className="studio-focus__stage">
        <button type="button" className="studio-focus__nav studio-focus__nav--prev" onClick={onPrev} aria-label="Previous photo (H or ←)">
          ←
        </button>

        <figure className="studio-focus__figure">
          {photo.previewDisconnected ? (
            <div className="studio-focus__disconnected">
              <p>Preview disconnected.</p>
              <p>Re-upload the “{photo.batch}” batch to reconnect this photo. Your decisions are saved.</p>
            </div>
          ) : photo.source === "site" ? (
            <Image
              src={photo.full}
              alt={photo.alt}
              width={Math.max(photo.width, 1)}
              height={Math.max(photo.height, 1)}
              sizes="(min-width: 1100px) 60vw, 100vw"
              unoptimized
              priority
              {...(photo.blur ? { placeholder: "blur" as const, blurDataURL: photo.blur } : {})}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.full} alt={photo.alt} />
          )}
          <figcaption>
            <span className="studio-focus__counter" aria-live="polite">
              {index + 1} / {total}
            </span>
            <span className="studio-focus__filename">{photo.filename}</span>
            <span className="studio-card__batch-tag">{photo.batch}</span>
          </figcaption>
        </figure>

        <button type="button" className="studio-focus__nav studio-focus__nav--next" onClick={onNext} aria-label="Next photo (J or →)">
          →
        </button>
      </div>

      <div className="studio-focus__panel">
        <div className="studio-focus__decisions">
          <button
            type="button"
            className={`studio-button studio-button--keep studio-button--big${isKept ? " is-active" : ""}`}
            aria-pressed={isKept}
            onClick={() => onKeep(photo.photo_id)}
          >
            KEEP <kbd>K</kbd>
          </button>
          <button
            type="button"
            className={`studio-button studio-button--scrap studio-button--big${isScrapped ? " is-active" : ""}`}
            aria-pressed={isScrapped}
            onClick={() => onScrap(photo.photo_id)}
          >
            SCRAP <kbd>S</kbd>
          </button>
        </div>

        <div className="studio-focus__destinations" role="group" aria-label="Destinations">
          <button
            type="button"
            className={`studio-dest studio-dest--modeling studio-dest--big${destinations.modeling ? " is-on" : ""}`}
            aria-pressed={destinations.modeling}
            onClick={() => onToggleDestination(photo.photo_id, "modeling", !destinations.modeling)}
          >
            MODELING <kbd>M</kbd>
          </button>
          <button
            type="button"
            className={`studio-dest studio-dest--projects studio-dest--big${destinations.projects ? " is-on" : ""}`}
            aria-pressed={destinations.projects}
            onClick={() => onToggleDestination(photo.photo_id, "projects", !destinations.projects)}
          >
            PROJECTS <kbd>R</kbd>
          </button>
          <button
            type="button"
            className={`studio-dest studio-dest--portfolio studio-dest--big${destinations.portfolio ? " is-on" : ""}`}
            aria-pressed={destinations.portfolio}
            onClick={() => onToggleDestination(photo.photo_id, "portfolio", !destinations.portfolio)}
          >
            PORTFOLIO <kbd>P</kbd>
          </button>
        </div>

        {isScrapped ? (
          <label className="studio-card__field">
            <span>Scrap reason (optional)</span>
            <select
              value={decision?.scrap_reason ?? ""}
              onChange={(event) => onSetScrapReason(photo.photo_id, event.target.value as ScrapReason)}
            >
              <option value="">No reason</option>
              {SCRAP_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className={`studio-card__field${needsCategory ? " studio-card__field--warn" : ""}`}>
            <span>
              Primary category{isKept ? " (required)" : ""}
              {needsCategory ? <em className="studio-focus__warn"> — needs category</em> : null}
            </span>
            <select
              value={decision?.category_primary ?? ""}
              onChange={(event) => onSetCategory(photo.photo_id, event.target.value || null)}
            >
              <option value="">Choose category…</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="studio-focus__tags">
          <span className="studio-focus__label">Tags</span>
          <ul>
            {(decision?.category_tags ?? []).map((tag) => (
              <li key={tag}>
                <span>{tag}</span>
                <button type="button" onClick={() => onRemoveTag(photo.photo_id, tag)} aria-label={`Remove tag ${tag}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (tagDraft.trim()) {
                onAddTag(photo.photo_id, tagDraft.trim());
                setTagDraft("");
              }
            }}
          >
            <label>
              <span className="sr-only">Add tag</span>
              <input
                type="text"
                value={tagDraft}
                placeholder="Add tag…"
                maxLength={40}
                onChange={(event) => setTagDraft(event.target.value)}
              />
            </label>
            <button type="submit" className="studio-button studio-button--ghost" disabled={!tagDraft.trim()}>
              Add
            </button>
          </form>
        </div>

        <label className="studio-focus__notes">
          <span className="studio-focus__label">Notes</span>
          <textarea
            value={notesDraft}
            rows={3}
            placeholder="Anything worth remembering about this frame…"
            onChange={(event) => handleNotesChange(event.target.value)}
          />
        </label>

        <label className="studio-focus__lock">
          <input
            type="checkbox"
            checked={Boolean(decision?.locked_single_assignment)}
            onChange={() => onToggleLock(photo.photo_id)}
          />
          <span>Single destination only (assigning one clears the others)</span>
        </label>

        <button type="button" className="studio-button studio-button--ghost studio-focus__exit" onClick={onExit}>
          Back to grid <kbd>Esc</kbd>
        </button>
      </div>
    </section>
  );
}
