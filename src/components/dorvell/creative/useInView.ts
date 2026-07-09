"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight IntersectionObserver hook. Returns a ref to attach and whether
 * the element is currently in view. Primitive options so effect deps stay
 * stable (no re-subscribe churn). Falls back to "in view" where IO is absent.
 */
export function useInView<T extends Element>({
  rootMargin = "0px",
  threshold = 0,
  once = false,
}: { rootMargin?: string; threshold?: number; once?: boolean } = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // no IO (very old/SSR) — reveal on next frame, not synchronously in-effect
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }
    let released = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once && !released) {
          released = true;
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, inView };
}
