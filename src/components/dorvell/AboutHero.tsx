import Image from "next/image";
import type { CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { aboutHero } from "@/content/about.data";
import { blurImageProps, imageAlt } from "@/lib/images";
import { getSocialLinks } from "@/lib/social-links";
import { SocialLinks } from "@/components/dorvell/contact/SocialLinks";
import { HeroContactSheet } from "@/components/dorvell/HeroContactSheet";

/**
 * Section 1 — Hero. A kinetic route-entry (oversized "DORVELL" field settles
 * from background to foreground and lifts, KineticTypePageTransition idiom),
 * then the name masks up line-by-line — line two demoted in weight with a
 * skewed gold "Jr." (faux-italic; neither loaded font ships a true italic).
 * A faint ghost wordmark and the lead portrait ride multi-plane scroll
 * parallax; a pointer-gated contact-sheet trailer is confined to the hero.
 * Server-rendered; only the trailer is a client island.
 */
export function AboutHero({
  portrait,
  trailerImages,
}: {
  portrait?: DorvellImage;
  trailerImages: DorvellImage[];
}) {
  return (
    <section className="about-hero" data-focus>
      {/* Route-entry overlay — pure CSS, plays on every mount + cold load. */}
      <div className="about-enter" aria-hidden="true">
        <div className="about-enter__plate" />
        <div className="about-enter__field">
          {Array.from({ length: 5 }).map((_, index) => (
            <span className="about-enter__line" key={index} style={{ "--i": index } as CSSProperties}>
              DORVELL
            </span>
          ))}
        </div>
      </div>

      <div className="about-hero__ghost" aria-hidden="true">
        <span>{aboutHero.ghost}</span>
        <span>{aboutHero.ghost}</span>
      </div>

      {trailerImages.length > 0 ? <HeroContactSheet images={trailerImages} /> : null}

      <div className="about-hero__masthead">
        <p className="about-eyebrow">{aboutHero.eyebrow}</p>
        <h1 className="about-hero__name" aria-label={aboutHero.name}>
          <span className="about-hero__line" aria-hidden="true" style={{ "--i": 0 } as CSSProperties}>
            <span className="about-hero__line-inner">Dorvell</span>
          </span>
          <span className="about-hero__line about-hero__line--sub" aria-hidden="true" style={{ "--i": 1 } as CSSProperties}>
            <span className="about-hero__line-inner">
              Ferguson <span className="about-hero__jr">Jr.</span>
            </span>
          </span>
        </h1>
        <p className="about-hero__role">{aboutHero.roleLine}</p>
        <p className="about-hero__lead">{aboutHero.lead}</p>
        <SocialLinks links={getSocialLinks()} className="about-hero__social" />
      </div>

      {portrait ? (
        <figure className="about-hero__portrait">
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
