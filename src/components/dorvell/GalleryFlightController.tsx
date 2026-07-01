"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps } from "@/lib/images";
import { buildGalleryLanes, type GalleryLaneKey } from "@/lib/gallery-lanes";

export function GalleryFlightController({ images }: { images: DorvellImage[] }) {
  const lanes = useMemo(() => buildGalleryLanes(images), [images]);
  const [activeKey, setActiveKey] = useState<GalleryLaneKey>(lanes[0]?.key ?? "portraits");
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const activeLane = lanes.find((lane) => lane.key === activeKey) ?? lanes[0];
  const activeLead = activeLane?.images[0];

  useEffect(() => {
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const worlds = Array.from(document.querySelectorAll<HTMLElement>(".gallery-world"));
    const wrapper = document.querySelector<HTMLElement>(".gallery-worlds");
    if (worlds.length === 0 || !wrapper) return undefined;

    wrapper.classList.add("is-directed");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) element.classList.add("is-in-view");
        });
      },
      { rootMargin: "-34% 0px -42% 0px", threshold: [0.18, 0.34, 0.5, 0.68] },
    );

    worlds.forEach((world) => observer.observe(world));

    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const rect = wrapper.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const next = travel <= 0 ? 0 : Math.min(1, Math.max(0, (rect.top * -1) / travel));
      setProgress(next);
      setIsVisible(rect.top < window.innerHeight * 0.72 && rect.bottom > window.innerHeight * 0.28);

      const focusY = window.innerHeight * 0.48;
      const closest = worlds.reduce<{ key: GalleryLaneKey | null; distance: number }>(
        (best, world) => {
          const worldRect = world.getBoundingClientRect();
          const localProgress = clamp((window.innerHeight - worldRect.top) / (window.innerHeight + worldRect.height));
          const worldCenter = worldRect.top + worldRect.height * 0.5;
          const centerDistance = (worldCenter - focusY) / window.innerHeight;
          const loopShift = (0.5 - localProgress) * 280;
          const loopOpacity = 0.18 + Math.max(0, 1 - Math.abs(centerDistance) * 1.25) * 0.26;

          world.style.setProperty("--world-progress", localProgress.toFixed(3));
          world.style.setProperty("--world-loop-shift", `${loopShift.toFixed(1)}px`);
          world.style.setProperty("--world-loop-opacity", loopOpacity.toFixed(3));
          world.style.setProperty("--world-depth-shift", `${(-centerDistance * 34).toFixed(1)}px`);
          world.style.setProperty("--world-stack-shift", `${(centerDistance * 9.5).toFixed(1)}px`);
          world.style.setProperty("--world-lead-tilt", `${(1.2 + centerDistance * -2.2).toFixed(2)}deg`);
          world.style.setProperty("--world-stack-tilt", `${(-5 + centerDistance * 3).toFixed(2)}deg`);

          if (worldRect.top < window.innerHeight * 0.78 && worldRect.bottom > window.innerHeight * 0.12) {
            world.classList.add("is-in-view");
          }
          const center = worldRect.top + worldRect.height * 0.42;
          const distance = Math.abs(center - focusY);
          const key = world.getAttribute("data-lane-key") as GalleryLaneKey | null;
          return key && distance < best.distance ? { key, distance } : best;
        },
        { key: null, distance: Number.POSITIVE_INFINITY },
      );

      const nextKey = closest.key;
      if (nextKey) {
        setActiveKey((current) => (current === nextKey ? current : nextKey));
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      wrapper.classList.remove("is-directed");
      worlds.forEach((world) => world.classList.remove("is-in-view"));
    };
  }, []);

  if (lanes.length === 0) return null;

  return (
    <nav
      aria-label="Gallery scroll navigator"
      className={isVisible ? "gallery-flight is-visible" : "gallery-flight"}
      style={{ "--lane-accent": activeLane?.accent ?? "#35e0bb", "--flight-progress": progress } as CSSProperties}
    >
      <div className="gallery-flight__preview" aria-hidden="true">
        {activeLead ? (
          <Image
            key={activeLead.id}
            src={activeLead.localOptimized.sm}
            alt=""
            width={activeLead.width}
            height={activeLead.height}
            {...blurImageProps(activeLead)}
          />
        ) : null}
        <span>{activeLane?.deckLabel}</span>
      </div>
      <div className="gallery-flight__track" aria-hidden="true">
        <span />
      </div>
      <div className="gallery-flight__links">
        {lanes.map((lane, index) => (
          <Link
            aria-current={lane.key === activeKey ? "true" : undefined}
            className={lane.key === activeKey ? "is-active" : ""}
            href={`#${lane.slug}`}
            key={lane.key}
            onFocus={() => setActiveKey(lane.key)}
            onMouseEnter={() => setActiveKey(lane.key)}
            style={{ "--lane-accent": lane.accent } as CSSProperties}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{lane.label}</strong>
          </Link>
        ))}
      </div>
    </nav>
  );
}
