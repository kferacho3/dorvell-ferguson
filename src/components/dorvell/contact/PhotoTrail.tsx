"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// One-shot fine-pointer probe (trail is desktop/pointer-only).
let finePointer: boolean | null = null;
const subscribeNever = () => () => {};
const getFinePointer = () => {
  if (finePointer === null) {
    finePointer =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches &&
      window.innerWidth > 760;
  }
  return finePointer;
};
const getServerFinePointer = () => false;

const POOL = 16;
const THRESHOLD = 90;

type Props = {
  photos: string[];
  /** Region to NOT spawn over (the form/video card). */
  holeRef: RefObject<HTMLElement | null>;
  className?: string;
};

/**
 * Infinite photo trail. Moving the pointer over the background flings frames
 * from the (large) photo bank. A shuffled bag walks the whole bank before any
 * repeat, so it stays "hard to see the same photo twice". Purely decorative:
 * pointer-events:none, aria-hidden, and disabled on reduced-motion / touch.
 */
export function PhotoTrail({ photos, holeRef, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const fine = useSyncExternalStore(subscribeNever, getFinePointer, getServerFinePointer);
  const enabled = fine && !reducedMotion && photos.length > 0;

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    // shuffled bag over the whole bank; reshuffle (avoiding an immediate
    // repeat) once exhausted.
    let bag: string[] = [];
    let last = "";
    const refill = () => {
      bag = photos.slice();
      for (let i = bag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      if (bag.length > 1 && bag[bag.length - 1] === last) {
        [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
    };
    const nextSrc = () => {
      if (bag.length === 0) refill();
      const src = bag.pop() as string;
      last = src;
      return src;
    };

    // reusable image pool
    const slots: HTMLImageElement[] = [];
    for (let i = 0; i < POOL; i += 1) {
      const img = document.createElement("img");
      img.className = "photo-trail__img";
      img.alt = "";
      img.decoding = "async";
      img.loading = "eager";
      container.appendChild(img);
      slots.push(img);
    }

    let slotIndex = 0;
    let zIndex = 1;
    let lastX = 0;
    let lastY = 0;
    let lastSpawn = 0;
    let primed = false;

    // Cache rects (updated on scroll/resize) so the pointermove hot path never
    // calls getBoundingClientRect.
    let holeRect: DOMRect | null = null;
    let containerRect = container.getBoundingClientRect();
    let rectRaf = 0;
    const refreshRects = () => {
      rectRaf = 0;
      holeRect = holeRef.current?.getBoundingClientRect() ?? null;
      containerRect = container.getBoundingClientRect();
    };
    const scheduleRefresh = () => {
      if (!rectRaf) rectRaf = requestAnimationFrame(refreshRects);
    };
    refreshRects();

    const insideHole = (x: number, y: number) =>
      holeRect
        ? x >= holeRect.left && x <= holeRect.right && y >= holeRect.top && y <= holeRect.bottom
        : false;

    const spawn = (clientX: number, clientY: number) => {
      const x = clientX - containerRect.left;
      const y = clientY - containerRect.top;
      const img = slots[slotIndex];
      slotIndex = (slotIndex + 1) % POOL;
      zIndex += 1;

      img.getAnimations().forEach((animation) => animation.cancel());
      img.src = nextSrc();
      img.style.left = `${x}px`;
      img.style.top = `${y}px`;
      img.style.zIndex = String(zIndex);
      const rot = (Math.random() * 2 - 1) * 9;
      const base = "translate(-50%, -50%)";

      img.animate(
        [
          { transform: `${base} scale(0.55) rotate(${rot}deg)`, opacity: 0 },
          { transform: `${base} scale(1) rotate(0deg)`, opacity: 1, offset: 0.18 },
          { transform: `${base} scale(1) rotate(0deg)`, opacity: 1, offset: 0.62 },
          { transform: `${base} translateY(-26px) scale(0.92) rotate(${-rot * 0.5}deg)`, opacity: 0 },
        ],
        { duration: 920, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
      );
    };

    const onMove = (event: PointerEvent) => {
      const { clientX, clientY } = event;
      if (!primed) {
        lastX = clientX;
        lastY = clientY;
        primed = true;
        return;
      }
      if (insideHole(clientX, clientY)) {
        lastX = clientX;
        lastY = clientY;
        return;
      }
      if (Math.hypot(clientX - lastX, clientY - lastY) < THRESHOLD) return;
      // cap spawn rate so a fast flick can't fire dozens of image loads at once
      if (event.timeStamp - lastSpawn < 45) return;
      lastSpawn = event.timeStamp;
      lastX = clientX;
      lastY = clientY;
      spawn(clientX, clientY);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", scheduleRefresh);
    window.addEventListener("scroll", scheduleRefresh, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", scheduleRefresh);
      window.removeEventListener("scroll", scheduleRefresh);
      if (rectRaf) cancelAnimationFrame(rectRaf);
      slots.forEach((img) => {
        img.getAnimations().forEach((animation) => animation.cancel());
        img.remove();
      });
    };
  }, [enabled, photos, holeRef]);

  if (!enabled) return null;
  return <div ref={containerRef} className={className ? `photo-trail ${className}` : "photo-trail"} aria-hidden="true" />;
}
