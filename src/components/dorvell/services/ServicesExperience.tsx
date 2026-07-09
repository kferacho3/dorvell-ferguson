"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { buildBookingMailto, type OrbitTile } from "@/lib/services-content";
import { ServicesHero } from "./ServicesHero";
import { ServicesIntro, type IntroFrame } from "./ServicesIntro";
import { ServicesPricing, type ServiceCardData } from "./ServicesPricing";
import { ServicesTicker } from "./ServicesTicker";

const INTRO_SEEN_KEY = "df-services-intro-seen";

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readIntroSeen() {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Session storage unavailable; the intro simply plays again next visit.
  }
}

export function ServicesExperience({
  introFrames,
  symbolSrc,
  tiles,
  services,
  email,
}: {
  introFrames: IntroFrame[];
  symbolSrc: string;
  tiles: OrbitTile[];
  services: ServiceCardData[];
  email: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [introDone, setIntroDone] = useState(false);

  // Skip the intro before paint for returning visitors and hash deep links.
  useIsomorphicLayoutEffect(() => {
    if (readIntroSeen() || window.location.hash.length > 1) {
      setIntroDone(true);
    }
  }, []);

  const handleIntroDone = useCallback(() => {
    writeIntroSeen();
    setIntroDone(true);
    // Move focus onto the revealed hero heading instead of letting it fall to
    // <body> when the intro overlay unmounts (WCAG 2.4.3 Focus Order).
    window.requestAnimationFrame(() => {
      document.getElementById("svc-hero-title")?.focus();
    });
  }, []);

  const scrollToServices = useCallback(() => {
    document
      .getElementById("svc-services")
      ?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }, [reducedMotion]);

  return (
    <div className="svc-page">
      {!introDone ? (
        <ServicesIntro
          frames={introFrames}
          symbolSrc={symbolSrc}
          reducedMotion={reducedMotion}
          onDone={handleIntroDone}
        />
      ) : null}

      <ServicesHero
        tiles={tiles}
        active={introDone}
        reducedMotion={reducedMotion}
        onStartProject={scrollToServices}
        emailHref={buildBookingMailto(email, 1)}
      />
      <ServicesPricing services={services} email={email} />
      <ServicesTicker active={introDone} />
    </div>
  );
}
