"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { ModelingImage } from "@/components/modeling/modelingTypes";

/**
 * Horizontal editorial drift — sticky section whose track translates with
 * native scroll progress while each print counter-drifts inside its frame
 * (image bleeds 18% so a ±8% shift never exposes edges). Adapted from the
 * Codrops horizontal parallax gallery, rebuilt on native scroll for touch,
 * keyboard, and reduced-motion support.
 */

type ModelingDriftGalleryProps = {
  images: ModelingImage[];
  title: string;
  kicker: string;
};

export function ModelingDriftGallery({ images, title, kicker }: ModelingDriftGalleryProps) {
  const reducedMotion = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const frames = images.slice(0, 8);

  useEffect(() => {
    if (reducedMotion) return;
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    if (!wrapper || !track) return;

    const prints = Array.from(track.querySelectorAll<HTMLElement>(".modeling-drift__print"));
    let raf = 0;
    let current = 0;
    let running = false;

    const measure = () => ({
      trackWidth: track.scrollWidth,
      viewWidth: wrapper.clientWidth,
      // Document-space top (offsetTop would be relative to the positioned route wrapper).
      wrapperTop: wrapper.getBoundingClientRect().top + window.scrollY,
      wrapperHeight: wrapper.offsetHeight,
    });
    let metrics = measure();
    const onResize = () => {
      metrics = measure();
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!running) return;
      const scrollable = metrics.wrapperHeight - window.innerHeight;
      const progress = scrollable > 0
        ? Math.min(1, Math.max(0, (window.scrollY - metrics.wrapperTop) / scrollable))
        : 0;
      const target = progress * Math.max(0, metrics.trackWidth - metrics.viewWidth);
      current += (target - current) * 0.09;
      track.style.transform = `translate3d(${-current}px, 0, 0)`;

      const viewCenter = metrics.viewWidth / 2;
      prints.forEach((print) => {
        const parent = print.parentElement as HTMLElement;
        const center = parent.offsetLeft - current + parent.offsetWidth / 2;
        const t = Math.max(-1, Math.min(1, (center - viewCenter) / viewCenter));
        print.style.transform = `translate3d(${-t * 8}%, 0, 0)`;
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        running = entries.some((entry) => entry.isIntersecting);
      },
      { rootMargin: "80px 0px" },
    );
    io.observe(wrapper);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      // If reduced motion flips on mid-scroll, the static variant relies on
      // native overflow scrolling — leftover transforms must not shift it.
      track.style.transform = "";
      prints.forEach((print) => {
        print.style.transform = "";
      });
    };
  }, [reducedMotion, frames.length]);

  if (frames.length === 0) return null;

  return (
    <section
      ref={wrapperRef}
      className={`modeling-drift${reducedMotion ? " modeling-drift--static" : ""}`}
      aria-labelledby="modeling-drift-title"
    >
      <div className="modeling-drift__stage">
        <header className="modeling-drift__head">
          <p className="modeling-kicker">{kicker}</p>
          <h2 id="modeling-drift-title">{title}</h2>
        </header>
        <ul className="modeling-drift__track" ref={trackRef}>
          {frames.map((image, index) => (
            <li key={image.id} className="modeling-drift__frame">
              <div className="modeling-drift__print">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={Math.max(image.width, 1)}
                  height={Math.max(image.height, 1)}
                  sizes="(min-width: 1100px) 44vw, 82vw"
                  unoptimized
                  loading={index < 2 ? "eager" : "lazy"}
                  {...(image.blur ? { placeholder: "blur" as const, blurDataURL: image.blur } : {})}
                />
              </div>
              <span className="modeling-drift__index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
