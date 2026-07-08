"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { cn } from "@/lib/cn";
import { blurImageProps, imageAlt } from "@/lib/images";
import { laneStrips } from "@/lib/portfolio-selection";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { PortfolioLightbox } from "./PortfolioLightbox";
import { useFilteredImages } from "./PortfolioModeProvider";
import { usePortfolioMode } from "./portfolioMode";

type LightboxState = { images: DorvellImage[]; index: number; origin?: { x: number; y: number; width: number; height: number } };

/**
 * Story mode — editorial horizontal strips, one per populated lane. Each rail
 * drifts horizontally as the section scrolls through the viewport (varied rate +
 * alternating direction) revealing the overflow content. Motion is a single
 * rAF-throttled scroll driver writing transforms; disabled under reduced motion,
 * where the rails become plain horizontal scroll regions.
 */
export function HorizontalStoryStrips() {
  const images = useFilteredImages();
  const { setMode } = usePortfolioMode();
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const strips = useMemo(() => laneStrips(images, 16), [images]);

  useEffect(() => {
    if (reducedMotion) return;
    const root = rootRef.current;
    if (!root) return;
    const rails = Array.from(root.querySelectorAll<HTMLElement>(".pf-strip__rail"));
    if (rails.length === 0) return;

    let frame = 0;
    let visible = false;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const rail of rails) {
        const strip = rail.closest<HTMLElement>(".pf-strip");
        if (!strip) continue;
        const rect = strip.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) continue;
        // progress 0 (entering bottom) → 1 (leaving top)
        const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
        const overflow = Math.max(0, rail.scrollWidth - rail.clientWidth);
        const dir = strip.dataset.dir === "1" ? -1 : 1;
        const travel = overflow * 0.55;
        const shift = dir === 1 ? -progress * travel : -(1 - progress) * travel;
        rail.style.transform = `translate3d(${shift.toFixed(1)}px, 0, 0)`;
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) {
          window.addEventListener("scroll", onScroll, { passive: true });
          onScroll();
        } else {
          window.removeEventListener("scroll", onScroll);
        }
      },
      { rootMargin: "100px 0px" },
    );
    observer.observe(root);
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reducedMotion, strips]);

  if (strips.length === 0) return null;

  return (
    <div className={cn("pf-strips", reducedMotion && "pf-strips--calm")} ref={rootRef}>
      {strips.map((strip, index) => (
        <article
          key={strip.key}
          className="pf-strip"
          data-dir={index % 2 === 0 ? "0" : "1"}
          style={{ "--lane-accent": strip.accent } as CSSProperties}
          aria-labelledby={`pf-strip-${strip.key}`}
        >
          <div className="pf-strip__label">
            <p className="pf-eyebrow">{strip.eyebrow}</p>
            <h3 id={`pf-strip-${strip.key}`}>{strip.label}</h3>
            <p className="pf-strip__desc">{strip.description}</p>
            <button type="button" className="pf-section__link" onClick={() => setMode("archive")}>
              See the full {strip.label} set →
            </button>
          </div>
          <div className="pf-strip__viewport">
            <div className="pf-strip__rail">
              {strip.images.map((image, imageIndex) => (
                <button
                  key={image.id}
                  type="button"
                  className="pf-strip__frame pf-frame pf-frame--cover"
                  aria-label={`Open ${strip.label} frame ${imageIndex + 1}: ${imageAlt(image)}`}
                  style={{ aspectRatio: `${image.width} / ${image.height}` } as CSSProperties}
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setLightbox({
                      images: strip.images,
                      index: imageIndex,
                      origin: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                    });
                  }}
                >
                  <Image
                    src={image.localOptimized.md}
                    alt={imageAlt(image)}
                    width={image.width}
                    height={image.height}
                    sizes="(max-width: 760px) 60vw, 26vw"
                    loading="lazy"
                    unoptimized
                    {...blurImageProps(image)}
                  />
                </button>
              ))}
            </div>
          </div>
        </article>
      ))}

      {lightbox !== null ? (
        <PortfolioLightbox
          images={lightbox.images}
          index={lightbox.index}
          origin={lightbox.origin}
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox((current) => (current ? { ...current, index } : null))}
        />
      ) : null}
    </div>
  );
}
