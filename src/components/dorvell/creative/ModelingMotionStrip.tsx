"use client";

import Link from "next/link";
import { getCreativeItemsForSurface } from "@/content/creative";
import { CreativeLightboxProvider } from "./CreativeLightbox";
import { CreativeMediaCard } from "./CreativeMediaCard";

/**
 * Cross-page surface: the modeling-tagged creative clips, embedded on the
 * Modeling page as a motion strip. Self-contained (own lightbox provider, own
 * .cw-scope token layer) so it drops in without touching the modeling system.
 */
export function ModelingMotionStrip() {
  const clips = getCreativeItemsForSurface("modeling");
  if (!clips.length) return null;

  return (
    <CreativeLightboxProvider>
      <section className="cw-scope cw-modstrip" aria-labelledby="cw-modstrip-title">
        <div className="cw-container cw-modstrip__head">
          <div>
            <p className="cw-eyebrow">Motion</p>
            <h2 id="cw-modstrip-title" className="cw-h2">
              The room, in motion.
            </h2>
            <p className="cw-lede">
              Runway walks and movement studies — the modeling side, in video. Part of Creative Worlds.
            </p>
          </div>
          <Link className="cw-btn cw-btn--ghost" href="/creative">
            Enter Creative Worlds
          </Link>
        </div>
        <div className="cw-modstrip__row" role="list">
          {clips.map((clip) => (
            <div key={clip.slug} className="cw-modstrip__cell" role="listitem">
              <CreativeMediaCard item={clip} list={clips} />
            </div>
          ))}
        </div>
      </section>
    </CreativeLightboxProvider>
  );
}
