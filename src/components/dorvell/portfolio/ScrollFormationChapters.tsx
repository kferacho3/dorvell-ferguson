"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";
import { portfolioChapters } from "@/lib/portfolio-selection";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { PortfolioLightbox } from "./PortfolioLightbox";
import { useFilteredImages } from "./PortfolioModeProvider";
import { usePortfolioMode } from "./portfolioMode";

type LightboxState = { images: DorvellImage[]; index: number };

/** Split a heading into per-character spans; the h2 keeps an aria-label. */
function SplitTitle({ text }: { text: string }) {
  const chars = useMemo(() => Array.from(text), [text]);
  return (
    <span className="pf-split" aria-hidden="true">
      {chars.map((char, index) => (
        <span key={`${char}-${index}`} style={{ "--i": index } as CSSProperties}>
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  );
}

/**
 * Category chapters that assemble from a scattered/depth state into a clean grid
 * as they scroll into view. Each tile carries a deterministic scatter offset in
 * CSS vars; a single per-grid `--p` progress var (updated by one rAF-throttled
 * scroll driver) interpolates every tile in CSS — no per-tile JS. Split-text
 * headline reveals on entry. Fully assembled + static under reduced motion.
 */
export function ScrollFormationChapters() {
  const images = useFilteredImages();
  const { setMode } = usePortfolioMode();
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const chapters = useMemo(() => portfolioChapters(images, 12), [images]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const grids = Array.from(root.querySelectorAll<HTMLElement>(".pf-chapter__grid"));

    // Reveal split-text + mark chapters in-view.
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        }
      },
      { rootMargin: "-12% 0px -12% 0px" },
    );
    root.querySelectorAll(".pf-chapter").forEach((chapter) => reveal.observe(chapter));

    if (reducedMotion) {
      for (const grid of grids) grid.style.setProperty("--p", "1");
      return () => reveal.disconnect();
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const grid of grids) {
        const rect = grid.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) continue;
        const p = Math.max(0, Math.min(1, (0.9 * vh - rect.top) / (0.55 * vh)));
        grid.style.setProperty("--p", p.toFixed(3));
      }
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      reveal.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reducedMotion, chapters]);

  if (chapters.length === 0) return null;

  return (
    <div className="pf-chapters" ref={rootRef}>
      {chapters.map((chapter, chapterIndex) => (
        <section
          key={chapter.lane.key}
          className="pf-chapter"
          style={{ "--lane-accent": chapter.lane.accent } as CSSProperties}
          aria-labelledby={`pf-chapter-${chapter.lane.key}`}
        >
          <header className="pf-chapter__head">
            <p className="pf-eyebrow">{chapter.lane.eyebrow}</p>
            <h2 id={`pf-chapter-${chapter.lane.key}`} className="pf-chapter__title" aria-label={chapter.lane.label}>
              <SplitTitle text={chapter.lane.label} />
            </h2>
            <p className="pf-chapter__desc">{chapter.lane.description}</p>
            <button type="button" className="pf-section__link" onClick={() => setMode("archive")}>
              View all {chapter.lane.label} →
            </button>
          </header>

          <div className="pf-chapter__grid">
            {chapter.images.map((image, index) => {
              const sx = (((index * 37) % 13) - 6) * 16;
              const sy = (((index * 53) % 11) - 5) * 22 + (chapterIndex % 2 === 0 ? 40 : -40);
              const sr = (((index * 29) % 9) - 4) * 2.4;
              return (
                <button
                  key={image.id}
                  type="button"
                  className="pf-chapter__tile pf-frame pf-frame--cover"
                  aria-label={`Open ${chapter.lane.label} frame ${index + 1}: ${imageAlt(image)}`}
                  style={
                    {
                      "--sx": `${sx}px`,
                      "--sy": `${sy}px`,
                      "--sr": `${sr}deg`,
                    } as CSSProperties
                  }
                  onClick={() => setLightbox({ images: chapter.images, index })}
                >
                  <Image
                    src={image.localOptimized.sm}
                    alt={imageAlt(image)}
                    width={image.width}
                    height={image.height}
                    sizes="(max-width: 760px) 46vw, 22vw"
                    loading="lazy"
                    unoptimized
                    {...blurImageProps(image)}
                  />
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {lightbox !== null ? (
        <PortfolioLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox((current) => (current ? { ...current, index } : null))}
        />
      ) : null}
    </div>
  );
}
