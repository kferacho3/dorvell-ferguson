import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import type { DorvellManual } from "@/content/dorvell.manual";
import { blurImageProps, imageAlt } from "@/lib/images";

export function RunwayDossierHero({
  manual,
  images,
}: {
  manual: DorvellManual;
  images: DorvellImage[];
}) {
  const runwayImages = images.filter((image) => ["Modeling", "Fashion", "Portraits"].includes(image.category));
  const lead = runwayImages[0] ?? images[0];
  const stack = runwayImages.filter((image) => image.id !== lead?.id).slice(0, 4);
  const strip = runwayImages.length > 0 ? Array.from({ length: 10 }, (_, index) => runwayImages[index % runwayImages.length]) : [];
  const modelDevelopment = manual.experience.find((entry) => entry.org === "The Mixson Method");
  const movementWords = ["pose", "lens", "light", "timing", "fit", "frame"];

  return (
    <section className="runway-dossier" aria-labelledby="runway-dossier-title">
      <div className="runway-dossier__copy">
        <p className="eyebrow">Runway / Model Book</p>
        <h1 id="runway-dossier-title">Behind the lens. Built for the frame.</h1>
        <p>
          Dorvell moves like someone who understands the frame before it happens: light, angle, fit, pose, and the quiet second where the image starts working.
        </p>
        <div className="runway-dossier__actions">
          <a className="button-primary" href="mailto:fergusondorvell2@gmail.com?subject=Runway%20%2F%20Editorial%20Booking%20Inquiry">
            Book runway / editorial
          </a>
          <Link className="button-secondary" href="/#fashion-creative">
            View fashion lane
          </Link>
        </div>
        <dl className="runway-dossier__stats" aria-label="Model book details">
          <div>
            <dt>Base</dt>
            <dd>{manual.profile.location}</dd>
          </div>
          <div>
            <dt>Development</dt>
            <dd>{modelDevelopment?.org ?? "Runway / editorial"}</dd>
          </div>
          <div>
            <dt>Range</dt>
            <dd>Modeling / creative direction / fashion content</dd>
          </div>
        </dl>
      </div>

      <div className="runway-dossier__stage" aria-label="Model book image composition">
        <div className="runway-word-loop" aria-hidden="true">
          {movementWords.concat(movementWords).map((word, index) => (
            <span key={`${word}-${index}`}>{word}</span>
          ))}
        </div>
        {lead ? (
          <figure className="runway-dossier__lead">
            <Image
              src={lead.localOptimized.lg}
              alt={imageAlt(lead)}
              width={lead.width}
              height={lead.height}
              priority
              sizes="(max-width: 1100px) 92vw, 40vw"
              {...blurImageProps(lead)}
            />
            <figcaption>
              <span>Model book</span>
              <strong>movement / light / frame</strong>
            </figcaption>
          </figure>
        ) : null}
        {stack.length > 0 ? (
          <div className="runway-dossier__stack" aria-hidden="true">
            {stack.map((image, index) => (
              <span key={image.id} style={{ "--stack-index": index } as CSSProperties}>
                <Image
                  src={image.localOptimized.sm}
                  alt=""
                  width={image.width}
                  height={image.height}
                  {...blurImageProps(image)}
                />
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {strip.length > 0 ? (
        <div className="runway-dossier__film" aria-hidden="true">
          {strip.map((image, index) => (
            <span key={`${image.id}-${index}`}>
              <Image
                src={image.localOptimized.sm}
                alt=""
                width={image.width}
                height={image.height}
                {...blurImageProps(image)}
              />
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
