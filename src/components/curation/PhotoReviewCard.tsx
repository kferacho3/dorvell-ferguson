"use client";

import Image from "next/image";
import { memo } from "react";
import type { CurationPhoto, PhotoDecision, ScrapReason } from "@/lib/curation/types";
import { SCRAP_REASONS } from "@/lib/curation/types";
import type { DestinationKey } from "@/components/curation/curationReducer";

type PhotoReviewCardProps = {
  photo: CurationPhoto;
  decision: PhotoDecision | undefined;
  categories: readonly string[];
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onKeep: (id: string) => void;
  onScrap: (id: string) => void;
  onSetCategory: (id: string, category: string | null) => void;
  onSetScrapReason: (id: string, reason: ScrapReason) => void;
  onToggleDestination: (id: string, destination: DestinationKey, value: boolean) => void;
  onOpenFocus: (id: string) => void;
};

function statusMeta(decision: PhotoDecision | undefined) {
  if (decision?.status === "kept") return { label: "Kept", tone: "keep" };
  if (decision?.status === "scrapped") return { label: "Scrapped", tone: "scrap" };
  return { label: "Unreviewed", tone: "unknown" };
}

function PhotoReviewCardInner({
  photo,
  decision,
  categories,
  selected,
  onToggleSelect,
  onKeep,
  onScrap,
  onSetCategory,
  onSetScrapReason,
  onToggleDestination,
  onOpenFocus,
}: PhotoReviewCardProps) {
  const status = statusMeta(decision);
  const isKept = decision?.status === "kept";
  const isScrapped = decision?.status === "scrapped";
  const needsCategory = isKept && !decision?.category_primary;
  const destinations = decision?.destinations ?? { portfolio: false, modeling: false, projects: false };
  const hasNotes = Boolean(decision?.notes?.trim());

  return (
    <article
      className={`studio-card${selected ? " is-selected" : ""} studio-card--${status.tone}`}
      aria-label={`${photo.filename} — ${status.label}`}
    >
      <div className="studio-card__media">
        <label className="studio-card__select">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(photo.photo_id)}
            aria-label={`Select ${photo.filename}`}
          />
          <span aria-hidden="true" />
        </label>

        <button
          type="button"
          className="studio-card__preview"
          onClick={() => onOpenFocus(photo.photo_id)}
          aria-label={`Open ${photo.filename} in focus review`}
        >
          {photo.previewDisconnected ? (
            <span className="studio-card__disconnected">
              Preview disconnected.
              <br />
              Re-upload this batch to reconnect.
            </span>
          ) : photo.source === "site" ? (
            <Image
              src={photo.thumb}
              alt={photo.alt}
              width={Math.max(photo.width, 1)}
              height={Math.max(photo.height, 1)}
              sizes="280px"
              unoptimized
              loading="lazy"
              {...(photo.blur ? { placeholder: "blur" as const, blurDataURL: photo.blur } : {})}
            />
          ) : (
            // Uploads preview from object URLs, which next/image cannot process.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.thumb} alt={photo.alt} loading="lazy" />
          )}
        </button>

        <div className="studio-card__flags" aria-hidden={!needsCategory && !hasNotes && !photo.isVideo}>
          {photo.isVideo ? <span className="studio-card__flag studio-card__flag--video">Video</span> : null}
          {needsCategory ? <span className="studio-card__flag studio-card__flag--warn">Needs category</span> : null}
          {hasNotes ? <span className="studio-card__flag studio-card__flag--note">Notes</span> : null}
        </div>
      </div>

      <div className="studio-card__meta">
        <p className="studio-card__filename" title={photo.filename}>
          {photo.filename}
        </p>
        <p className="studio-card__batch">
          <span className={`studio-card__status studio-card__status--${status.tone}`}>{status.label}</span>
          <span className="studio-card__batch-tag">{photo.batch}</span>
          {photo.scrapedCategory ? (
            <span className="studio-card__hint" title="Category from the original site data">
              was: {photo.scrapedCategory}
            </span>
          ) : null}
        </p>
        {decision && decision.category_tags.length > 0 ? (
          <p className="studio-card__tags" title={decision.category_tags.join(", ")}>
            {decision.category_tags.slice(0, 3).join(" · ")}
            {decision.category_tags.length > 3 ? ` +${decision.category_tags.length - 3}` : ""}
          </p>
        ) : null}
      </div>

      <div className="studio-card__decision-row">
        <button
          type="button"
          className={`studio-button studio-button--keep${isKept ? " is-active" : ""}`}
          aria-pressed={isKept}
          onClick={() => onKeep(photo.photo_id)}
        >
          KEEP
        </button>
        <button
          type="button"
          className={`studio-button studio-button--scrap${isScrapped ? " is-active" : ""}`}
          aria-pressed={isScrapped}
          onClick={() => onScrap(photo.photo_id)}
        >
          SCRAP
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
          <span>Primary category{isKept ? " (required)" : ""}</span>
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

      <div className="studio-card__destinations" role="group" aria-label={`Destinations for ${photo.filename}`}>
        <button
          type="button"
          className={`studio-dest studio-dest--modeling${destinations.modeling ? " is-on" : ""}`}
          aria-pressed={destinations.modeling}
          onClick={() => onToggleDestination(photo.photo_id, "modeling", !destinations.modeling)}
        >
          MODELING
        </button>
        <button
          type="button"
          className={`studio-dest studio-dest--projects${destinations.projects ? " is-on" : ""}`}
          aria-pressed={destinations.projects}
          onClick={() => onToggleDestination(photo.photo_id, "projects", !destinations.projects)}
        >
          PROJECTS
        </button>
        <button
          type="button"
          className={`studio-dest studio-dest--portfolio${destinations.portfolio ? " is-on" : ""}`}
          aria-pressed={destinations.portfolio}
          onClick={() => onToggleDestination(photo.photo_id, "portfolio", !destinations.portfolio)}
        >
          PORTFOLIO
        </button>
      </div>
    </article>
  );
}

export const PhotoReviewCard = memo(PhotoReviewCardInner);
