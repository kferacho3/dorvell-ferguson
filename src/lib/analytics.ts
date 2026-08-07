import type { FilmPlatform } from "@/lib/social-links";

/**
 * Film + social analytics seam.
 *
 * The site has no analytics vendor wired in. Rather than pick one, every event
 * is pushed to `window.dataLayer` — the shape GTM, GA4 and most tag managers
 * already consume — and silently no-ops when no tag manager is present. Drop a
 * container into the layout later and the whole funnel starts reporting with no
 * component changes.
 *
 * The one rule worth stating: a muted hero loop starting on its own is NOT
 * engagement. `hero_motion_started` (autoplay) and `film_started`
 * (`trigger: "intentional"`) are deliberately different events, and every play
 * carries a `trigger` so autoplay can be excluded from any success measure.
 */

export type FilmAnalyticsEvent =
  | "hero_motion_impression"
  | "hero_motion_started"
  | "hero_motion_completed"
  | "film_viewer_opened"
  | "film_started"
  | "film_progress_25"
  | "film_progress_50"
  | "film_progress_75"
  | "film_completed"
  | "film_replayed"
  | "film_social_click"
  | "film_related_opened"
  | "film_booking_click";

export type FilmPlacement =
  | "hero"
  | "featured"
  | "archive"
  | "related"
  | "film-page"
  | "social-page"
  | "footer"
  | "nav"
  | "viewer";

export type FilmAnalyticsProps = {
  /** Film slug. */
  film?: string;
  placement?: FilmPlacement;
  platform?: FilmPlatform;
  /** Whether playback was started by the visitor or by muted autoplay. */
  trigger?: "autoplay" | "intentional";
  /** Whether the destination was an exact post or just a profile. */
  destination?: "post" | "profile";
};

type DataLayerWindow = Window & { dataLayer?: unknown[] };

/** Device class is derived here so no caller has to touch matchMedia. */
function deviceClass(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia("(max-width: 760px)").matches ? "mobile" : "desktop";
}

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function trackFilmEvent(event: FilmAnalyticsEvent, props: FilmAnalyticsProps = {}): void {
  if (typeof window === "undefined") return;
  const win = window as DataLayerWindow;
  if (!Array.isArray(win.dataLayer)) return; // no tag manager — stay silent
  win.dataLayer.push({
    event,
    ...props,
    device_class: deviceClass(),
    reduced_motion: reducedMotion(),
  });
}

/**
 * Progress milestones fire once each per play. Callers keep a Set of already
 * -reported milestones; this returns the milestone crossed, if any.
 */
export const FILM_PROGRESS_MILESTONES = [25, 50, 75] as const;

export type FilmProgressMilestone = (typeof FILM_PROGRESS_MILESTONES)[number];

export function progressEventFor(milestone: FilmProgressMilestone): FilmAnalyticsEvent {
  return `film_progress_${milestone}` as FilmAnalyticsEvent;
}
