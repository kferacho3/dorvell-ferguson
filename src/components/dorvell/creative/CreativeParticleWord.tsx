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
      const fontSize = Math.min(width / (word.length * 0.62), height * 0.72);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${fontSize}px "Big Shoulders Display", Impact, sans-serif`;
      ctx.fillText(word, width / 2, height / 2);

      const image = ctx.getImageData(0, 0, width, height).data;
      const step = width > 640 ? 5 : 4;
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
              s: step * 0.5,
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
        const twinkle = 0.55 + 0.45 * Math.sin(i * 12.9 + burst);
        // literal gold (--df-gold) + ink (--df-text): a Canvas 2D context can't
        // resolve CSS custom properties, so these mirror the brand tokens by value.
        ctx.fillStyle = i % 7 === 0 ? `rgba(240,179,90,${twinkle})` : `rgba(248,241,231,${0.7 * twinkle})`;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      if (burstRef.current > 0) burstRef.current -= 1;
    };

    build();
    frame();
    const onResize = () => build();
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
