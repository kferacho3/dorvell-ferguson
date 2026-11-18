"use client";

import type { CreativeItem } from "@/content/creative";
import { CreativeLightboxProvider } from "./CreativeLightbox";
import { CreativeMediaCard } from "./CreativeMediaCard";

/**
 * Cross-page surface: the modeling-tagged creative clips, embedded on the
 * Modeling page as a motion strip. Self-contained (own lightbox provider, own
 * .cw-scope token layer) so it drops in without touching the modeling system.
 */
export function ModelingMotionStrip({ clips }: { clips: CreativeItem[] }) {
  if (!clips.length) return null;

  const [lead, ...rest] = clips;

  return (
    <CreativeLightboxProvider>
      <section
        id="modeling-clips"
        className="cw-scope cw-modstrip scroll-mt-0"
        aria-labelledby="cw-modstrip-title"
        tabIndex={-1}
      >
        <div className="cw-modstrip__glow" aria-hidden="true" />

        <div className="cw-container cw-modstrip__head">
          <h2 id="cw-modstrip-title" className="cw-modstrip__title">
            Runway clips
          </h2>
        </div>

        <div className="cw-modstrip__stage">
          <div className="cw-modstrip__bento">
            <div className="cw-modstrip__lead">
              <CreativeMediaCard
                item={lead}
                list={clips}
                className="cw-modstrip__lead-card"
                compact
              />
            </div>

            {rest.length > 0 ? (
              <div className="cw-modstrip__grid" role="list">
                {rest.map((clip) => (
                  <div
                    key={clip.slug}
                    className="cw-modstrip__cell"
                    role="listitem"
                  >
                    <CreativeMediaCard item={clip} list={clips} compact />
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
