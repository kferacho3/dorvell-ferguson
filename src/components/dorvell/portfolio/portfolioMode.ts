import { useSyncExternalStore } from "react";
import type { PortfolioCategoryFilter } from "@/lib/portfolio-taxonomy";

/**
 * Portfolio "gallery mode" + category-filter state.
 *
 * Implemented as a tiny module-level external store consumed via
 * `useSyncExternalStore` — the SSR-safe, react-compiler-clean pattern in this
 * repo (no set-state-in-effect). The server snapshot is a fixed default so
 * hydration matches; after mount the store resolves the device-appropriate
 * default (calm on mobile / reduced-motion, cinematic otherwise) or a persisted
 * choice, and subscribers re-render once.
 */

export type PortfolioMode = "cinematic" | "calm" | "archive" | "story";

export const PORTFOLIO_MODES: readonly {
  key: PortfolioMode;
  label: string;
  tagline: string;
}[] = [
  { key: "cinematic", label: "Cinematic", tagline: "Motion-led exploration" },
  { key: "calm", label: "Calm", tagline: "Clean browsing" },
  { key: "archive", label: "Archive", tagline: "Scan the range" },
  { key: "story", label: "Story", tagline: "Project context" },
];

const STORAGE_KEY = "df-portfolio-mode";

function isMode(value: unknown): value is PortfolioMode {
  return value === "cinematic" || value === "calm" || value === "archive" || value === "story";
}

type StoreState = {
  mode: PortfolioMode;
  category: PortfolioCategoryFilter;
};

const SERVER_STATE: StoreState = { mode: "cinematic", category: "All" };

let state: StoreState = SERVER_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function prefersCalm(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 760px)").matches;
  return reduced || mobile;
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  let mode: PortfolioMode = state.mode;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isMode(stored)) mode = stored;
    else mode = prefersCalm() ? "calm" : "cinematic";
  } catch {
    mode = prefersCalm() ? "calm" : "cinematic";
  }
  if (mode !== state.mode) state = { ...state, mode };
}

function subscribe(listener: () => void): () => void {
  ensureInitialized();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): StoreState {
  ensureInitialized();
  return state;
}

function getServerSnapshot(): StoreState {
  return SERVER_STATE;
}

export function setPortfolioMode(mode: PortfolioMode) {
  if (state.mode === mode) return;
  state = { ...state, mode };
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage unavailable — mode still applies for the session */
  }
  emit();
}

export function setPortfolioCategory(category: PortfolioCategoryFilter) {
  if (state.category === category) return;
  state = { ...state, category };
  emit();
}

export function usePortfolioMode() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { mode: snapshot.mode, setMode: setPortfolioMode };
}

export function usePortfolioFilters() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { category: snapshot.category, setCategory: setPortfolioCategory };
}
