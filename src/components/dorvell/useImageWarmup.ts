"use client";

import { useEffect, useMemo } from "react";

const warmedImages = new Set<string>();

type IdleWindow = typeof window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function warmImage(src: string) {
  if (!src || warmedImages.has(src)) return;
  warmedImages.add(src);

  const image = new window.Image();
  image.decoding = "async";
  image.src = src;
  void image.decode?.().catch(() => undefined);
}

export function useImageWarmup(urls: Array<string | undefined | null>, limit = 12) {
  const signature = useMemo(() => urls.filter(Boolean).join("|"), [urls]);

  useEffect(() => {
    if (!signature) return;

    const idleWindow = window as IdleWindow;
    const candidates = signature
      .split("|")
      .filter((src) => src && !warmedImages.has(src))
      .slice(0, limit);

    if (candidates.length === 0) return;

    const run = () => {
      candidates.forEach(warmImage);
    };

    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(run, { timeout: 900 });
      return () => idleWindow.cancelIdleCallback?.(handle);
    }

    const timeout = window.setTimeout(run, 160);
    return () => window.clearTimeout(timeout);
  }, [limit, signature]);
}
