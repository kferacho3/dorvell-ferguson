"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { DorvellImage, DorvellSiteContent } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";
import { buildGalleryLanes, type GalleryLane } from "@/lib/gallery-lanes";
import { AtlasOrbitField } from "./AtlasOrbitField";
import { useImageWarmup } from "./useImageWarmup";

type LaneTotals = Partial<Record<GalleryLane["key"], number>>;

function laneLead(lane: GalleryLane) {
  return lane.images[0];
}

function railImages(images: DorvellImage[]) {
  const first = images.slice(0, 18);
  return [...first, ...first.slice(0, 10)];
}

const heroProofs = [
  {
    value: "7+ yrs",
    label: "Hands on the camera.",
  },
  {
    value: "J-school eye",
    label: "Story, sequence, deadline.",
  },
  {
    value: "Both sides",
    label: "Shoots it. Wears it. Directs it.",
  },
  {
    value: "Grade -> ship",
    label: "Selects, color, crops, rollout.",
  },
];

function laneFrameTotal(lane: GalleryLane, laneTotals?: LaneTotals) {
  return laneTotals?.[lane.key] ?? lane.images.length;
}

function laneSpeedLabel(lane: GalleryLane, laneTotals?: LaneTotals) {
  return `${laneFrameTotal(lane, laneTotals)} frames`;
}

function nextIndex(index: number, direction: number, total: number) {
  if (total <= 0) return 0;
  return (index + direction + total) % total;
}

export function GalleryAtlasHero({
  images,
  summary,
  laneTotals,
}: {
  images: DorvellSiteContent["images"];
  summary?: DorvellSiteContent["scrapeSummary"];
  laneTotals?: LaneTotals;
}) {
  const lanes = useMemo(() => buildGalleryLanes(images), [images]);
  const [activeKey, setActiveKey] = useState(lanes[0]?.key ?? "portraits");
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const activeLaneIndex = Math.max(0, lanes.findIndex((lane) => lane.key === activeKey));
  const activeLane = lanes[activeLaneIndex] ?? lanes[0];
  const activeFrames = activeLane?.images.slice(0, 14) ?? [];
  const activeImage = activeFrames[activeFrameIndex % Math.max(activeFrames.length, 1)] ?? laneLead(activeLane) ?? images[0];
  const loopImages = useMemo(() => railImages(images), [images]);
  const orbitImages = useMemo(() => loopImages.slice(0, 16), [loopImages]);
  const lanePreviewUrls = useMemo(
    () => lanes.flatMap((lane) => lane.images.slice(0, 6).map((image) => image.localOptimized.md)),
    [lanes],
  );
  const heroRef = useRef<HTMLElement | null>(null);

  useImageWarmup(lanePreviewUrls, 16);

  const selectLane = (key: GalleryLane["key"]) => {
    setActiveKey(key);
    setActiveFrameIndex(0);
  };

  const shiftLane = (direction: number) => {
    if (lanes.length === 0) return;
    const lane = lanes[nextIndex(activeLaneIndex, direction, lanes.length)];
    setActiveKey(lane.key);
    setActiveFrameIndex(0);
  };

  const shiftFrame = (direction: number) => {
    setActiveFrameIndex((index) => nextIndex(index, direction, activeFrames.length));
  };

  const updateHeroPointer = (event: PointerEvent<HTMLElement>) => {
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    hero.style.setProperty("--hero-tilt-x", `${(0.5 - y) * 8}deg`);
    hero.style.setProperty("--hero-tilt-y", `${(x - 0.5) * -10}deg`);
    hero.style.setProperty("--hero-glow-x", `${Math.round(x * 100)}%`);
    hero.style.setProperty("--hero-glow-y", `${Math.round(y * 100)}%`);
  };

  const resetHeroPointer = () => {
    const hero = heroRef.current;
    if (!hero) return;
    hero.style.setProperty("--hero-tilt-x", "0deg");
    hero.style.setProperty("--hero-tilt-y", "0deg");
    hero.style.setProperty("--hero-glow-x", "62%");
    hero.style.setProperty("--hero-glow-y", "42%");
  };

  return (
    <section
      className="atlas-hero"
      aria-labelledby="hero-title"
      data-active-lane={activeLane?.key}
      onPointerLeave={resetHeroPointer}
      onPointerMove={updateHeroPointer}
      ref={heroRef}
      style={{ "--lane-accent": activeLane?.accent ?? "#35e0bb", "--lane-soft": activeLane?.accentSoft ?? "rgba(53, 224, 187, 0.18)" } as CSSProperties}
    >
      <AtlasOrbitField images={orbitImages} />
      <div className="atlas-noise" aria-hidden="true" />
      <div className="atlas-marquee" aria-hidden="true">
        {loopImages.map((image, index) => (
          <span key={`${image.id}-${index}`}>
            <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} unoptimized />
          </span>
        ))}
      </div>

      <div className="atlas-copy">
        <p className="atlas-kicker">Dorvell Ferguson Jr. / Tampa</p>
        <h1 className="atlas-headline" id="hero-title">Portraits first. Movement everywhere.</h1>
        <p className="atlas-lede">
          A living archive of faces, stage heat, athletic timing, and fashion direction, led by the photograph before
          the interface gets a word in.
        </p>
        <nav className="atlas-lane-dial" aria-label="Jump to portfolio lanes">
          {lanes.map((lane, index) => {
            const lead = laneLead(lane);
            return (
              <a
                aria-current={lane.key === activeKey ? "true" : undefined}
                className={lane.key === activeKey ? "is-active" : ""}
                href={lane.href}
                key={lane.key}
                onFocus={() => selectLane(lane.key)}
                onMouseEnter={() => selectLane(lane.key)}
                style={{ "--lane-accent": lane.accent, "--lane-soft": lane.accentSoft } as CSSProperties}
              >
                <span className="atlas-lane-dial__number">{String(index + 1).padStart(2, "0")}</span>
                <span className="atlas-lane-dial__thumb">
                  {lead ? (
                    <Image src={lead.localOptimized.sm} alt="" width={lead.width} height={lead.height} unoptimized {...blurImageProps(lead)} />
                  ) : null}
                </span>
                <span className="atlas-lane-dial__copy">
                  <strong>{lane.label}</strong>
                  <small>{laneSpeedLabel(lane, laneTotals)}</small>
                </span>
              </a>
            );
          })}
        </nav>
        <div className="atlas-proof-rail" aria-label="Creative proof points">
          {heroProofs.map((proof) => (
            <span key={proof.value}>
              <strong>{proof.value}</strong>
              <small>{proof.label}</small>
            </span>
          ))}
        </div>
        <div className="atlas-actions">
          <Link className="button-primary" href="/work">
            Open full archive
          </Link>
          <Link className="button-secondary" href="/contact">
            Book Dorvell
          </Link>
        </div>
      </div>

      <div className="atlas-stage" style={{ "--lane-accent": activeLane?.accent ?? "#35e0bb" } as CSSProperties}>
        <div className="atlas-stage__meta">
          <span>{summary?.imagesDownloaded ?? images.length} portfolio frames</span>
          <span>Portraits / Music / Sports / Fashion</span>
        </div>
        {activeImage ? (
          <figure className="atlas-preview">
            <Image
              src={activeImage.localOptimized.md}
              alt={imageAlt(activeImage)}
              width={activeImage.width}
              height={activeImage.height}
              priority
              sizes="(max-width: 900px) 92vw, 46vw"
              unoptimized
              {...blurImageProps(activeImage)}
            />
            <figcaption>
              <span>
                {String((activeFrameIndex % Math.max(activeFrames.length, 1)) + 1).padStart(2, "0")} /{" "}
                {String(activeFrames.length || 1).padStart(2, "0")} {activeLane?.eyebrow}
              </span>
              <strong>{activeLane?.label}</strong>
            </figcaption>
          </figure>
        ) : null}
        <div className="atlas-slide-carousel" aria-label="Featured image carousel">
          <button type="button" aria-label="Previous portfolio lane" onClick={() => shiftLane(-1)}>
            <span aria-hidden="true">&lt;</span>
          </button>
          <button type="button" className="atlas-slide-carousel__active" onClick={() => shiftFrame(1)}>
            <span>
              {String(activeLaneIndex + 1).padStart(2, "0")} / {String(lanes.length || 1).padStart(2, "0")}
            </span>
            <strong>{activeLane?.label}</strong>
            <small>Next frame</small>
          </button>
          <button type="button" aria-label="Next portfolio lane" onClick={() => shiftLane(1)}>
            <span aria-hidden="true">&gt;</span>
          </button>
        </div>
        <div className="atlas-minimap" aria-hidden="true">
          {lanes.map((lane) => (
            <span
              key={lane.key}
              className={lane.key === activeKey ? "is-active" : ""}
              style={{ "--lane-accent": lane.accent } as CSSProperties}
            />
          ))}
        </div>
      </div>

      <nav className="atlas-galleries" aria-label="Featured galleries">
        {lanes.map((lane, index) => {
          const lead = laneLead(lane);
          return (
            <a
              className={lane.key === activeKey ? "atlas-gallery-card is-active" : "atlas-gallery-card"}
              href={lane.href}
              key={lane.key}
              aria-label={`${lane.label}. ${laneFrameTotal(lane, laneTotals)} frames. ${lane.description}`}
              onFocus={() => selectLane(lane.key)}
              onMouseEnter={() => selectLane(lane.key)}
              style={{ "--lane-accent": lane.accent, "--lane-soft": lane.accentSoft } as CSSProperties}
            >
              <span className="atlas-gallery-card__number">{String(index + 1).padStart(2, "0")}</span>
              <span className="atlas-gallery-card__image">
                {lead ? (
                  <Image src={lead.localOptimized.sm} alt="" width={lead.width} height={lead.height} unoptimized {...blurImageProps(lead)} />
                ) : null}
              </span>
              <span className="atlas-gallery-card__copy">
                <em>{lane.eyebrow}</em>
                <strong>{lane.label}</strong>
                <small>{laneFrameTotal(lane, laneTotals)} frames</small>
              </span>
            </a>
          );
        })}
      </nav>
    </section>
  );
}
