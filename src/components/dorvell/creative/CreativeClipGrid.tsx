"use client";

import Image from "next/image";
import { formatRuntime, type CreativeItem } from "@/content/creative";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { useCreativeLightbox } from "./CreativeLightbox";
import { PlayIcon } from "./icons";

type CreativeClipGridProps = { items: CreativeItem[] };

export function CreativeClipGrid({ items }: CreativeClipGridProps) {
  const { open } = useCreativeLightbox();

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-7 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.slug}>
          <button
            type="button"
            className="group flex w-full flex-col gap-2 text-left"
            aria-label={`Watch ${item.title}`}
            aria-haspopup="dialog"
            onClick={() => open(item, items)}
          >
            <span className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--df-panel-solid)]">
              <Image
                src={resolveCreativeAsset(item.thumbSrc)}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 639px) 46vw, (max-width: 1023px) 29vw, 290px"
                placeholder={item.blurDataURL ? "blur" : "empty"}
                blurDataURL={item.blurDataURL}
                className="object-cover"
              />
              <span
                className="absolute bottom-2 left-2 grid size-7 place-items-center rounded-full bg-[var(--df-bg)] text-[var(--df-text)]"
                aria-hidden="true"
              >
                <PlayIcon className="size-4" />
              </span>
            </span>
            <span className="flex w-full items-start justify-between gap-2">
              <span className="min-w-0 text-sm font-semibold leading-snug group-hover:underline group-focus-visible:underline sm:text-base">
                {item.title}
              </span>
              <span className="shrink-0 text-xs leading-5 tabular-nums text-[var(--df-text-soft)]">
                {formatRuntime(item.duration)}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
