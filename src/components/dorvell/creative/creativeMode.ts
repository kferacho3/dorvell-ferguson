import { useSyncExternalStore } from "react";

/**
 * Creative Worlds experience mode.
 *
 * Same SSR-safe, react-compiler-clean pattern as the portfolio store
 * (module-level external store via useSyncExternalStore — no set-state-in-effect).
 * The server snapshot is a fixed default so hydration matches; after mount the
 * store resolves the device-appropriate default (calm on mobile / reduced-motion,
 * cinematic otherwise) or a persisted choice, and subscribers re-render once.
 *
 *  - cinematic: scroll transforms, parallax reels, animated text, active video,
 *    optional WebGPU / 3D enhancements.
 *  - calm: poster-first cards, clean editorial grid, no heavy WebGL, no trails —
 *    for anyone who just wants to browse the work.
 */

export type CreativeMode = "cinematic" | "calm";

export const CREATIVE_MODES: readonly {
  key: CreativeMode;
  label: string;
  tagline: string;
}[] = [
  { key: "cinematic", label: "Cinematic", tagline: "Motion, scenes, atmosphere" },
  { key: "calm", label: "Calm", tagline: "Quiet, poster-first browsing" },
];

const STORAGE_KEY = "df-creative-mode";

function isMode(value: unknown): value is CreativeMode {
  return value === "cinematic" || value === "calm";
}

const SERVER_MODE: CreativeMode = "cinematic";

let mode: CreativeMode = SERVER_MODE;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function prefersCalm(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 760px)").matches;
  const saveData =
    typeof navigator !== "undefined" &&
    "connection" in navigator &&
    Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  return reduced || mobile || saveData;
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  let next: CreativeMode = mode;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    next = isMode(stored) ? stored : prefersCalm() ? "calm" : "cinematic";
  } catch {
    next = prefersCalm() ? "calm" : "cinematic";
  }
  if (next !== mode) mode = next;
}

function subscribe(listener: () => void): () => void {
  ensureInitialized();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CreativeMode {
  ensureInitialized();
  return mode;
}

function getServerSnapshot(): CreativeMode {
  return SERVER_MODE;
}

export function setCreativeMode(next: CreativeMode) {
  if (mode === next) return;
  mode = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable — mode still applies for the session */
  }
  emit();
}

export function useCreativeMode() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { mode: value, setMode: setCreativeMode };
}
