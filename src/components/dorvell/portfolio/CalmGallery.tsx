"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";
import { getCategoryDef, imageCategories, isVideo } from "@/lib/portfolio-taxonomy";
import { PortfolioLightbox } from "./PortfolioLightbox";

type LightboxOrigin = { x: number; y: number; width: number; height: number };

const BATCH = 42;

function originFromElement(element: Element): LightboxOrigin {
  const rect = element.getBoundingClientRect();
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

/**
 * Calm mode — a clean, low-motion masonry. Each tile's box is set to its image's
 * exact aspect ratio so `cover` fills without cropping. Keyboard-friendly, no
 * WebGL, no motion trails; opens the shared accessible lightbox.
 */
export function CalmGallery({ images }: { images: DorvellImage[] }) {
  const [visible, setVisible] = useState(BATCH);
  const [lightbox, setLightbox] = useState<{ index: number; origin?: LightboxOrigin } | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Derived reset when the filtered set changes (adjust-state-during-render pattern).
  const key = `${images.length}:${images[0]?.id ?? "none"}`;
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) {
    setPrevKey(key);
    setVisible(BATCH);
    setLightbox(null);
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visible >= images.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible((count) => Math.min(count + BATCH, images.length));
        }
      },
      { rootMargin: "700px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visible, images.length]);

  if (images.length === 0) {
    return <p className="pf-empty">No frames in this category yet.</p>;
  }

  const shown = images.slice(0, visible);
  const remaining = images.length - visible;

  return (
    <>
      <div className="pf-calm__grid">
        {shown.map((image, index) => {
          const def = getCategoryDef(imageCategories(image)[0]);
          return (
            <button
              key={image.id}
              type="button"
              className="pf-calm__item pf-frame pf-frame--cover"
              aria-label={`Open ${def.label} frame ${index + 1}: ${imageAlt(image)}`}
              style={
                {
                  "--lane-accent": def.accent,
                  aspectRatio: `${image.width} / ${image.height}`,
                } as CSSProperties
              }
              onClick={(event) => setLightbox({ index, origin: originFromElement(event.currentTarget) })}
            >
              <Image
                src={image.localOptimized.md}
                alt={imageAlt(image)}
                width={image.width}
                height={image.height}
                sizes="(max-width: 480px) 48vw, (max-width: 1100px) 32vw, 24vw"
                loading={index < 8 ? "eager" : "lazy"}
                unoptimized
                {...blurImageProps(image)}
              />
              <span className="pf-calm__tag">
                {isVideo(image) ? <span className="pf-badge-video">Video</span> : null}
                {def.label}
              </span>
            </button>
          );
        })}
      </div>

      {remaining > 0 ? (
        <div className="pf-calm__more">
          <div ref={sentinelRef} aria-hidden="true" className="pf-calm__sentinel" />
          <button type="button" onClick={() => setVisible((count) => Math.min(count + BATCH, images.length))}>
            Show more ({remaining} remaining)
          </button>
        </div>
      ) : null}

      {lightbox !== null ? (
        <PortfolioLightbox
          images={images}
          index={lightbox.index}
          origin={lightbox.origin}
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox((current) => (current ? { ...current, index } : { index }))}
        />
      ) : null}
    </>
  );
}
