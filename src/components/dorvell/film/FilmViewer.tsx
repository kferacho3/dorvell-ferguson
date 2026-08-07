"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { trackFilmEvent, type FilmPlacement } from "@/lib/analytics";
import {
  filmIndexItems,
  formatRuntime,
  getRelatedCreativeItems,
  type CreativeItem,
} from "@/content/creative";
import { SocialActionBar } from "@/components/dorvell/social/SocialActionBar";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/dorvell/creative/icons";
import { FilmPlayer } from "./FilmPlayer";
import { FilmMetaPanel } from "./FilmMetaPanel";
import { FilmEndState } from "./FilmEndState";

// ---------------------------------------------------------------------------
// Provider — one viewer instance for the whole site
// ---------------------------------------------------------------------------

type OpenOptions = {
  /** The playlist to page through. Defaults to the film index. */
  list?: CreativeItem[];
  placement?: FilmPlacement;
  /** Rect of the element that was clicked — drives the FLIP entry. */
  originRect?: DOMRect | null;
};

type FilmViewerApi = { open: (film: CreativeItem, options?: OpenOptions) => void };

const FilmViewerContext = createContext<FilmViewerApi | null>(null);

/** Any component can call `open(film)` to launch the cinematic viewer. */
export function useFilmViewer(): FilmViewerApi {
  const ctx = useContext(FilmViewerContext);
  if (!ctx) throw new Error("useFilmViewer must be used within FilmViewerProvider");
  return ctx;
}

type ViewerState = {
  list: CreativeItem[];
  index: number;
  placement: FilmPlacement;
  originRect: DOMRect | null;
};

export function FilmViewerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ViewerState | null>(null);

  const open = useCallback((film: CreativeItem, options: OpenOptions = {}) => {
    const source = options.list?.length ? options.list : filmIndexItems;
    let list = source;
    let index = source.findIndex((i) => i.slug === film.slug);
    if (index < 0) {
      list = [film, ...filmIndexItems.filter((i) => i.slug !== film.slug)];
      index = 0;
    }
    trackFilmEvent("film_viewer_opened", {
      film: film.slug,
      placement: options.placement ?? "viewer",
    });
    setState({
      list,
      index,
      placement: options.placement ?? "viewer",
      originRect: options.originRect ?? null,
    });
  }, []);

  const api = useMemo<FilmViewerApi>(() => ({ open }), [open]);

  return (
    <FilmViewerContext.Provider value={api}>
      {children}
      {state ? (
        <FilmViewerDialog
          list={state.list}
          index={state.index}
          placement={state.placement}
          originRect={state.originRect}
          onIndex={(next) =>
            setState((prev) =>
              prev ? { ...prev, index: (next + prev.list.length) % prev.list.length } : prev,
            )
          }
          onOpenItem={open}
          onClose={() => setState(null)}
        />
      ) : null}
    </FilmViewerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

/**
 * Turns the clicked element's rect into the CSS custom properties that animate
 * the dialog out from exactly where it was opened. Returns nothing when there
 * is no origin (keyboard entry, deep link) so the viewer simply fades in.
 */
function flipStyle(rect: DOMRect | null): CSSProperties | undefined {
  if (!rect || typeof window === "undefined") return undefined;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return {
    "--fv-origin-x": `${cx - window.innerWidth / 2}px`,
    "--fv-origin-y": `${cy - window.innerHeight / 2}px`,
    "--fv-origin-scale": String(Math.max(rect.width / window.innerWidth, 0.18)),
  } as CSSProperties;
}

function FilmViewerDialog({
  list,
  index,
  placement,
  originRect,
  onIndex,
  onOpenItem,
  onClose,
}: {
  list: CreativeItem[];
  index: number;
  placement: FilmPlacement;
  originRect: DOMRect | null;
  onIndex: (next: number) => void;
  onOpenItem: (film: CreativeItem, options?: OpenOptions) => void;
  onClose: () => void;
}) {
  const film = list[index];
  // The end state is stored as "which film ended" rather than a boolean, so
  // navigating to another film clears it by derivation — no reset effect, which
  // the repo's react-compiler rules would reject anyway.
  const [endedFor, setEndedFor] = useState<string | null>(null);
  const [replayNonce, setReplayNonce] = useState(0);
  const ended = endedFor === film.slug;

  const prev = useCallback(() => onIndex(index - 1), [index, onIndex]);
  const next = useCallback(() => onIndex(index + 1), [index, onIndex]);

  const dialogRef = useFocusTrap<HTMLDivElement>({ onClose, onPrev: prev, onNext: next });

  const related = useMemo(() => getRelatedCreativeItems(film.slug, 3), [film.slug]);
  const total = list.length;

  return (
    <div
      className="fv"
      role="dialog"
      aria-modal="true"
      aria-label={`${film.title} — film viewer`}
      style={flipStyle(originRect)}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} className="fv__dialog">
        <header className="fv__bar">
          <p className="fv__index">
            <span className="fv__index-num">{String(film.filmIndex ?? index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true"> / </span>
            <span>{String(total).padStart(2, "0")}</span>
            <span className="sr-only">
              Film {film.filmIndex ?? index + 1} of {total}
            </span>
          </p>
          <p className="fv__bar-title">{film.title}</p>
          <button
            type="button"
            className="fv__close"
            onClick={onClose}
            aria-label="Close film viewer"
            data-autofocus
          >
            <CloseIcon />
          </button>
        </header>

        <div className="fv__stage">
          {total > 1 ? (
            <button
              type="button"
              className="fv__nav fv__nav--prev"
              onClick={prev}
              aria-label={`Previous film: ${list[(index - 1 + total) % total].title}`}
            >
              <ChevronLeftIcon />
            </button>
          ) : null}

          <div className={cn("fv__frame", `fv__frame--${film.orientation}`)}>
            {/* keyed so navigating films tears down the previous decoder */}
            <FilmPlayer
              key={`${film.slug}-${replayNonce}`}
              film={film}
              placement={placement}
              autoStart
              onEnded={() => setEndedFor(film.slug)}
            />
            {ended ? (
              <FilmEndState
                film={film}
                placement={placement}
                onReplay={() => {
                  setEndedFor(null);
                  setReplayNonce((n) => n + 1);
                }}
                onMoreFilms={() => {
                  setEndedFor(null);
                  next();
                }}
              />
            ) : null}
          </div>

          {total > 1 ? (
            <button
              type="button"
              className="fv__nav fv__nav--next"
              onClick={next}
              aria-label={`Next film: ${list[(index + 1) % total].title}`}
            >
              <ChevronRightIcon />
            </button>
          ) : null}
        </div>

        <aside className="fv__aside">
          <p className="fv__eyebrow">{film.category}</p>
          <h2 className="fv__title">{film.title}</h2>
          <p className="fv__desc">{film.description}</p>

          <FilmMetaPanel film={film} />

          {film.directorNote ? (
            <blockquote className="fv__note">
              <span className="fv__note-label">Director&rsquo;s note</span>
              {film.directorNote}
            </blockquote>
          ) : null}

          {film.synopsis ? (
            <details className="fv__synopsis">
              <summary>Visual description</summary>
              <p>{film.synopsis}</p>
            </details>
          ) : null}

          <SocialActionBar film={film} placement={placement} />

          <div className="fv__actions">
            <Link className="fv-btn fv-btn--primary" href={`/creative/${film.slug}`} onClick={onClose}>
              Open film page
            </Link>
            <Link
              className="fv-btn"
              href="/contact"
              onClick={() => {
                trackFilmEvent("film_booking_click", { film: film.slug, placement });
                onClose();
              }}
            >
              Book a creative film
            </Link>
          </div>

          {related.length ? (
            <div className="fv__related">
              <p className="fv__related-label">Related worlds</p>
              <ul className="fv__related-grid">
                {related.map((rel) => (
                  <li key={rel.slug}>
                    <button
                      type="button"
                      className="fv__related-card"
                      onClick={() => {
                        trackFilmEvent("film_related_opened", {
                          film: rel.slug,
                          placement: "related",
                        });
                        // Swap the viewer to the related piece in place rather
                        // than closing to an archive anchor and losing context.
                        onOpenItem(rel, { list: [rel], placement: "related" });
                      }}
                      aria-label={`Open ${rel.title}`}
                    >
                      <span className={cn("fv__related-frame", `fv__related-frame--${rel.orientation}`)}>
                        <Image
                          src={resolveCreativeAsset(rel.thumbSrc)}
                          alt=""
                          fill
                          unoptimized
                          sizes="120px"
                          placeholder={rel.blurDataURL ? "blur" : "empty"}
                          blurDataURL={rel.blurDataURL}
                        />
                      </span>
                      <span className="fv__related-meta">
                        <strong>{rel.title}</strong>
                        <small>{formatRuntime(rel.duration)}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
