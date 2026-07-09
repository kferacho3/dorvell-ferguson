"use client";

import { getCreativeItemsByCategory } from "@/content/creative";
import { CreativeMediaCard } from "./CreativeMediaCard";
import { Reveal } from "./Reveal";

const CONCEPT_TAGS = [
  "silhouette",
  "mirror",
  "flash",
  "editorial",
  "gym",
  "night",
  "horror",
  "comedy",
  "rooftop",
  "abandoned",
  "liminal",
  "nature",
  "fashion",
  "sports energy",
  "cinematic closeup",
  "body language",
];

/**
 * Section 7 — Creative photoshoot gallery. Concept-first, not category-first:
 * a big text block + a right-side bento, then a horizontal contact-sheet strip.
 */
export function CreativePhotoshootGallery() {
  const shoots = getCreativeItemsByCategory("creative-photoshoots");
  const bento = shoots.slice(0, 5);
  const strip = [...shoots, ...getCreativeItemsByCategory("motion-studies")];

  return (
    <section className="cw-section cw-shoot" aria-labelledby="cw-shoot-title">
      <div className="cw-container cw-container--wide cw-shoot__top">
        <div className="cw-shoot__intro">
          <p className="cw-eyebrow">Creative Photoshoots</p>
          <h2 id="cw-shoot-title" className="cw-h2">
            Concepts first.
            <br />
            Categories never.
          </h2>
          <p className="cw-lede">
            Unusual concepts, experimental light, and built worlds — not every frame belongs in a portfolio
            grid. Some belong in a scene.
          </p>
          <ul className="cw-shoot__tags" aria-label="Concept vocabulary">
            {CONCEPT_TAGS.map((tag) => (
              <li key={tag} className="cw-tag">
                {tag}
              </li>
            ))}
          </ul>
        </div>

        <div className="cw-shoot__bento">
          {bento.map((item, index) => (
            <Reveal
              key={item.slug}
              className={`cw-shoot__cell cw-shoot__cell--${index}`}
              style={{ transitionDelay: `${index * 55}ms` }}
            >
              <CreativeMediaCard item={item} list={strip} />
            </Reveal>
          ))}
        </div>
      </div>

      <div className="cw-container cw-container--wide">
        <p className="cw-shoot__striplabel">Contact sheet — drag / scroll</p>
      </div>
      <div className="cw-shoot__strip" role="list" aria-label="Photoshoot contact sheet">
        {strip.map((item) => (
          <div key={item.slug} className="cw-shoot__stripcell" role="listitem">
            <CreativeMediaCard item={item} list={strip} />
          </div>
        ))}
      </div>
    </section>
  );
}
