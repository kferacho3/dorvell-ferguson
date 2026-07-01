import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { DorvellCategory, DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";
import { buildGalleryLanes, galleryLaneDefinitions, laneKeyForImage } from "@/lib/gallery-lanes";

type Project = {
  slug: string;
  title: string;
  category: DorvellCategory;
  images: DorvellImage[];
};

export function ProjectExhibitHero({
  project,
  allImages,
}: {
  project: Project;
  allImages: DorvellImage[];
}) {
  const projectLane =
    galleryLaneDefinitions.find((definition) => definition.projectSlugs.includes(project.slug)) ??
    (project.images[0]
      ? galleryLaneDefinitions.find((definition) => definition.key === laneKeyForImage(project.images[0]))
      : undefined) ??
    galleryLaneDefinitions[0];

  const laneImages = buildGalleryLanes(allImages).find((lane) => lane.key === projectLane.key)?.images ?? [];
  const exhibitImages = project.images.length >= 5 ? project.images : laneImages.length > 0 ? laneImages : project.images;
  const lead = project.images[0] ?? exhibitImages[0];
  const stackImages = exhibitImages.filter((image) => image.id !== lead?.id).slice(0, 5);
  const stripImages = exhibitImages.length > 0 ? Array.from({ length: 12 }, (_, index) => exhibitImages[index % exhibitImages.length]) : [];
  const titleEchoes = Array.from({ length: 8 }, (_, index) => index);
  const displayTitle = project.title
    .replace(/\s*\(coming soon\s*\)\s*/i, "")
    .replace(/\s*\/\s*/g, " / ")
    .trim();
  const frameLabel = `${project.images.length} ${project.images.length === 1 ? "frame" : "frames"}`;
  const exhibitSentence = `${frameLabel} from Dorvell's working archive, staged as a focused room inside the larger visual system.`;

  return (
    <header
      className="project-exhibit"
      style={{ "--lane-accent": projectLane.accent } as CSSProperties}
      aria-labelledby="project-title"
    >
      <div className="project-exhibit__copy">
        <p className="eyebrow">{projectLane.eyebrow}</p>
        <h1 id="project-title">{displayTitle}</h1>
        <p>{exhibitSentence}</p>
        <div className="project-exhibit__actions">
          <Link className="button-primary" href={`/work#${projectLane.slug}`}>
            Open {projectLane.label}
          </Link>
          <a className="button-secondary" href={`mailto:fergusondorvell2@gmail.com?subject=${encodeURIComponent(`${displayTitle} booking inquiry`)}`}>
            Book this lane
          </a>
        </div>
        <dl className="project-exhibit__stats" aria-label="Project details">
          <div>
            <dt>Lane</dt>
            <dd>{projectLane.label}</dd>
          </div>
          <div>
            <dt>Frames</dt>
            <dd>{String(project.images.length).padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>{project.category}</dd>
          </div>
        </dl>
      </div>

      <div className="project-exhibit__stage" aria-label={`${project.title} visual preview`}>
        <div className="project-title-tube" aria-hidden="true">
          {titleEchoes.map((index) => (
            <span key={index} style={{ "--echo-index": index } as CSSProperties}>
              {displayTitle}
            </span>
          ))}
        </div>
        {lead ? (
          <figure className="project-exhibit__lead">
            <Image
              src={lead.localOptimized.lg}
              alt={imageAlt(lead)}
              width={lead.width}
              height={lead.height}
              priority
              sizes="(max-width: 1100px) 92vw, 45vw"
              {...blurImageProps(lead)}
            />
            <figcaption>
              <span>Lead frame</span>
              <strong>{projectLane.deckLabel}</strong>
            </figcaption>
          </figure>
        ) : null}
        {stackImages.length > 0 ? (
          <div className="project-exhibit__stack" aria-hidden="true">
            {stackImages.map((image, index) => (
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

      {stripImages.length > 0 ? (
        <div className="project-flow-strip" aria-hidden="true">
          {stripImages.map((image, index) => (
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
    </header>
  );
}
