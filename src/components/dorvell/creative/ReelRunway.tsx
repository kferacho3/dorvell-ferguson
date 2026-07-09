"use client";

import { useEffect, useRef, useState } from "react";
import { getCreativeItem, type CreativeItem } from "@/content/creative";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { VideoPlayer } from "./VideoPlayer";
import { useCreativeLightbox } from "./CreativeLightbox";
import { useCreativeMode } from "./creativeMode";
import { ExpandIcon } from "./icons";

const PANELS: { word: string; slug: string }[] = [
  { word: "Shadow", slug: "the-threshold" },
  { word: "Motion", slug: "modeling-4" },
  { word: "Pressure", slug: "misc-creative-6" },
  { word: "Style", slug: "misc-creative-4" },
  { word: "Light", slug: "fireworks" },
];

/**
 * Section 6 — Infinite parallax "Reel Runway". Full-bleed panels in normal page
 * flow (no scroll hijack, no global snap). Big wordmarks parallax across each
 * panel; exactly one clip (nearest viewport center) autoplays muted. Calm /
 * reduced motion → static, poster-first with visible play controls.
 */
export function ReelRunway() {
  const { mode } = useCreativeMode();
  const reducedMotion = usePrefersReducedMotion();
  const { open } = useCreativeLightbox();
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [activePanel, setActivePanel] = useState(0);

  const enable = mode === "cinematic" && !reducedMotion;
  const panels = PANELS.map((p) => ({ ...p, item: getCreativeItem(p.slug) })).filter(
    (p): p is { word: string; slug: string; item: CreativeItem } => Boolean(p.item),
  );

  useEffect(() => {
    if (!enable) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const viewportCenter = window.innerHeight / 2;
      let best = 0;
      let bestDistance = Infinity;
      panelRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - viewportCenter);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
        const progress = (center - viewportCenter) / window.innerHeight;
        const word = wordRefs.current[index];
        if (word) word.style.transform = `translate3d(${progress * -28}%, 0, 0)`;
      });
      setActivePanel((prev) => (prev === best ? prev : best));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enable]);

  return (
    <section className="cw-reel" aria-label="Reel runway">
      {panels.map((panel, index) => (
        <div
          key={panel.slug}
          ref={(el) => {
            panelRefs.current[index] = el;
          }}
          className="cw-reel__panel"
        >
          <div className="cw-reel__media">
            <VideoPlayer
              item={panel.item}
              mode="ambient"
              active={enable && index === activePanel}
              loop
              controls={false}
              framed={false}
            />
            <div className="cw-reel__scrim" aria-hidden="true" />
          </div>

          <span
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className="cw-reel__word"
            aria-hidden="true"
          >
            {panel.word}
          </span>

          <div className="cw-reel__cap">
            <div>
              <p className="cw-reel__cap-title">{panel.item.title}</p>
              <p className="cw-reel__cap-meta">{panel.item.category}</p>
            </div>
            <button
              type="button"
              className="cw-btn cw-btn--ghost cw-reel__open"
              onClick={() => open(panel.item, panels.map((p) => p.item))}
              aria-label={`Open ${panel.item.title}`}
            >
              Open <ExpandIcon />
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
