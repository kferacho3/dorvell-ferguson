import Image from "next/image";
import type { DorvellImage } from "@/content/dorvell.schema";
import type { DorvellManual } from "@/content/dorvell.manual";
import { blurImageProps, imageAlt } from "@/lib/images";

export function AboutStory({
  manual,
  images,
  expanded = false,
}: {
  manual: DorvellManual;
  images: DorvellImage[];
  expanded?: boolean;
}) {
  const portrait = images.find((image) => image.category === "Modeling") ?? images[0];

  return (
    <section
      className={expanded ? "about-section is-expanded" : "about-section"}
      aria-labelledby="about-title"
      data-studio-section="about"
    >
      <div className="about-image">
        {portrait ? (
          <Image
            src={portrait.localOptimized.md}
            alt={imageAlt(portrait)}
            width={portrait.width}
            height={portrait.height}
            {...blurImageProps(portrait)}
          />
        ) : null}
      </div>
      <div className="about-copy">
        <p className="eyebrow">Behind the Lens</p>
        <h2 id="about-title">A visual storyteller who knows what it feels like to be in the frame.</h2>
        <p>{expanded ? manual.profile.fullBio : manual.profile.shortBio}</p>
        <div className="proof-list">
          <span>7+ years hands-on photography experience</span>
          <span>Troy University Multimedia Journalism</span>
          <span>Portraits / fashion / music / athletics</span>
          <span>Runway and editorial modeling lane</span>
        </div>
      </div>
    </section>
  );
}
