import Image from "next/image";
import type { DorvellImage } from "@/content/dorvell.schema";
import type { DorvellManual } from "@/content/dorvell.manual";
import type { SocialLink } from "@/lib/social-links";
import { heroImages, imageAlt, blurImageProps } from "@/lib/images";
import { SocialLinks } from "./SocialLinks";

type Profile = DorvellManual["profile"];

const PROOF_TAGS = ["Tampa-based", "Portraits", "Music", "Fashion", "Sports", "Photojournalism"];

/**
 * Compact contact header — deliberately shorter and calmer than the Portfolio
 * or About heroes. A faded triptych of real frames sits behind warm cream copy
 * and a single, direct headline.
 */
export function ContactHero({
  profile,
  images = [],
  socials,
}: {
  profile: Profile;
  images?: DorvellImage[];
  socials: SocialLink[];
}) {
  const frames = heroImages(images, 3);

  return (
    <section className="contact-hero" aria-labelledby="contact-hero-title">
      {frames.length > 0 ? (
        <div className="contact-hero__frames" aria-hidden="true">
          {frames.map((image) => (
            <span key={image.id} className="contact-hero__frame">
              <Image
                src={image.localOptimized.sm}
                alt=""
                width={image.width}
                height={image.height}
                sizes="(max-width: 760px) 40vw, 22vw"
                {...blurImageProps(image)}
              />
            </span>
          ))}
        </div>
      ) : null}

      <div className="contact-hero__inner">
        <p className="eyebrow">Contact · {profile.location}</p>
        <h1 id="contact-hero-title">Let&rsquo;s build the shot.</h1>
        <p className="contact-hero__lead">
          For portraits, concerts, sports, fashion, editorial/photojournalism, and creative
          collaborations — send the details and Dorvell will follow up.
        </p>

        <ul className="contact-hero__tags" aria-label="Focus areas">
          {PROOF_TAGS.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>

        <SocialLinks links={socials} className="contact-hero__socials" />
      </div>

      {/* Screen-reader-only alt reference for the decorative frames. */}
      {frames[0] ? <span className="sr-only">Recent work: {imageAlt(frames[0])}.</span> : null}
    </section>
  );
}
