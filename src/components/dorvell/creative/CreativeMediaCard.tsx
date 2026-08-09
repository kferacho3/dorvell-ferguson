"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { CreativeItem } from "@/content/creative";
import { useCreativeLightbox } from "./CreativeLightbox";
import { useCreativeMode } from "./creativeMode";
import { useFilmViewer } from "@/components/dorvell/film/FilmViewer";
import { filmIndexItems } from "@/content/creative";

const ratioLabel: Record<CreativeItem["orientation"], string> = {
  portrait: "9:16",
  landscape: "16:9",
  square: "1:1",
};

function durationLabel(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CreativeMediaCard({
  item,
  list,
  className,
  hoverPreview = true,
  compact = false,
}: {
  item: CreativeItem;
  /** The list this card belongs to, so lightbox prev/next walks it. */
  list?: CreativeItem[];
  className?: string;
  hoverPreview?: boolean;
  /** Media-first: quieter chrome, title/meta reveal on hover/focus. */
  compact?: boolean;
}) {
  const { open } = useCreativeLightbox();
  const { open: openFilm } = useFilmViewer();
  const { mode } = useCreativeMode();
  const reducedMotion = usePrefersReducedMotion();
  const [preview, setPreview] = useState(false);

  const canPreview = hoverPreview && mode === "cinematic" && !reducedMotion;
  const thumb = resolveCreativeAsset(item.thumbSrc);
  // Hover preview is desktop-only. Prefer the silent loop cut where one exists
  // so hovering a 34-second film costs ~0.4MB rather than the whole film.
  const previewSrc = resolveCreativeAsset(item.loopSrc ?? item.mobileSrc);
  // The three distributed films get the film-grade viewer (completion, end
  // state, social actions); everything else keeps the archive lightbox.
  const isFilm = item.filmIndex !== undefined;

  return (
    <button
      type="button"
      className={cn("cw-card", isFilm && "cw-card--film", compact && "cw-card--compact", className)}
      onClick={() =>
        isFilm
          ? openFilm(item, { list: filmIndexItems, placement: "archive" })
          : open(item, list)
      }
      aria-label={`Open ${item.title} — ${item.category}`}
      onPointerEnter={() => {
        if (canPreview && typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
          setPreview(true);
        }
      }}
      onPointerLeave={() => setPreview(false)}
    >
      <div className={cn("cw-card__frame", "cw-frame", `cw-frame--${item.orientation}`)}>
        <Image
          src={thumb}
          alt={item.title}
          fill
          unoptimized
          sizes="(max-width: 760px) 50vw, 320px"
          placeholder={item.blurDataURL ? "blur" : "empty"}
          blurDataURL={item.blurDataURL}
          className="cw-video__poster"
        />
        {preview ? (
          <video
            className="cw-card__preview"
            muted
            loop
            playsInline
            autoPlay
            preload="none"
            poster={resolveCreativeAsset(item.posterSrc)}
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src={previewSrc} type="video/mp4" />
          </video>
        ) : null}

        <div className="cw-card__scrim" />
        <div className="cw-card__top">
          {isFilm ? (
            <span className="cw-chip cw-chip--film">
              Film {String(item.filmIndex).padStart(2, "0")}
            </span>
          ) : null}
          <span className="cw-chip">{durationLabel(item.duration)}</span>
          {compact ? null : <span className="cw-chip">{ratioLabel[item.orientation]}</span>}
        </div>
        <div className="cw-card__body">
          <span className="cw-card__title">{item.title}</span>
          {compact ? null : <span className="cw-card__meta">{item.category}</span>}
          {compact ? null : (
            <div className="cw-card__tags">
              {item.moods.slice(0, 4).map((mood) => (
                <span key={mood} className="cw-tag">
                  {mood}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
