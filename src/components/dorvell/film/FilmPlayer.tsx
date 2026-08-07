"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { formatRuntime, type CreativeItem } from "@/content/creative";
import {
  FILM_PROGRESS_MILESTONES,
  progressEventFor,
  trackFilmEvent,
  type FilmPlacement,
} from "@/lib/analytics";
import { useIsMobile } from "@/components/dorvell/creative/useIsMobile";
import {
  CollapseIcon,
  ExpandIcon,
  MutedIcon,
  PauseIcon,
  PlayIcon,
  SoundIcon,
} from "@/components/dorvell/creative/icons";

type FilmPlayerProps = {
  film: CreativeItem;
  /** Fires once the film reaches its end — drives the conversion end state. */
  onEnded?: () => void;
  /** Fires on a play that the visitor asked for (never on muted autoplay). */
  onIntentionalPlay?: () => void;
  placement: FilmPlacement;
  /**
   * Start playing on mount. Only pass this where opening the player IS the
   * intent (the viewer, a film route's play action) — never on a page load.
   */
  autoStart?: boolean;
  className?: string;
};

/**
 * Full-film player: progress, sound, fullscreen, keyboard, and completion.
 *
 * Distinct from the ambient `VideoPlayer` (which loops muted clips in the page
 * flow) because a film has semantics that an ambient loop does not — it can be
 * completed, replayed, and scrubbed, and its milestones are worth measuring.
 *
 * Sound starts ON here. This player only ever mounts after the visitor has
 * asked for the film, so muting them would be second-guessing a decision they
 * already made. Reduced motion suppresses `autoStart` only; the controls stay
 * fully available.
 */
export function FilmPlayer({
  film,
  onEnded,
  onIntentionalPlay,
  placement,
  autoStart = false,
  className,
}: FilmPlayerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const reportedRef = useRef<Set<number>>(new Set());
  const startedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  /**
   * The <video> is not mounted until the film is wanted. Used inline (the
   * Creative Hub featured slot), that keeps full-film bytes at exactly zero
   * until someone presses play; used in the viewer, `autoStart` arms it
   * immediately because opening the viewer already was the intent.
   */
  const [armed, setArmed] = useState(autoStart);
  const wantsPlayRef = useRef(autoStart);

  const src = resolveCreativeAsset(isMobile ? film.mobileSrc : film.mp4Src);
  const poster = resolveCreativeAsset(film.posterSrc);
  const duration = film.duration;

  // Opening the player is itself the intent signal, so start unless the visitor
  // has asked for reduced motion.
  useEffect(() => {
    if (!armed || !wantsPlayRef.current) return;
    if (autoStart && reducedMotion) return; // never auto-start against a stated preference
    const video = videoRef.current;
    if (!video) return;
    wantsPlayRef.current = false;
    video.play().catch(() => {
      // Unmuted autoplay refused (no sticky activation on this page yet). Fall
      // back to a muted start so the film still runs, and flip the control to
      // "Unmute" so getting sound back is one obvious click.
      video.muted = true;
      setMuted(true);
      video.play().catch(() => {
        /* still blocked — poster + big play control remain */
      });
    });
  }, [armed, autoStart, reducedMotion, film.slug]);

  // Pause when the tab goes to the background — never keep audio running in a
  // tab the visitor has left.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) videoRef.current?.pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const togglePlay = useCallback(() => {
    onIntentionalPlay?.();
    if (!armed) {
      // First press: mount the <video>, and let the arming effect start it.
      wantsPlayRef.current = true;
      setArmed(true);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, [armed, onIntentionalPlay]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      frameRef.current?.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const seekBy = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const total = Number.isFinite(video.duration) ? video.duration : duration;
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), total);
  }, [duration]);

  const seekToFraction = useCallback((fraction: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(fraction, 0), 1) * video.duration;
  }, []);

  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const total = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration;
    const fraction = total > 0 ? video.currentTime / total : 0;
    setCurrent(video.currentTime);
    setProgress(fraction);

    const percent = fraction * 100;
    for (const milestone of FILM_PROGRESS_MILESTONES) {
      if (percent >= milestone && !reportedRef.current.has(milestone)) {
        reportedRef.current.add(milestone);
        trackFilmEvent(progressEventFor(milestone), { film: film.slug, placement });
      }
    }
  }, [duration, film.slug, placement]);

  const handlePlay = useCallback(() => {
    setPlaying(true);
    if (startedRef.current) {
      trackFilmEvent("film_replayed", { film: film.slug, placement });
      return;
    }
    startedRef.current = true;
    // Always intentional: this player only mounts once the visitor has asked
    // for the film. Silent hero autoplay reports `hero_motion_started` instead,
    // and the two must never be conflated in a success measure.
    trackFilmEvent("film_started", { film: film.slug, placement, trigger: "intentional" });
  }, [film.slug, placement]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    reportedRef.current.clear();
    trackFilmEvent("film_completed", { film: film.slug, placement });
    onEnded?.();
  }, [film.slug, onEnded, placement]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === " " || event.key === "k") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "m") {
        toggleMute();
      } else if (event.key === "f") {
        toggleFullscreen();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seekBy(-5);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        seekBy(5);
      }
    },
    [seekBy, toggleFullscreen, toggleMute, togglePlay],
  );

  return (
    <div
      ref={frameRef}
      className={cn("fp", `fp--${film.orientation}`, playing && "is-playing", className)}
      onKeyDown={onKeyDown}
    >
      <Image
        src={poster}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 760px) 100vw, 68vw"
        placeholder={film.blurDataURL ? "blur" : "empty"}
        blurDataURL={film.blurDataURL}
        priority
        className="fp__poster"
      />

      {armed ? (
        <video
          ref={videoRef}
          className="fp__media"
          playsInline
          preload="auto"
          poster={poster}
          aria-label={`${film.title} — full film`}
          onPlay={handlePlay}
          onPause={() => setPlaying(false)}
          onEnded={handleEnded}
          onTimeUpdate={onTimeUpdate}
          onClick={togglePlay}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : null}

      {!playing ? (
        <button type="button" className="fp__bigplay" onClick={togglePlay} aria-label={`Play ${film.title}`}>
          <span className="fp__bigplay-disc">
            <PlayIcon />
          </span>
        </button>
      ) : null}

      <div className="fp__controls">
        <button
          type="button"
          className="fp__ctrl"
          onClick={togglePlay}
          aria-label={playing ? `Pause ${film.title}` : `Play ${film.title}`}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        {film.hasAudio ? (
          <button
            type="button"
            className="fp__ctrl"
            onClick={toggleMute}
            aria-label={muted ? "Unmute film" : "Mute film"}
          >
            {muted ? <MutedIcon /> : <SoundIcon />}
          </button>
        ) : null}

        <span className="fp__time">
          {formatRuntime(current)} <span aria-hidden="true">/</span> {formatRuntime(duration)}
        </span>

        <div
          className="fp__scrub"
          role="slider"
          tabIndex={0}
          aria-label={`Seek within ${film.title}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-valuetext={`${formatRuntime(current)} of ${formatRuntime(duration)}`}
          onPointerDown={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            seekToFraction((event.clientX - rect.left) / rect.width);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              seekBy(-5);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              seekBy(5);
            }
          }}
        >
          <div className="fp__scrub-fill" style={{ transform: `scaleX(${progress})` }} />
        </div>

        <button
          type="button"
          className="fp__ctrl"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit full screen" : "Play full screen"}
        >
          {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
        </button>
      </div>
    </div>
  );
}
