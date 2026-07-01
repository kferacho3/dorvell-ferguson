"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DorvellImage } from "@/content/dorvell.schema";
import { cn } from "@/lib/cn";
import { blurImageProps, imageAlt } from "@/lib/images";
import { buildGalleryLanes, galleryLaneDefinitions, laneKeyForImage, type GalleryLaneKey } from "@/lib/gallery-lanes";
import { ImageCard } from "./ImageCard";
import { ImmersiveLightbox } from "./ImmersiveLightbox";

const modes = ["grid", "contact", "carousel"] as const;
const densityModes = [
  { key: "tight", label: "50%", detail: "dense scan" },
  { key: "editorial", label: "75%", detail: "balanced" },
  { key: "billboard", label: "125%", detail: "large frames" },
] as const;
type ArchiveFilter = GalleryLaneKey | "All";
type LightboxOrigin = { x: number; y: number; width: number; height: number };
type LightboxState = { index: number; origin?: LightboxOrigin };
type PointerMap = { x: number; y: number };
type WorkArchiveProps = {
  images: DorvellImage[];
  scopeLabel?: string;
  variant?: "full" | "preview";
};

function originFromElement(element: Element): LightboxOrigin {
  const rect = element.getBoundingClientRect();
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

export function WorkArchive({ images, scopeLabel, variant = "full" }: WorkArchiveProps) {
  const [filter, setFilter] = useState<ArchiveFilter>("All");
  const [mode, setMode] = useState<(typeof modes)[number]>("grid");
  const [density, setDensity] = useState<(typeof densityModes)[number]["key"]>("editorial");
  const [lightboxState, setLightboxState] = useState<LightboxState | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [pointerMap, setPointerMap] = useState<PointerMap | null>(null);

  const lanes = useMemo(() => buildGalleryLanes(images), [images]);
  const archiveScopeLabel = scopeLabel?.trim();

  useEffect(() => {
    const applyHash = (scrollToArchive = false) => {
      const slug = window.location.hash.replace("#", "");
      const lane = galleryLaneDefinitions.find((definition) => definition.slug === slug);
      if (!lane) return;
      setFilter(lane.key);

      if (scrollToArchive && window.location.pathname === "/work") {
        window.requestAnimationFrame(() => {
          document.getElementById("archive")?.scrollIntoView({ block: "start" });
        });
      }
    };

    const onHashChange = () => applyHash(window.location.pathname === "/work");
    const onHashLinkClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      const href = target?.getAttribute("href") ?? "";
      const hash = href.includes("#") ? href.split("#").pop() : "";
      const lane = galleryLaneDefinitions.find((definition) => definition.slug === hash);
      if (lane) window.setTimeout(() => applyHash(true), 40);
    };

    applyHash(window.location.pathname === "/work");
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onHashChange);
    document.addEventListener("click", onHashLinkClick);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onHashChange);
      document.removeEventListener("click", onHashLinkClick);
    };
  }, []);

  const filtered = useMemo(
    () => images.filter((image) => filter === "All" || laneKeyForImage(image) === filter),
    [filter, images],
  );

  const activeLaneLabel = lanes.find((lane) => lane.key === filter)?.label ?? filter;
  const filterLabel = filter === "All" ? (archiveScopeLabel ? `the ${archiveScopeLabel} exhibit` : "all galleries") : activeLaneLabel;
  const mapFilterLabel = filter === "All" ? (archiveScopeLabel ? "Full exhibit" : "All galleries") : activeLaneLabel;
  const frameLabel = filtered.length === 1 ? "frame" : "frames";
  const archiveTitle =
    variant === "preview"
      ? "The archive breathes in four directions."
      : archiveScopeLabel
        ? "Exhibit contact sheet."
        : "Full working archive.";
  const activePreviewIndex = filtered.length > 0 ? Math.min(previewIndex ?? 0, filtered.length - 1) : 0;
  const previewImage = filtered[activePreviewIndex];
  const previewProgress = filtered.length > 1 ? activePreviewIndex / (filtered.length - 1) : 0;
  const previewLaneKey = previewImage ? laneKeyForImage(previewImage) : null;
  const previewLane = previewLaneKey ? galleryLaneDefinitions.find((definition) => definition.key === previewLaneKey) : null;
  const flowFrames = filtered.slice(0, 16);
  const cursorX = pointerMap?.x ?? 0.5;
  const cursorY = pointerMap?.y ?? 0.5;

  const selectFilter = (nextFilter: ArchiveFilter) => {
    setFilter(nextFilter);
    setPreviewIndex(null);
    setLightboxState(null);
    setPointerMap(null);
  };

  const selectMode = (nextMode: (typeof modes)[number]) => {
    setMode(nextMode);
    setPreviewIndex(null);
    setLightboxState(null);
    setPointerMap(null);
  };

  return (
    <section className={cn("archive-section", variant === "preview" && "archive-preview")} aria-labelledby="archive-title" id="archive">
      {variant === "full" ? (
        <div className="archive-hash-anchors" aria-hidden="true">
          {galleryLaneDefinitions.map((lane) => (
            <span id={lane.slug} key={lane.key} />
          ))}
        </div>
      ) : null}

      <div className="section-heading archive-heading">
        <div>
          <p className="eyebrow">Archive</p>
          <h2 id="archive-title">{archiveTitle}</h2>
          <p>{filtered.length} {frameLabel} in {filterLabel}.</p>
        </div>
        {variant === "preview" ? <Link href="/work">Open full archive</Link> : null}
      </div>

      <div className="archive-controls">
        <div className="filter-row" aria-label="Filter archive">
          <button
            type="button"
            className={filter === "All" ? "is-active" : ""}
            onClick={() => selectFilter("All")}
          >
            {archiveScopeLabel ? "Full exhibit" : "All galleries"}
          </button>
          {lanes.map((lane) => (
            <button
              key={lane.key}
              type="button"
              className={filter === lane.key ? "is-active" : ""}
              onClick={() => selectFilter(lane.key)}
              style={{ "--lane-accent": lane.accent } as CSSProperties}
            >
              {lane.label}
            </button>
          ))}
        </div>
        <div className="archive-view-switches">
          <div className="mode-toggle" aria-label="Archive view mode">
            {modes.map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                className={mode === nextMode ? "is-active" : ""}
                onClick={() => selectMode(nextMode)}
              >
                {nextMode}
              </button>
            ))}
          </div>
          <div className="density-toggle" aria-label="Archive grid density">
            {densityModes.map((densityMode) => (
              <button
                aria-pressed={density === densityMode.key}
                className={density === densityMode.key ? "is-active" : ""}
                key={densityMode.key}
                onClick={() => setDensity(densityMode.key)}
                type="button"
              >
                <strong>{densityMode.label}</strong>
                <span>{densityMode.detail}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {flowFrames.length > 0 ? (
        <div className="archive-flow-register" key={`${filter}-${mode}-flow`} aria-hidden="true">
          {flowFrames.map((image, index) => {
            const lane = galleryLaneDefinitions.find((definition) => definition.key === laneKeyForImage(image));
            const drift = ((index % 5) - 2) * 22;
            return (
              <span
                className="archive-flow-frame"
                key={image.id}
                style={
                  {
                    "--flow-index": index,
                    "--flow-drift": drift,
                    "--lane-accent": lane?.accent ?? "#35e0bb",
                  } as CSSProperties
                }
              >
                <Image
                  src={image.localOptimized.sm}
                  alt=""
                  width={image.width}
                  height={image.height}
                  {...blurImageProps(image)}
                />
              </span>
            );
          })}
        </div>
      ) : null}

      {previewImage ? (
        <div
          className="archive-instrument"
          data-cursor-active={pointerMap ? "true" : "false"}
          style={
            {
              "--lane-accent": previewLane?.accent ?? "#35e0bb",
              "--archive-progress": previewProgress,
              "--archive-cursor-x": cursorX,
              "--archive-cursor-y": cursorY,
              "--archive-cursor-left": `${Math.round(cursorX * 100)}%`,
              "--archive-cursor-top": `${Math.round(cursorY * 100)}%`,
            } as CSSProperties
          }
        >
          <figure className="archive-preview-frame">
            <Image
              src={previewImage.localOptimized.md}
              alt={imageAlt(previewImage)}
              width={previewImage.width}
              height={previewImage.height}
              {...blurImageProps(previewImage)}
            />
            <figcaption>
              <span>{String(activePreviewIndex + 1).padStart(2, "0")} / {String(filtered.length).padStart(2, "0")}</span>
              <strong>{previewLane?.label ?? previewImage.category}</strong>
              <em>{previewImage.projectTitle}</em>
            </figcaption>
            <span className="archive-preview-lens" aria-hidden="true">
              <span />
            </span>
          </figure>
          <div className="archive-minimap" aria-label="Archive cursor map">
            <div className="archive-map-header">
              <span>Cursor map</span>
              <strong>{mapFilterLabel}</strong>
              <em>{String(activePreviewIndex + 1).padStart(2, "0")} active</em>
            </div>
            <div className="archive-map-grid">
              {filtered.map((image, index) => {
                const lane = galleryLaneDefinitions.find((definition) => definition.key === laneKeyForImage(image));
                const isActive = index === activePreviewIndex;
                return (
                  <button
                    aria-label={`Preview ${lane?.label ?? image.category} frame ${index + 1}`}
                    aria-current={isActive ? "true" : undefined}
                    className={isActive ? "is-active" : ""}
                    key={image.id}
                    onBlur={() => setPreviewIndex(null)}
                    onClick={(event) => setLightboxState({ index, origin: originFromElement(event.currentTarget) })}
                    onFocus={() => setPreviewIndex(index)}
                    onMouseEnter={() => setPreviewIndex(index)}
                    onMouseLeave={() => setPreviewIndex(null)}
                    style={{ "--lane-accent": lane?.accent ?? "#35e0bb" } as CSSProperties}
                    type="button"
                  >
                    <span />
                  </button>
                );
              })}
            </div>
            <div className="archive-hover-map" aria-hidden="true">
              <span className="archive-hover-map__thumb">
                <Image
                  key={`${previewImage.id}-map`}
                  src={previewImage.localOptimized.sm}
                  alt=""
                  width={previewImage.width}
                  height={previewImage.height}
                  {...blurImageProps(previewImage)}
                />
                <span className="archive-hover-map__dot" />
              </span>
              <span className="archive-hover-map__readout">
                <strong>{pointerMap ? "Hover lock" : "Scan idle"}</strong>
                <em>
                  X{String(Math.round(cursorX * 100)).padStart(2, "0")} / Y{String(Math.round(cursorY * 100)).padStart(2, "0")}
                </em>
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn("archive-grid", `archive-${mode}`, `archive-density-${density}`)} key={`${filter}-${mode}-${density}`}>
        {filtered.map((image, index) => (
          <ImageCard
            key={image.id}
            image={image}
            index={index}
            mode={mode}
            onOpen={(origin) => setLightboxState({ index, origin })}
            onPreview={setPreviewIndex}
            onPointerMap={setPointerMap}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No frames in this lane yet.</p>
      ) : null}

      {lightboxState !== null ? (
        <ImmersiveLightbox
          images={filtered}
          index={lightboxState.index}
          origin={lightboxState.origin}
          onClose={() => setLightboxState(null)}
          onNavigate={(index) => setLightboxState((current) => (current ? { ...current, index } : { index }))}
        />
      ) : null}
    </section>
  );
}
