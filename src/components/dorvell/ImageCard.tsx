"use client";

import Image from "next/image";
import type { CSSProperties, PointerEvent } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";
import { galleryLaneDefinitions, laneKeyForImage } from "@/lib/gallery-lanes";

type LightboxOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PointerMap = {
  x: number;
  y: number;
};

export function ImageCard({
  image,
  index,
  mode,
  onOpen,
  onPreview,
  onPointerMap,
}: {
  image: DorvellImage;
  index: number;
  mode: string;
  onOpen: (origin: LightboxOrigin) => void;
  onPreview?: (index: number | null) => void;
  onPointerMap?: (point: PointerMap | null) => void;
}) {
  const laneKey = laneKeyForImage(image);
  const lane = galleryLaneDefinitions.find((definition) => definition.key === laneKey);
  const setPointerMapFromEvent = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.width > 0 ? Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) : 0.5;
    const y = rect.height > 0 ? Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) : 0.5;
    onPointerMap?.({ x, y });
  };

  return (
    <button
      className={`image-card lane-${laneKey} mode-${mode}`}
      style={{ "--lane-accent": lane?.accent ?? "#35e0bb", "--card-index": Math.min(index, 18) } as CSSProperties}
      type="button"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        onOpen({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      }}
      onBlur={() => {
        onPreview?.(null);
        onPointerMap?.(null);
      }}
      onFocus={() => {
        onPreview?.(index);
        onPointerMap?.({ x: 0.5, y: 0.5 });
      }}
      onPointerEnter={(event) => {
        onPreview?.(index);
        setPointerMapFromEvent(event);
      }}
      onPointerMove={(event) => {
        onPreview?.(index);
        setPointerMapFromEvent(event);
      }}
      onPointerLeave={() => {
        onPreview?.(null);
        onPointerMap?.(null);
      }}
      aria-label={`Open ${lane?.label ?? image.category} image ${index + 1}`}
    >
      <Image
        src={image.localOptimized.md}
        alt={imageAlt(image)}
        width={image.width}
        height={image.height}
        loading={index < 6 ? "eager" : "lazy"}
        sizes="(max-width: 760px) 88vw, (max-width: 1200px) 42vw, 28vw"
        unoptimized
        {...blurImageProps(image)}
      />
      <span className="contact-number">DF-{String(index + 1).padStart(3, "0")}</span>
      <span className="card-meta">
        <strong>{lane?.label ?? image.category}</strong>
        <em>{image.projectTitle}</em>
      </span>
    </button>
  );
}
