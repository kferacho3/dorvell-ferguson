"use client";

import { useEffect } from "react";

/**
 * One controller for the whole About page (mirrors StudioSignalController's
 * frame-locked rAF idiom):
 *  - a single IntersectionObserver adds a persistent `.is-in-view` class to
 *    every `[data-reveal]` (whole-element rise) and `[data-reveal-group]`
 *    (child-staggered container — the container stays put, its children
 *    animate) the first time it enters, then unobserves it (reveals are
 *    one-shot; nothing toggles back off).
 *  - a shared, frame-guarded scroll loop writes CSS custom properties only —
 *    `--about-scroll` on the root for ghost-type parallax, and a per-element
 *    `--focus` (0→1 by viewport position) on each `[data-focus]` plate for the
 *    documentary focus-pull. No React state is set per frame, so it stays clean
 *    under the strict react-compiler lint.
 *
 * Reduced motion: reveal everything immediately and skip both the observer and
 * the rAF loop (the CSS reduced-motion block also neutralizes transforms).
 */
export function AboutRevealController() {
  useEffect(() => {
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-group]"));
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      revealEls.forEach((el) => el.classList.add("is-in-view"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    revealEls.forEach((el) => observer.observe(el));

    const root = document.documentElement;
    const focusEls = Array.from(document.querySelectorAll<HTMLElement>("[data-focus]"));
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    let frame = 0;

    const sync = () => {
      frame = 0;
      const viewportHeight = window.innerHeight || 1;
      root.style.setProperty("--about-scroll", String(Math.round(window.scrollY)));
      focusEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const progress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height));
        el.style.setProperty("--focus", progress.toFixed(3));
      });
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.style.removeProperty("--about-scroll");
      focusEls.forEach((el) => el.style.removeProperty("--focus"));
    };
  }, []);

  return null;
}
