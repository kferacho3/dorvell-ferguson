"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { blurImageProps, imageAlt } from "@/lib/images";
import { getCategoryDef } from "@/lib/portfolio-taxonomy";
import { featuredImages } from "@/lib/portfolio-selection";
import { imageCategories } from "@/lib/portfolio-taxonomy";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { socialLinks } from "@/lib/social-links";
import { AtlasOrbitField } from "../AtlasOrbitField";
import { usePortfolioData } from "./PortfolioModeProvider";
import { usePortfolioMode } from "./portfolioMode";
import { PortfolioModeSwitch } from "./PortfolioModeSwitch";
import { PortfolioCategoryChips } from "./PortfolioCategoryChips";

const ROTATE_MS = 4200;

export function PortfolioHero() {
  const { images } = usePortfolioData();
  const { mode } = usePortfolioMode();
  const reducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  const preview = useMemo(() => featuredImages(images, 6), [images]);
  const orbitImages = useMemo(() => featuredImages(images, 14), [images]);
  const activeImage = preview[active] ?? preview[0];
  const activeDef = activeImage ? getCategoryDef(imageCategories(activeImage)[0]) : getCategoryDef("Portraits");

  useEffect(() => {
    if (reducedMotion || preview.length <= 1) return;
    const id = window.setInterval(() => {
      if (document.hidden || pausedRef.current) return;
      setActive((current) => (current + 1) % preview.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, preview.length]);

  return (
    <section
      className="pf-hero"
      aria-labelledby="pf-hero-title"
      style={{ "--lane-accent": activeDef.accent } as CSSProperties}
    >
      {mode === "cinematic" ? (
        <div className="pf-hero__orbit">
          <AtlasOrbitField images={orbitImages} />
        </div>
      ) : null}

      <div className="pf-hero__inner">
        <div className="pf-hero__copy">
          <p className="pf-eyebrow">The Work Index</p>
          <h1 className="pf-hero__title" id="pf-hero-title">
            Images with <em>presence</em>.
          </h1>
          <p className="pf-hero__lead">
            Portraits, concerts, sports, studio work, fashion, events, and photojournalism — organized
            as a living index of Dorvell Ferguson Jr.&rsquo;s visual world. Explore it your way, from
            calm contact sheets to immersive, motion-led rooms.
          </p>

          <div className="pf-hero__controls">
            <PortfolioModeSwitch />
          </div>
          <PortfolioCategoryChips className="pf-hero__chips" />

          <div className="pf-hero__actions">
            <Link className="button-primary" href="/contact">
              Book a shoot
            </Link>
            <Link className="button-secondary" href="/contact">
              Hire for coverage
            </Link>
            <a
              className="pf-hero__ig"
              href={socialLinks.instagramPhotography}
              target="_blank"
              rel="noreferrer"
            >
              @fergphotography ↗
            </a>
          </div>
        </div>

        <div
          className="pf-hero__preview"
          aria-label="Featured work preview"
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
          onFocusCapture={() => {
            pausedRef.current = true;
          }}
          onBlurCapture={() => {
            pausedRef.current = false;
          }}
        >
          {preview.map((image, index) => (
            <figure
              key={image.id}
              className={cn("pf-frame pf-frame--cover", index === active && "is-active")}
              aria-hidden={index === active ? undefined : "true"}
            >
              <Image
                src={image.localOptimized.md}
                alt={index === active ? imageAlt(image) : ""}
                width={image.width}
                height={image.height}
                sizes="(max-width: 900px) 92vw, 44vw"
                priority={index === 0}
                unoptimized
                {...blurImageProps(image)}
              />
            </figure>
          ))}

          {activeImage ? (
            <div className="pf-hero__preview-meta">
              <strong>{activeImage.projectTitle ?? getCategoryDef(imageCategories(activeImage)[0]).label}</strong>
              <span>{getCategoryDef(imageCategories(activeImage)[0]).label}</span>
            </div>
          ) : null}

          {preview.length > 1 ? (
            <div className="pf-hero__preview-dots" role="group" aria-label="Featured frames">
              {preview.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  aria-pressed={index === active}
                  aria-label={`Show featured frame ${index + 1}`}
                  className={cn(index === active && "is-active")}
                  onClick={() => setActive(index)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
