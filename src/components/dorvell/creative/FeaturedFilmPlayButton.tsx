"use client";

import { useFilmViewer } from "@/components/dorvell/film/FilmViewer";
import type { CreativeItem } from "@/content/creative";
import { PlayIcon } from "./icons";

type FeaturedFilmPlayButtonProps = { film: CreativeItem };

export function FeaturedFilmPlayButton({ film }: FeaturedFilmPlayButtonProps) {
  const { open } = useFilmViewer();

  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-[var(--df-text)] px-4 py-2 text-sm font-semibold text-[var(--df-bg)] hover:bg-[var(--df-teal)]"
      aria-label={`Play film: ${film.title}`}
      aria-haspopup="dialog"
      onClick={() => open(film, { placement: "featured" })}
    >
      <PlayIcon className="size-5" />
      Play film
    </button>
  );
}
