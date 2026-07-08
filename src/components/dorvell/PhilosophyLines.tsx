"use client";

import { useEffect } from "react";

/**
 * Velocity-reactive stretch for the ONE kinetic philosophy line (OnScroll
 * Letter-animations demo, amplitude capped hard). A null-rendering controller
 * (like AboutRevealController): it finds `.about-philosophy__line--kinetic`,
 * and while that line is on screen runs a small rAF that eases scroll position
 * and maps its velocity to a top-anchored scaleY between 1.0 and 1.2 — written
 * straight to element.style, never React state. Reduced motion early-returns
 * and the line stays static.
 */
export function PhilosophyLines() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const line = document.querySelector<HTMLElement>(".about-philosophy__line--kinetic");
    if (!line) return;

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    let raf = 0;
    let running = false;
    let smoothed = window.scrollY;
    let previous = smoothed;

    const tick = () => {
      smoothed += (window.scrollY - smoothed) * 0.1;
      const velocity = smoothed - previous;
      previous = smoothed;
      const scaleY = clamp(1 + Math.abs(velocity) / 200, 1, 1.2);
      line.style.transform = `scaleY(${scaleY.toFixed(3)})`;
      if (running) raf = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      smoothed = window.scrollY;
      previous = smoothed;
      raf = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      line.style.transform = "scaleY(1)";
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
      },
      { threshold: 0 },
    );
    observer.observe(line);

    return () => {
      observer.disconnect();
      stop();
      line.style.removeProperty("transform");
    };
  }, []);

  return null;
}
