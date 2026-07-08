"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DorvellImage } from "@/content/dorvell.schema";
import { cn } from "@/lib/cn";
import { blurImageProps, imageAlt } from "@/lib/images";
import { buildGalleryLanes, galleryLaneDefinitions, laneKeyForImage, type GalleryLaneKey } from "@/lib/gallery-lanes";
import { ImageCard } from "./ImageCard";
import { ImmersiveLightbox } from "./ImmersiveLightbox";
import { useImageWarmup } from "./useImageWarmup";

const modes = ["grid", "focus", "contact", "carousel"] as const;
const GRID_CHUNK = 72;
const MINIMAP_CAP = 120;
const FOCUS_RAIL_WINDOW = 40;
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
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [pointerMap, setPointerMap] = useState<PointerMap | null>(null);
  const [visibleCount, setVisibleCount] = useState(GRID_CHUNK);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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

  // Evenly sampled minimap entries so the cursor map never renders thousands of buttons.
  const minimapEntries = useMemo(() => {
    if (filtered.length <= MINIMAP_CAP) return filtered.map((image, index) => ({ image, index }));
    const step = (filtered.length - 1) / (MINIMAP_CAP - 1);
    return Array.from({ length: MINIMAP_CAP }, (_, sampleIndex) => {
      const index = Math.round(sampleIndex * step);
      return { image: filtered[index], index };
    });
  }, [filtered]);

  // Append the next chunk of grid cards when the sentinel scrolls into range.
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleCount >= filtered.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + GRID_CHUNK, filtered.length));
        }
      },
      { rootMargin: "640px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filtered.length, mode, density]);

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
  const selectedFocusIndex = filtered.length > 0 ? Math.min(focusIndex ?? 0, filtered.length - 1) : 0;
  const activePreviewIndex = filtered.length > 0 ? Math.min(previewIndex ?? focusIndex ?? 0, filtered.length - 1) : 0;
  const previewImage = filtered[activePreviewIndex];
  const previewProgress = filtered.length > 1 ? activePreviewIndex / (filtered.length - 1) : 0;
  const previewLaneKey = previewImage ? laneKeyForImage(previewImage) : null;
  const previewLane = previewLaneKey ? galleryLaneDefinitions.find((definition) => definition.key === previewLaneKey) : null;
  const flowFrames = filtered.slice(0, 16);
  const calmPreviewFrames = filtered.slice(0, 6);
  const focusWarmupUrls = useMemo(() => filtered.slice(0, 18).map((image) => image.localOptimized.md), [filtered]);
  const cursorX = pointerMap?.x ?? 0.5;
  const cursorY = pointerMap?.y ?? 0.5;

  useImageWarmup(focusWarmupUrls, mode === "focus" ? 18 : 8);

  const selectFilter = (nextFilter: ArchiveFilter) => {
    setFilter(nextFilter);
    setFocusIndex(null);
    setPreviewIndex(null);
    setLightboxState(null);
    setPointerMap(null);
    setVisibleCount(GRID_CHUNK);
  };

  const selectMode = (nextMode: (typeof modes)[number]) => {
    setMode(nextMode);
    setFocusIndex(null);
    setPreviewIndex(null);
    setLightboxState(null);
    setPointerMap(null);
    setVisibleCount(GRID_CHUNK);
  };

  if (variant === "preview") {
    return (
      <section className="archive-section archive-preview archive-preview--calm" aria-labelledby="archive-title" id="archive">
        <div className="section-heading archive-heading archive-heading--calm">
          <div>
            <p className="eyebrow">Selected Work</p>
            <h2 id="archive-title">Less interface. More photograph.</h2>
            <p>{filtered.length} selected frames held back for a quieter first pass.</p>
          </div>
          <Link href="/work">Open full archive</Link>
        </div>

        <div className="archive-preview-gallery" aria-label="Selected portfolio frames">
          {calmPreviewFrames.map((image, index) => {
            const lane = galleryLaneDefinitions.find((definition) => definition.key === laneKeyForImage(image));
            return (
              <button
                aria-label={`Open ${lane?.label ?? image.category} selected image ${index + 1}`}
                className="archive-preview-card"
                key={image.id}
                onClick={(event) => setLightboxState({ index, origin: originFromElement(event.currentTarget) })}
                style={{ "--lane-accent": lane?.accent ?? "#35e0bb", "--card-index": index } as CSSProperties}
                type="button"
              >
                <Image
                  src={image.localOptimized.md}
                  alt={imageAlt(image)}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 760px) 88vw, (max-width: 1100px) 44vw, 28vw"
                  loading={index < 3 ? "eager" : "lazy"}
                  unoptimized
                  {...blurImageProps(image)}
                />
                <span>
                  <strong>{lane?.label ?? image.category}</strong>
                  <em>DF-{String(index + 1).padStart(3, "0")}</em>
                </span>
              </button>
            );
          })}
        </div>

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

  const remainingCount = Math.max(0, filtered.length - visibleCount);
  const railStart = Math.max(
    0,
    Math.min(selectedFocusIndex - Math.floor(FOCUS_RAIL_WINDOW / 2), filtered.length - FOCUS_RAIL_WINDOW),
  );
  const focusRailEntries = filtered
    .slice(railStart, railStart + FOCUS_RAIL_WINDOW)
    .map((image, offset) => ({ image, index: railStart + offset }));

  return (
    <section className="archive-section" aria-labelledby="archive-title" id="archive">
      <div className="archive-hash-anchors" aria-hidden="true">
        {galleryLaneDefinitions.map((lane) => (
          <span id={lane.slug} key={lane.key} />
        ))}
      </div>

      <div className="section-heading archive-heading">
        <div>
          <p className="eyebrow">Archive</p>
          <h2 id="archive-title">{archiveTitle}</h2>
          <p>{filtered.length} {frameLabel} in {filterLabel}.</p>
        </div>
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

      {flowFrames.length > 0 && mode !== "focus" ? (
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
                  unoptimized
                  {...blurImageProps(image)}
                />
              </span>
            );
          })}
        </div>
      ) : null}

      {previewImage && mode !== "focus" ? (
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
              unoptimized
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
              {minimapEntries.map(({ image, index }) => {
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
                  unoptimized
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
              <span className="archive-hover-map__signal">{previewImage.projectTitle}</span>
            </div>
          </div>
        </div>
      ) : null}

      {mode === "focus" && previewImage ? (
        <div
          className="archive-focus-mode"
          key={`${filter}-${mode}`}
          style={{ "--lane-accent": previewLane?.accent ?? "#35e0bb" } as CSSProperties}
        >
          <div className="archive-focus-stage">
            <button
              aria-label={`Open focused ${previewLane?.label ?? previewImage.category} image`}
              className="archive-focus-image"
              onClick={(event) => setLightboxState({ index: activePreviewIndex, origin: originFromElement(event.currentTarget) })}
              type="button"
            >
              <Image
                key={previewImage.id}
                src={previewImage.localOptimized.md}
                alt={imageAlt(previewImage)}
                width={previewImage.width}
                height={previewImage.height}
                sizes="(max-width: 900px) 94vw, 68vw"
                priority={activePreviewIndex < 2}
                unoptimized
                {...blurImageProps(previewImage)}
              />
              <span className="archive-focus-image__shade" />
            </button>
            <div className="archive-focus-caption">
              <span>DF-{String(activePreviewIndex + 1).padStart(3, "0")}</span>
              <strong>{previewLane?.label ?? previewImage.category}</strong>
              <em>{previewImage.projectTitle}</em>
            </div>
          </div>
          <div className="archive-focus-rail" aria-label="Focus gallery">
            {focusRailEntries.map(({ image, index }) => {
              const lane = galleryLaneDefinitions.find((definition) => definition.key === laneKeyForImage(image));
              const isSelected = index === selectedFocusIndex;
              const isPreviewing = index === activePreviewIndex;
              return (
                <button
                  aria-current={isSelected ? "true" : undefined}
                  aria-label={`Focus ${lane?.label ?? image.category} image ${index + 1}`}
                  className={cn("archive-focus-thumb", isSelected && "is-selected", isPreviewing && "is-previewing")}
                  key={image.id}
                  onBlur={() => setPreviewIndex(null)}
                  onClick={() => {
                    setFocusIndex(index);
                    setPreviewIndex(index);
                    setPointerMap(null);
                  }}
                  onFocus={() => setPreviewIndex(index)}
                  onPointerEnter={() => setPreviewIndex(index)}
                  onPointerLeave={() => setPreviewIndex(null)}
                  style={{ "--lane-accent": lane?.accent ?? "#35e0bb" } as CSSProperties}
                  type="button"
                >
                  <Image
                    src={image.localOptimized.sm}
                    alt=""
                    width={image.width}
                    height={image.height}
                    sizes="(max-width: 900px) 34vw, 120px"
                    unoptimized
                    {...blurImageProps(image)}
                  />
                  <span>
                    <strong>{lane?.label ?? image.category}</strong>
                    <em>DF-{String(index + 1).padStart(3, "0")}</em>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className={cn("archive-grid", `archive-${mode}`, `archive-density-${density}`)} key={`${filter}-${mode}-${density}`}>
            {filtered.slice(0, visibleCount).map((image, index) => (
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
          {remainingCount > 0 ? (
            <div className="archive-load-more">
              <div ref={loadMoreRef} className="archive-load-more__sentinel" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setVisibleCount((count) => Math.min(count + GRID_CHUNK, filtered.length))}
              >
                Show more ({remainingCount} remaining)
              </button>
            </div>
          ) : null}
        </>
      )}

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
