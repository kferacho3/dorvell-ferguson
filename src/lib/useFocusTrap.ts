"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),video,input,select,textarea';

type FocusTrapHandlers = {
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

/**
 * Modal focus management for the film viewer and the creative lightbox.
 *
 * Returns a ref for the dialog container. On mount it locks body scroll, moves
 * focus to `[data-autofocus]`, and traps Tab inside the dialog; on unmount it
 * restores scroll and returns focus to whatever opened it.
 *
 * Handlers are read through a ref that is refreshed on every render, so
 * navigating between films never tears down and re-establishes focus
 * management — the listener subscribes exactly once per open.
 */
export function useFocusTrap<T extends HTMLElement>(handlers: FocusTrapHandlers) {
  const containerRef = useRef<T | null>(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    container?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      const current = handlersRef.current;
      if (event.key === "Escape") {
        event.preventDefault();
        current.onClose();
        return;
      }
      if (event.key === "ArrowLeft" && current.onPrev) {
        current.onPrev();
        return;
      }
      if (event.key === "ArrowRight" && current.onNext) {
        current.onNext();
        return;
      }
      if (event.key !== "Tab" || !container) return;

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
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
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return containerRef;
}
