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

  const [lead, ...rest] = clips;

  return (
    <CreativeLightboxProvider>
      <section className="cw-scope cw-modstrip" aria-labelledby="cw-modstrip-title">
        <div className="cw-modstrip__glow" aria-hidden="true" />

        <div className="cw-container cw-modstrip__head">
          <p className="cw-eyebrow">Motion</p>
          <h2 id="cw-modstrip-title" className="cw-modstrip__title">
            The room, in motion.
          </h2>
          <p className="cw-lede">
            Runway walks and movement studies — the modeling side, in video. Part of Creative Worlds.
          </p>
          <p className="cw-modstrip__count">
            {clips.length} studies · open any frame
          </p>
          <Link className="cw-btn cw-btn--ghost" href="/creative">
            Enter Creative Worlds
          </Link>
        </div>

        <div className="cw-modstrip__stage">
          <div className="cw-modstrip__bento">
            <div className="cw-modstrip__lead">
              <CreativeMediaCard item={lead} list={clips} className="cw-modstrip__lead-card" />
            </div>

            {rest.length > 0 ? (
              <div className="cw-modstrip__grid" role="list">
                {rest.map((clip) => (
                  <div key={clip.slug} className="cw-modstrip__cell" role="listitem">
                    <CreativeMediaCard item={clip} list={clips} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </CreativeLightboxProvider>
  );
}
