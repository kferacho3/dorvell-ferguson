"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { useInView } from "./useInView";

type Particle = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; s: number };

/**
 * Section 10 — Particle text moment. The word forms from drifting "dust" on a
 * Canvas 2D field (progressive enhancement; no WebGPU dependency, no heavy
 * assets). A "Dissolve" button bursts and reforms it. Reduced motion or no
 * canvas → a static clip-reveal heading. The animation only runs while the
 * section is in view.
 */
export function CreativeParticleWord({ word = "WORLD" }: { word?: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const burstRef = useRef(0);
  // derived (not effect state): canvas enhancement only when motion is allowed
  const enhanced = !reducedMotion;

  useEffect(() => {
    if (reducedMotion || !inView) return;
    const canvas = canvasRef.current;
    const host = viewRef.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;

    const FONT_STACK = '"Big Shoulders Display", Impact, sans-serif';

    /**
     * Size the word to the box by measuring it, rather than guessing from a
     * character count. A guessed size overflows a condensed display face and
     * the glyphs get clipped by the canvas edge — which is exactly what the
     * old `width / (length * 0.62)` heuristic did.
     */
    const fitFont = (maxWidth: number, maxHeight: number) => {
      let size = Math.floor(maxHeight);
      let metrics = null as TextMetrics | null;
      for (let i = 0; i < 12; i += 1) {
        ctx.font = `900 ${size}px ${FONT_STACK}`;
        metrics = ctx.measureText(word);
        const glyphHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        if (!metrics.width || !glyphHeight) break;
        const scale = Math.min(maxWidth / metrics.width, maxHeight / glyphHeight);
        if (scale > 0.99 && scale <= 1.01) break;
        size = Math.max(12, Math.floor(size * scale));
      }
      ctx.font = `900 ${size}px ${FONT_STACK}`;
      return ctx.measureText(word);
    };

    const build = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(320, Math.floor(rect.width));
      height = Math.max(160, Math.floor(rect.height));
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // stamp the word, then sample its pixels into particle home positions
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      // alphabetic + the real ink box centres the glyphs optically; "middle"
      // uses the em box, which sits high on a display face.
      ctx.textBaseline = "alphabetic";
      const metrics = fitFont(width * 0.94, height * 0.84);
      const baselineY =
        height / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
      ctx.fillText(word, width / 2, baselineY);

      const image = ctx.getImageData(0, 0, width, height).data;
      const step = width > 640 ? 4 : 3;
      const particles: Particle[] = [];
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const alpha = image[(y * width + x) * 4 + 3];
          if (alpha > 130) {
            particles.push({
              hx: x,
              hy: y,
              x: width / 2 + (Math.random() - 0.5) * width,
              y: height / 2 + (Math.random() - 0.5) * height,
              vx: 0,
              vy: 0,
              s: step * 0.72,
            });
          }
        }
      }
      particlesRef.current = particles;
      ctx.clearRect(0, 0, width, height);
    };

    const frame = () => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, width, height);
      const particles = particlesRef.current;
      const burst = burstRef.current;
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        if (burst > 0) {
          // scatter outward, then let easing pull them home (dust reform)
          const angle = (i % 360) * 0.0174 + burst * 0.02;
          p.vx += Math.cos(angle) * 0.9;
          p.vy += Math.sin(angle) * 0.9;
        }
        // ease toward home + tiny organic drift
        p.vx += (p.hx - p.x) * 0.012;
        p.vy += (p.hy - p.y) * 0.012;
        p.vx *= 0.86;
        p.vy *= 0.86;
        p.x += p.vx;
        p.y += p.vy;
        const twinkle = 0.72 + 0.28 * Math.sin(i * 12.9 + burst);
        // literal gold (--df-gold) + ink (--df-text): a Canvas 2D context can't
        // resolve CSS custom properties, so these mirror the brand tokens by value.
        ctx.fillStyle = i % 6 === 0 ? `rgba(240,179,90,${twinkle})` : `rgba(248,241,231,${0.92 * twinkle})`;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      if (burstRef.current > 0) burstRef.current -= 1;
    };

    const start = () => {
      if (!running) return;
      build();
      frame();
    };

    // Measuring before the display face has loaded sizes the word against the
    // Impact fallback, which has different metrics — the result is a word that
    // no longer fits its box once the real font swaps in.
    if (document.fonts?.ready) {
      document.fonts.ready.then(start).catch(start);
    } else {
      start();
    }

    const onResize = () => {
      if (running) build();
    };
    window.addEventListener("resize", onResize);
    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [inView, reducedMotion, word, viewRef]);

  return (
    <section className="cw-section cw-particle" aria-label={`Creative word — ${word}`}>
      <div className="cw-container cw-particle__inner">
        <p className="cw-eyebrow">Not every frame belongs in a grid</p>
        <div ref={viewRef} className="cw-particle__stage">
          {/* Always-present accessible + no-JS fallback heading */}
          <h2 className={enhanced ? "cw-particle__word cw-particle__word--hidden" : "cw-particle__word"}>{word}</h2>
          {enhanced ? <canvas ref={canvasRef} className="cw-particle__canvas" aria-hidden="true" /> : null}
        </div>
        <p className="cw-lede">Some belong in a world.</p>
        {enhanced ? (
          <button
            type="button"
            className="cw-btn cw-btn--ghost"
            onClick={() => {
              burstRef.current = 24;
            }}
          >
            Dissolve &amp; reform
          </button>
        ) : null}
      </div>
    </section>
  );
}
