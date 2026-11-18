"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { PhotoGalleryImage } from "./photoGalleryImage";

export type { PhotoGalleryImage } from "./photoGalleryImage";

const BATCH_SIZE = 24;
const controls =
  "inline-flex min-h-11 items-center justify-center border border-[var(--df-line-strong)] px-3 text-sm font-medium hover:border-[var(--df-text-soft)] sm:px-4";

type PhotoViewerProps = {
  images: readonly PhotoGalleryImage[];
  index: number;
  label: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

function PhotoViewer({
  images,
  index,
  label,
  triggerRef,
  onClose,
  onNavigate,
}: PhotoViewerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const titleId = useId();
  const image = images[index];

  useEffect(() => {
    const viewer = dialog.current;
    if (!viewer) return;

    const trigger = triggerRef.current;
    const originalOverflow = document.body.style.overflow;
    viewer.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      viewer.close();
      document.body.style.overflow = originalOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [triggerRef]);

  const navigate = (direction: -1 | 1) => {
    onNavigate((index + direction + images.length) % images.length);
  };

  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className="m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[72rem] border border-[var(--df-line-strong)] bg-[var(--df-bg)] text-[var(--df-text)] backdrop:bg-[color-mix(in_srgb,var(--df-bg)_85%,transparent)] sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)]"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (images.length < 2) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 border-b border-[var(--df-line)] px-3 py-2 sm:px-5">
        <h2 id={titleId} className="text-base font-semibold">
          {label}
        </h2>
        <button type="button" className={controls} onClick={onClose}>
          Close
        </button>
      </div>
      <div
        className="grid touch-pan-y touch-pinch-zoom place-items-center px-2 sm:px-4"
        onTouchStart={({ touches }) => {
          const point = touches[0];
          touchStart.current =
            touches.length === 1
              ? { x: point.clientX, y: point.clientY }
              : null;
        }}
        onTouchEnd={({ changedTouches }) => {
          const start = touchStart.current;
          const point = changedTouches[0];
          touchStart.current = null;
          if (!start || !point || images.length < 2) return;

          const dx = point.clientX - start.x;
          const dy = point.clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy))
            navigate(dx > 0 ? -1 : 1);
        }}
        onTouchCancel={() => {
          touchStart.current = null;
        }}
      >
        <Image
          key={image.id}
          src={image.full}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="eager"
          unoptimized
          className="h-auto max-h-[max(8rem,calc(100dvh-10rem))] w-auto max-w-full object-contain"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--df-line)] px-3 py-2 sm:px-5">
        {images.length > 1 ? (
          <button
            type="button"
            className={controls}
            aria-label="Previous photo"
            onClick={() => navigate(-1)}
          >
            Previous
          </button>
        ) : null}
        <p
          className="text-sm tabular-nums text-[var(--df-text-soft)]"
          role="status"
        >
          {index + 1} / {images.length}
        </p>
        {images.length > 1 ? (
          <button
            type="button"
            className={controls}
            aria-label="Next photo"
            onClick={() => navigate(1)}
          >
            Next
          </button>
        ) : null}
      </div>
    </dialog>,
    document.body,
  );
}

type PhotoGalleryProps = {
  images: readonly PhotoGalleryImage[];
  label: string;
  emptyMessage?: string;
};

export function PhotoGallery({
  images,
  label,
  emptyMessage = "No photos are available in this collection yet.",
}: PhotoGalleryProps) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstNewButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (visibleCount > BATCH_SIZE) firstNewButton.current?.focus();
  }, [visibleCount]);

  if (images.length === 0) {
    return (
      <p className="border-y border-[var(--df-line)] py-8 text-[var(--df-text-soft)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <ul
        aria-label={label}
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
      >
        {images.slice(0, visibleCount).map((image, index) => (
          <li key={image.id} className="min-w-0">
            <button
              ref={
                index === visibleCount - BATCH_SIZE && index > 0
                  ? firstNewButton
                  : undefined
              }
              type="button"
              aria-label={`View photo ${index + 1}: ${image.alt}`}
              aria-haspopup="dialog"
              onClick={(event) => {
                triggerRef.current = event.currentTarget;
                setSelectedIndex(index);
              }}
              className="block aspect-[4/5] w-full cursor-zoom-in bg-[var(--df-panel-solid)] hover:brightness-110"
            >
              <Image
                src={image.src}
                alt=""
                width={image.width}
                height={image.height}
                loading={index < 4 ? "eager" : "lazy"}
                placeholder={image.blur ? "blur" : "empty"}
                blurDataURL={image.blur}
                unoptimized
                className="size-full object-cover object-[center_42%]"
              />
            </button>
          </li>
        ))}
      </ul>
      {visibleCount < images.length ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--df-line)] pt-4">
          <button
            type="button"
            className={controls}
            onClick={() => setVisibleCount((count) => count + BATCH_SIZE)}
          >
            Show more photos
          </button>
          <p className="text-sm tabular-nums text-[var(--df-text-soft)]">
            Showing {visibleCount.toLocaleString("en-US")} of{" "}
            {images.length.toLocaleString("en-US")}
          </p>
        </div>
      ) : null}
      {selectedIndex !== null && images[selectedIndex] ? (
        <PhotoViewer
          images={images}
          index={selectedIndex}
          label={label}
          triggerRef={triggerRef}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      ) : null}
    </>
  );
}
