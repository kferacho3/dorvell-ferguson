"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { useSavesData } from "@/lib/useConnectionAwareMedia";
import {
  creativeItems,
  filmIndexItems,
  formatRuntime,
  getFilmBySlug,
  type CreativeItem,
} from "@/content/creative";
import { useFilmViewer } from "./film/FilmViewer";
import { FollowTheWork } from "./social/FollowTheWork";
import { PlayIcon } from "./creative/icons";

/**
 * The vertical motion band.
 *
 * This section used to mount TikTok's embed.js on the landing page — third
 * party script, third-party chrome, and TikTok's own recommendations sitting in
 * the critical path of the site's first impression. It is now self-hosted:
 * Dorvell's own vertical work, led by SUNSET STUDY, playing from the silent
 * loop cuts.
 *
 * The live TikTok feed still exists; it moved to /social, behind a click.
 */

/** Vertical clips that read as social-native, the newest film first. */
function verticalRail(): CreativeItem[] {
  const lead = getFilmBySlug("sunset-study");
  const others = creativeItems.filter(
    (item) => item.orientation === "portrait" && item.slug !== lead?.slug,
  );
  return [...(lead ? [lead] : []), ...others].slice(0, 6);
}

function motionFramePool(images: DorvellImage[]) {
  const motionCategories = new Set(["Fashion", "Modeling", "Runway", "Music", "Behind The Scenes"]);
  const matches = images.filter((image) => motionCategories.has(image.category));
  return matches.length >= 6 ? matches : images;
}

export function SocialMotionSpotlight({ images }: { images: DorvellImage[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const savesData = useSavesData();
  const { open } = useFilmViewer();
  // Exactly one clip is ever live — whichever is hovered or focused.
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const rail = verticalRail();
  const frames = motionFramePool(images).slice(0, 9);
  const lead = frames[0] ?? images[0];
  const canPlay = !reducedMotion && !savesData;

  return (
    <section className="social-motion" aria-labelledby="social-motion-title">
      <div className="social-motion__copy">
        <p className="eyebrow">Vertical / motion</p>
        <h2 id="social-motion-title">The first scroll hits like a moving contact sheet.</h2>
        <p>
          Dorvell&apos;s vertical work brings runway energy, styling notes, and behind-the-lens
          pacing into the archive — shot for the phone, cut like film, and hosted here rather than
          borrowed from a feed.
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

      <div className="social-motion__stage">
        {lead ? (
          <figure className="social-motion__poster">
            <Image
              src={lead.localOptimized.md}
              alt={imageAlt(lead)}
              width={lead.width}
              height={lead.height}
              sizes="(max-width: 900px) 82vw, 34vw"
              {...blurImageProps(lead)}
            />
            <figcaption>
              <span>Shot by Dorvell</span>
              <strong>@2kferg</strong>
            </figcaption>
          </figure>
        ) : null}

        <ul className="social-motion__rail" aria-label="Vertical motion work">
          {rail.map((item) => {
            const isActive = activeSlug === item.slug && canPlay;
            const isFilm = item.filmIndex !== undefined;
            return (
              <li key={item.slug}>
                <button
                  type="button"
                  className={cn("social-motion__clip", isActive && "is-live")}
                  onPointerEnter={() => setActiveSlug(item.slug)}
                  onPointerLeave={() => setActiveSlug((s) => (s === item.slug ? null : s))}
                  onFocus={() => setActiveSlug(item.slug)}
                  onBlur={() => setActiveSlug((s) => (s === item.slug ? null : s))}
                  onClick={() =>
                    open(item, {
                      list: isFilm ? filmIndexItems : [item],
                      placement: "archive",
                    })
                  }
                  aria-label={`Watch ${item.title}, ${formatRuntime(item.duration)}`}
                >
                  <Image
                    src={resolveCreativeAsset(item.thumbSrc)}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 900px) 42vw, 190px"
                    placeholder={item.blurDataURL ? "blur" : "empty"}
                    blurDataURL={item.blurDataURL}
                  />
                  {isActive ? (
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
                      <source
                        src={resolveCreativeAsset(item.loopSrc ?? item.mobileSrc)}
                        type="video/mp4"
                      />
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
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
