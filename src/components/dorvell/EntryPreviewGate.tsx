"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";

const ENTRY_SEEN_KEY = "df-entry-gate-seen";

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readEntrySeen() {
  try {
    return window.sessionStorage.getItem(ENTRY_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeEntrySeen() {
  try {
    window.sessionStorage.setItem(ENTRY_SEEN_KEY, "1");
  } catch {
    // Session storage unavailable; the gate simply shows again next visit.
  }
}

export function EntryPreviewGate({ images, totalFrames }: { images: DorvellImage[]; totalFrames: number }) {
  const [entered, setEntered] = useState(false);
  const enterButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previewImages = images.slice(0, 4);

  // Skip the gate before paint for returning visitors and hash deep links.
  useIsomorphicLayoutEffect(() => {
    if (readEntrySeen() || window.location.hash.length > 1) {
      setEntered(true);
    }
  }, []);

  useEffect(() => {
    if (entered) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    enterButtonRef.current?.focus();

    document.documentElement.classList.add("entry-gate-lock");
    document.body.classList.add("entry-gate-lock");

    return () => {
      document.documentElement.classList.remove("entry-gate-lock");
      document.body.classList.remove("entry-gate-lock");
    };
  }, [entered]);

  const enterPortfolio = useCallback(() => {
    writeEntrySeen();
    document.documentElement.classList.remove("entry-gate-lock");
    document.body.classList.remove("entry-gate-lock");
    window.scrollTo({ top: 0, behavior: "auto" });
    setEntered(true);
    const previousFocus = previousFocusRef.current;
    if (previousFocus && document.contains(previousFocus)) {
      previousFocus.focus();
    }
  }, []);

  useEffect(() => {
    if (entered) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        enterPortfolio();
        return;
      }
      // The gate is an opaque full-screen overlay with a single control —
      // keep Tab from walking onto the invisible page behind it.
      if (event.key === "Tab") {
        event.preventDefault();
        enterButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [entered, enterPortfolio]);

  if (entered) return null;

  return (
    <section className="entry-gate" aria-labelledby="entry-title">
      <div className="entry-gate__copy">
        <p>Dorvell Ferguson Jr. / Tampa</p>
        <p className="entry-gate__title" id="entry-title">
          Enter the archive.
        </p>
        <span>{totalFrames} frames across portraits, music, sports, and fashion.</span>
        <button ref={enterButtonRef} type="button" onClick={enterPortfolio}>
          Enter
        </button>
      </div>
      <div className="entry-gate__preview" aria-label="Portfolio preview">
        {previewImages.map((image, index) => (
          <figure key={image.id} className="entry-gate__frame">
            <Image
              src={image.localOptimized.md}
              alt={imageAlt(image)}
              width={image.width}
              height={image.height}
              sizes="(max-width: 760px) 78vw, 25vw"
              unoptimized
              priority={index < 2}
              {...blurImageProps(image)}
            />
            <figcaption>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{image.category}</strong>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
