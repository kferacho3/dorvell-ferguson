"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import {
  creativeCategories,
  getCreativeItem,
  type CreativeCategory,
  type CreativeCategoryKey,
} from "@/content/creative";
import { useInView } from "./useInView";
import { emitCreativeFilter } from "./creativeFilter";
import { ArrowIcon } from "./icons";

/** Bento sizing per room index — a couple of feature tiles among quieter ones. */
const SPANS = ["cw-room--tall", "", "", "cw-room--wide", "", "cw-room--tall", "", "cw-room--wide"];

function RoomTile({
  room,
  index,
  onFocus,
}: {
  room: CreativeCategory;
  index: number;
  onFocus: (key: CreativeCategoryKey) => void;
}) {
  const { ref, inView } = useInView<HTMLButtonElement>({
    once: true,
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.1,
  });
  const preview = getCreativeItem(room.representativeSlug);

  return (
    <button
      ref={ref}
      type="button"
      className={cn("cw-room", SPANS[index], "cw-reveal", inView && "is-in")}
      style={{ transitionDelay: `${index * 45}ms` }}
      onClick={() => onFocus(room.key)}
      aria-label={`Filter the creative archive to ${room.label}`}
    >
      <span className="cw-room__frame">
        {preview ? (
          <Image
            src={resolveCreativeAsset(preview.thumbSrc)}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 760px) 100vw, 420px"
            placeholder={preview.blurDataURL ? "blur" : "empty"}
            blurDataURL={preview.blurDataURL}
            className="cw-video__poster"
          />
        ) : null}
        <span className="cw-room__scrim" aria-hidden="true" />
      </span>
      <span className="cw-room__body">
        <span className="cw-room__title">{room.label}</span>
        <span className="cw-room__blurb">{room.blurb}</span>
        <span className="cw-room__tags">
          {room.tags.map((tag) => (
            <span key={tag} className="cw-tag">
              {tag}
            </span>
          ))}
        </span>
        <span className="cw-room__cta">
          Filter archive <ArrowIcon />
        </span>
      </span>
    </button>
  );
}

/**
 * Section 4 — Creative Rooms / concept categories. Bento grid of the eight
 * rooms; each tile previews a representative frame and, on click, focuses the
 * archive filter below and scrolls to it.
 */
export function CreativeRooms() {
  const reducedMotion = usePrefersReducedMotion();

  const focusRoom = (key: CreativeCategoryKey) => {
    emitCreativeFilter(key);
    document.getElementById("cw-archive")?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <section className="cw-section cw-rooms" aria-labelledby="cw-rooms-title">
      <div className="cw-container cw-container--wide">
        <div className="cw-section__head">
          <p className="cw-eyebrow">Creative Rooms</p>
          <h2 id="cw-rooms-title" className="cw-h2">
            Explore by mood, setting, and creative language.
          </h2>
          <p className="cw-lede">
            Eight worlds — some full of work, some still being built. Pick a room to filter the archive.
          </p>
        </div>

        <div className="cw-rooms__grid">
          {creativeCategories.map((room, index) => (
            <RoomTile key={room.key} room={room} index={index} onFocus={focusRoom} />
          ))}
        </div>
      </div>
    </section>
  );
}
