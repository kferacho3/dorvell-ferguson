"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ElasticMorph } from "@/lib/elastic-morph";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// Self-authored, structurally-identical morph pair (viewBox 0 0 300 100):
// a clean rounded pill at rest that squishes + bulges on press, then settles
// back with elastic easing on release.
const REST_PATH =
  "M50,0C116.67,0 183.33,0 250,0C277.61,0 300,22.39 300,50C300,77.61 277.61,100 250,100C183.33,100 116.67,100 50,100C22.39,100 0,77.61 0,50C0,22.39 22.39,0 50,0Z";
const ACTIVE_PATH =
  "M50,0C116.67,11 183.33,11 250,0C277.61,6 307,28.39 307,50C307,71.61 277.61,94 250,100C183.33,89 116.67,89 50,100C22.39,94 -7,71.61 -7,50C-7,28.39 22.39,6 50,0Z";

type ElasticButtonProps = {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Primary tactile button. The visible surface is a morphing SVG path that
 * gives an elastic squish on press and a springy settle on release. Fully
 * functional (and static) under reduced motion or without pointer events —
 * the morph is pure decoration layered behind the real button label.
 */
export function ElasticButton({
  children,
  type = "button",
  onClick,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: ElasticButtonProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const morphRef = useRef<ElasticMorph | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const pathEl = pathRef.current;
    if (!pathEl) return;
    const morph = new ElasticMorph(pathEl, REST_PATH, ACTIVE_PATH);
    morphRef.current = morph;
    return () => {
      morph.destroy();
      morphRef.current = null;
    };
  }, [reducedMotion]);

  const press = () => {
    if (!disabled) morphRef.current?.press();
  };
  const release = () => morphRef.current?.release();

  return (
    <button
      type={type}
      className={className ? `elastic-btn ${className}` : "elastic-btn"}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onBlur={release}
    >
      <span className="elastic-btn__shape" aria-hidden="true">
        <svg viewBox="0 0 300 100" preserveAspectRatio="none" focusable="false">
          <path ref={pathRef} d={REST_PATH} />
        </svg>
      </span>
      <span className="elastic-btn__label">{children}</span>
    </button>
  );
}
