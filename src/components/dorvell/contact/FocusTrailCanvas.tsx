"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// One-shot capability probe (fine pointer + non-mobile width), cached so the
// external-store snapshot stays stable across renders.
let finePointer: boolean | null = null;
const subscribeNever = () => () => {};
const getFinePointer = () => {
  if (finePointer === null) {
    finePointer =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches &&
      window.innerWidth > 760;
  }
  return finePointer;
};
const getServerFinePointer = () => false;

type FocusTrailCanvasProps = {
  containerRef: RefObject<HTMLElement | null>;
};

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isField(el: EventTarget | null): el is Field {
  if (!(el instanceof HTMLElement)) return false;
  if (!/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return false;
  if (el instanceof HTMLInputElement && (el.type === "radio" || el.type === "checkbox")) return false;
  return true;
}

/**
 * Decorative focus indicator (a rebuild of Codrops "Focusss"): a warm head dot
 * trailed by a teal tail follows the active field, growing a check mark when the
 * field validates. Purely cosmetic — pointer-events:none, aria-hidden, and it
 * only mounts on fine-pointer, motion-OK devices. Focus remains fully usable
 * (native focus rings) when the canvas is absent.
 */
export function FocusTrailCanvas({ containerRef }: FocusTrailCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const finePointerReady = useSyncExternalStore(subscribeNever, getFinePointer, getServerFinePointer);
  const enabled = finePointerReady && !reducedMotion;

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const styles = getComputedStyle(document.documentElement);
    const headColor = styles.getPropertyValue("--df-gold").trim() || "#f0b35a";
    const tailColor = styles.getPropertyValue("--df-teal").trim() || "#35e0bb";
    const inkColor = styles.getPropertyValue("--df-ink").trim() || "#090a09";

    // The head rides a fixed left rail (inside the card's reserved padding-left
    // gutter) and only tracks the focused field vertically — so it never lands
    // in the two-column grid gap or behind a neighbouring input.
    const RAIL_X = 15;
    const RADIUS = 5;
    const TAIL = 9;
    const head = { x: NaN, y: NaN, r: RADIUS, tx: 0, ty: 0, vx: 0, check: 0, checkTarget: 0 };
    const tail: { x: number; y: number }[] = [];
    let currentEl: Field | null = null;
    let cssW = 0;
    let cssH = 0;
    let raf = 0;

    const aim = (el: Field) => {
      const cr = container.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      head.tx = RAIL_X;
      head.ty = er.top - cr.top + er.height / 2;
    };

    const validate = (el: Field) => {
      const filled = String(el.value ?? "").trim().length > 0;
      head.checkTarget = filled && el.checkValidity() ? 1 : 0;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = container.clientWidth;
      cssH = container.clientHeight;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (currentEl) aim(currentEl);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!isField(event.target)) return;
      const el = event.target;
      const previous = currentEl;
      currentEl = el;
      aim(el);
      validate(el);
      if (Number.isNaN(head.x)) {
        head.x = head.tx;
        head.y = head.ty;
      }
      if (el !== previous) {
        head.vx = -6 - Math.abs(head.tx - head.x) / 6;
        tail.length = 0;
      }
    };

    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (!next || !container.contains(next)) {
        currentEl = null;
        head.checkTarget = 0;
      }
    };

    const onInput = (event: Event) => {
      if (isField(event.target) && event.target === currentEl) validate(event.target);
    };

    const paint = () => {
      ctx.clearRect(0, 0, cssW, cssH);

      if (currentEl && !Number.isNaN(head.x)) {
        tail.push({ x: head.x, y: head.y });
        if (tail.length > TAIL) tail.shift();

        if (tail.length > 3) {
          ctx.beginPath();
          ctx.moveTo(tail[0].x, tail[0].y);
          for (let i = 1; i < tail.length - 1; i += 1) {
            const p1 = tail[i];
            const p2 = tail[i + 1];
            ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
          }
          ctx.lineWidth = RADIUS * 0.9;
          ctx.lineCap = "round";
          ctx.strokeStyle = tailColor;
          ctx.globalAlpha = 0.45;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        head.x += (head.tx - head.x) * 0.2;
        head.y += (head.ty - head.y) * 0.2;
        head.vx *= 0.8;
        head.x += head.vx;
        head.check += (head.checkTarget - head.check) * 0.2;
        head.r += (RADIUS + head.check * 2 - head.r) * 0.2;

        ctx.beginPath();
        ctx.arc(head.x, head.y, head.r, 0, Math.PI * 2);
        ctx.fillStyle = headColor;
        ctx.fill();

        if (head.check > 0.06) {
          const size = 3.4 * head.check;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(head.x - size, head.y);
          ctx.lineTo(head.x - size * 0.2, head.y + size);
          ctx.lineTo(head.x + size, head.y - size);
          ctx.lineWidth = 1.6;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = inkColor;
          ctx.stroke();
          ctx.restore();
        }
      }

      raf = requestAnimationFrame(paint);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);
    container.addEventListener("input", onInput);
    raf = requestAnimationFrame(paint);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
      container.removeEventListener("input", onInput);
    };
  }, [enabled, containerRef]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} className="focus-trail" aria-hidden="true" />;
}
