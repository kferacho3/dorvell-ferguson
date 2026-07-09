"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { getCreativeItem, type CreativeItem } from "@/content/creative";
import { VideoPlayer } from "./VideoPlayer";
import { CreativeMediaCard } from "./CreativeMediaCard";
import { useCreativeLightbox } from "./CreativeLightbox";
import { useCreativeMode } from "./creativeMode";

const CLIP_SLUGS = [
  "the-threshold",
  "modeling-1",
  "misc-creative-6",
  "music-event-swaelee",
  "modeling-2",
  "misc-creative-4",
];

type Placement = { x: number; y: number; s: number; r: number; z?: number };

// four formations × six clips. x = vw offset, y = vh offset, s = scale, r = deg.
const FORMATIONS: Placement[][] = [
  // scatter
  [
    { x: -26, y: -14, s: 0.8, r: -6 },
    { x: 22, y: -20, s: 0.7, r: 5 },
    { x: -12, y: 16, s: 0.75, r: 8 },
    { x: 30, y: 12, s: 0.68, r: -7 },
    { x: -32, y: 6, s: 0.62, r: 10 },
    { x: 8, y: -2, s: 0.92, r: -3, z: 4 },
  ],
  // row
  [
    { x: -34, y: 0, s: 0.6, r: 0 },
    { x: -20.5, y: 0, s: 0.7, r: 0 },
    { x: -6.5, y: 0, s: 0.82, r: 0, z: 4 },
    { x: 7.5, y: 0, s: 0.82, r: 0 },
    { x: 21.5, y: 0, s: 0.7, r: 0 },
    { x: 35, y: 0, s: 0.6, r: 0 },
  ],
  // bento
  [
    { x: -18, y: -12, s: 0.72, r: 0, z: 4 },
    { x: 0, y: -12, s: 0.72, r: 0 },
    { x: 18, y: -12, s: 0.72, r: 0 },
    { x: -18, y: 12, s: 0.72, r: 0 },
    { x: 0, y: 12, s: 0.72, r: 0 },
    { x: 18, y: 12, s: 0.72, r: 0 },
  ],
  // focus — one frame steps forward
  [
    { x: 0, y: 0, s: 1.18, r: 0, z: 6 },
    { x: -30, y: -16, s: 0.42, r: -4 },
    { x: 30, y: -16, s: 0.42, r: 4 },
    { x: -32, y: 14, s: 0.42, r: 5 },
    { x: 32, y: 14, s: 0.42, r: -5 },
    { x: 0, y: 22, s: 0.42, r: 0 },
  ],
];

const ACTIVE_INDEX = [5, 2, 0, 0];

const CHAPTERS = [
  { title: "Shadow / Reflection", line: "Silhouette, blinds, mirrors — the study before the scene." },
  { title: "Body / Motion", line: "Walk, turn, pace — how a look reads as movement." },
  { title: "City / Night", line: "Skyline pressure, crowds, stage light, neon." },
  { title: "One steps forward", line: "The set assembles, and a single frame takes the room." },
];

function clipTransform(p: Placement) {
  return `translate(calc(-50% + ${p.x}vw), calc(-50% + ${p.y}vh)) scale(${p.s}) rotate(${p.r}deg)`;
}

/**
 * Section 5 — Scroll-based video layout transformations. A pinned stage whose
 * clips morph through scattered → row → bento → focus formations as you scroll;
 * one clip per chapter autoplays (muted, in view). Calm/reduced motion falls
 * back to a static card grid.
 */
export function ScrollMorphGallery() {
  const { mode } = useCreativeMode();
  const reducedMotion = usePrefersReducedMotion();
  const { open } = useCreativeLightbox();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [formation, setFormation] = useState(0);

  const immersive = mode === "cinematic" && !reducedMotion;
  const clips = CLIP_SLUGS.map(getCreativeItem).filter(Boolean) as CreativeItem[];

  useEffect(() => {
    if (!immersive) return; // calm branch renders a static grid; formation unused
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
      const idx = Math.min(FORMATIONS.length - 1, Math.floor(p * FORMATIONS.length));
      setFormation((prev) => (prev === idx ? prev : idx));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [immersive]);

  if (!immersive) {
    return (
      <section className="cw-section cw-morph cw-morph--calm" aria-labelledby="cw-morph-title">
        <div className="cw-container cw-container--wide">
          <div className="cw-section__head">
            <p className="cw-eyebrow">Chapters</p>
            <h2 id="cw-morph-title" className="cw-h2">
              Scenes, assembled.
            </h2>
            <p className="cw-lede">Shadow, motion, city, and one frame that steps forward.</p>
          </div>
          <div className="cw-morph__grid">
            {clips.map((clip) => (
              <CreativeMediaCard key={clip.slug} item={clip} list={clips} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const chapter = CHAPTERS[formation];
  const activeIndex = ACTIVE_INDEX[formation];

  return (
    <section ref={sectionRef} className="cw-section cw-morph cw-morph--immersive" aria-label="Scroll-morph gallery">
      <div className="cw-morph__sticky">
        <div className="cw-container cw-morph__label">
          <p className="cw-eyebrow">
            Chapter {formation + 1} / {FORMATIONS.length}
          </p>
          <h2 className="cw-h2">{chapter.title}</h2>
          <p className="cw-lede">{chapter.line}</p>
        </div>

        <div className="cw-morph__stage" aria-hidden={false}>
          {clips.map((clip, index) => {
            const place = FORMATIONS[formation][index];
            const isActive = index === activeIndex;
            return (
              <div
                key={clip.slug}
                className="cw-morph__clip"
                style={{ transform: clipTransform(place), zIndex: place.z ?? 1 }}
              >
                <div className={cn("cw-frame", `cw-frame--${clip.orientation}`)}>
                  {isActive ? (
                    <VideoPlayer item={clip} mode="ambient" active loop controls={false} framed={false} />
                  ) : (
                    <button
                      type="button"
                      className="cw-card cw-morph__poster"
                      onClick={() => open(clip, clips)}
                      aria-label={`Open ${clip.title}`}
                    >
                      <Image
                        src={resolveCreativeAsset(clip.thumbSrc)}
                        alt={clip.title}
                        fill
                        unoptimized
                        sizes="240px"
                        placeholder={clip.blurDataURL ? "blur" : "empty"}
                        blurDataURL={clip.blurDataURL}
                        className="cw-video__poster"
                      />
                      <span className="cw-card__scrim" aria-hidden="true" />
                      <span className="cw-morph__cliptitle">{clip.title}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
