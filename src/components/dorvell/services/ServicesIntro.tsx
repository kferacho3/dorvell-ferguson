"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { INTRO_PHRASES, INTRO_RESOLVE } from "@/lib/services-content";

export interface IntroFrame {
  src: string;
  alt: string;
  blurDataURL?: string;
}

// Cross-fade cadence is deliberately kept at ~2.2 changes/sec (well under the
// WCAG 2.3.1 three-flashes-per-second threshold) and dissolves rather than
// hard-cuts, so the montage is safe for photosensitive visitors regardless of
// their OS motion preference. The reduced-motion path shows a single calm card.
const IMAGE_INTERVAL_MS = 600;
const PHRASE_INTERVAL_MS = 480;
const FLASH_DURATION_MS = 2600;
const REDUCED_HOLD_MS = 900;
const WIPE_MS = 560;

export function ServicesIntro({
  frames,
  symbolSrc,
  reducedMotion,
  onDone,
}: {
  frames: IntroFrame[];
  symbolSrc: string;
  reducedMotion: boolean;
  onDone: () => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [resolved, setResolved] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const skipRef = useRef<HTMLButtonElement | null>(null);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setLeaving(true);
    window.setTimeout(onDone, WIPE_MS);
  }, [onDone]);

  // Lock body scroll while the overlay is up.
  useEffect(() => {
    document.body.classList.add("svc-intro-lock");
    return () => document.body.classList.remove("svc-intro-lock");
  }, []);

  // Move focus to the skip control so keyboard users can dismiss immediately.
  useEffect(() => {
    skipRef.current?.focus();
  }, []);

  // Reduced motion: hold a single calm card, then reveal.
  useEffect(() => {
    if (!reducedMotion) return;
    const timeout = window.setTimeout(finish, REDUCED_HOLD_MS);
    return () => window.clearTimeout(timeout);
  }, [reducedMotion, finish]);

  // Full montage timeline (dissolve cross-fade, not a strobe).
  useEffect(() => {
    if (reducedMotion || frames.length === 0) return;

    const imageTimer = window.setInterval(() => {
      setImageIndex((index) => (index + 1) % frames.length);
    }, IMAGE_INTERVAL_MS);

    const phraseTimer = window.setInterval(() => {
      setPhraseIndex((index) => Math.min(index + 1, INTRO_PHRASES.length - 1));
    }, PHRASE_INTERVAL_MS);

    const resolveTimer = window.setTimeout(() => setResolved(true), FLASH_DURATION_MS - 560);
    const endTimer = window.setTimeout(finish, FLASH_DURATION_MS);

    return () => {
      window.clearInterval(imageTimer);
      window.clearInterval(phraseTimer);
      window.clearTimeout(resolveTimer);
      window.clearTimeout(endTimer);
    };
  }, [reducedMotion, frames.length, finish]);

  // Any key dismisses.
  useEffect(() => {
    const onKey = () => finish();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  const showResolve = resolved || reducedMotion;

  return (
    <div
      className={leaving ? "svc-intro is-leaving" : "svc-intro"}
      aria-label="Services intro"
      onClick={finish}
    >
      <div className="svc-intro__stage" aria-hidden="true">
        {!reducedMotion
          ? frames.map((frame, index) => (
              <Image
                key={frame.src}
                className={index === imageIndex ? "svc-intro__frame is-active" : "svc-intro__frame"}
                src={frame.src}
                alt=""
                fill
                sizes="100vw"
                placeholder={frame.blurDataURL ? "blur" : "empty"}
                blurDataURL={frame.blurDataURL}
                priority={index === 0}
              />
            ))
          : null}
        <span className="svc-intro__scrim" />
      </div>

      <div className="svc-intro__content">
        {showResolve ? (
          <div className="svc-intro__resolve">
            <Image src={symbolSrc} alt="" width={72} height={72} className="svc-intro__mark" priority />
            <p className="svc-intro__resolve-line">{INTRO_RESOLVE}</p>
            <p className="svc-intro__resolve-sub">Dorvell Ferguson Jr. — Services</p>
          </div>
        ) : (
          <p className="svc-intro__phrase" key={phraseIndex}>
            {INTRO_PHRASES[phraseIndex]}
          </p>
        )}
      </div>

      <button ref={skipRef} type="button" className="svc-intro__skip" onClick={finish}>
        Skip intro
      </button>
    </div>
  );
}
