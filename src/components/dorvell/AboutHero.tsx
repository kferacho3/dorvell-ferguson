import Image from "next/image";
import type { CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { aboutHero } from "@/content/about.data";
import { blurImageProps, imageAlt } from "@/lib/images";
import { getSocialLinks } from "@/lib/social-links";
import { SocialLinks } from "@/components/dorvell/contact/SocialLinks";
import { HeroContactSheet } from "@/components/dorvell/HeroContactSheet";

const NAME_LINES = ["Dorvell", "Ferguson Jr."];

/**
 * Section 1 — Hero. Oversized name arrives forward and settles (aboutHeroIn
 * keyframe, restraint edit of the Kinetic Type transition) over a faint ghost
 * wordmark; the lead portrait sits in a bleed frame with a pointer-gated
 * contact-sheet trailer confined to the hero zone. Server-rendered; only the
 * trailer is a client island.
 */
export function AboutHero({
  portrait,
  trailerImages,
}: {
  portrait?: DorvellImage;
  trailerImages: DorvellImage[];
}) {
  return (
    <section className="about-hero">
      <div className="about-hero__ghost" aria-hidden="true">
        <span>{aboutHero.ghost}</span>
        <span>{aboutHero.ghost}</span>
      </div>

      {trailerImages.length > 0 ? <HeroContactSheet images={trailerImages} /> : null}

      <div className="about-hero__masthead">
        <p className="about-eyebrow">{aboutHero.eyebrow}</p>
        <h1 className="about-hero__name" aria-label={aboutHero.name}>
          {NAME_LINES.map((line, index) => (
            <span
              className="about-hero__line"
              aria-hidden="true"
              key={line}
              style={{ "--i": index } as CSSProperties}
            >
              {line}
            </span>
          ))}
        </h1>
        <p className="about-hero__role">{aboutHero.roleLine}</p>
        <p className="about-hero__lead">{aboutHero.lead}</p>
        <SocialLinks links={getSocialLinks()} className="about-hero__social" />
      </div>

      {portrait ? (
        <figure className="about-hero__portrait" data-focus>
          <Image
            src={portrait.localOptimized.lg}
            alt={imageAlt(portrait)}
            width={portrait.width}
            height={portrait.height}
            priority
            sizes="(max-width: 1080px) 92vw, 40vw"
            {...blurImageProps(portrait)}
          />
          <figcaption>Tampa · on both sides of the lens</figcaption>
        </figure>
      ) : null}
      {/* TODO (client): confirm the final hero portrait asset — see pickHeroPortrait(). */}
    </section>
  );
}
