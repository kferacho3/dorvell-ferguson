"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { heroCreativeItem } from "@/content/creative";
import { VideoPlayer } from "./VideoPlayer";
import { CreativeModeSwitch } from "./CreativeModeSwitch";
import { useCreativeMode } from "./creativeMode";

const MICRO_LABELS = ["Video", "Photo", "Motion", "Styling", "Culture", "Shadow", "Concept"];

/**
 * Section 1 — Cinematic hero / video monolith.
 * In Cinematic mode a tall section pins a full-bleed clip that scales into a
 * framed object as you scroll, while the wordmark masks away. Progress written
 * to a CSS var via ref (no per-frame React re-render). Calm/reduced motion →
 * a static, poster-first, normal-height hero.
 */
export function CreativeHeroVideo() {
  const { mode } = useCreativeMode();
  const reducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const immersive = mode === "cinematic" && !reducedMotion;

  useEffect(() => {
    if (!immersive) {
      sectionRef.current?.style.setProperty("--p", "0");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
      el.style.setProperty("--p", String(p));
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [immersive]);

  return (
    <section
      ref={sectionRef}
      className={cn("cw-hero", immersive ? "cw-hero--immersive" : "cw-hero--calm")}
      aria-label="Creative Worlds — introduction"
    >
      <div className="cw-hero__sticky">
        <div className="cw-hero__media">
          <VideoPlayer
            item={heroCreativeItem}
            mode="ambient"
            priority
            loop
            controls={false}
            framed={false}
          />
          <div className="cw-hero__scrim" aria-hidden="true" />
        </div>

        <div className="cw-container cw-hero__overlay">
          <p className="cw-hero__eyebrow">The Creative Index</p>
          <h1 className="cw-hero__title">
            <span className="cw-hero__word">Creative</span>
            <span className="cw-hero__word cw-hero__word--accent">Worlds</span>
          </h1>
          <p className="cw-hero__lede">
            Cinematic shorts, concept shoots, motion studies, and visual experiments by Dorvell Ferguson Jr.
          </p>
          <ul className="cw-hero__labels" aria-label="What lives here">
            {MICRO_LABELS.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
          <div className="cw-hero__modeswitch">
            <CreativeModeSwitch variant="hero" />
          </div>
        </div>

        <div className="cw-hero__foot">
          <span className="cw-hero__cue">Scroll to enter</span>
          <div className="cw-hero__progress" aria-hidden="true">
            <div ref={progressRef} className="cw-hero__progress-fill" />
          </div>
        </div>
      </div>
    </section>
  );
}
