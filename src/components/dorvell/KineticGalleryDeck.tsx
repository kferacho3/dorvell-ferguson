"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { buildGalleryLanes, type GalleryLaneKey } from "@/lib/gallery-lanes";
import { blurImageProps, imageAlt } from "@/lib/images";

const deckModes = [
  { key: "contact", label: "Contact", detail: "clean scan" },
  { key: "stack", label: "Stack", detail: "layout jump" },
  { key: "strip", label: "Strip", detail: "loop energy" },
] as const;

type DeckMode = (typeof deckModes)[number]["key"];

export function KineticGalleryDeck({ images }: { images: DorvellImage[] }) {
  const lanes = useMemo(() => buildGalleryLanes(images), [images]);
  const [activeKey, setActiveKey] = useState<GalleryLaneKey>(lanes[0]?.key ?? "portraits");
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [mode, setMode] = useState<DeckMode>("contact");
  const activeLane = lanes.find((lane) => lane.key === activeKey) ?? lanes[0];
  const frames = activeLane?.images.slice(0, 16) ?? [];
  const resolvedFrameIndex = Math.min(activeFrameIndex, Math.max(frames.length - 1, 0));
  const activeFrame = frames[resolvedFrameIndex] ?? frames[0];

  const selectLane = (key: GalleryLaneKey) => {
    setActiveKey(key);
    setActiveFrameIndex(0);
  };

  if (!activeLane || !activeFrame) return null;

  return (
    <section
      className="kinetic-deck"
      aria-labelledby="kinetic-title"
      data-mode={mode}
      style={{ "--lane-accent": activeLane.accent, "--lane-soft": activeLane.accentSoft } as CSSProperties}
    >
      <div className="kinetic-deck__header">
        <div>
          <p className="eyebrow">Grid-flow preview</p>
          <h2 id="kinetic-title">Touch the wall. Re-cut the room.</h2>
        </div>
        <p>
          A Codrops-inspired contact wall for Dorvell&apos;s four lanes. Hover a frame, change the layout, then jump
          straight into the gallery without losing your place.
        </p>
      </div>

      <div className="kinetic-deck__shell">
        <aside className="kinetic-deck__controls" aria-label="Kinetic gallery controls">
          <div className="kinetic-lane-list" aria-label="Portfolio lanes">
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
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {lead ? (
                    <Image src={lead.localOptimized.sm} alt="" width={lead.width} height={lead.height} {...blurImageProps(lead)} />
                  ) : null}
                  <strong>{lane.label}</strong>
                  <small>{lane.images.length} frames</small>
                </button>
              );
            })}
          </div>

          <div className="kinetic-mode-switch" aria-label="Wall layout mode">
            {deckModes.map((deckMode) => (
              <button
                aria-pressed={mode === deckMode.key}
                className={mode === deckMode.key ? "is-active" : ""}
                key={deckMode.key}
                onClick={() => setMode(deckMode.key)}
                type="button"
              >
                <strong>{deckMode.label}</strong>
                <small>{deckMode.detail}</small>
              </button>
            ))}
          </div>
        </aside>

        <div className="kinetic-deck__stage">
          <div className="kinetic-preview" aria-live="polite">
            <figure>
              <Image
                key={activeFrame.id}
                src={activeFrame.localOptimized.lg}
                alt={imageAlt(activeFrame)}
                width={activeFrame.width}
                height={activeFrame.height}
                sizes="(max-width: 900px) 92vw, 42vw"
                {...blurImageProps(activeFrame)}
              />
              <figcaption>
                <span>{activeLane.eyebrow}</span>
                <strong>{activeFrame.projectTitle ?? activeFrame.category}</strong>
              </figcaption>
            </figure>
            <div className="kinetic-preview__meta">
              <span>{String(resolvedFrameIndex + 1).padStart(2, "0")} / {String(frames.length).padStart(2, "0")}</span>
              <strong>{activeLane.label}</strong>
              <p>{activeLane.description}</p>
              <Link className="button-primary" href={`/work#${activeLane.slug}`}>
                Enter {activeLane.label}
              </Link>
            </div>
          </div>

          <div className="kinetic-minimap" aria-label={`${activeLane.label} hover map`}>
            {frames.map((image, index) => (
              <button
                aria-label={`Preview map frame ${index + 1}`}
                aria-pressed={index === resolvedFrameIndex}
                className={index === resolvedFrameIndex ? "is-active" : ""}
                key={image.id}
                onClick={() => setActiveFrameIndex(index)}
                onFocus={() => setActiveFrameIndex(index)}
                onMouseEnter={() => setActiveFrameIndex(index)}
                type="button"
              >
                <span />
              </button>
            ))}
          </div>

          <div className="kinetic-wall" aria-label={`${activeLane.label} interactive frame wall`}>
            {frames.map((image, index) => {
              const isActive = index === resolvedFrameIndex;
              return (
                <button
                  aria-label={`Preview ${activeLane.label} frame ${index + 1}`}
                  aria-pressed={isActive}
                  className={isActive ? "kinetic-frame is-active" : "kinetic-frame"}
                  key={image.id}
                  onClick={() => setActiveFrameIndex(index)}
                  onFocus={() => setActiveFrameIndex(index)}
                  onMouseEnter={() => setActiveFrameIndex(index)}
                  style={{ "--frame-index": index } as CSSProperties}
                  type="button"
                >
                  <Image src={image.localOptimized.md} alt="" width={image.width} height={image.height} {...blurImageProps(image)} />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
