"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { photomodeSets, type PhotomodeSet } from "@/content/creative";
import { socialLinks } from "@/lib/social-links";
import { useInView } from "./useInView";

const ROTATIONS = ["-5deg", "4deg", "-3deg", "6deg"];

/** One photomode set as a taped print that cycles its frames like a gif. */
function GifPrint({ set, index }: { set: PhotomodeSet; index: number }) {
  const reducedMotion = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);

  const animated = !reducedMotion && set.items.length > 1;

  useEffect(() => {
    if (!animated || !inView || paused) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % set.items.length), 380);
    return () => clearInterval(id);
  }, [animated, inView, paused, set.items.length]);

  const bloomSrc = resolveCreativeAsset(set.items[frame]?.mdSrc ?? set.items[0].mdSrc);

  return (
    <div
      ref={ref}
      className="cw-graf__printwrap"
      style={{ ["--rot" as string]: ROTATIONS[index % ROTATIONS.length] }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {/* chromatic + lens-blur bloom of the current frame — glows around the print */}
      <span className="cw-graf__bloom" style={{ backgroundImage: `url(${bloomSrc})` }} aria-hidden="true" />
      <div className="cw-graf__print">
        <span className="cw-graf__tape cw-graf__tape--tl" aria-hidden="true" />
        <span className="cw-graf__tape cw-graf__tape--br" aria-hidden="true" />
        <span className="cw-graf__gifbadge">{animated ? "GIF" : "STILL"}</span>
        <div className="cw-graf__photo">
          {set.items.map((image, i) => (
            <Image
              key={image.slug}
              src={resolveCreativeAsset(image.mdSrc)}
              alt={i === 0 ? `${set.label} — @2kferg photomode` : ""}
              fill
              unoptimized
              sizes="(max-width: 760px) 80vw, 360px"
              placeholder={image.blurDataURL ? "blur" : "empty"}
              blurDataURL={image.blurDataURL}
              className="cw-graf__frame"
              style={{ opacity: i === frame ? 1 : 0 }}
            />
          ))}
          <span className="cw-graf__chroma" aria-hidden="true" style={{ backgroundImage: `url(${bloomSrc})` }} />
          <span className="cw-graf__sheen" aria-hidden="true" />
        </div>
        <div className="cw-graf__caption">
          <span>@2kferg</span>
          <span>{set.items.length} frames</span>
        </div>
      </div>
    </div>
  );
}

/** Reusable chromatic-aberration (RGB channel split) SVG filter, defined once. */
function ChromaticFilterDefs() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="cw-chroma" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="r"
          />
          <feOffset in="r" dx="4" dy="0.6" result="ro" />
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="g"
          />
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="b"
          />
          <feOffset in="b" dx="-4" dy="-0.6" result="bo" />
          <feBlend in="ro" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="bo" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * Photomode graffiti wall — the @2kferg TikTok photomode bursts sprayed back to
 * life: gif-cycling taped prints on a concrete wall lit by a bold gradient,
 * cinematic but with street energy. Reduced motion → static first frame.
 */
export function PhotomodeGraffiti() {
  if (!photomodeSets.length) return null;

  return (
    <section className="cw-section cw-graf" aria-labelledby="cw-graf-title">
      <ChromaticFilterDefs />
      <span className="cw-graf__glow" aria-hidden="true" />
      <span className="cw-graf__sticker cw-graf__sticker--1" aria-hidden="true">
        2KFERG
      </span>
      <span className="cw-graf__sticker cw-graf__sticker--2" aria-hidden="true">
        EST. TAMPA
      </span>

      <div className="cw-container cw-graf__inner">
        <div className="cw-graf__head">
          <p className="cw-eyebrow">Photomode · @2kferg</p>
          <h2 id="cw-graf-title" className="cw-graf__tag" data-text="PHOTOMODE">
            PHOTOMODE
          </h2>
          <p className="cw-lede">
            Stills ripped straight from the feed and sprayed back to the wall — the @2kferg photomode bursts,
            back in motion.
          </p>
        </div>

        <div className="cw-graf__wall">
          {photomodeSets.map((set, index) => (
            <GifPrint key={set.slug} set={set} index={index} />
          ))}
        </div>

        <div className="cw-actions cw-graf__actions">
          <a className="cw-btn cw-btn--accent" href={socialLinks.instagramPersonal} target="_blank" rel="noreferrer">
            More @2kferg
          </a>
          {socialLinks.tiktok ? (
            <a className="cw-btn cw-btn--ghost" href={socialLinks.tiktok} target="_blank" rel="noreferrer">
              Watch on TikTok
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
