"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { ModelingImage } from "@/components/modeling/modelingTypes";

/**
 * The private contact sheet — a monochrome archive that develops to color
 * around the cursor. Adapted from the Codrops proximity grid: squared-distance
 * falloff + frame-rate-independent smoothing, rebuilt in DOM (filter:
 * grayscale + scale + z-index) with one rAF loop and imperative style writes.
 * Touch and reduced motion fall back to hover/focus color reveals in CSS.
 */

type ModelingContactSheetProps = {
  images: ModelingImage[];
};

export function ModelingContactSheet({ images }: ModelingContactSheetProps) {
  const reducedMotion = usePrefersReducedMotion();
  const gridRef = useRef<HTMLUListElement>(null);
  const cells = images.slice(0, 18);

  useEffect(() => {
    if (reducedMotion) return;
    const grid = gridRef.current;
    if (!grid) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const items = Array.from(grid.querySelectorAll<HTMLElement>(".modeling-sheet__cell"));
    let raf = 0;
    let running = false;
    const pointer = { x: -1, y: -1, tx: -1, ty: -1, inside: false };
    let lastTime = performance.now();

    const onPointerMove = (event: PointerEvent) => {
      pointer.tx = event.clientX;
      pointer.ty = event.clientY;
      pointer.inside = true;
    };
    const onPointerLeave = () => {
      pointer.inside = false;
    };
    grid.addEventListener("pointermove", onPointerMove);
    grid.addEventListener("pointerleave", onPointerLeave);

    const io = new IntersectionObserver(
      (entries) => {
        running = entries.some((entry) => entry.isIntersecting);
      },
      { rootMargin: "60px 0px" },
    );
    io.observe(grid);

    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      if (!running) return;

      const ease = 1 - Math.pow(0.012, dt);
      pointer.x += (pointer.tx - pointer.x) * ease;
      pointer.y += (pointer.ty - pointer.y) * ease;

      const gridRect = grid.getBoundingClientRect();
      const falloff = 9 / Math.max(gridRect.width, 1) ** 2;

      items.forEach((item) => {
        const centerX = gridRect.left + item.offsetLeft + item.offsetWidth / 2;
        const centerY = gridRect.top + item.offsetTop + item.offsetHeight / 2;
        const dx = pointer.x - centerX;
        const dy = pointer.y - centerY;
        const influence = pointer.inside
          ? Math.max(0, 1 - (dx * dx + dy * dy) * falloff * 4)
          : 0;
        item.style.filter = `grayscale(${(1 - influence).toFixed(3)})`;
        item.style.transform = `scale(${(1 + influence * 0.055).toFixed(4)})`;
        item.style.zIndex = String(Math.round(influence * 10));
      });
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      grid.removeEventListener("pointermove", onPointerMove);
      grid.removeEventListener("pointerleave", onPointerLeave);
      items.forEach((item) => {
        item.style.filter = "";
        item.style.transform = "";
        item.style.zIndex = "";
      });
    };
  }, [reducedMotion, cells.length]);

  if (cells.length === 0) return null;

  return (
    <section className="modeling-sheet" aria-labelledby="modeling-sheet-title">
      <header className="modeling-sheet__head">
        <p className="modeling-kicker">The archive</p>
        <h2 id="modeling-sheet-title">Contact sheet, kept in the dark.</h2>
        <p className="modeling-sheet__note">Move across the sheet — frames develop where you look.</p>
      </header>
      <ul className="modeling-sheet__grid" ref={gridRef}>
        {cells.map((image) => (
          <li key={image.id} className="modeling-sheet__cell">
            <Image
              src={image.src}
              alt={image.alt}
              width={Math.max(image.width, 1)}
              height={Math.max(image.height, 1)}
              sizes="(min-width: 1100px) 16vw, 30vw"
              unoptimized
              loading="lazy"
              {...(image.blur ? { placeholder: "blur" as const, blurDataURL: image.blur } : {})}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
