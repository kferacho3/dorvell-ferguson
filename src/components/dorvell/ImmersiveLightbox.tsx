"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";
import { galleryLaneDefinitions, laneKeyForImage } from "@/lib/gallery-lanes";
import { useImageWarmup } from "./useImageWarmup";

type LightboxOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function ImmersiveLightbox({
  images,
  index,
  origin,
  onClose,
  onNavigate,
  ctaHref,
  ctaLabel,
}: {
  images: DorvellImage[];
  index: number;
  origin?: LightboxOrigin;
  onClose: () => void;
  onNavigate: (index: number) => void;
  /** Optional booking CTA rendered in the details panel (Portfolio drawer). */
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const image = images[index];
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const portalElement = typeof document === "undefined" ? null : document.body;
  const lane = image ? galleryLaneDefinitions.find((definition) => definition.key === laneKeyForImage(image)) : null;
  const titleId = "lightbox-title";
  const descriptionId = "lightbox-description";
  const nearbyImages = useMemo(() => {
    if (images.length <= 9) return images.map((nextImage, nextIndex) => ({ image: nextImage, index: nextIndex }));
    return Array.from({ length: 9 }).map((_, offset) => {
      const nextIndex = (index - 4 + offset + images.length) % images.length;
      return { image: images[nextIndex], index: nextIndex };
    });
  }, [images, index]);
  const nearbyLargeUrls = useMemo(() => nearbyImages.map((item) => item.image.localOptimized.lg), [nearbyImages]);

  useImageWarmup(nearbyLargeUrls, 9);

  useEffect(() => {
    if (!portalElement) return undefined;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [portalElement]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNavigate((index + 1) % images.length);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onNavigate((index - 1 + images.length) % images.length);
      }
      if (event.key === "Tab") {
        const focusable = Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>(
            "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
          ) ?? [],
        ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
        if (focusable.length === 0) return;
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
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [image, images.length, index, onClose, onNavigate]);

  if (!image || !portalElement) return null;

  const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;
  const targetWidth = viewportWidth > 0 ? Math.min(1220, Math.max(280, viewportWidth - 36)) : 1220;
  const targetHeight = viewportHeight > 0 ? Math.max(320, viewportHeight - 36) : 720;
  const originCenterX = origin ? origin.x + origin.width / 2 : viewportWidth / 2;
  const originCenterY = origin ? origin.y + origin.height / 2 : viewportHeight / 2;
  const openX = origin && viewportWidth > 0 ? originCenterX - viewportWidth / 2 : 0;
  const openY = origin && viewportHeight > 0 ? originCenterY - viewportHeight / 2 : 18;
  const openScaleX = origin ? Math.max(0.08, Math.min(0.92, origin.width / targetWidth)) : 0.92;
  const openScaleY = origin ? Math.max(0.08, Math.min(0.92, origin.height / targetHeight)) : 0.92;

  const navigateBySwipe = (clientX: number) => {
    if (touchStartX.current === null) return;
    const delta = clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 52) return;
    onNavigate(delta < 0 ? (index + 1) % images.length : (index - 1 + images.length) % images.length);
  };

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      style={
        {
          "--lane-accent": lane?.accent ?? "#35e0bb",
          "--lightbox-open-x": `${openX}px`,
          "--lightbox-open-y": `${openY}px`,
          "--lightbox-open-scale-x": openScaleX,
          "--lightbox-open-scale-y": openScaleY,
        } as CSSProperties
      }
    >
      <button className="lightbox-backdrop" type="button" onClick={onClose} aria-label="Close image viewer" />
      <div className="lightbox-panel" ref={panelRef}>
        <div
          className="lightbox-image-wrap"
          onTouchEnd={(event) => navigateBySwipe(event.changedTouches[0]?.clientX ?? 0)}
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0]?.clientX ?? null;
          }}
        >
          <Image
            src={image.localOptimized.lg}
            alt={imageAlt(image)}
            width={image.width}
            height={image.height}
            priority
            sizes="(max-width: 900px) 100vw, calc(100vw - 380px)"
            unoptimized
            {...blurImageProps(image)}
          />
          <div className="lightbox-count" aria-live="polite">
            {String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </div>
        </div>
        <aside className="lightbox-details">
          <button ref={closeRef} className="icon-button lightbox-close" type="button" onClick={onClose}>
            Close
          </button>
          <p className="eyebrow">{lane?.eyebrow ?? image.category}</p>
          <h2 id={titleId}>{image.projectTitle ?? "Portfolio Frame"}</h2>
          <p id={descriptionId}>{lane?.description ?? "Selected frame from Dorvell Ferguson Jr.'s working archive."}</p>
          <dl className="lightbox-facts" aria-label="Frame details">
            <div>
              <dt>Lane</dt>
              <dd>{lane?.label ?? image.category}</dd>
            </div>
            <div>
              <dt>Frame</dt>
              <dd>{String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{image.projectTitle ?? image.category}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>{image.width} x {image.height}</dd>
            </div>
          </dl>
          <div className="tag-row">
            {image.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="lightbox-meter" aria-hidden="true">
            <span style={{ width: `${((index + 1) / images.length) * 100}%` }} />
          </div>
          <div className="lightbox-strip" aria-label="Nearby frames">
            {nearbyImages.map((item) => (
              <button
                aria-label={`View image ${item.index + 1}`}
                className={item.index === index ? "is-active" : ""}
                key={item.image.id}
                onClick={() => onNavigate(item.index)}
                type="button"
              >
                <Image
                  src={item.image.localOptimized.sm}
                  alt=""
                  width={item.image.width}
                  height={item.image.height}
                  unoptimized
                />
              </button>
            ))}
          </div>
          <div className="lightbox-actions">
            <button aria-label="Previous image" type="button" onClick={() => onNavigate((index - 1 + images.length) % images.length)}>
              Previous
            </button>
            <button aria-label="Next image" type="button" onClick={() => onNavigate((index + 1) % images.length)}>
              Next
            </button>
          </div>
          {ctaHref ? (
            <a className="button-primary lightbox-cta" href={ctaHref}>
              {ctaLabel ?? "Book similar work"}
            </a>
          ) : null}
        </aside>
      </div>
    </div>,
    portalElement,
  );
}
