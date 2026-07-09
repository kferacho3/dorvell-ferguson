"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import {
  creativeItems,
  getRelatedCreativeItems,
  type CreativeItem,
} from "@/content/creative";
import { VideoPlayer } from "./VideoPlayer";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./icons";

type LightboxApi = { open: (item: CreativeItem, list?: CreativeItem[]) => void };
const LightboxContext = createContext<LightboxApi | null>(null);

/** Any card can call `open(item, list)` to launch the premium detail drawer. */
export function useCreativeLightbox(): LightboxApi {
  const ctx = useContext(LightboxContext);
  if (!ctx) throw new Error("useCreativeLightbox must be used within CreativeLightboxProvider");
  return ctx;
}

function durationLabel(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CreativeLightboxProvider({ children }: { children: ReactNode }) {
  const [box, setBox] = useState<{ list: CreativeItem[]; index: number } | null>(null);

  const open = useCallback((item: CreativeItem, list?: CreativeItem[]) => {
    const source = list && list.length ? list : creativeItems;
    let index = source.findIndex((i) => i.slug === item.slug);
    let finalList = source;
    if (index < 0) {
      finalList = creativeItems;
      index = creativeItems.findIndex((i) => i.slug === item.slug);
    }
    if (index < 0) {
      finalList = [item];
      index = 0;
    }
    setBox({ list: finalList, index });
  }, []);

  const api = useMemo<LightboxApi>(() => ({ open }), [open]);

  return (
    <LightboxContext.Provider value={api}>
      {children}
      {box ? (
        <LightboxDialog
          list={box.list}
          index={box.index}
          onIndex={(next) => setBox((b) => (b ? { ...b, index: (next + b.list.length) % b.list.length } : b))}
          onClose={() => setBox(null)}
          onOpenItem={open}
        />
      ) : null}
    </LightboxContext.Provider>
  );
}

function LightboxDialog({
  list,
  index,
  onIndex,
  onClose,
  onOpenItem,
}: {
  list: CreativeItem[];
  index: number;
  onIndex: (next: number) => void;
  onClose: () => void;
  onOpenItem: (item: CreativeItem, list?: CreativeItem[]) => void;
}) {
  const item = list[index];
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const related = useMemo(() => getRelatedCreativeItems(item.slug, 3), [item.slug]);

  const prev = useCallback(() => onIndex(index - 1), [index, onIndex]);
  const next = useCallback(() => onIndex(index + 1), [index, onIndex]);

  // latest nav handlers for the keydown listener — updated in an effect (never
  // during render) so navigation doesn't re-subscribe the focus-trap effect.
  const navRef = useRef({ prev, next, onClose });
  useEffect(() => {
    navRef.current = { prev, next, onClose };
  });

  // body scroll lock
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // focus trap + keyboard — mounts once, so arrow navigation never tears down
  // focus management (focus is only restored to the opener on real close).
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      const nav = navRef.current;
      if (event.key === "Escape") {
        nav.onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        nav.prev();
        return;
      }
      if (event.key === "ArrowRight") {
        nav.next();
        return;
      }
      if (event.key === "Tab" && dialog) {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),video,input,select,textarea',
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          last.focus();
          event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === last) {
          first.focus();
          event.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className="cw-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} — creative detail`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="cw-lightbox__dialog"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current == null) return;
          const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
          if (Math.abs(delta) > 44) (delta < 0 ? next : prev)();
          touchStartX.current = null;
        }}
      >
        <button
          type="button"
          className="cw-lightbox__close"
          onClick={onClose}
          aria-label="Close"
          data-autofocus
        >
          <CloseIcon />
        </button>

        {list.length > 1 ? (
          <>
            <button type="button" className="cw-lightbox__nav cw-lightbox__nav--prev" onClick={prev} aria-label="Previous">
              <ChevronLeftIcon />
            </button>
            <button type="button" className="cw-lightbox__nav cw-lightbox__nav--next" onClick={next} aria-label="Next">
              <ChevronRightIcon />
            </button>
          </>
        ) : null}

        <div className="cw-lightbox__stage">
          <div
            className={cn(
              "cw-frame",
              `cw-frame--${item.orientation}`,
              item.orientation === "portrait" && "cw-lightbox__frame--portrait",
            )}
          >
            {/* key forces a fresh player (and stops the previous video) on navigate */}
            <VideoPlayer key={item.slug} item={item} framed={false} priority loop controls startMuted />
          </div>
        </div>

        <div className="cw-lightbox__aside">
          <p className="cw-eyebrow">{item.category}</p>
          <h2 className="cw-lightbox__title">{item.title}</h2>
          <div className="cw-lightbox__metrics">
            <span className="cw-chip">{item.type.replace("-", " ")}</span>
            <span className="cw-chip">{item.orientation}</span>
            <span className="cw-chip">{durationLabel(item.duration)}</span>
            {item.location ? <span className="cw-chip">{item.location}</span> : null}
          </div>
          <p className="cw-lightbox__desc">{item.description}</p>
          {item.directorNote ? <p className="cw-lightbox__note">{item.directorNote}</p> : null}

          <div className="cw-card__tags" style={{ maxHeight: "none", opacity: 1, overflow: "visible" }}>
            {item.tags.map((tag) => (
              <span key={tag} className="cw-tag">
                {tag}
              </span>
            ))}
          </div>

          {related.length ? (
            <div className="cw-lightbox__related">
              <p className="cw-card__meta">Related worlds</p>
              <div className="cw-lightbox__related-grid">
                {related.map((rel) => (
                  <button
                    key={rel.slug}
                    type="button"
                    className="cw-card"
                    onClick={() => onOpenItem(rel, list)}
                    aria-label={`Open ${rel.title}`}
                  >
                    <div className={cn("cw-frame", `cw-frame--${rel.orientation}`)}>
                      <Image
                        src={resolveCreativeAsset(rel.thumbSrc)}
                        alt={rel.title}
                        fill
                        unoptimized
                        sizes="120px"
                        placeholder={rel.blurDataURL ? "blur" : "empty"}
                        blurDataURL={rel.blurDataURL}
                        className="cw-video__poster"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="cw-actions">
            <Link className="cw-btn cw-btn--primary" href="/contact">
              Book a creative shoot
            </Link>
            <Link className="cw-btn cw-btn--ghost" href="/contact">
              Send a concept
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
