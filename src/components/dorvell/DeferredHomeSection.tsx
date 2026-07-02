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
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin: compactViewport ? "0px 0px" : rootMargin },
    );

    observer.observe(marker);

    const desktopFallback = compactViewport
      ? undefined
      : window.setTimeout(() => {
          setShouldRender(true);
          observer.disconnect();
        }, 1800);

    return () => {
      observer.disconnect();
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
