"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Fragment, useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { ModelingImage } from "@/components/modeling/modelingTypes";
import { ModelingContactSheet } from "@/components/modeling/ModelingContactSheet";
import { ModelingDriftGallery } from "@/components/modeling/ModelingDriftGallery";
import { ModelingFallbackGallery } from "@/components/modeling/ModelingFallbackGallery";

const ModelingRibbonField = dynamic(() => import("@/components/modeling/ModelingRibbonField"), {
  ssr: false,
  loading: () => <div className="modeling-ribbons__field" aria-hidden="true" />,
});

type ModelingExperienceProps = {
  images: ModelingImage[];
  curated: boolean;
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
  if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const TITLE = "The Ferguson Room";

// One-shot capability probe, cached so the store snapshot stays stable.
let ribbonSupport: boolean | null = null;
const subscribeNever = () => () => {};
const getRibbonSupport = () => {
  if (ribbonSupport === null) ribbonSupport = canRunRibbons();
  return ribbonSupport;
};

export function ModelingExperience({ images, curated }: ModelingExperienceProps) {
  const reducedMotion = usePrefersReducedMotion();
  const webglReady = useSyncExternalStore(subscribeNever, getRibbonSupport, () => false);

  const useRibbons = webglReady && !reducedMotion && images.length >= 6;
  const isEmpty = images.length === 0;

  return (
    <div className="modeling-room">
      {/* film grain + vignette atmosphere */}
      <div className="modeling-room__grain" aria-hidden="true" />
      <div className="modeling-room__vignette" aria-hidden="true" />

      {/* ---------- entrance ---------- */}
      <header className="modeling-door">
        <p className="modeling-door__kicker">Members only · by request</p>
        <h1 className="modeling-door__title" aria-label={TITLE}>
          {TITLE.split(" ").map((word, wordIndex, words) => {
            const charOffset = words.slice(0, wordIndex).reduce((sum, w) => sum + w.length + 1, 0);
            return (
              <Fragment key={`${word}-${wordIndex}`}>
                {wordIndex > 0 ? " " : null}
                <span className="modeling-door__word" aria-hidden="true">
                  {word.split("").map((char, charIndex) => (
                    <span
                      key={`${char}-${charIndex}`}
                      style={{ animationDelay: `${120 + (charOffset + charIndex) * 42}ms` }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              </Fragment>
            );
          })}
        </h1>
        <p className="modeling-door__line">
          The modeling side of the lens. Private set, quiet light, no audience.
        </p>
        {!isEmpty ? (
          <p className="modeling-door__cue" aria-hidden="true">
            <span />
            Enter
          </p>
        ) : null}
      </header>

      {/* ---------- main experience ---------- */}
      {isEmpty ? (
        <section className="modeling-empty" aria-labelledby="modeling-empty-title">
          <div className="modeling-empty__frame">
            <h2 id="modeling-empty-title">The Room is being hung.</h2>
            <p>
              This collection fills itself: every photo marked <strong>MODELING</strong> in the
              Photo Curation Studio takes its place here automatically.
            </p>
            <Link href="/contact" className="modeling-cta__button">
              Request a first look
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="modeling-ribbons" aria-label="Modeling frames in motion">
            <div className="modeling-ribbons__sticky">
              {useRibbons ? (
                <ModelingRibbonField images={images} />
              ) : (
                <ModelingFallbackGallery images={images} />
              )}
              <div className="modeling-ribbons__caption" aria-hidden="true">
                <p>{curated ? "Curated for the Room" : "From the working archive"}</p>
                <p>{Math.min(images.length, 21)} frames · in rotation</p>
              </div>
            </div>
          </section>

          <section className="modeling-statement">
            <p>
              Most of the site is Dorvell behind the camera.
              <br />
              <em>This room is the other side.</em>
            </p>
          </section>

          <ModelingDriftGallery
            images={images.slice(0, 8)}
            kicker="Private set"
            title="Prints that walk the wall."
          />

          <ModelingContactSheet images={images.slice(8, 26).length >= 6 ? images.slice(8, 26) : images.slice(0, 18)} />
        </>
      )}

      {/* ---------- booking descent ---------- */}
      <section className="modeling-cta" aria-labelledby="modeling-cta-title">
        <h2 id="modeling-cta-title">Request the Room.</h2>
        <p>Agencies, designers, and editorial teams — the set opens by inquiry.</p>
        <div className="modeling-cta__row">
          <Link href="/contact" className="modeling-cta__button">
            Book the set
          </Link>
          <Link href="/work" className="modeling-cta__link">
            See the photography archive
          </Link>
        </div>
      </section>
    </div>
  );
}
