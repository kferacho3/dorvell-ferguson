"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { CreativeItem } from "@/content/creative";
import { useInView } from "./useInView";
import { MutedIcon, PauseIcon, PlayIcon, SoundIcon } from "./icons";

type PlayOverride = "auto" | "play" | "pause";

export type VideoPlayerProps = {
  item: CreativeItem;
  /** ambient = autoplay muted while in view; manual = poster-first, tap to play. */
  mode?: "ambient" | "manual";
  /** For ambient: only the "active" instance in a group should play (center of a row, etc.). */
  active?: boolean;
  loop?: boolean;
  fit?: "cover" | "contain";
  controls?: boolean;
  /** Hero/featured: eager poster + full preload. */
  priority?: boolean;
  startMuted?: boolean;
  className?: string;
  /** Frame aspect wrapper; pass false when the parent already sets aspect. */
  framed?: boolean;
};

function formatTime(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const m = Math.floor(s / 60);
  const rem = Math.floor(s % 60);
  return `${m}:${String(rem).padStart(2, "0")}`;
}

export function VideoPlayer({
  item,
  mode = "ambient",
  active = true,
  loop = true,
  fit = "cover",
  controls = true,
  priority = false,
  startMuted = true,
  className,
  framed = true,
}: VideoPlayerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({ rootMargin: "220px 0px", threshold: 0.2 });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(startMuted);
  const [override, setOverride] = useState<PlayOverride>("auto");
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [pageHidden, setPageHidden] = useState(false);

  const mp4 = resolveCreativeAsset(item.mp4Src);
  const webm = resolveCreativeAsset(item.webmSrc);
  const poster = resolveCreativeAsset(item.posterSrc);

  // pause when the tab is hidden (setState only inside the event callback)
  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const visible = inView && !pageHidden;
  let shouldPlay: boolean;
  if (!visible) shouldPlay = false; // always pause offscreen / hidden
  else if (override === "play") shouldPlay = true;
  else if (override === "pause") shouldPlay = false;
  else shouldPlay = mode === "ambient" && active && !reducedMotion; // auto

  // mount the <video> when it should play OR once the user has taken manual
  // control (so a paused clip stays mounted and keeps its position). Purely
  // derived — no ref-in-render, no set-state-in-effect.
  const showVideo = shouldPlay || override !== "auto";

  // drive playback + keep muted state applied
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    if (shouldPlay) {
      const promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {
          /* autoplay blocked — poster + play button remain */
        });
      }
    } else {
      video.pause();
    }
  }, [shouldPlay, muted, showVideo]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    const isPlaying = video ? !video.paused : false;
    if (isPlaying) {
      setOverride("pause");
      video?.pause();
    } else {
      setOverride("play");
      // play inside the user gesture so iOS / data-saver can honor it even when
      // the earlier muted-autoplay attempt was blocked (effect runs post-commit).
      video?.play().catch(() => {});
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  }, []);

  const seekTo = useCallback((fraction: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(fraction, 0), 1) * video.duration;
  }, []);

  const onScrubPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      seekTo((event.clientX - rect.left) / rect.width);
    },
    [seekTo],
  );

  const onScrubKey = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const step = 5;
      if (event.key === "ArrowLeft") {
        video.currentTime = Math.max(0, video.currentTime - step);
        event.preventDefault();
      } else if (event.key === "ArrowRight") {
        video.currentTime = Math.min(video.duration || item.duration, video.currentTime + step);
        event.preventDefault();
      }
    },
    [item.duration],
  );

  const inner = (
    <div
      ref={viewRef}
      className={cn("cw-video", fit === "contain" && "is-fit-contain", playing && "is-playing", className)}
    >
      <Image
        src={poster}
        alt={item.title}
        fill
        unoptimized
        sizes="(max-width: 760px) 100vw, 60vw"
        placeholder={item.blurDataURL ? "blur" : "empty"}
        blurDataURL={item.blurDataURL}
        priority={priority}
        className="cw-video__poster"
      />

      {showVideo ? (
        <video
          ref={videoRef}
          className="cw-video__media"
          muted={muted}
          loop={loop}
          playsInline
          preload={priority ? "auto" : "metadata"}
          poster={poster}
          aria-label={`${item.title} — cinematic clip`}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={
            controls
              ? (event) => {
                  // only feed timeupdate into state when a scrubber/time is shown —
                  // ambient clips (controls=false) must not re-render ~4×/second.
                  const video = event.currentTarget;
                  setCurrent(video.currentTime);
                  setProgress(video.duration ? video.currentTime / video.duration : 0);
                }
              : undefined
          }
        >
          {webm ? <source src={webm} type="video/webm" /> : null}
          <source src={mp4} type="video/mp4" />
        </video>
      ) : null}

      {!playing ? (
        <button type="button" className="cw-video__play" onClick={togglePlay} aria-label={`Play ${item.title}`}>
          <span className="cw-video__play-disc">
            <PlayIcon />
          </span>
        </button>
      ) : null}

      {/* WCAG 2.2.2 — a persistent pause for ambient/looping clips that hide the full bar */}
      {playing && !controls ? (
        <button
          type="button"
          className="cw-video__ambient-pause"
          onClick={togglePlay}
          aria-label={`Pause ${item.title}`}
        >
          <PauseIcon />
        </button>
      ) : null}

      {controls ? (
        <div className="cw-video__controls">
          <button type="button" className="cw-ctrl" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          {item.hasAudio ? (
            <button type="button" className="cw-ctrl" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? <MutedIcon /> : <SoundIcon />}
            </button>
          ) : null}
          <span className="cw-video__time">
            {formatTime(current)} / {formatTime(item.duration)}
          </span>
          <div
            className="cw-video__scrub"
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            onPointerDown={onScrubPointer}
            onKeyDown={onScrubKey}
          >
            <div className="cw-video__scrub-fill" style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>
      ) : null}
    </div>
  );

  if (!framed) return inner;
  return <div className={cn("cw-frame", `cw-frame--${item.orientation}`)}>{inner}</div>;
}
