import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { DorvellSiteContent } from "@/content/dorvell.schema";
import { blurImageProps, heroImages, imageAlt } from "@/lib/images";
import { EditorialLensField } from "./EditorialLensField";

type HeroStyle = CSSProperties & {
  "--x": string;
  "--y": string;
  "--r": string;
};

export function EditorialLensHero({
  images,
  summary,
}: {
  images: DorvellSiteContent["images"];
  summary?: DorvellSiteContent["scrapeSummary"];
}) {
  const selected = heroImages(images, 7);

  return (
    <section className="hero-section">
      <EditorialLensField />
      <div className="contact-sheet-grid" aria-hidden="true" />
      <div className="hero-copy">
        <p className="eyebrow">Tampa-based photographer / model / visual storyteller</p>
        <h1>Dorvell Ferguson Jr. frames fashion, music, movement, and live moments with a storyteller&apos;s eye.</h1>
        <p>
          Built from a multimedia journalism background, Dorvell works across portraits, runway, events, athletics,
          concerts, creative direction, and social-first imagery.
        </p>
        <div className="hero-actions">
          <Link href="/work" className="button-primary">
            View the Archive
          </Link>
          <Link href="/contact" className="button-secondary">
            Book / Contact
          </Link>
        </div>
        <dl className="hero-stats">
          <div>
            <dt>Imported</dt>
            <dd>{summary?.imagesDownloaded ?? images.length} frames</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>Tampa, FL</dd>
          </div>
          <div>
            <dt>Focus</dt>
            <dd>Fashion / Music / Motion</dd>
          </div>
        </dl>
      </div>
      <div className="hero-stack" aria-label="Featured portfolio images">
        {selected.map((image, index) => (
          <figure
            className="hero-frame"
            key={image.id}
            style={
              {
                "--x": `${(index % 3) * 16 - 16}%`,
                "--y": `${Math.floor(index / 3) * 13 - 8}%`,
                "--r": `${[-5, 3, -2, 5, -4, 2, -1][index] ?? 0}deg`,
              } as HeroStyle
            }
          >
            <Image
              src={image.localOptimized.md}
              alt={imageAlt(image)}
              width={image.width}
              height={image.height}
              priority={index < 2}
              {...blurImageProps(image)}
            />
            <figcaption>
              <span>DF-{String(index + 1).padStart(3, "0")}</span>
              <strong>{image.category}</strong>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
