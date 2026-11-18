"use client";

import { getCreativeItemsByCategory } from "@/content/creative";
import { CreativeMediaCard } from "./CreativeMediaCard";
import { Reveal } from "./Reveal";
import "@/styles/creative-shoot.css";

/**
 * Section 7 — Creative photoshoot gallery. Concept-first, not category-first:
 * a big text block + a right-side bento, then a horizontal contact-sheet strip.
 */
export function CreativePhotoshootGallery() {
  const shoots = getCreativeItemsByCategory("creative-photoshoots");
  const bento = shoots.slice(0, 5);
  const strip = [...shoots, ...getCreativeItemsByCategory("motion-studies")];

  return (
    <section
      id="creative-photoshoots"
      className="cw-section cw-shoot scroll-mt-0"
      aria-labelledby="cw-shoot-title"
    >
      <div className="cw-container cw-container--wide cw-shoot__top">
        <div className="cw-shoot__intro">
          <h2 id="cw-shoot-title" className="cw-h2">
            Creative photoshoots
          </h2>
        </div>

        <div className="cw-shoot__bento">
          {bento.map((item, index) => (
            <Reveal
              key={item.slug}
              className={`cw-shoot__cell cw-shoot__cell--${index}`}
              style={{ transitionDelay: `${index * 55}ms` }}
            >
              <CreativeMediaCard item={item} list={strip} compact />
            </Reveal>
          ))}
        </div>
      </div>

      <div className="cw-container cw-container--wide">
        <p className="cw-shoot__striplabel">Contact sheet</p>
      </div>
      <div
        className="cw-shoot__strip"
        role="list"
        aria-label="Photoshoot contact sheet"
      >
        {strip.map((item) => (
          <div key={item.slug} className="cw-shoot__stripcell" role="listitem">
            <CreativeMediaCard item={item} list={strip} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
