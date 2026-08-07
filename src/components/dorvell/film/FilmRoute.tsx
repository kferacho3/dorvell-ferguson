"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { trackFilmEvent } from "@/lib/analytics";
import {
  filmIndexItems,
  formatRuntime,
  getRelatedCreativeItems,
  type CreativeItem,
} from "@/content/creative";
import { SocialActionBar } from "@/components/dorvell/social/SocialActionBar";
import { FollowTheWork } from "@/components/dorvell/social/FollowTheWork";
import { useFilmViewer } from "./FilmViewer";
import { FilmPlayer } from "./FilmPlayer";
import { FilmMetaPanel } from "./FilmMetaPanel";

/**
 * The standalone film page body.
 *
 * Built for the visitor who arrived from a social post: the poster and premise
 * are readable instantly, the film is one press away, and the credits make it
 * obvious that Dorvell can concept, shoot, perform, direct and edit — which is
 * the actual conversion argument.
 */
export function FilmRoute({ film }: { film: CreativeItem }) {
  const { open } = useFilmViewer();
  const related = getRelatedCreativeItems(film.slug, 4);
  const otherFilms = filmIndexItems.filter((f) => f.slug !== film.slug);
  const total = filmIndexItems.length;

  return (
    <article className="filmpage">
      <nav className="filmpage__crumbs" aria-label="Breadcrumb">
        <Link href="/creative">Creative Worlds</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{film.title}</span>
      </nav>

      <header className="filmpage__head">
        <p className="filmpage__eyebrow">
          Film {String(film.filmIndex ?? 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          <span aria-hidden="true"> · </span>
          {film.category}
        </p>
        <h1 className="filmpage__title">{film.title}</h1>
        <p className="filmpage__thesis">{film.description}</p>
      </header>

      <div className={cn("filmpage__stage", `filmpage__stage--${film.orientation}`)}>
        <FilmPlayer film={film} placement="film-page" />
      </div>

      <div className="filmpage__body">
        <div className="filmpage__main">
          {film.directorNote ? (
            <section className="filmpage__note" aria-labelledby="filmpage-note">
              <h2 id="filmpage-note" className="filmpage__section-label">
                Director&rsquo;s note
              </h2>
              <p>{film.directorNote}</p>
            </section>
          ) : null}

          {film.synopsis ? (
            <section className="filmpage__synopsis" aria-labelledby="filmpage-synopsis">
              <h2 id="filmpage-synopsis" className="filmpage__section-label">
                Visual description
              </h2>
              <p>{film.synopsis}</p>
            </section>
          ) : null}

          <section aria-labelledby="filmpage-tags">
            <h2 id="filmpage-tags" className="filmpage__section-label">
              In this film
            </h2>
            <ul className="filmpage__tags">
              {film.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="filmpage__aside">
          <h2 className="filmpage__section-label">Credits &amp; format</h2>
          <FilmMetaPanel film={film} />

          <SocialActionBar film={film} placement="film-page" />

          <div className="filmpage__actions">
            <Link
              className="fv-btn fv-btn--primary"
              href="/contact"
              onClick={() => trackFilmEvent("film_booking_click", { film: film.slug, placement: "film-page" })}
            >
              Book a creative film
            </Link>
            <Link className="fv-btn" href="/creative#cw-archive">
              Open the archive
            </Link>
          </div>

          <FollowTheWork variant="stacked" placement="film-page" className="filmpage__follow" />
        </aside>
      </div>

      {otherFilms.length ? (
        <section className="filmpage__more" aria-labelledby="filmpage-more">
          <h2 id="filmpage-more" className="filmpage__section-label">
            More films
          </h2>
          <ul className="filmpage__more-grid">
            {otherFilms.map((other) => (
              <li key={other.slug}>
                <Link className="filmpage__more-card" href={`/creative/${other.slug}`}>
                  <span className={cn("filmpage__more-frame", `filmpage__more-frame--${other.orientation}`)}>
                    <Image
                      src={resolveCreativeAsset(other.posterSrc)}
                      alt=""
                      fill
                      unoptimized
                      sizes="(max-width: 760px) 90vw, 380px"
                      placeholder={other.blurDataURL ? "blur" : "empty"}
                      blurDataURL={other.blurDataURL}
                    />
                  </span>
                  <span className="filmpage__more-meta">
                    <strong>{other.title}</strong>
                    <small>
                      {formatRuntime(other.duration)} · {other.category}
                    </small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length ? (
        <section className="filmpage__related" aria-labelledby="filmpage-related">
          <h2 id="filmpage-related" className="filmpage__section-label">
            Related worlds
          </h2>
          <ul className="filmpage__related-grid">
            {related.map((rel) => (
              <li key={rel.slug}>
                <button
                  type="button"
                  className="filmpage__related-card"
                  onClick={() => {
                    trackFilmEvent("film_related_opened", { film: rel.slug, placement: "related" });
                    open(rel, { list: [rel], placement: "related" });
                  }}
                  aria-label={`Open ${rel.title}`}
                >
                  <span className={cn("filmpage__more-frame", `filmpage__more-frame--${rel.orientation}`)}>
                    <Image
                      src={resolveCreativeAsset(rel.thumbSrc)}
                      alt=""
                      fill
                      unoptimized
                      sizes="200px"
                      placeholder={rel.blurDataURL ? "blur" : "empty"}
                      blurDataURL={rel.blurDataURL}
                    />
                  </span>
                  <span className="filmpage__more-meta">
                    <strong>{rel.title}</strong>
                    <small>{formatRuntime(rel.duration)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
