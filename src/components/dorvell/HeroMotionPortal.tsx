"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { useSavesData } from "@/lib/useConnectionAwareMedia";
import { trackFilmEvent } from "@/lib/analytics";
import { formatRuntime, motionPortalFilm, motionPortalFilms, filmIndexItems } from "@/content/creative";
import { useInView } from "@/components/dorvell/creative/useInView";
import { useIsMobile } from "@/components/dorvell/creative/useIsMobile";
import { useFilmViewer } from "./film/FilmViewer";
import { PlayIcon } from "./creative/icons";

/**
 * Waits for the page to actually settle before returning true.
 *
 * The hero's photography owns the first paint. This defers everything the
 * motion portal wants to do until the browser is idle, so attaching a video
 * source can never compete with the LCP image. Falls back to a timeout where
 * requestIdleCallback is unavailable (Safari).
 */
function usePageSettled(): boolean {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (typeof win.requestIdleCallback === "function") {
      const handle = win.requestIdleCallback(() => setSettled(true), { timeout: 2600 });
      return () => win.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(() => setSettled(true), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  return settled;
}

/**
 * The landing hero's motion doorway.
 *
 * One contained film surface inside the existing archive hero — not a carousel,
 * not a banner. It renders a poster immediately and attaches the video source
 * only once every gate agrees: the portal is on screen, the page has gone idle,
 * motion is welcome, the connection is not constrained, and on mobile the
 * visitor has explicitly tapped.
 *
 * It plays `loopSrc` — a silent, sub-8-second cut — so a hero impression is
 * structurally incapable of pulling a full film's bytes. The full film only
 * ever loads inside the viewer, after intent.
 */
export function HeroMotionPortal() {
  const film = motionPortalFilm;
  const reducedMotion = usePrefersReducedMotion();
  const savesData = useSavesData();
  const isMobile = useIsMobile();
  const settled = usePageSettled();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({ rootMargin: "160px 0px", threshold: 0.25 });
  const portalRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const impressionRef = useRef(false);
  const startedRef = useRef(false);

  const [mobileOptIn, setMobileOptIn] = useState(false);
  const [playing, setPlaying] = useState(false);

  const { open } = useFilmViewer();

  // Every gate must agree before a single video byte is requested.
  const allowedByPreference = !reducedMotion && !savesData;
  const allowedByDevice = !isMobile || mobileOptIn;
  const attachSource = Boolean(film?.loopSrc) && inView && settled && allowedByPreference && allowedByDevice;

  useEffect(() => {
    if (!inView || impressionRef.current || !film) return;
    impressionRef.current = true;
    trackFilmEvent("hero_motion_impression", { film: film.slug, placement: "hero" });
  }, [inView, film]);

  // Pause whenever the portal leaves the viewport or the tab is hidden.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (attachSource && inView) {
      video.play().catch(() => {
        /* blocked — the poster simply stays */
      });
    } else {
      video.pause();
    }
  }, [attachSource, inView]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) videoRef.current?.pause();
      else if (attachSource && inView) videoRef.current?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [attachSource, inView]);

  const openViewer = useCallback(() => {
    if (!film) return;
    open(film, {
      list: filmIndexItems,
      placement: "hero",
      originRect: portalRef.current?.getBoundingClientRect() ?? null,
    });
  }, [film, open]);

  if (!film) return null;

  const poster = resolveCreativeAsset(film.posterSrc);
  const loopSrc = resolveCreativeAsset(film.loopSrc ?? film.mobileSrc);
  // The hero counts the motion doorway, not the Creative Hub's featured order —
  // LOOK UP is film 02 in the featured index but it is the first thing the
  // landing page shows, so labelling it "02" here would read as a mistake.
  const portalPosition = motionPortalFilms.findIndex((f) => f.slug === film.slug) + 1;
  const indexLabel = `${String(Math.max(portalPosition, 1)).padStart(2, "0")} / ${String(filmIndexItems.length).padStart(2, "0")}`;
  const needsTap = isMobile && !mobileOptIn && allowedByPreference;

  return (
    <div className="atlas-portal" ref={viewRef}>
      <div className="atlas-portal__head">
        <span className="atlas-portal__now">Now showing</span>
        <span className="atlas-portal__index">Motion {indexLabel}</span>
      </div>

      <button
        type="button"
        ref={portalRef}
        className="atlas-portal__surface"
        onClick={openViewer}
        aria-label={`Watch ${film.title}, ${formatRuntime(film.duration)} — opens the film viewer`}
      >
        <Image
          src={poster}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 900px) 92vw, 42vw"
          placeholder={film.blurDataURL ? "blur" : "empty"}
          blurDataURL={film.blurDataURL}
          className="atlas-portal__poster"
        />

        {attachSource ? (
          <video
            ref={videoRef}
            className="atlas-portal__video"
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            onPlay={() => {
              setPlaying(true);
              if (startedRef.current) return;
              startedRef.current = true;
              // Silent autoplay — reported separately from an intentional play
              // so it can never be counted as engagement.
              trackFilmEvent("hero_motion_started", {
                film: film.slug,
                placement: "hero",
                trigger: "autoplay",
              });
            }}
            onPause={() => setPlaying(false)}
          >
            <source src={loopSrc} type="video/mp4" />
          </video>
        ) : null}

        <span className="atlas-portal__scrim" aria-hidden="true" />

        <span className="atlas-portal__meta" aria-hidden="true">
          <strong className="atlas-portal__title">{film.title}</strong>
          <span className="atlas-portal__runtime">{formatRuntime(film.duration)}</span>
        </span>

        <span className="atlas-portal__cue" aria-hidden="true">
          <span className="atlas-portal__cue-disc">
            <PlayIcon />
          </span>
          Watch film
        </span>

        {playing ? <span className="atlas-portal__live" aria-hidden="true" /> : null}
      </button>

      {needsTap ? (
        <button
          type="button"
          className="atlas-portal__optin"
          onClick={() => setMobileOptIn(true)}
        >
          Play the loop
          <span className="sr-only"> — starts a short, silent preview of {film.title}</span>
        </button>
      ) : null}

      {reducedMotion || savesData ? (
        <p className="atlas-portal__static">
          Motion paused — {film.title} is ready to watch in full.
        </p>
      ) : null}
    </div>
  );
}
