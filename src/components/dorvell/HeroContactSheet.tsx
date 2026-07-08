"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps } from "@/lib/images";

const POOL_SIZE = 6;
const SPAWN_DISTANCE = 160; // px of travel before a new ghost drops
const SPAWN_INTERVAL = 180; // ms between ghosts
const LIFETIME = 950; // ms fade/settle

/**
 * Photographic contact-sheet cursor trailer for the hero — a restrained,
 * documentary take on the codrops ghost-image effect. Desktop only and heavily
 * gated: fine pointer + hover + not reduced-motion + width ≥ 1024. A fixed pool
 * of grayscale frames is recycled (no node churn); a ghost spawns only after
 * both ≥160px of travel AND ≥180ms elapse, then settles (scale 1.04→1.0) and
 * fades over 950ms via CSS transitions — so there is no continuous rAF loop.
 * All work happens on refs/DOM inside effects: no React state, lint-clean.
 */
export function HeroContactSheet({ images }: { images: DorvellImage[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frames = images.slice(0, POOL_SIZE);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer || !canHover || reducedMotion.matches || window.innerWidth < 1024) return;

    const hero = container.closest<HTMLElement>(".about-hero") ?? container.parentElement;
    if (!hero) return;

    const nodes = Array.from(container.querySelectorAll<HTMLElement>(".about-hero__ghostframe"));
    if (nodes.length === 0) return;

    const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
    const timers = new Map<HTMLElement, number>();
    let inside = false;
    let poolIndex = 0;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;

    const spawn = (x: number, y: number) => {
      const node = nodes[poolIndex % nodes.length];
      poolIndex += 1;
      const rotation = (Math.random() * 8 - 4).toFixed(2);

      const prior = timers.get(node);
      if (prior) window.clearTimeout(prior);

      node.style.transition = "none";
      node.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(1.04)`;
      node.style.opacity = "0.7";

      window.requestAnimationFrame(() => {
        node.style.transition = `transform ${LIFETIME}ms ${ease}, opacity ${LIFETIME}ms ${ease}`;
        node.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(1)`;
        node.style.opacity = "0";
      });

      const timer = window.setTimeout(() => timers.delete(node), LIFETIME + 60);
      timers.set(node, timer);
    };

    const onEnter = () => {
      inside = true;
    };
    const onLeave = () => {
      inside = false;
    };
    const onMove = (event: PointerEvent) => {
      if (!inside) return;
      const rect = hero.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const distance = Math.hypot(x - lastX, y - lastY);
      if (distance >= SPAWN_DISTANCE && event.timeStamp - lastTime >= SPAWN_INTERVAL) {
        spawn(x, y);
        lastX = x;
        lastY = y;
        lastTime = event.timeStamp;
      }
    };

    const onReducedChange = () => {
      if (reducedMotion.matches) {
        inside = false;
        nodes.forEach((node) => {
          node.style.opacity = "0";
        });
      }
    };

    hero.addEventListener("pointerenter", onEnter);
    hero.addEventListener("pointerleave", onLeave);
    hero.addEventListener("pointermove", onMove);
    reducedMotion.addEventListener("change", onReducedChange);

    return () => {
      hero.removeEventListener("pointerenter", onEnter);
      hero.removeEventListener("pointerleave", onLeave);
      hero.removeEventListener("pointermove", onMove);
      reducedMotion.removeEventListener("change", onReducedChange);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <div className="about-hero__trailer" aria-hidden="true" ref={containerRef}>
      {frames.map((image, index) => (
        <span className="about-hero__ghostframe" key={`${image.id}-${index}`}>
          <Image
            src={image.localOptimized.sm}
            alt=""
            width={image.width}
            height={image.height}
            {...blurImageProps(image)}
          />
        </span>
      ))}
    </div>
  );
}
