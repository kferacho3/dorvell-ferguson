"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties, type PointerEvent } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";
import { buildGalleryLanes } from "@/lib/gallery-lanes";
import { useImageWarmup } from "./useImageWarmup";

export function FeaturedWorkStrip({ images }: { images: DorvellImage[] }) {
  const lanes = useMemo(() => buildGalleryLanes(images), [images]);
  const featured = useMemo(
    () =>
      lanes.flatMap((lane) =>
        lane.images.slice(0, 3).map((image) => ({ image, lane })),
      ),
    [lanes],
  );
  const scanFrames = useMemo(() => [...featured, ...featured], [featured]);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = featured[activeIndex] ?? featured[0];
  const featuredPreviewUrls = useMemo(() => featured.map(({ image }) => image.localOptimized.md), [featured]);

  useImageWarmup(featuredPreviewUrls, 12);

  if (!active) return null;

  const previewLane = (laneKey: string) => {
    const nextIndex = featured.findIndex((item) => item.lane.key === laneKey);
    if (nextIndex >= 0) setActiveIndex(nextIndex);
  };

  const updateScanPosition = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

    event.currentTarget.style.setProperty("--scan-x", `${Math.round(x * 100)}%`);
    event.currentTarget.style.setProperty("--scan-y", `${Math.round(y * 100)}%`);
    event.currentTarget.style.setProperty("--scan-tilt-x", `${(0.5 - y) * 5}deg`);
    event.currentTarget.style.setProperty("--scan-tilt-y", `${(x - 0.5) * -7}deg`);
  };

  const resetScanPosition = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--scan-x", "52%");
    event.currentTarget.style.setProperty("--scan-y", "48%");
    event.currentTarget.style.setProperty("--scan-tilt-x", "0deg");
    event.currentTarget.style.setProperty("--scan-tilt-y", "0deg");
  };

  return (
    <section className="featured-strip" aria-labelledby="featured-title">
      <div
        className="featured-deck"
        style={{ "--lane-accent": active.lane.accent, "--lane-soft": active.lane.accentSoft } as CSSProperties}
      >
        <div className="featured-deck__copy">
          <p className="eyebrow">Signal Frames</p>
          <h2 id="featured-title">Twelve frames. Four lanes.</h2>
          <p>
            A contact-sheet scanner for Dorvell&apos;s four worlds: portrait control, stage heat, athletic timing, and
            styled direction.
          </p>
          <div className="featured-deck__meta" aria-label="Active featured frame">
            <span>{String(activeIndex + 1).padStart(2, "0")} / {String(featured.length).padStart(2, "0")}</span>
            <strong>{active.lane.label}</strong>
            <em>{active.image.projectTitle ?? active.image.category}</em>
          </div>
          <div className="featured-deck__lanes" aria-label="Featured lane shortcuts">
            {lanes.map((lane, index) => (
              <Link
                className={lane.key === active.lane.key ? "is-active" : ""}
                href={`/work#${lane.slug}`}
                key={lane.key}
                onFocus={() => previewLane(lane.key)}
                onMouseEnter={() => previewLane(lane.key)}
                style={{ "--lane-accent": lane.accent, "--lane-soft": lane.accentSoft } as CSSProperties}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{lane.label}</strong>
                <small>{lane.images.length} frames</small>
              </Link>
            ))}
          </div>
          <div className="featured-deck__actions">
            <Link className="button-primary" href="/work">
              Open all work
            </Link>
            <Link className="button-secondary" href={`/work#${active.lane.slug}`}>
              View this lane
            </Link>
          </div>
        </div>

        <figure className="featured-deck__stage">
          <div
            className="featured-deck__stage-inner"
            onPointerLeave={resetScanPosition}
            onPointerMove={updateScanPosition}
          >
            <Image
              key={active.image.id}
              src={active.image.localOptimized.md}
              alt={imageAlt(active.image)}
              width={active.image.width}
              height={active.image.height}
              sizes="(max-width: 900px) 92vw, 48vw"
              unoptimized
              {...blurImageProps(active.image)}
            />
            <span className="featured-stage__grid" aria-hidden="true" />
            <span className="featured-stage__beam" aria-hidden="true" />
            <span className="featured-stage__reticle" aria-hidden="true" />
          </div>
          <figcaption>
            <span>{active.lane.eyebrow}</span>
            <strong>{active.lane.deckLabel}</strong>
          </figcaption>
        </figure>

        <div className="featured-deck__scanner" aria-hidden="true">
          <div className="featured-scanner__readout">
            <span>active lane</span>
            <strong>{active.lane.label}</strong>
          </div>
          <div className="featured-scanner__reel featured-scanner__reel--a">
            {scanFrames.map(({ image, lane }, index) => (
              <figure key={`${image.id}-scan-a-${index}`} style={{ "--lane-accent": lane.accent } as CSSProperties}>
                <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} unoptimized {...blurImageProps(image)} />
                <figcaption>{String((index % featured.length) + 1).padStart(2, "0")}</figcaption>
              </figure>
            ))}
          </div>
          <div className="featured-scanner__reel featured-scanner__reel--b">
            {[...scanFrames].reverse().map(({ image, lane }, index) => (
              <figure key={`${image.id}-scan-b-${index}`} style={{ "--lane-accent": lane.accent } as CSSProperties}>
                <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} unoptimized {...blurImageProps(image)} />
                <figcaption>{lane.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="featured-deck__rail" tabIndex={0} aria-label="Horizontally scroll featured images">
          {featured.map(({ image, lane }, index) => {
            const href = image.projectSlug ? `/work/${image.projectSlug}` : `/work#${lane.slug}`;
            return (
              <Link
                aria-current={index === activeIndex ? "true" : undefined}
                className={index === activeIndex ? "featured-frame is-active" : "featured-frame"}
                href={href}
                key={image.id}
                onFocus={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                style={{ "--lane-accent": lane.accent, "--frame-index": index } as CSSProperties}
              >
                <Image
                  src={image.localOptimized.md}
                  alt={imageAlt(image)}
                  width={image.width}
                  height={image.height}
                  unoptimized
                  {...blurImageProps(image)}
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{lane.label}</strong>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
