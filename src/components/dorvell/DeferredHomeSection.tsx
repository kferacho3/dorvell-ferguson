"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function DeferredHomeSection({
  children,
  minHeight = 900,
  rootMargin = "520px 0px",
}: {
  children: ReactNode;
  minHeight?: number;
  rootMargin?: string;
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const markerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldRender) return;
    const marker = markerRef.current;
    if (!marker) return;

    const compactViewport = window.matchMedia("(max-width: 760px)").matches;
    const effectiveRootMargin = compactViewport ? "420px 0px" : rootMargin;
    const rootMarginPixels = Number.parseFloat(effectiveRootMargin) || 0;
    let isActive = true;

    const renderNow = () => {
      if (!isActive) return true;
      const rect = marker.getBoundingClientRect();
      if (rect.top > window.innerHeight + rootMarginPixels) return false;
      setShouldRender(true);
      return true;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin: effectiveRootMargin },
    );

    observer.observe(marker);
    if (renderNow()) {
      observer.disconnect();
      return () => {
        isActive = false;
      };
    }

    const onScroll = () => {
      if (!renderNow()) return;
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const desktopFallback = compactViewport
      ? undefined
      : window.setTimeout(() => {
          setShouldRender(true);
          observer.disconnect();
        }, 1800);

    return () => {
      isActive = false;
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (desktopFallback) window.clearTimeout(desktopFallback);
    };
  }, [rootMargin, shouldRender]);

  return (
    <div
      ref={markerRef}
      className="deferred-home-section"
      style={shouldRender ? undefined : { minHeight }}
      aria-busy={shouldRender ? undefined : "true"}
    >
      {shouldRender ? children : null}
    </div>
  );
}
