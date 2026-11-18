"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { filmIndexItems } from "@/content/creative";
import { FilmPlayer } from "@/components/dorvell/film/FilmPlayer";
import { FilmMetaPanel } from "@/components/dorvell/film/FilmMetaPanel";
import { useFilmViewer } from "@/components/dorvell/film/FilmViewer";
import { GallerySelect } from "../portfolio/GallerySelect";
import { Reveal } from "./Reveal";
import "@/styles/featured-film.css";

const control =
  "inline-flex min-h-11 items-center rounded-md border border-[var(--cw-line-strong)] bg-[var(--cw-bg-2)] px-3 text-sm font-medium text-[var(--cw-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cw-teal)]";

const filmOptions = filmIndexItems.map(({ slug, title }) => ({
  value: slug,
  label: title,
}));

export function FeaturedCreativeFilm() {
  const [filmSlug, setFilmSlug] = useState(filmOptions[0]?.value ?? "");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const detailsId = useId();
  const { open } = useFilmViewer();
  const film = filmIndexItems.find(({ slug }) => slug === filmSlug);

  if (!film) return null;

  return (
    <section
      id="cw-featured"
      className={cn(
        "cw-section cw-featured scroll-mt-0",
        detailsOpen && "cw-featured--open",
      )}
      aria-labelledby="cw-featured-title"
    >
      <div className="cw-featured__shell">
        <Reveal className="cw-featured__stage">
          <header className="cw-featured__chrome">
            <p className="cw-eyebrow">Featured film</p>
            <h2 id="cw-featured-title" className="cw-featured__title">
              {film.title}
            </h2>
          </header>

          <div className="cw-featured__canvas" ref={stageRef}>
            <FilmPlayer key={film.slug} film={film} placement="featured" />
          </div>

          <div className="flex w-full flex-wrap items-end justify-center gap-2">
            <div className="w-40 text-left">
              <GallerySelect
                label="Featured film"
                value={filmSlug}
                options={filmOptions}
                onChange={(slug) => {
                  setFilmSlug(slug);
                  setDetailsOpen(false);
                }}
              />
            </div>
            <button
              type="button"
              className={control}
              aria-expanded={detailsOpen}
              aria-controls={detailsId}
              onClick={() => setDetailsOpen((previous) => !previous)}
            >
              {detailsOpen ? "Hide details" : "Film details"}
            </button>
          </div>
        </Reveal>

        <aside
          id={detailsId}
          className="cw-featured__panel"
          aria-hidden={!detailsOpen}
          inert={!detailsOpen}
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

            <div className="flex flex-wrap gap-x-4 text-sm font-medium">
              <Link
                className="inline-flex min-h-11 items-center underline underline-offset-4"
                href={`/creative/${film.slug}`}
              >
                Film page
              </Link>
              <button
                type="button"
                className="inline-flex min-h-11 items-center underline underline-offset-4"
                onClick={() =>
                  open(film, {
                    list: filmIndexItems,
                    placement: "featured",
                    originRect:
                      stageRef.current?.getBoundingClientRect() ?? null,
                  })
                }
              >
                Open player
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
