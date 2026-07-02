"use client";

import { useEffect, useMemo } from "react";

const warmedImages = new Set<string>();

type IdleWindow = typeof window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
  deviceMemory?: number;
};

function canWarmImages() {
  const compactViewport = window.matchMedia("(max-width: 760px)").matches;
  const navigatorInfo = window.navigator as NavigatorWithConnection;
  const connection = navigatorInfo.connection;
  const lowDataConnection =
    connection?.saveData ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g";
  const constrainedMemory = Boolean(navigatorInfo.deviceMemory && navigatorInfo.deviceMemory <= 4 && window.innerWidth < 1100);

  return !compactViewport && !lowDataConnection && !constrainedMemory;
}

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
    if (!canWarmImages()) return;

    const idleWindow = window as IdleWindow;
    const candidates = signature
      .split("|")
      .filter((src) => src && !warmedImages.has(src))
      .slice(0, limit);

    if (candidates.length === 0) return;

    const timers = new Set<number>();
    const run = () => {
      candidates.forEach((src, index) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          warmImage(src);
        }, index * 90);
        timers.add(timer);
      });
    };

    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(run, { timeout: 1400 });
      return () => {
        idleWindow.cancelIdleCallback?.(handle);
        timers.forEach((timer) => window.clearTimeout(timer));
      };
    }

    const timeout = window.setTimeout(run, 320);
    return () => {
      window.clearTimeout(timeout);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [limit, signature]);
}
