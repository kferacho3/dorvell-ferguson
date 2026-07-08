"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import { blurImageProps, imageAlt } from "@/lib/images";
import { getCategoryDef, imageCategories } from "@/lib/portfolio-taxonomy";
import { ringImages } from "@/lib/portfolio-selection";
import { PortfolioLightbox } from "./PortfolioLightbox";
import { useFilteredImages } from "./PortfolioModeProvider";

/**
 * A small "Selected Work" orbiter — a CSS-3D ring of frames that rotates slowly
 * (pauses on hover, stops under reduced motion). A transitional showpiece, not
 * the main gallery. Pure CSS 3D so there's no WebGL cost.
 */
export function SelectedWorkRing() {
  const images = useFilteredImages();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const ring = useMemo(() => ringImages(images, 10), [images]);

  if (ring.length < 4) return null;
  const count = ring.length;

  return (
    <section className="pf-ring" aria-labelledby="pf-ring-title">
      <div className="pf-grain-layer" />
      <div className="pf-container pf-ring__head">
        <p className="pf-eyebrow">Selected Rotation</p>
        <h2 id="pf-ring-title">In orbit.</h2>
        <p>A slow turn through selected frames — hover to hold it still, click to open.</p>
      </div>

      <div className="pf-ring__stage">
        <div className="pf-ring__pivot">
          <div className="pf-ring__spin">
            {ring.map((image, index) => {
              const def = getCategoryDef(imageCategories(image)[0]);
              return (
                <button
                  key={image.id}
                  type="button"
                  className="pf-ring__card pf-frame pf-frame--cover"
                  aria-label={`Open selected frame ${index + 1}: ${imageAlt(image)}`}
                  style={
                    {
                      "--angle": `${(360 / count) * index}deg`,
                      "--lane-accent": def.accent,
                    } as CSSProperties
                  }
                  onClick={() => setLightbox(index)}
                >
                  <Image
                    src={image.localOptimized.sm}
                    alt={imageAlt(image)}
                    width={image.width}
                    height={image.height}
                    sizes="220px"
                    loading="lazy"
                    unoptimized
                    {...blurImageProps(image)}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {lightbox !== null ? (
        <PortfolioLightbox
          images={ring}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox(index)}
        />
      ) : null}
    </section>
  );
}
