"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { buildGalleryLanes } from "@/lib/gallery-lanes";

const studioStops = [
  {
    id: "runway",
    label: "Runway",
    href: "#runway-title",
    accent: "#f0b35a",
    readout: "movement check",
  },
  {
    id: "edit",
    label: "Edit Bay",
    href: "#design-title",
    accent: "#35e0bb",
    readout: "rollout logic",
  },
  {
    id: "about",
    label: "Behind Lens",
    href: "#about-title",
    accent: "#48c7ff",
    readout: "story source",
  },
  {
    id: "booking",
    label: "Booking",
    href: "#booking-title",
    accent: "#f04d5e",
    readout: "brief armed",
  },
  {
    id: "closing",
    label: "Closing",
    href: "#closing-frame",
    accent: "#f0b35a",
    readout: "next frame",
  },
] as const;

type StudioStopId = (typeof studioStops)[number]["id"];

export function StudioSignalController({ images, email }: { images: DorvellImage[]; email: string }) {
  const lanes = useMemo(() => buildGalleryLanes(images), [images]);
  const signalFrames = useMemo(
    () =>
      lanes
        .flatMap((lane) =>
          lane.images.slice(0, 2).map((image) => ({
            image,
            lane,
          })),
        )
        .slice(0, 8),
    [lanes],
  );
  const [activeId, setActiveId] = useState<StudioStopId>("runway");
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const activeStop = studioStops.find((stop) => stop.id === activeId) ?? studioStops[0];

  useEffect(() => {
    const root = document.documentElement;
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    let frame = 0;

    const getTargets = () =>
      studioStops
        .map((stop) => ({
          stop,
          element: document.querySelector<HTMLElement>(`[data-studio-section="${stop.id}"]`),
        }))
        .filter((item): item is { stop: (typeof studioStops)[number]; element: HTMLElement } => Boolean(item.element));

    const sync = () => {
      frame = 0;
      const targets = getTargets();
      if (targets.length === 0) return;

      const viewportHeight = window.innerHeight || 1;
      const firstTop = targets[0].element.getBoundingClientRect().top + window.scrollY;
      const lastRect = targets[targets.length - 1].element.getBoundingClientRect();
      const lastBottom = lastRect.bottom + window.scrollY;
      const travel = Math.max(1, lastBottom - firstTop - viewportHeight);
      const nextProgress = clamp((window.scrollY - firstTop + viewportHeight * 0.28) / travel);
      const shouldShow = targets.some(({ element }) => {
        const rect = element.getBoundingClientRect();
        return rect.top < viewportHeight * 0.76 && rect.bottom > viewportHeight * 0.18;
      });

      let closest: { id: StudioStopId; distance: number } = {
        id: targets[0].stop.id,
        distance: Number.POSITIVE_INFINITY,
      };

      targets.forEach(({ stop, element }) => {
        const rect = element.getBoundingClientRect();
        const localProgress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height));
        const centerDistance = (rect.top + rect.height * 0.48 - viewportHeight * 0.5) / viewportHeight;
        const strength = clamp(1 - Math.abs(centerDistance) * 1.35);
        const drift = (0.5 - localProgress) * 72;
        const tilt = centerDistance * -1.8;

        element.style.setProperty("--studio-local", localProgress.toFixed(3));
        element.style.setProperty("--studio-drift", `${drift.toFixed(1)}px`);
        element.style.setProperty("--studio-drift-soft", `${(drift * 0.38).toFixed(1)}px`);
        element.style.setProperty("--studio-drift-reverse", `${(drift * -0.52).toFixed(1)}px`);
        element.style.setProperty("--studio-tilt", `${tilt.toFixed(2)}deg`);
        element.style.setProperty("--studio-tilt-soft", `${(tilt * 0.44).toFixed(2)}deg`);
        element.style.setProperty("--studio-tilt-reverse", `${(tilt * -0.5).toFixed(2)}deg`);
        element.style.setProperty("--studio-glow", strength.toFixed(3));
        element.style.setProperty("--studio-glow-opacity", (0.12 + strength * 0.44).toFixed(3));
        element.classList.toggle("is-studio-live", strength > 0.18);

        const distance = Math.abs(rect.top + rect.height * 0.38 - viewportHeight * 0.48);
        if (distance < closest.distance) closest = { id: stop.id, distance };
      });

      root.style.setProperty("--studio-progress", nextProgress.toFixed(3));
      setProgress(nextProgress);
      setIsVisible(shouldShow);
      setActiveId((current) => (current === closest.id ? current : closest.id));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.style.removeProperty("--studio-progress");
      getTargets().forEach(({ element }) => {
        element.classList.remove("is-studio-live");
        element.style.removeProperty("--studio-local");
        element.style.removeProperty("--studio-drift");
        element.style.removeProperty("--studio-drift-soft");
        element.style.removeProperty("--studio-drift-reverse");
        element.style.removeProperty("--studio-tilt");
        element.style.removeProperty("--studio-tilt-soft");
        element.style.removeProperty("--studio-tilt-reverse");
        element.style.removeProperty("--studio-glow");
        element.style.removeProperty("--studio-glow-opacity");
      });
    };
  }, []);

  if (signalFrames.length === 0) return null;

  return (
    <aside
      aria-label="Production section navigator"
      className={isVisible ? "studio-signal is-visible" : "studio-signal"}
      style={{ "--lane-accent": activeStop.accent, "--studio-meter": progress } as CSSProperties}
    >
      <div className="studio-signal__frames" aria-hidden="true">
        {signalFrames.map(({ image, lane }, index) => (
          <span key={`${image.id}-${index}`} style={{ "--lane-accent": lane.accent } as CSSProperties}>
            <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} />
          </span>
        ))}
      </div>
      <div className="studio-signal__readout">
        <span>Studio sync</span>
        <strong>{activeStop.label}</strong>
        <em>{activeStop.readout}</em>
      </div>
      <div className="studio-signal__meter" aria-hidden="true">
        <span />
      </div>
      <nav className="studio-signal__stops" aria-label="Production sections">
        {studioStops.map((stop, index) => (
          <Link
            aria-current={stop.id === activeId ? "true" : undefined}
            className={stop.id === activeId ? "is-active" : ""}
            href={stop.href}
            key={stop.id}
            style={{ "--lane-accent": stop.accent } as CSSProperties}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{stop.label}</strong>
          </Link>
        ))}
      </nav>
      <a className="studio-signal__brief" href={`mailto:${email}?subject=${encodeURIComponent("Dorvell Ferguson Jr. booking inquiry")}`}>
        Send the brief
      </a>
    </aside>
  );
}
