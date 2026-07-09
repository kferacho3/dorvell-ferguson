"use client";

import { useEffect, useState } from "react";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Count from 0 → `target` over `durationMs` (easeOutCubic), starting after
 * `delayMs`. When `active` is false the animation waits; when `reducedMotion`
 * is true it jumps straight to the target. Returns the current rounded value.
 */
export function useCountUp(
  target: number,
  { durationMs = 2000, delayMs = 0, active = true, reducedMotion = false }: {
    durationMs?: number;
    delayMs?: number;
    active?: boolean;
    reducedMotion?: boolean;
  } = {},
): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (reducedMotion) {
      // Defer out of the synchronous effect body (react-compiler friendly).
      const jump = window.requestAnimationFrame(() => setValue(target));
      return () => window.cancelAnimationFrame(jump);
    }

    let raf = 0;
    let start = 0;
    const startTimeout = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now;
        const progress = Math.min((now - start) / durationMs, 1);
        setValue(Math.round(easeOutCubic(progress) * target));
        if (progress < 1) raf = window.requestAnimationFrame(tick);
      };
      raf = window.requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(startTimeout);
      window.cancelAnimationFrame(raf);
    };
  }, [target, durationMs, delayMs, active, reducedMotion]);

  return value;
}

/**
 * Type `text` character-by-character at `speedMs`/char after `startDelayMs`.
 * When `active` is false it waits at empty; `reducedMotion` reveals the full
 * string instantly. Returns the typed substring plus a `done` flag.
 */
export function useTypewriter(
  text: string,
  { speedMs = 35, startDelayMs = 400, active = true, reducedMotion = false }: {
    speedMs?: number;
    startDelayMs?: number;
    active?: boolean;
    reducedMotion?: boolean;
  } = {},
): { typed: string; done: boolean } {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Every setState below runs inside a scheduled callback, never synchronously
    // in the effect body, to stay react-compiler friendly.
    if (!active) {
      const id = window.requestAnimationFrame(() => setCount(0));
      return () => window.cancelAnimationFrame(id);
    }
    if (reducedMotion) {
      const id = window.requestAnimationFrame(() => setCount(text.length));
      return () => window.cancelAnimationFrame(id);
    }

    let timer: number | null = null;
    const start = window.requestAnimationFrame(() => {
      setCount(0);
      let index = 0;
      timer = window.setTimeout(function step() {
        index += 1;
        setCount(index);
        if (index < text.length) timer = window.setTimeout(step, speedMs);
      }, startDelayMs);
    });

    return () => {
      window.cancelAnimationFrame(start);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [text, speedMs, startDelayMs, active, reducedMotion]);

  return { typed: text.slice(0, count), done: count >= text.length };
}
