import Link from "next/link";
import { Fragment, type CSSProperties } from "react";
import { aboutClosing } from "@/content/about.data";
import { getSocialLinks } from "@/lib/social-links";
import { SocialLinks } from "@/components/dorvell/contact/SocialLinks";

/**
 * Section 8 — Closing CTA. A calm sign-off that bookends the hero: oversized
 * headline over a faint ghost echo, a short line, two branded CTAs plus a
 * quiet "hire for journalism" link, and the shared social row (which already
 * carries @fergphotography + LinkedIn). Server component.
 */
export function AboutClosing() {
  const words = aboutClosing.headline.split(" ");

  return (
    <section className="about-block about-closing" data-focus>
      <div className="about-closing__ghost" aria-hidden="true">
        {aboutClosing.ghost}
      </div>

      <p className="about-eyebrow">{aboutClosing.eyebrow}</p>
      <h2 className="about-closing__headline" data-reveal-group aria-label={aboutClosing.headline}>
        <span aria-hidden="true">
          {words.map((word, index) => (
            <Fragment key={`${word}-${index}`}>
              <span className="about-closing__word" style={{ "--wi": index } as CSSProperties}>
                {word}
              </span>
              {index < words.length - 1 ? " " : ""}
            </Fragment>
          ))}
        </span>
      </h2>
      <p className="about-closing__body">{aboutClosing.body}</p>

      <div className="about-closing__actions">
        <Link className="about-cta about-cta--primary" href={aboutClosing.primary.href}>
          {aboutClosing.primary.label}
        </Link>
        <Link className="about-cta about-cta--ghost" href={aboutClosing.secondary.href}>
          {aboutClosing.secondary.label}
        </Link>
        <Link className="about-closing__journalism" href={aboutClosing.journalism.href}>
          {aboutClosing.journalism.label}
        </Link>
      </div>

      <SocialLinks links={getSocialLinks()} className="about-closing__social" />
    </section>
  );
}
