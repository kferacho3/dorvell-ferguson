import Image from "next/image";
import type { CSSProperties } from "react";
import type { DorvellImage, DorvellSiteContent } from "@/content/dorvell.schema";
import { buildGalleryLanes } from "@/lib/gallery-lanes";
import { blurImageProps, imageAlt } from "@/lib/images";

function formatCount(count: number) {
  return String(count).padStart(2, "0");
}

export function WorkArchiveHero({
  images,
  summary,
}: {
  images: DorvellImage[];
  summary?: DorvellSiteContent["scrapeSummary"];
}) {
  const lanes = buildGalleryLanes(images);
  const totalFrames = summary?.imagesDownloaded ?? images.length;
  const heroImage = lanes[3]?.images[0] ?? lanes[0]?.images[0] ?? images[0];
  const reel = lanes.flatMap((lane) => lane.images.slice(0, 4).map((image) => ({ lane, image })));

  return (
    <section className="work-archive-hero" aria-labelledby="work-archive-title">
      <div className="work-archive-hero__copy">
        <p className="eyebrow">Photo Archive / Four Doors</p>
        <h1 id="work-archive-title">One archive, four doors.</h1>
        <p>
          Portraits, live music, athletic timing, and fashion direction stay close enough to scan without
          flattening the work.
        </p>
        <div className="work-archive-hero__stats" aria-label="Archive summary">
          <span>
            <strong>{totalFrames}</strong>
            frames
          </span>
          <span>
            <strong>{lanes.length}</strong>
            lanes
          </span>
          <span>
            <strong>01</strong>
            cursor map
          </span>
        </div>
        <a className="button-primary" href="#archive">
          Enter the archive
        </a>
      </div>

      <div className="work-archive-hero__stage" aria-label="Archive gallery doors">
        {heroImage ? (
          <figure className="work-archive-hero__lead">
            <Image
              src={heroImage.localOptimized.lg}
              alt={imageAlt(heroImage)}
              width={heroImage.width}
              height={heroImage.height}
              sizes="(max-width: 900px) 92vw, 46vw"
              priority
              {...blurImageProps(heroImage)}
            />
            <figcaption>
              <span>Active archive</span>
              <strong>Dorvell Ferguson</strong>
            </figcaption>
          </figure>
        ) : null}

        <div className="work-archive-doors">
          {lanes.map((lane, index) => {
            const lead = lane.images[0];
            return (
              <a
                className="work-archive-door"
                href={`#${lane.slug}`}
                key={lane.key}
                style={{ "--lane-accent": lane.accent, "--door-index": index } as CSSProperties}
              >
                <span className="work-archive-door__number">{formatCount(index + 1)}</span>
                <span className="work-archive-door__thumb">
                  {lead ? (
                    <Image
                      src={lead.localOptimized.sm}
                      alt=""
                      width={lead.width}
                      height={lead.height}
                      {...blurImageProps(lead)}
                    />
                  ) : null}
                </span>
                <span className="work-archive-door__copy">
                  <em>{lane.eyebrow}</em>
                  <strong>{lane.label}</strong>
                  <small>{lane.images.length} frames</small>
                </span>
              </a>
            );
          })}
        </div>

        <div className="work-archive-reel" aria-hidden="true">
          {[...reel, ...reel].map(({ lane, image }, index) => (
            <span
              key={`${image.id}-${index}`}
              style={{ "--lane-accent": lane.accent, "--reel-index": index } as CSSProperties}
            >
              <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
