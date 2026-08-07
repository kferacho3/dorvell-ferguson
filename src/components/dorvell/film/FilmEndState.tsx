"use client";

import Link from "next/link";
import type { CreativeItem } from "@/content/creative";
import { trackFilmEvent, type FilmPlacement } from "@/lib/analytics";
import { SocialActionBar } from "@/components/dorvell/social/SocialActionBar";
import { ReplayIcon } from "@/components/dorvell/creative/icons";

type FilmEndStateProps = {
  film: CreativeItem;
  placement: FilmPlacement;
  onReplay: () => void;
  onMoreFilms: () => void;
};

/**
 * The conversion frame, revealed only once a film has actually finished.
 *
 * Nothing here is allowed to appear during playback — no overlay, no follow
 * sticker, no handle across the frame. The film gets to be a film; the ask
 * comes after.
 */
export function FilmEndState({ film, placement, onReplay, onMoreFilms }: FilmEndStateProps) {
  return (
    <div className="fv-end" role="group" aria-label={`${film.title} has ended`}>
      <p className="fv-end__eyebrow">Continue the world</p>
      <p className="fv-end__title">{film.title} — that&rsquo;s the whole piece.</p>

      <SocialActionBar film={film} placement={placement} variant="compact" className="fv-end__social" />

      <div className="fv-end__actions">
        <button type="button" className="fv-btn" onClick={onReplay}>
          <ReplayIcon />
          Watch again
        </button>
        <button type="button" className="fv-btn" onClick={onMoreFilms}>
          View more films
        </button>
        <Link
          className="fv-btn fv-btn--primary"
          href="/contact"
          onClick={() => trackFilmEvent("film_booking_click", { film: film.slug, placement })}
        >
          Book Dorvell
        </Link>
      </div>
    </div>
  );
}
