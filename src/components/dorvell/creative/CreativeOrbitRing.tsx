"use client";

import Image from "next/image";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { getCreativeItem, type CreativeItem } from "@/content/creative";
import { useCreativeLightbox } from "./CreativeLightbox";

const RING_SLUGS = [
  "the-threshold",
  "modeling-1",
  "modeling-2",
  "misc-creative-4",
  "misc-creative-6",
  "music-event-swaelee",
  "fireworks",
  "misc-creative-5",
  "kicked-out-1",
];

const CELL_WIDTH = 170;

/**
 * Section 11 — Creative Orbit. A CSS 3D ring of posters as a transition
 * flourish (lighter than a WebGL scene on this video-heavy page). Auto-rotates
 * in Cinematic; hover/focus pauses; click opens the drawer. Reduced motion →
 * a static ring (CSS neutralizes the spin).
 */
export function CreativeOrbitRing() {
  const { open } = useCreativeLightbox();
  const items = RING_SLUGS.map(getCreativeItem).filter(Boolean) as CreativeItem[];
  const count = items.length;
  if (!count) return null;

  const angle = 360 / count;
  const radius = Math.round(CELL_WIDTH / 2 / Math.tan(Math.PI / count));

  return (
    <section className="cw-section cw-orbit" aria-labelledby="cw-orbit-title">
      <div className="cw-container cw-section__head cw-section__head--center">
        <p className="cw-eyebrow">Creative Orbit</p>
        <h2 id="cw-orbit-title" className="cw-h2">
          The whole world, spinning.
        </h2>
        <p className="cw-lede">A quick pass through the archive — tap any frame to open it.</p>
      </div>

      <div className="cw-orbit__scene" style={{ ["--orbit-radius" as string]: `${radius}px` }}>
        <div className="cw-orbit__ring">
          {items.map((item, index) => (
            <button
              key={item.slug}
              type="button"
              className="cw-orbit__cell"
              style={{ transform: `rotateY(${index * angle}deg) translateZ(var(--orbit-radius))` }}
              onClick={() => open(item, items)}
              aria-label={`Open ${item.title}`}
            >
              <span className="cw-orbit__frame">
                <Image
                  src={resolveCreativeAsset(item.thumbSrc)}
                  alt={item.title}
                  fill
                  unoptimized
                  sizes="170px"
                  placeholder={item.blurDataURL ? "blur" : "empty"}
                  blurDataURL={item.blurDataURL}
                  className="cw-video__poster"
                />
                <span className="cw-orbit__label">{item.title}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
