"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
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
import "@/styles/featured-film.css";

/**
 * Section 3 — the featured film.
 *
 * Video-first: the stage owns ~3/4 of the layout by default. Copy, specs, and
 * the director's note live behind an expand control so the film is the page,
 * not a sidebar for a wall of text. Opening details retracts the stage to ~2/3.
 *
 * Manual index only — finishing one film never auto-starts the next.
 * The player here is poster-first; "Play film" opens the full viewer.
 */
export function FeaturedCreativeFilm() {
  const [index, setIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const detailsId = useId();
  const { open } = useFilmViewer();

  const total = filmIndexItems.length;
  const film = filmIndexItems[index];

  const go = useCallback(
    (direction: number) => setIndex((i) => (i + direction + total) % total),
    [total],
  );

  // New film → fold the copy again so the stage stays dominant.
  useEffect(() => {
    setDetailsOpen(false);
  }, [film?.slug]);

  const openViewer = useCallback(() => {
    open(film, {
      list: filmIndexItems,
      placement: "featured",
      originRect: stageRef.current?.getBoundingClientRect() ?? null,
    });
  }, [film, open]);

  if (!film) return null;

  return (
    <section
      id="cw-featured"
      className={cn("cw-section cw-featured", detailsOpen && "cw-featured--open")}
      aria-labelledby="cw-featured-title"
    >
      <div className="cw-featured__shell">
        <Reveal className="cw-featured__stage">
          <header className="cw-featured__chrome">
            <p className="cw-eyebrow">
              Featured film{" "}
              <span className="cw-featured__count">
                {String(film.filmIndex ?? index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            </p>
            <h2 id="cw-featured-title" className="cw-featured__title">
              {film.title}
            </h2>
          </header>

          <div className="cw-featured__canvas" ref={stageRef}>
            <FilmPlayer key={film.slug} film={film} placement="featured" />
          </div>

          <div className="cw-featured__toolbar">
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

            <div className="cw-actions cw-featured__actions">
              <button type="button" className="cw-btn cw-btn--primary" onClick={openViewer}>
                Play film <span className="cw-featured__runtime">{formatRuntime(film.duration)}</span>
              </button>
              <button
                type="button"
                className={cn("cw-btn cw-btn--ghost", detailsOpen && "is-active")}
                aria-expanded={detailsOpen}
                aria-controls={detailsId}
                onClick={() => setDetailsOpen((open) => !open)}
              >
                {detailsOpen ? "Hide details" : "Details"}
              </button>
            </div>
          </div>
        </Reveal>

        <aside
          id={detailsId}
          className="cw-featured__panel"
          aria-hidden={!detailsOpen}
          inert={!detailsOpen ? true : undefined}
        >
          <div className="cw-featured__panel-inner">
            <p className="cw-featured__lede">{film.description}</p>

            <FilmMetaPanel film={film} compact />

            {film.directorNote ? (
              <details className="cw-featured__fold">
                <summary>Director&rsquo;s note</summary>
                <p>{film.directorNote}</p>
              </details>
            ) : null}

            {film.synopsis ? (
              <details className="cw-featured__fold">
                <summary>Visual description</summary>
                <p>{film.synopsis}</p>
              </details>
            ) : null}

            <div className="cw-actions cw-featured__panel-actions">
              <Link className="cw-btn" href={`/creative/${film.slug}`}>
                See the process
              </Link>
              <Link
                className="cw-btn cw-btn--accent"
                href="/contact"
                onClick={() => trackFilmEvent("film_booking_click", { film: film.slug, placement: "featured" })}
              >
                Book a film
              </Link>
            </div>

            <SocialActionBar film={film} placement="featured" />
            <FollowTheWork variant="rail" placement="featured" className="cw-featured__follow" />
          </div>
        </aside>
      </div>
    </section>
  );
}
