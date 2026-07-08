"use client";

import Image from "next/image";
import type { ModelingImage } from "@/components/modeling/modelingTypes";

/**
 * The Room without WebGL: a slow editorial column of large prints.
 * Serves reduced-motion visitors, small screens, and any browser where
 * the ribbon field can't run. Still composed, still dark, still premium.
 */

type ModelingFallbackGalleryProps = {
  images: ModelingImage[];
};

export function ModelingFallbackGallery({ images }: ModelingFallbackGalleryProps) {
  const frames = images.slice(0, 9);
  if (frames.length === 0) return null;

  return (
    <div className="modeling-fallback" aria-label="Modeling gallery">
      <ul className="modeling-fallback__column">
        {frames.map((image, index) => (
          <li
            key={image.id}
            className={`modeling-fallback__frame modeling-fallback__frame--${index % 3}`}
          >
            <figure>
              <Image
                src={image.src}
                alt={image.alt}
                width={Math.max(image.width, 1)}
                height={Math.max(image.height, 1)}
                sizes="(min-width: 1100px) 52vw, 88vw"
                unoptimized
                loading={index < 2 ? "eager" : "lazy"}
                {...(image.blur ? { placeholder: "blur" as const, blurDataURL: image.blur } : {})}
              />
              <figcaption aria-hidden="true">{String(index + 1).padStart(2, "0")}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
