"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { filmIndexItems, formatRuntime } from "@/content/creative";
import { trackFilmEvent } from "@/lib/analytics";
import { FilmPlayer } from "@/components/dorvell/film/FilmPlayer";
import { FilmMetaPanel } from "@/components/dorvell/film/FilmMetaPanel";
import { SocialActionBar } from "@/components/dorvell/social/SocialActionBar";
import { FollowTheWork } from "@/components/dorvell/social/FollowTheWork";
import { useFilmViewer } from "@/components/dorvell/film/FilmViewer";
import { Reveal } from "./Reveal";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/**
 * Section 3 — the featured film.
 *
 * Now a manual index over the three distributed films rather than a single
 * fixed slot. It never advances on its own: finishing one film does not start
 * the next, because deciding to watch a second film is the visitor's to make.
 *
 * The player here is poster-first and unarmed — no film byte is fetched until
 * someone presses play. "Play film" opens the full viewer instead, which is
 * where completion, the end state and the playlist live.
 */
export function FeaturedCreativeFilm() {
  const [index, setIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const { open } = useFilmViewer();

  const total = filmIndexItems.length;
  const film = filmIndexItems[index];

  const go = useCallback(
    (direction: number) => setIndex((i) => (i + direction + total) % total),
    [total],
  );

  const openViewer = useCallback(() => {
    open(film, {
      list: filmIndexItems,
      placement: "featured",
      originRect: stageRef.current?.getBoundingClientRect() ?? null,
    });
  }, [film, open]);

  if (!film) return null;

  return (
    <section id="cw-featured" className="cw-section cw-featured" aria-labelledby="cw-featured-title">
      <div className="cw-container cw-featured__grid">
        <Reveal className="cw-featured__stage">
          <div className="cw-featured__canvas" ref={stageRef}>
            {/* keyed so paging the index tears down the previous decoder */}
            <FilmPlayer key={film.slug} film={film} placement="featured" />
          </div>

          <div className="cw-featured__index" role="group" aria-label="Featured film index">
            <button
              type="button"
              className="cw-featured__step"
              onClick={() => go(-1)}
              aria-label={`Previous film: ${filmIndexItems[(index - 1 + total) % total].title}`}
            >
              <ChevronLeftIcon />
            </button>
            <ol className="cw-featured__dots">
              {filmIndexItems.map((entry, i) => (
                <li key={entry.slug}>
                  <button
                    type="button"
                    className={cn("cw-featured__dot", i === index && "is-active")}
                    aria-current={i === index ? "true" : undefined}
                    onClick={() => setIndex(i)}
                  >
                    <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    <span className="sr-only">{entry.title}</span>
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="cw-featured__step"
              onClick={() => go(1)}
              aria-label={`Next film: ${filmIndexItems[(index + 1) % total].title}`}
            >
              <ChevronRightIcon />
            </button>
          </div>
        </Reveal>

        <div className="cw-featured__meta">
          <p className="cw-eyebrow">
            Featured film{" "}
            <span className="cw-featured__count">
              {String(film.filmIndex ?? index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </p>
          <h2 id="cw-featured-title" className="cw-h2">
            {film.title}
          </h2>
          <p className="cw-lede">{film.description}</p>

          <FilmMetaPanel film={film} />

          {film.directorNote ? (
            <blockquote className="cw-featured__note">
              <span className="cw-featured__note-label">Director&rsquo;s note</span>
              {film.directorNote}
            </blockquote>
          ) : null}

          {film.synopsis ? (
            <details className="fv__synopsis cw-featured__synopsis">
              <summary>Visual description</summary>
              <p>{film.synopsis}</p>
            </details>
          ) : null}

          <div className="cw-actions cw-featured__actions">
            <button type="button" className="cw-btn cw-btn--primary" onClick={openViewer}>
              Play film <span className="cw-featured__runtime">{formatRuntime(film.duration)}</span>
            </button>
            <Link className="cw-btn" href={`/creative/${film.slug}`}>
              See the process
            </Link>
            <Link
              className="cw-btn cw-btn--accent"
              href="/contact"
              onClick={() => trackFilmEvent("film_booking_click", { film: film.slug, placement: "featured" })}
            >
              Book a creative film
            </Link>
          </div>

          <SocialActionBar film={film} placement="featured" />
          <FollowTheWork variant="rail" placement="featured" className="cw-featured__follow" />
        </div>
      </div>
    </section>
  );
}
