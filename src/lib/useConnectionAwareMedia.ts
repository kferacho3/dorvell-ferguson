"use client";

import { useSyncExternalStore } from "react";

/**
 * Save-Data / slow-connection probe.
 *
 * Mirrors `usePrefersReducedMotion`'s shape: a one-shot browser capability read
 * through `useSyncExternalStore`, which is the pattern this repo uses to stay
 * inside the strict react-compiler hook rules (no setState in an effect body).
 *
 * `navigator.connection` is Chromium-only and never changes for the lifetime of
 * a page in practice, so the store has no real subscription — the server
 * snapshot is the permissive default, which means SSR and non-Chromium browsers
 * behave exactly as they do today.
 */

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
};

const SLOW_TYPES = new Set(["slow-2g", "2g"]);

function connection(): NetworkInformation | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

/** Never re-subscribes — connection info is effectively static per page load. */
function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): boolean {
  const info = connection();
  if (!info) return false;
  if (info.saveData) return true;
  return Boolean(info.effectiveType && SLOW_TYPES.has(info.effectiveType));
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * True when the visitor has asked for reduced data or is on a 2g-class
 * connection. Callers should fall back to a poster and never attach a video
 * source when this is true.
 */
export function useSavesData(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
