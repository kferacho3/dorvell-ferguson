"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { heroCreativeItem } from "@/content/creative";
import { VideoPlayer } from "./VideoPlayer";
import { CreativeModeSwitch } from "./CreativeModeSwitch";
import { useCreativeMode } from "./creativeMode";

const sections = [
  { href: "#cw-featured", label: "Films" },
  { href: "#creative-photoshoots", label: "Photoshoots" },
  { href: "#cw-archive", label: "Archive" },
] as const;

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
  const stickyRef = useRef<HTMLDivElement | null>(null);
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
      const sticky = stickyRef.current;
      if (!el || !sticky) return;
      const rect = el.getBoundingClientRect();
      const top = Number.parseFloat(window.getComputedStyle(sticky).top);
      const total = el.offsetHeight - sticky.offsetHeight;
      const p =
        total > 0 ? Math.min(Math.max((top - rect.top) / total, 0), 1) : 0;
      el.style.setProperty("--p", String(p));
      if (progressRef.current)
        progressRef.current.style.transform = `scaleX(${p})`;
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
      className={cn(
        "cw-hero",
        immersive ? "cw-hero--immersive" : "cw-hero--calm",
      )}
      aria-label="Creative Worlds — introduction"
    >
      <div
        ref={stickyRef}
        className={cn(
          "cw-hero__sticky",
          immersive &&
            "!top-[var(--creative-header)] !h-[calc(100svh-var(--creative-header))] [--creative-header:calc(6.125rem+env(safe-area-inset-top))] md:[--creative-header:calc(4.0625rem+env(safe-area-inset-top))]",
        )}
      >
        <div className="cw-hero__media">
          <VideoPlayer
            item={heroCreativeItem}
            mode="ambient"
            active={immersive}
            priority
            loop
            controls={false}
            framed={false}
            ambientPauseClassName="!bottom-10 !right-4 !top-auto !size-11"
          />
          <div
            className="cw-hero__scrim pointer-events-none"
            aria-hidden="true"
          />
        </div>

        <div className="cw-container cw-container--wide absolute inset-x-0 top-3 z-[4] flex flex-wrap items-center justify-between gap-x-4 sm:top-5">
          <nav
            aria-label="Videography sections"
            className="flex flex-wrap gap-x-4 sm:gap-x-6"
          >
            {sections.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="inline-flex min-h-11 items-center border-b border-transparent text-sm font-semibold text-[var(--cw-ink)] hover:border-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--cw-teal)]"
              >
                {label}
              </a>
            ))}
          </nav>
          <CreativeModeSwitch />
        </div>

        <div className="cw-container cw-hero__overlay pointer-events-none [@media(max-height:500px)]:!gap-2 [@media(max-height:500px)]:!pb-8">
          <p className="cw-hero__eyebrow">Videography</p>
          <h1 className="cw-hero__title [@media(max-height:500px)]:!text-[clamp(2.75rem,14svh,4.8rem)]">
            <span className="cw-hero__word">Creative</span>
            <span className="cw-hero__word cw-hero__word--accent">Worlds</span>
          </h1>
        </div>

        <div className="cw-hero__foot">
          <div className="cw-hero__progress" aria-hidden="true">
            <div ref={progressRef} className="cw-hero__progress-fill" />
          </div>
        </div>
      </div>
    </section>
  );
}
