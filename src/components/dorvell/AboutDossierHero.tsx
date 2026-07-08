import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import type { DorvellManual } from "@/content/dorvell.manual";
import { blurImageProps, imageAlt } from "@/lib/images";

export function AboutDossierHero({
  manual,
  images,
}: {
  manual: DorvellManual;
  images: DorvellImage[];
}) {
  const creatorImages = images.filter((image) =>
    ["Portraits", "Modeling", "Fashion", "Music", "Athletics"].includes(image.category),
  );
  const lead = creatorImages.find((image) => image.category === "Modeling") ?? creatorImages[0] ?? images[0];
  const tiles = creatorImages.filter((image) => image.id !== lead?.id).slice(0, 7);
  const strip = creatorImages.length > 0 ? Array.from({ length: 12 }, (_, index) => creatorImages[index % creatorImages.length]) : [];
  const primaryExperience = manual.experience.find((entry) => entry.role.includes("Freelance")) ?? manual.experience[0];
  const words = ["journalism", "runway", "music", "athletics", "portrait", "direction"];

  return (
    <section className="about-dossier" aria-labelledby="about-dossier-title">
      <div className="about-dossier__copy">
        <p className="eyebrow">Creator Dossier</p>
        <h1 id="about-dossier-title">Story-first eye. Frame-ready presence.</h1>
        <p>{manual.profile.fullBio}</p>
        <div className="about-dossier__actions">
          <Link className="button-primary" href="/work">
            Enter archive
          </Link>
          <Link className="button-secondary" href="/modeling">
            Modeling
          </Link>
          <Link className="about-dossier__contact-link" href="/contact">
            Booking &amp; contact
          </Link>
        </div>
        <dl className="about-dossier__stats" aria-label="Creator credentials">
          <div>
            <dt>Base</dt>
            <dd>{manual.profile.location}</dd>
          </div>
          <div>
            <dt>Training</dt>
            <dd>{manual.education.degree}, {manual.education.school}</dd>
          </div>
          <div>
            <dt>Working since</dt>
            <dd>{primaryExperience?.dates.replace("May ", "") ?? "2019-Present"}</dd>
          </div>
        </dl>
      </div>

      <div className="about-dossier__stage" aria-label="Dorvell Ferguson visual identity collage">
        <div className="about-word-loop" aria-hidden="true">
          {words.concat(words).map((word, index) => (
            <span key={`${word}-${index}`}>{word}</span>
          ))}
        </div>
        {lead ? (
          <figure className="about-dossier__lead">
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
              <span>{manual.profile.headline}</span>
              <strong>{manual.profile.location}</strong>
            </figcaption>
          </figure>
        ) : null}
        {tiles.length > 0 ? (
          <div className="about-dossier__tiles" aria-hidden="true">
            {tiles.map((image, index) => (
              <span key={image.id} style={{ "--tile-index": index } as CSSProperties}>
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

      <div className="about-dossier__proof" aria-label="Strengths and tools">
        <div>
          <span>Strengths</span>
          {manual.strengths.slice(0, 5).map((strength) => (
            <strong key={strength}>{strength}</strong>
          ))}
        </div>
        <div>
          <span>Tool kit</span>
          {manual.tools.map((tool) => (
            <strong key={tool}>{tool}</strong>
          ))}
        </div>
      </div>

      {strip.length > 0 ? (
        <div className="about-dossier__film" aria-hidden="true">
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
