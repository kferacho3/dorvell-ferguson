"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { cn } from "@/lib/cn";
import { blurImageProps, imageAlt } from "@/lib/images";
import { extractPalette, fallbackPalette, type Palette } from "@/lib/color-extract";
import { getCategoryDef, imageCategories, isVideo } from "@/lib/portfolio-taxonomy";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { PortfolioLightbox } from "./PortfolioLightbox";

type Props = { images: DorvellImage[] };
type LightboxOrigin = { x: number; y: number; width: number; height: number };

const FRICTION = 0.92;
const WHEEL_SENS = 0.6;
const MAX_ROTATION = 34;
const MAX_DEPTH = 150;
const MIN_SCALE = 0.82;
const SCALE_RANGE = 0.18;
const GAP = 34;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Signature featured carousel — CSS-3D cards drifting on a black stage with a
 * Canvas-2D reactive gradient that blooms with the active image's dominant
 * colours. Physics: single-velocity inertia with drag + horizontal wheel + keys.
 * Cards are positioned imperatively in a rAF loop (no per-frame React renders);
 * only the active index is lifted to state for the readout + accent. Paused when
 * offscreen / hidden. Falls back to a static scroll strip under reduced motion.
 */
export function FeaturedGradientCarousel({ images }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const paletteRef = useRef<Map<string, Palette>>(new Map());
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<{ index: number; origin?: LightboxOrigin } | null>(null);

  const featured = useMemo(() => images.slice(0, 12), [images]);
  const activeImage = featured[active] ?? featured[0];
  const activeDef = activeImage ? getCategoryDef(imageCategories(activeImage)[0]) : getCategoryDef("Portraits");

  // Preload dominant-colour palettes for the reactive gradient.
  useEffect(() => {
    let cancelled = false;
    for (const image of featured) {
      const def = getCategoryDef(imageCategories(image)[0]);
      extractPalette(image.localOptimized.sm, def.accent).then((palette) => {
        if (!cancelled) paletteRef.current.set(image.id, palette);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [featured]);

  // The physics + rAF engine (skipped entirely under reduced motion).
  useEffect(() => {
    if (reducedMotion) return;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || featured.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cards = cardRefs.current.filter((node): node is HTMLElement => node !== null);
    if (cards.length === 0) return;

    let scrollX = 0;
    let velocity = 0;
    let running = false;
    let rafId = 0;
    let lastTime = 0;
    let lastActive = -1;
    let dragging = false;
    let dragLastX = 0;
    let dragVel = 0;

    let stageWidth = stage.clientWidth;
    let cardWidth = cards[0].offsetWidth || 320;
    let step = cardWidth + GAP;
    let track = step * cards.length;

    let dpr = Math.min(2, window.devicePixelRatio || 1);
    const grad = { r1: 20, g1: 60, b1: 55, r2: 40, g2: 80, b2: 70 };
    let target = { ...grad };

    const measure = () => {
      stageWidth = stage.clientWidth;
      cardWidth = cards[0].offsetWidth || 320;
      step = cardWidth + GAP;
      track = step * cards.length;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(stage.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(stage.clientHeight * dpr));
    };

    const setTargetFromActive = (index: number) => {
      const image = featured[index];
      const def = getCategoryDef(imageCategories(image)[0]);
      const palette = paletteRef.current.get(image.id) ?? fallbackPalette(def.accent);
      target = {
        r1: palette.primary[0],
        g1: palette.primary[1],
        b1: palette.primary[2],
        r2: palette.secondary[0],
        g2: palette.secondary[1],
        b2: palette.secondary[2],
      };
    };

    const positionCards = () => {
      const half = track / 2;
      const center = stageWidth / 2;
      let bestIndex = 0;
      let bestDist = Infinity;
      for (let i = 0; i < cards.length; i += 1) {
        let pos = (((i * step - scrollX) % track) + track) % track;
        if (pos > half) pos -= track;
        const norm = Math.max(-1, Math.min(1, pos / (stageWidth / 2 || 1)));
        const invNorm = 1 - Math.abs(norm);
        const ry = -norm * MAX_ROTATION;
        const tz = invNorm * MAX_DEPTH;
        const scale = MIN_SCALE + invNorm * SCALE_RANGE;
        const dist = Math.abs(pos);
        const node = cards[i];
        node.style.transform = `translate3d(calc(-50% + ${pos.toFixed(1)}px), -50%, ${tz.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        node.style.zIndex = String(1000 + Math.round(tz));
        node.style.opacity = dist > center + cardWidth ? "0" : "1";
        const blur = dist < cardWidth * 0.6 ? 0 : Math.min(6, 2 * Math.pow(Math.abs(norm), 1.1) * 3);
        node.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      }
      if (bestIndex !== lastActive) {
        lastActive = bestIndex;
        setActive(bestIndex);
        setTargetFromActive(bestIndex);
      }
    };

    const drawBackground = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;
      grad.r1 = lerp(grad.r1, target.r1, 0.06);
      grad.g1 = lerp(grad.g1, target.g1, 0.06);
      grad.b1 = lerp(grad.b1, target.b1, 0.06);
      grad.r2 = lerp(grad.r2, target.r2, 0.06);
      grad.g2 = lerp(grad.g2, target.g2, 0.06);
      grad.b2 = lerp(grad.b2, target.b2, 0.06);

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#040504";
      ctx.fillRect(0, 0, w, h);

      const t = time * 0.00018;
      const big = Math.max(w, h);
      ctx.globalCompositeOperation = "lighter";

      const cx1 = w * 0.5 + Math.cos(t) * w * 0.22;
      const cy1 = h * 0.46 + Math.sin(t * 0.8) * h * 0.2;
      const g1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, big * 0.62);
      g1.addColorStop(0, `rgba(${grad.r1 | 0}, ${grad.g1 | 0}, ${grad.b1 | 0}, 0.62)`);
      g1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const cx2 = w * 0.5 + Math.cos(t * 1.3 + 2) * w * 0.26;
      const cy2 = h * 0.54 + Math.sin(t) * h * 0.22;
      const g2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, big * 0.5);
      g2.addColorStop(0, `rgba(${grad.r2 | 0}, ${grad.g2 | 0}, ${grad.b2 | 0}, 0.5)`);
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    };

    const tick = (time: number) => {
      if (!running) return;
      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 1 / 60;
      lastTime = time;
      if (!dragging) {
        scrollX += velocity * dt * 60;
        velocity *= Math.pow(FRICTION, dt * 60);
        if (Math.abs(velocity) < 0.02) velocity = 0;
      }
      positionCards();
      drawBackground(time);
      rafId = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTime = 0;
      rafId = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
    };

    // Input — pointer drag
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      dragLastX = event.clientX;
      dragVel = 0;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add("is-grabbing");
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - dragLastX;
      dragLastX = event.clientX;
      dragVel = dx;
      scrollX -= dx;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      velocity = -dragVel;
      try {
        stage.releasePointerCapture(event.pointerId);
      } catch {
        /* pointer already released */
      }
      stage.classList.remove("is-grabbing");
    };
    // Input — horizontal wheel only (never hijacks vertical page scroll)
    const onWheel = (event: WheelEvent) => {
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (!horizontal) return;
      event.preventDefault();
      velocity += event.deltaX * WHEEL_SENS * 0.4;
    };
    // Input — keyboard when the stage is focused
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        velocity += step * 0.12;
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        velocity -= step * 0.12;
      }
    };

    measure();
    setTargetFromActive(0);
    grad.r1 = target.r1;
    grad.g1 = target.g1;
    grad.b1 = target.b1;
    grad.r2 = target.r2;
    grad.g2 = target.g2;
    grad.b2 = target.b2;

    const resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(stage);
    const intersection = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) start();
        else stop();
      },
      { threshold: 0.05 },
    );
    intersection.observe(stage);
    const onVisibility = () => {
      if (document.hidden) {
        stop();
        return;
      }
      const rect = stage.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) start();
    };

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerUp);
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointercancel", onPointerUp);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion, featured]);

  if (featured.length === 0) return null;

  return (
    <section
      className={cn("pf-carousel", reducedMotion && "pf-carousel--calm")}
      aria-labelledby="pf-carousel-title"
      style={{ "--lane-accent": activeDef.accent } as CSSProperties}
    >
      <canvas ref={canvasRef} className="pf-carousel__bg" aria-hidden="true" />
      <div className="pf-grain-layer" />

      <div className="pf-container pf-carousel__head">
        <div>
          <p className="pf-eyebrow">Signature Work</p>
          <h2 id="pf-carousel-title">Featured rotation.</h2>
        </div>
        <p>Drag, scroll, or arrow through a curated spread — the light behind each frame is pulled from the photograph itself.</p>
      </div>

      <div
        className="pf-carousel__stage"
        ref={stageRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Featured photographs"
        tabIndex={0}
      >
        <div className="pf-carousel__track" ref={trackRef}>
          {featured.map((image, index) => {
            const def = getCategoryDef(imageCategories(image)[0]);
            return (
              <article
                key={image.id}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                className="pf-carousel__card"
                style={{ "--lane-accent": def.accent } as CSSProperties}
              >
                <button
                  type="button"
                  // Off-center cards are opacity:0 in the rAF loop; keep them out of
                  // the tab order (keyboard uses the stage arrows + "Open project").
                  tabIndex={-1}
                  className="pf-carousel__card-btn pf-frame pf-frame--cover"
                  aria-label={`Open ${def.label}: ${imageAlt(image)}`}
                  onClick={(event) =>
                    setLightbox({
                      index,
                      origin: (() => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
                      })(),
                    })
                  }
                >
                  <Image
                    src={image.localOptimized.md}
                    alt={imageAlt(image)}
                    width={image.width}
                    height={image.height}
                    sizes="(max-width: 760px) 78vw, 32vw"
                    loading={index < 3 ? "eager" : "lazy"}
                    unoptimized
                    {...blurImageProps(image)}
                  />
                  <span className="pf-carousel__badge">
                    {isVideo(image) ? <span className="pf-badge-video">Video</span> : null}
                    {def.label}
                  </span>
                </button>
              </article>
            );
          })}
        </div>
      </div>

      <div className="pf-container pf-carousel__foot">
        <div className="pf-carousel__readout" aria-live="polite">
          <strong>{activeImage?.projectTitle ?? activeDef.label}</strong>
          <span>
            {activeDef.label} · {String(active + 1).padStart(2, "0")} / {String(featured.length).padStart(2, "0")}
          </span>
        </div>
        <button
          type="button"
          className="button-secondary"
          onClick={() => activeImage && setLightbox({ index: active })}
        >
          Open project
        </button>
      </div>

      {lightbox !== null ? (
        <PortfolioLightbox
          images={featured}
          index={lightbox.index}
          origin={lightbox.origin}
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox((current) => (current ? { ...current, index } : { index }))}
        />
      ) : null}
    </section>
  );
}
