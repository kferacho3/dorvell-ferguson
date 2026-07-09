"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { photomodeSets, type PhotomodeImage } from "@/content/creative";
import { socialLinks } from "@/lib/social-links";

// deterministic loose rotations (no Math.random — SSR-stable)
const ROTATIONS = [-6, 4, -3, 7, -5, 3, -8, 5];

function PolaroidStack({ label, items }: { label: string; items: PhotomodeImage[] }) {
  const [order, setOrder] = useState(() => items.map((_, i) => i));

  // send the top card to the back — the "live printed" flip-through
  const flip = () => setOrder((prev) => (prev.length > 1 ? [...prev.slice(1), prev[0]] : prev));

  return (
    <div className="cw-polaroid__stack">
      <button
        type="button"
        className="cw-polaroid__deck"
        onClick={flip}
        aria-label={`${label} — flip to the next print (${items.length} photos)`}
      >
        {order.map((itemIndex, position) => {
          const image = items[itemIndex];
          const depth = order.length - position; // top card highest
          const rotation = ROTATIONS[itemIndex % ROTATIONS.length];
          const isTop = position === 0;
          return (
            <span
              key={image.slug}
              className={cn("cw-polaroid__card", isTop && "is-top")}
              style={{
                zIndex: depth,
                transform: `translate(-50%, -50%) rotate(${rotation}deg) translateY(${position * 4}px)`,
              }}
            >
              <span className="cw-polaroid__photo">
                <Image
                  src={resolveCreativeAsset(image.mdSrc)}
                  alt={`${label} print ${itemIndex + 1}`}
                  fill
                  unoptimized
                  sizes="320px"
                  placeholder={image.blurDataURL ? "blur" : "empty"}
                  blurDataURL={image.blurDataURL}
                  className="cw-polaroid__img"
                />
              </span>
              <span className="cw-polaroid__caption">@2kferg · photomode</span>
            </span>
          );
        })}
      </button>
      <p className="cw-polaroid__hint">Tap to flip · {items.length} prints</p>
    </div>
  );
}

/**
 * Section — Photomode Polaroids. The @2kferg TikTok stills as live-printed
 * polaroids: loosely rotated, stacked, flip-through on tap. Deterministic
 * rotations keep SSR stable.
 */
export function PhotomodePolaroids() {
  if (!photomodeSets.length) return null;

  return (
    <section className="cw-section cw-polaroid" aria-labelledby="cw-polaroid-title">
      <div className="cw-container">
        <div className="cw-section__head cw-section__head--center">
          <p className="cw-eyebrow">Photomode · @2kferg</p>
          <h2 id="cw-polaroid-title" className="cw-h2">
            Freshly printed.
          </h2>
          <p className="cw-lede">
            Stills pulled straight from the feed and printed to the table — flip through the stacks.
          </p>
        </div>

        <div className="cw-polaroid__sets">
          {photomodeSets.map((set) => (
            <PolaroidStack key={set.slug} label={set.label} items={set.items} />
          ))}
        </div>

        <div className="cw-actions cw-polaroid__actions">
          <a className="cw-btn cw-btn--ghost" href={socialLinks.instagramPersonal} target="_blank" rel="noreferrer">
            More on @2kferg
          </a>
        </div>
      </div>
    </section>
  );
}
