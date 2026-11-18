"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Fragment, useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { ModelingImage } from "@/components/modeling/modelingTypes";
import { ModelingContactSheet } from "@/components/modeling/ModelingContactSheet";
import { ModelingDriftGallery } from "@/components/modeling/ModelingDriftGallery";
import { ModelingFallbackGallery } from "@/components/modeling/ModelingFallbackGallery";

const ModelingRibbonField = dynamic(
  () => import("@/components/modeling/ModelingRibbonField"),
  {
    ssr: false,
    loading: () => (
      <div className="modeling-ribbons__field" aria-hidden="true" />
    ),
  },
);

type ModelingExperienceProps = {
  images: ModelingImage[];
  hasClips: boolean;
};

/** Device gate mirroring the site's AtlasOrbitField pattern. */
function canRunRibbons(): boolean {
  if (typeof window === "undefined") return false;
  if (window.innerWidth <= 900) return false;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return false;
  if (
    nav.connection?.effectiveType &&
    /(^|-)2g$/.test(nav.connection.effectiveType)
  )
    return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4)
    return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const TITLE = "The Ferguson Room";
const sectionLink =
  "inline-flex min-h-11 items-center text-sm font-medium text-[var(--room-bone)] underline decoration-[var(--room-brass-soft)] underline-offset-8 hover:decoration-[var(--room-brass)]";

// One-shot capability probe, cached so the store snapshot stays stable.
let ribbonSupport: boolean | null = null;
const subscribeNever = () => () => {};
const getRibbonSupport = () => {
  if (ribbonSupport === null) ribbonSupport = canRunRibbons();
  return ribbonSupport;
};

export function ModelingExperience({
  images,
  hasClips,
}: ModelingExperienceProps) {
  const reducedMotion = usePrefersReducedMotion();
  const webglReady = useSyncExternalStore(
    subscribeNever,
    getRibbonSupport,
    () => false,
  );

  const useRibbons = webglReady && !reducedMotion && images.length >= 6;
  const isEmpty = images.length === 0;

  return (
    <div className="modeling-room">
      {/* film grain + vignette atmosphere */}
      <div className="modeling-room__grain" aria-hidden="true" />
      <div className="modeling-room__vignette" aria-hidden="true" />

      {/* ---------- entrance ---------- */}
      <header className="modeling-door">
        <p className="modeling-door__kicker">Modeling</p>
        <h1 className="modeling-door__title" aria-label={TITLE}>
          {TITLE.split(" ").map((word, wordIndex, words) => {
            const charOffset = words
              .slice(0, wordIndex)
              .reduce((sum, w) => sum + w.length + 1, 0);
            return (
              <Fragment key={`${word}-${wordIndex}`}>
                {wordIndex > 0 ? " " : null}
                <span className="modeling-door__word" aria-hidden="true">
                  {word.split("").map((char, charIndex) => (
                    <span
                      key={`${char}-${charIndex}`}
                      style={{
                        animationDelay: `${120 + (charOffset + charIndex) * 42}ms`,
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              </Fragment>
            );
          })}
        </h1>
        {!isEmpty || hasClips ? (
          <>
            <span className="modeling-door__cue !mt-7" aria-hidden="true">
              <span />
            </span>
            <nav
              aria-label="Modeling sections"
              className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1"
            >
              {!isEmpty ? (
                <a href="#modeling-photos" className={sectionLink}>
                  Photo portfolio
                </a>
              ) : null}
              {hasClips ? (
                <a href="#modeling-clips" className={sectionLink}>
                  Runway clips
                </a>
              ) : null}
            </nav>
          </>
        ) : null}
      </header>

      {/* ---------- main experience ---------- */}
      {isEmpty ? (
        <section
          className="modeling-empty"
          aria-labelledby="modeling-empty-title"
        >
          <div className="modeling-empty__frame">
            <h2 id="modeling-empty-title">Photos coming soon</h2>
          </div>
        </section>
      ) : (
        <>
          <section
            id="modeling-photos"
            className="modeling-ribbons scroll-mt-0"
            aria-label="Modeling photo portfolio"
            tabIndex={-1}
          >
            <div className="modeling-ribbons__sticky">
              {useRibbons ? (
                <ModelingRibbonField images={images} />
              ) : (
                <ModelingFallbackGallery images={images} />
              )}
            </div>
          </section>

          <section className="modeling-statement">
            <p>
              <em>On the other side of the lens.</em>
            </p>
          </section>

          <ModelingDriftGallery images={images.slice(0, 8)} />

          <ModelingContactSheet
            images={
              images.slice(8, 26).length >= 6
                ? images.slice(8, 26)
                : images.slice(0, 18)
            }
          />
        </>
      )}

      {/* ---------- booking descent ---------- */}
      <section className="modeling-cta" aria-labelledby="modeling-cta-title">
        <h2 id="modeling-cta-title">Modeling inquiries</h2>
        <Link href="/contact" className={sectionLink}>
          Book Dorvell
        </Link>
      </section>
    </div>
  );
}
