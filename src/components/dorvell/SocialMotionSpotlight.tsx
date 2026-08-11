"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { useSavesData } from "@/lib/useConnectionAwareMedia";
import {
  creativeItems,
  filmIndexItems,
  formatRuntime,
  type CreativeItem,
  type CreativeOrientation,
} from "@/content/creative";
import { useFilmViewer } from "./film/FilmViewer";
import { FollowTheWork } from "./social/FollowTheWork";
import { PlayIcon } from "./creative/icons";
import "@/styles/social-motion.css";

/**
 * Landing motion band — Dorvell's own clips, containers matched to media.
 *
 * Widescreen pieces sit in 16:9 slots (top + bottom). True vertical pieces
 * sit in a portrait row between them. Letterboxed-in-portrait films (e.g.
 * Sunset Study) are presented as landscape so the black bars get cropped
 * away instead of defining the layout.
 */

/** How the clip should be framed in this mosaic — not always the file shape. */
function displayOrientation(item: CreativeItem): CreativeOrientation {
  // Baked letterbox inside a 9:16 file — show as landscape and cover-crop the bars.
  if (item.tags.includes("letterbox")) return "landscape";
  return item.orientation;
}

function buildMosaic(): { top: CreativeItem[]; middle: CreativeItem[]; bottom: CreativeItem[] } {
  const byFilm = (a: CreativeItem, b: CreativeItem) =>
    (a.filmIndex ?? 99) - (b.filmIndex ?? 99) || a.title.localeCompare(b.title);

  const featured = creativeItems.filter((item) => item.featured || item.filmIndex !== undefined);
  const featuredWide = featured.filter((item) => displayOrientation(item) === "landscape").sort(byFilm);
  const featuredTall = featured.filter((item) => displayOrientation(item) === "portrait").sort(byFilm);

  // Top up the portrait band from the full archive so the middle row stays full.
  const tallIds = new Set(featuredTall.map((item) => item.slug));
  const extraTall = creativeItems
    .filter((item) => displayOrientation(item) === "portrait" && !tallIds.has(item.slug))
    .sort(byFilm);

  const wide = featuredWide.length >= 4
    ? featuredWide
    : [...featuredWide, ...creativeItems.filter((item) => displayOrientation(item) === "landscape" && !featuredWide.some((w) => w.slug === item.slug)).sort(byFilm)];

  const tall = [...featuredTall, ...extraTall];

  return {
    top: wide.slice(0, 2),
    middle: tall.slice(0, 6),
    bottom: wide.slice(2, 4),
  };
}

function MotionClip({
  item,
  active,
  canPlay,
  onActivate,
  onDeactivate,
  onOpen,
}: {
  item: CreativeItem;
  active: boolean;
  canPlay: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onOpen: () => void;
}) {
  const orientation = displayOrientation(item);
  const isFilm = item.filmIndex !== undefined;
  const isLive = active && canPlay;

  return (
    <button
      type="button"
      className={cn("social-motion__clip", `social-motion__clip--${orientation}`, isLive && "is-live")}
      onPointerEnter={onActivate}
      onPointerLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      onClick={onOpen}
      aria-label={`Watch ${item.title}, ${formatRuntime(item.duration)}`}
    >
      <Image
        src={resolveCreativeAsset(item.thumbSrc)}
        alt=""
        fill
        unoptimized
        sizes={
          orientation === "landscape"
            ? "(max-width: 900px) 92vw, 28vw"
            : "(max-width: 900px) 42vw, 14vw"
        }
        placeholder={item.blurDataURL ? "blur" : "empty"}
        blurDataURL={item.blurDataURL}
      />
      {isLive ? (
        <video
          className="social-motion__clip-video"
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={resolveCreativeAsset(item.loopSrc ?? item.mobileSrc)} type="video/mp4" />
        </video>
      ) : null}
      <span className="social-motion__clip-scrim" aria-hidden="true" />
      {isFilm ? (
        <span className="social-motion__clip-badge" aria-hidden="true">
          Film {String(item.filmIndex).padStart(2, "0")}
        </span>
      ) : null}
      <span className="social-motion__clip-meta" aria-hidden="true">
        <strong>{item.title}</strong>
        <small>{formatRuntime(item.duration)}</small>
      </span>
      <span className="social-motion__clip-play" aria-hidden="true">
        <PlayIcon />
      </span>
    </button>
  );
}

export function SocialMotionSpotlight({ images: _images }: { images: DorvellImage[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const savesData = useSavesData();
  const { open } = useFilmViewer();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const mosaic = useMemo(() => buildMosaic(), []);
  const canPlay = !reducedMotion && !savesData;

  const renderBand = (items: CreativeItem[]) =>
    items.map((item) => (
      <MotionClip
        key={item.slug}
        item={item}
        active={activeSlug === item.slug}
        canPlay={canPlay}
        onActivate={() => setActiveSlug(item.slug)}
        onDeactivate={() => setActiveSlug((slug) => (slug === item.slug ? null : slug))}
        onOpen={() =>
          open(item, {
            list: item.filmIndex !== undefined ? filmIndexItems : [item],
            placement: "archive",
          })
        }
      />
    ));

  return (
    <section className="social-motion" aria-labelledby="social-motion-title">
      <div className="social-motion__copy">
        <p className="eyebrow">Vertical / motion</p>
        <h2 id="social-motion-title">The first scroll hits like a moving contact sheet.</h2>
        <p>
          Dorvell&apos;s motion work brings runway energy, styling notes, and behind-the-lens pacing
          into the archive — shot for the frame it belongs in, cut like film, and hosted here rather
          than borrowed from a feed.
        </p>
        <div className="social-motion__actions">
          <Link className="button-primary" href="/social">
            Follow the work
          </Link>
          <Link className="button-secondary" href="/creative">
            Enter Creative Worlds
          </Link>
        </div>
        <FollowTheWork variant="rail" placement="hero" className="social-motion__follow" />
      </div>

      <div className="social-motion__stage" aria-label="Motion work by frame shape">
        {mosaic.top.length > 0 ? (
          <div className="social-motion__band social-motion__band--wide">{renderBand(mosaic.top)}</div>
        ) : null}
        {mosaic.middle.length > 0 ? (
          <div className="social-motion__band social-motion__band--tall">{renderBand(mosaic.middle)}</div>
        ) : null}
        {mosaic.bottom.length > 0 ? (
          <div className="social-motion__band social-motion__band--wide">{renderBand(mosaic.bottom)}</div>
        ) : null}
      </div>
    </section>
  );
}
