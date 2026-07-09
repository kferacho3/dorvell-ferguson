"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { CreativeItem } from "@/content/creative";
import { useCreativeLightbox } from "./CreativeLightbox";
import { useCreativeMode } from "./creativeMode";

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
}: {
  item: CreativeItem;
  /** The list this card belongs to, so lightbox prev/next walks it. */
  list?: CreativeItem[];
  className?: string;
  hoverPreview?: boolean;
}) {
  const { open } = useCreativeLightbox();
  const { mode } = useCreativeMode();
  const reducedMotion = usePrefersReducedMotion();
  const [preview, setPreview] = useState(false);

  const canPreview = hoverPreview && mode === "cinematic" && !reducedMotion;
  const thumb = resolveCreativeAsset(item.thumbSrc);
  const mp4 = resolveCreativeAsset(item.mp4Src);
  const webm = resolveCreativeAsset(item.webmSrc);

  return (
    <button
      type="button"
      className={cn("cw-card", className)}
      onClick={() => open(item, list)}
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
            {webm ? <source src={webm} type="video/webm" /> : null}
            <source src={mp4} type="video/mp4" />
          </video>
        ) : null}

        <div className="cw-card__scrim" />
        <div className="cw-card__top">
          <span className="cw-chip">{durationLabel(item.duration)}</span>
          <span className="cw-chip">{ratioLabel[item.orientation]}</span>
        </div>
        <div className="cw-card__body">
          <span className="cw-card__title">{item.title}</span>
          <span className="cw-card__meta">{item.category}</span>
          <div className="cw-card__tags">
            {item.moods.slice(0, 4).map((mood) => (
              <span key={mood} className="cw-tag">
                {mood}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
