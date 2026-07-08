"use client";

import { useEffect } from "react";

/**
 * One controller for the whole About page (mirrors StudioSignalController's
 * frame-locked rAF idiom). It drives every native motion effect through CSS
 * custom properties written on refs/DOM only — no per-frame React state, so it
 * stays clean under the strict react-compiler lint.
 *
 * Reveals (one-shot):
 *  - IntersectionObserver adds a persistent `.is-in-view` to `[data-reveal]`
 *    (whole-element rise) and `[data-reveal-group]` (child-staggered) the first
 *    time each enters, then unobserves it.
 *
 * Scrubbed vars (scroll-linked, the mechanism behind the inspiration demos):
 *  - `--about-scroll` on :root (parallax depth planes)
 *  - `--focus` 0→1 and signed `--parallax` -1→1 on each `[data-focus]`
 *  - `--read` 0→1 sweeping a reading pace across each `[data-read]` (inherits
 *    into sticky descendants)
 *  - `--pin` 0→1 across each `[data-pin]` sticky track
 *  - `--about-veln` (-1..1) / `--about-velna` (0..1) eased scroll velocity on
 *    :root, for the kinetic philosophy line
 *
 * A single rAF `writeVars()` computes all of the above. A scroll listener
 * schedules it (frame-guarded); while any `[data-kinetic]` element is on screen
 * a continuous loop keeps it running so velocity settles to rest, then parks.
 *
 * Reduced motion: reveal everything immediately and skip both loops; every var
 * stays unset so the CSS fallbacks (var(--read,1), var(--focus,0), var(--pin,1),
 * var(--about-veln,0)) resolve to the finished/static state.
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
    const readEls = Array.from(document.querySelectorAll<HTMLElement>("[data-read]"));
    const pinEls = Array.from(document.querySelectorAll<HTMLElement>("[data-pin]"));
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const clampS = (value: number) => Math.min(1, Math.max(-1, value));

    // Cache pin track heights (measured on resize, never per frame).
    const pinHeights = new WeakMap<HTMLElement, number>();
    const measure = () => pinEls.forEach((el) => pinHeights.set(el, el.offsetHeight));
    measure();
    pinEls.forEach((el) => el.classList.add("is-pinned"));

    let smoothed = window.scrollY;
    let previous = smoothed;
    let scrollFrame = 0;
    let loopFrame = 0;
    let looping = false;

    const writeVars = () => {
      const viewportHeight = window.innerHeight || 1;
      root.style.setProperty("--about-scroll", String(Math.round(window.scrollY)));

      focusEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const focus = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height));
        const parallax = clampS((viewportHeight / 2 - (rect.top + rect.height / 2)) / viewportHeight);
        el.style.setProperty("--focus", focus.toFixed(3));
        el.style.setProperty("--parallax", parallax.toFixed(3));
      });

      readEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const read = clamp((viewportHeight * 0.9 - rect.top) / (rect.height + viewportHeight * 0.4));
        el.style.setProperty("--read", read.toFixed(4));
      });

      pinEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const height = pinHeights.get(el) ?? el.offsetHeight;
        const pin = clamp(-rect.top / Math.max(1, height - viewportHeight));
        el.style.setProperty("--pin", pin.toFixed(4));
      });

      smoothed += (window.scrollY - smoothed) * 0.12;
      const capped = Math.max(-90, Math.min(90, smoothed - previous));
      previous = smoothed;
      root.style.setProperty("--about-veln", (capped / 90).toFixed(3));
      root.style.setProperty("--about-velna", Math.abs(capped / 90).toFixed(3));
    };

    const onScrollTick = () => {
      scrollFrame = 0;
      writeVars();
    };
    const onScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(onScrollTick);
    };

    const loopTick = () => {
      writeVars();
      if (looping) loopFrame = window.requestAnimationFrame(loopTick);
    };
    const startLoop = () => {
      if (looping) return;
      looping = true;
      smoothed = window.scrollY;
      previous = smoothed;
      loopFrame = window.requestAnimationFrame(loopTick);
    };
    const stopLoop = () => {
      looping = false;
      if (loopFrame) window.cancelAnimationFrame(loopFrame);
      loopFrame = 0;
      root.style.setProperty("--about-veln", "0");
      root.style.setProperty("--about-velna", "0");
    };

    // Continuous loop only while a kinetic element is on screen (so velocity
    // eases to rest after scrolling stops), otherwise the loop parks.
    const kineticObserver = new IntersectionObserver(
      (entries) => {
        const anyVisible = entries.some((entry) => entry.isIntersecting);
        if (anyVisible) startLoop();
        else stopLoop();
      },
      { threshold: 0 },
    );
    document.querySelectorAll<HTMLElement>("[data-kinetic]").forEach((el) => kineticObserver.observe(el));

    const onResize = () => {
      measure();
      onScroll();
    };

    writeVars();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      kineticObserver.disconnect();
      stopLoop();
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      root.style.removeProperty("--about-scroll");
      root.style.removeProperty("--about-veln");
      root.style.removeProperty("--about-velna");
      focusEls.forEach((el) => {
        el.style.removeProperty("--focus");
        el.style.removeProperty("--parallax");
      });
      readEls.forEach((el) => el.style.removeProperty("--read"));
      pinEls.forEach((el) => {
        el.style.removeProperty("--pin");
        el.classList.remove("is-pinned");
      });
    };
  }, []);

  return null;
}
