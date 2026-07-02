import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";
import { buildGalleryLanes } from "@/lib/gallery-lanes";

function worldTitleParts(label: string) {
  const parts = label.split(" / ");
  if (parts.length === 1) return [label];
  return [`${parts[0]} /`, parts.slice(1).join(" / ")];
}

export function GalleryWorlds({ images }: { images: DorvellImage[] }) {
  const lanes = buildGalleryLanes(images);

  return (
    <section className="gallery-worlds" aria-label="Featured portfolio galleries">
      {lanes.map((lane, laneIndex) => {
        const lead = lane.images[0];
        const support = lane.images.slice(1, 9);
        const strip = [...lane.images.slice(0, 10), ...lane.images.slice(0, 6)];
        const loopSource = lane.images.slice(0, 6);
        const loopFrames = [...loopSource, ...loopSource.slice(0, 3)];

        return (
          <article
            className={`gallery-world gallery-world--${lane.key}`}
            data-lane-key={lane.key}
            id={lane.slug}
            key={lane.key}
            style={{ "--lane-accent": lane.accent, "--lane-soft": lane.accentSoft } as CSSProperties}
          >
            <div className="world-index" aria-hidden="true">
              {String(laneIndex + 1).padStart(2, "0")}
            </div>
            <div className="world-loop-field" aria-hidden="true">
              {loopFrames.map((image, index) => (
                <span
                  className="world-loop-frame"
                  key={`${image.id}-loop-${index}`}
                  style={
                    {
                      "--loop-index": index,
                      "--loop-column": index % 3,
                    } as CSSProperties
                  }
                >
                  <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} unoptimized {...blurImageProps(image)} />
                </span>
              ))}
            </div>
            <div className="world-copy">
              <p className="atlas-kicker">{lane.eyebrow}</p>
              <h2>
                {worldTitleParts(lane.label).map((part) => (
                  <span key={part}>{part}</span>
                ))}
              </h2>
              <p>{lane.description}</p>
              <div className="world-actions">
                <Link href={`/work#${lane.slug}`}>View gallery</Link>
                <span>{lane.images.length} frames</span>
              </div>
            </div>

            <div className="world-stage">
              {lead ? (
                <figure className="world-lead">
                  <Image
                    src={lead.localOptimized.md}
                    alt={imageAlt(lead)}
                    width={lead.width}
                    height={lead.height}
                    sizes="(max-width: 900px) 92vw, 52vw"
                    unoptimized
                    {...blurImageProps(lead)}
                  />
                  <figcaption>
                    <span>{lane.deckLabel}</span>
                    <strong>DF-{String(laneIndex + 1).padStart(2, "0")}</strong>
                  </figcaption>
                </figure>
              ) : null}
              <div className="world-stack" aria-hidden="true">
                {support.map((image, index) => (
                  <span
                    key={image.id}
                    style={{ "--card-index": index, "--card-offset": `${(index % 3) * 16}px` } as CSSProperties}
                  >
                    <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} unoptimized {...blurImageProps(image)} />
                  </span>
                ))}
              </div>
            </div>

            <div className="world-strip" aria-hidden="true">
              {strip.map((image, index) => (
                <span key={`${image.id}-${index}`}>
                  <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} unoptimized />
                </span>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}
