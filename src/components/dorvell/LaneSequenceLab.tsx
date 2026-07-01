"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";
import { buildGalleryLanes, type GalleryLaneKey } from "@/lib/gallery-lanes";

export function LaneSequenceLab({ images }: { images: DorvellImage[] }) {
  const lanes = useMemo(() => buildGalleryLanes(images), [images]);
  const [activeKey, setActiveKey] = useState<GalleryLaneKey>(lanes[0]?.key ?? "portraits");
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const activeLane = lanes.find((lane) => lane.key === activeKey) ?? lanes[0];
  const activeSequence = activeLane?.images.slice(0, 10) ?? [];
  const activeFrame = activeSequence[Math.min(activeFrameIndex, Math.max(activeSequence.length - 1, 0))] ?? activeSequence[0];

  const selectLane = (key: GalleryLaneKey) => {
    setActiveKey(key);
    setActiveFrameIndex(0);
  };

  if (!activeLane || !activeFrame) return null;

  return (
    <section
      className="sequence-lab"
      aria-labelledby="sequence-lab-title"
      style={{ "--lane-accent": activeLane.accent, "--lane-soft": activeLane.accentSoft } as CSSProperties}
    >
      <div className="sequence-lab__header">
        <div>
          <p className="eyebrow">Sequence Lab</p>
          <h2 id="sequence-lab-title">Four rooms. One projector.</h2>
        </div>
        <p>
          Pick a lane, skim the contact sheet, then drop straight into the full archive. It keeps the site playful
          without making the work hard to find.
        </p>
      </div>

      <div className="sequence-lab__console">
        <figure className="sequence-lab__projector">
          <Image
            key={activeFrame.id}
            src={activeFrame.localOptimized.lg}
            alt={imageAlt(activeFrame)}
            width={activeFrame.width}
            height={activeFrame.height}
            sizes="(max-width: 900px) 92vw, 54vw"
            {...blurImageProps(activeFrame)}
          />
          <figcaption>
            <span>{activeLane.eyebrow}</span>
            <strong>{activeLane.label}</strong>
            <em>
              {String(activeFrameIndex + 1).padStart(2, "0")} / {String(activeSequence.length).padStart(2, "0")}
            </em>
          </figcaption>
        </figure>

        <div className="sequence-lab__controls" aria-label="Portfolio lane sequence controls">
          <div className="sequence-lab__lane-buttons">
            {lanes.map((lane, index) => {
              const lead = lane.images[0];
              const isActive = lane.key === activeKey;
              return (
                <button
                  aria-pressed={isActive}
                  className={isActive ? "is-active" : ""}
                  key={lane.key}
                  onClick={() => selectLane(lane.key)}
                  onFocus={() => selectLane(lane.key)}
                  onMouseEnter={() => selectLane(lane.key)}
                  style={{ "--lane-accent": lane.accent, "--lane-soft": lane.accentSoft } as CSSProperties}
                  type="button"
                >
                  <span className="sequence-lab__lane-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="sequence-lab__lane-thumb">
                    {lead ? (
                      <Image src={lead.localOptimized.sm} alt="" width={lead.width} height={lead.height} {...blurImageProps(lead)} />
                    ) : null}
                  </span>
                  <span className="sequence-lab__lane-copy">
                    <strong>{lane.label}</strong>
                    <small>{lane.images.length} frames</small>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="sequence-lab__contact-strip" aria-label={`${activeLane.label} contact sheet`}>
            {activeSequence.map((image, index) => {
              const isActive = index === activeFrameIndex;
              return (
                <button
                  aria-label={`Preview ${activeLane.label} frame ${index + 1}`}
                  aria-pressed={isActive}
                  className={isActive ? "is-active" : ""}
                  key={image.id}
                  onClick={() => setActiveFrameIndex(index)}
                  onFocus={() => setActiveFrameIndex(index)}
                  onMouseEnter={() => setActiveFrameIndex(index)}
                  type="button"
                >
                  <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} {...blurImageProps(image)} />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </button>
              );
            })}
          </div>

          <div className="sequence-lab__actions">
            <Link className="button-primary" href={`/work#${activeLane.slug}`}>
              Enter {activeLane.label}
            </Link>
            <span>{activeLane.description}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
