"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import {
  CENTER_STAT,
  HERO_HEADING,
  HERO_SUBHEAD,
  ORBIT_DIAMETERS,
  ORBIT_SPINS,
  REEL,
  type OrbitTile,
} from "@/lib/services-content";
import { useCountUp, useTypewriter } from "@/lib/services-hooks";

const GLOW_TOKENS: Record<OrbitTile["glow"], string> = {
  teal: "var(--df-teal)",
  gold: "var(--df-gold)",
  red: "var(--df-red)",
  blue: "var(--df-blue)",
  rust: "var(--df-brown-hot)",
};

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M6.5 3.5 12 9l-5.5 5.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CursorGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 2.5 15.5 9 9.6 10.4 8 16.5 3 2.5Z" fill="var(--df-teal)" stroke="var(--df-bg)" strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  );
}

/** A single orbit ring with its riding tiles (photos + the reel). */
function Orbit({ index, tiles, active, reducedMotion }: {
  index: number;
  tiles: OrbitTile[];
  active: boolean;
  reducedMotion: boolean;
}) {
  const diameter = ORBIT_DIAMETERS[index];
  const spin = ORBIT_SPINS[index];
  const radius = diameter / 2;

  const ringStyle = {
    width: `${diameter}px`,
    height: `${diameter}px`,
    "--svc-spin-duration": `${spin.duration}s`,
    "--svc-spin-direction": spin.direction,
    // Tiles counter-rotate at the same rate so imagery stays upright.
    "--svc-spin-counter": spin.direction === "reverse" ? "normal" : "reverse",
  } as CSSProperties;

  return (
    <div className={reducedMotion ? "svc-orbit is-static" : "svc-orbit"} style={ringStyle} aria-hidden={tiles.every((t) => t.kind !== "video")}>
      {tiles.map((tile) => {
        const placement = {
          "--svc-angle": `${tile.angle}deg`,
          "--svc-radius": `${radius}px`,
          "--svc-size": `${tile.size}px`,
          "--svc-corner": tile.shape === "round" ? "50%" : `${tile.cornerRadius ?? 18}px`,
          "--svc-glow": GLOW_TOKENS[tile.glow],
          "--svc-fly-delay": `${tile.flyDelay}s`,
        } as CSSProperties;

        return (
          <div
            key={tile.id}
            className={active ? "svc-tile is-in" : "svc-tile"}
            style={placement}
            data-shape={tile.shape}
          >
            <div className={reducedMotion ? "svc-tile__inner is-static" : "svc-tile__inner"}>
              {tile.kind === "video" ? (
                <video
                  className="svc-tile__media"
                  poster={REEL.poster}
                  muted
                  loop
                  playsInline
                  autoPlay={!reducedMotion}
                  preload="metadata"
                  aria-label="Dorvell Ferguson motion reel"
                >
                  <source src={REEL.webm} type="video/webm" />
                  <source src={REEL.mp4} type="video/mp4" />
                </video>
              ) : tile.image ? (
                <Image
                  className="svc-tile__media"
                  src={tile.image.src}
                  alt=""
                  width={tile.image.width}
                  height={tile.image.height}
                  sizes="120px"
                  placeholder={tile.image.blurDataURL ? "blur" : "empty"}
                  blurDataURL={tile.image.blurDataURL}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ServicesHero({
  tiles,
  active,
  reducedMotion,
  onStartProject,
  emailHref,
}: {
  tiles: OrbitTile[];
  active: boolean;
  reducedMotion: boolean;
  onStartProject: () => void;
  emailHref: string;
}) {
  const fullHeading = HERO_HEADING.lead + HERO_HEADING.accent;
  const { typed, done } = useTypewriter(fullHeading, { active, reducedMotion });
  const count = useCountUp(CENTER_STAT.target, { delayMs: 1200, active, reducedMotion });

  const typedLead = typed.slice(0, HERO_HEADING.lead.length);
  const typedAccent = typed.slice(HERO_HEADING.lead.length);

  const tilesByOrbit = [0, 1, 2, 3].map((orbit) => tiles.filter((tile) => tile.orbit === orbit));

  return (
    <section className={active ? "svc-hero is-in" : "svc-hero"} aria-labelledby="svc-hero-title">
      <div className="svc-hero__left">
        <p className="eyebrow svc-hero__eyebrow">Services · Tampa &amp; on location</p>

        <h1 id="svc-hero-title" className="svc-hero__title" tabIndex={-1}>
          <span aria-hidden="true">
            <span className="svc-hero__lead">{typedLead}</span>
            <span className="svc-hero__accent">{typedAccent}</span>
            <span className={done ? "svc-caret is-idle" : "svc-caret"} />
          </span>
          <span className="sr-only">{fullHeading}</span>
        </h1>

        <p className="svc-hero__subhead">{HERO_SUBHEAD}</p>

        <div className="svc-hero__actions">
          <span className="svc-border-wrap">
            <button type="button" className="svc-cta svc-cta--primary" onClick={onStartProject}>
              <span className="svc-cta__label">Start a project</span>
              <ChevronRight />
            </button>
          </span>
          <a className="svc-cta svc-cta--ghost" href={emailHref}>
            Email Dorvell
          </a>
        </div>

        <span className="svc-hero__cursor" aria-hidden="true">
          <CursorGlyph />
          <span className="svc-hero__cursor-label">Tampa, FL</span>
        </span>
      </div>

      <div className="svc-hero__right">
        <div className="svc-circles" role="img" aria-label={`${CENTER_STAT.target}${CENTER_STAT.suffix} ${CENTER_STAT.label}, orbited by portfolio frames and a motion reel`}>
          {tilesByOrbit.map((orbitTiles, orbit) => (
            <Orbit key={orbit} index={orbit} tiles={orbitTiles} active={active} reducedMotion={reducedMotion} />
          ))}
          <div className="svc-center">
            <span className="svc-center__value">
              {count}
              {CENTER_STAT.suffix}
            </span>
            <span className="svc-center__label">{CENTER_STAT.label}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
