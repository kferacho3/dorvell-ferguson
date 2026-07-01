"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { buildGalleryLanes, type GalleryLaneKey } from "@/lib/gallery-lanes";
import { blurImageProps, imageAlt } from "@/lib/images";
import { useImageWarmup } from "./useImageWarmup";

type RouteStop = {
  key: GalleryLaneKey;
  progress: string;
  x: string;
  y: string;
  rotate: string;
};

const routeStops: RouteStop[] = [
  { key: "portraits", progress: "11%", x: "20%", y: "70%", rotate: "-7deg" },
  { key: "music-live", progress: "36%", x: "38%", y: "24%", rotate: "4deg" },
  { key: "sports-athletics", progress: "64%", x: "62%", y: "62%", rotate: "-3deg" },
  { key: "fashion-creative", progress: "88%", x: "80%", y: "30%", rotate: "6deg" },
];

const framePositions = [
  { x: "10%", y: "23%", rotate: "-8deg", delay: "0ms" },
  { x: "24%", y: "48%", rotate: "5deg", delay: "80ms" },
  { x: "42%", y: "78%", rotate: "-4deg", delay: "160ms" },
  { x: "56%", y: "18%", rotate: "7deg", delay: "240ms" },
  { x: "73%", y: "74%", rotate: "-6deg", delay: "320ms" },
  { x: "91%", y: "50%", rotate: "4deg", delay: "400ms" },
];

function routeStopForKey(key: GalleryLaneKey) {
  return routeStops.find((stop) => stop.key === key) ?? routeStops[0];
}

export function MotionPathGalleryPortal({ images }: { images: DorvellImage[] }) {
  const lanes = useMemo(() => buildGalleryLanes(images), [images]);
  const [activeKey, setActiveKey] = useState<GalleryLaneKey>(lanes[0]?.key ?? "portraits");
  const activeLane = lanes.find((lane) => lane.key === activeKey) ?? lanes[0];
  const activeLaneIndex = Math.max(0, lanes.findIndex((lane) => lane.key === activeLane?.key));
  const activeStop = routeStopForKey(activeLane?.key ?? "portraits");
  const activeFrames = useMemo(() => activeLane?.images.slice(0, framePositions.length) ?? [], [activeLane]);
  const leadFrame = activeFrames[0] ?? activeLane?.images[0];
  const routePreviewUrls = useMemo(
    () => [
      ...lanes.map((lane) => lane.images[0]?.localOptimized.md),
      ...activeFrames.map((image) => image.localOptimized.md),
    ],
    [activeFrames, lanes],
  );

  useImageWarmup(routePreviewUrls, 12);

  if (!activeLane || !leadFrame) return null;

  return (
    <section
      className="motion-path-portal"
      aria-labelledby="motion-path-portal-title"
      data-active-lane={activeLane.key}
      style={
        {
          "--lane-accent": activeLane.accent,
          "--lane-soft": activeLane.accentSoft,
          "--route-progress": activeStop.progress,
          "--traveler-x": activeStop.x,
          "--traveler-y": activeStop.y,
          "--traveler-rotate": activeStop.rotate,
        } as CSSProperties
      }
    >
      <div className="motion-path-portal__header">
        <div>
          <p className="eyebrow">Motion path</p>
          <h2 id="motion-path-portal-title">Follow the frame.</h2>
        </div>
        <p>
          Faces, stages, courts, and fits all move through the same designer eye. Pick a lane and let the route hand
          you off to the full room.
        </p>
      </div>

      <div className="motion-path-portal__shell">
        <div className="motion-path-portal__map" aria-label={`${activeLane.label} route map`}>
          <svg className="motion-route-svg" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
            <path className="motion-route-shadow" d="M 58 412 C 222 48 360 500 520 260 S 792 58 930 168" />
            <path className="motion-route-line" d="M 58 412 C 222 48 360 500 520 260 S 792 58 930 168" />
            <path className="motion-route-rhythm" d="M 112 466 C 246 236 348 160 492 256 S 708 428 864 236" />
          </svg>

          {activeFrames.map((image, index) => {
            const framePosition = framePositions[index];

            return (
              <figure
                className="motion-path-frame"
                key={image.id}
                style={
                  {
                    "--frame-x": framePosition.x,
                    "--frame-y": framePosition.y,
                    "--frame-rotate": framePosition.rotate,
                    "--frame-delay": framePosition.delay,
                  } as CSSProperties
                }
              >
                <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} unoptimized {...blurImageProps(image)} />
                <figcaption>{String(index + 1).padStart(2, "0")}</figcaption>
              </figure>
            );
          })}

          <figure className="motion-path-traveler" aria-live="polite">
            <Image
              key={leadFrame.id}
              src={leadFrame.localOptimized.md}
              alt={imageAlt(leadFrame)}
              width={leadFrame.width}
              height={leadFrame.height}
              sizes="(max-width: 760px) 44vw, 220px"
              unoptimized
              {...blurImageProps(leadFrame)}
            />
            <figcaption>
              <span>{String(activeLaneIndex + 1).padStart(2, "0")}</span>
              <strong>{activeLane.label}</strong>
            </figcaption>
          </figure>

          {lanes.map((lane, index) => {
            const stop = routeStopForKey(lane.key);
            const lead = lane.images[0];
            const isActive = lane.key === activeKey;
            const labelParts = lane.label.split(" / ");

            return (
              <button
                aria-pressed={isActive}
                className={isActive ? "motion-path-node is-active" : "motion-path-node"}
                key={lane.key}
                onClick={() => setActiveKey(lane.key)}
                onFocus={() => setActiveKey(lane.key)}
                onMouseEnter={() => setActiveKey(lane.key)}
                style={
                  {
                    "--node-x": stop.x,
                    "--node-y": stop.y,
                    "--lane-accent": lane.accent,
                    "--lane-soft": lane.accentSoft,
                  } as CSSProperties
                }
                type="button"
              >
                <span className="motion-path-node__index">{String(index + 1).padStart(2, "0")}</span>
                {lead ? (
                  <span className="motion-path-node__thumb">
                    <Image src={lead.localOptimized.sm} alt="" width={lead.width} height={lead.height} unoptimized {...blurImageProps(lead)} />
                  </span>
                ) : null}
                <span className="motion-path-node__copy">
                  <strong>
                    {labelParts.map((part, partIndex) => (
                      <span key={part}>
                        {part}
                        {partIndex < labelParts.length - 1 ? " /" : ""}
                      </span>
                    ))}
                  </strong>
                  <small>{lane.images.length} frames</small>
                </span>
              </button>
            );
          })}
        </div>

        <aside className="motion-path-portal__focus" aria-label={`${activeLane.label} route details`}>
          <div className="motion-path-portal__plate">
            <span>Now routing</span>
            <strong>{activeLane.eyebrow}</strong>
          </div>
          <figure className="motion-path-portal__lead">
            <Image
              key={`${leadFrame.id}-focus`}
              src={leadFrame.localOptimized.md}
              alt={imageAlt(leadFrame)}
              width={leadFrame.width}
              height={leadFrame.height}
              sizes="(max-width: 1100px) 92vw, 360px"
              unoptimized
              {...blurImageProps(leadFrame)}
            />
          </figure>
          <div className="motion-path-portal__copy">
            <h3>{activeLane.label}</h3>
            <p>{activeLane.description}</p>
          </div>
          <div className="motion-path-portal__stats" aria-label={`${activeLane.label} stats`}>
            <span>
              <strong>{String(activeLane.images.length).padStart(2, "0")}</strong>
              frames
            </span>
            <span>
              <strong>DF-{String(activeLaneIndex + 1).padStart(2, "0")}</strong>
              lane
            </span>
          </div>
          <div className="motion-path-portal__strip" aria-hidden="true">
            {activeFrames.slice(0, 4).map((image) => (
              <span key={`${image.id}-strip`}>
                <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} unoptimized {...blurImageProps(image)} />
              </span>
            ))}
          </div>
          <Link className="button-primary" href={`/work#${activeLane.slug}`}>
            Enter {activeLane.label}
          </Link>
        </aside>
      </div>

      <div
        className="motion-handoff"
        aria-label="Route handoff into gallery rooms"
        style={{ "--dock-progress": activeStop.progress } as CSSProperties}
      >
        <div className="motion-handoff__flow" key={`${activeLane.key}-handoff-flow`} aria-hidden="true">
          {activeFrames.slice(0, 5).map((image, index) => (
            <span
              className="motion-handoff__flow-card"
              key={`${image.id}-handoff-${index}`}
              style={{ "--handoff-index": index } as CSSProperties}
            >
              <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} {...blurImageProps(image)} />
            </span>
          ))}
        </div>

        <div className="motion-handoff__dock">
          <span>Route armed</span>
          <strong>{activeLane.label}</strong>
          <Link href={`#${activeLane.slug}`}>Drop into room</Link>
        </div>

        <div className="motion-handoff__lanes" aria-label="Choose a gallery room to route into">
          {lanes.map((lane, index) => {
            const lead = lane.images[0];
            const isActive = lane.key === activeLane.key;

            return (
              <button
                aria-pressed={isActive}
                className={isActive ? "is-active" : ""}
                key={`${lane.key}-handoff`}
                onClick={() => setActiveKey(lane.key)}
                onFocus={() => setActiveKey(lane.key)}
                onMouseEnter={() => setActiveKey(lane.key)}
                style={{ "--lane-accent": lane.accent, "--lane-soft": lane.accentSoft } as CSSProperties}
                type="button"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {lead ? (
                  <Image src={lead.localOptimized.sm} alt="" width={lead.width} height={lead.height} unoptimized {...blurImageProps(lead)} />
                ) : null}
                <strong>{lane.label}</strong>
                <small>{lane.images.length} frames</small>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
