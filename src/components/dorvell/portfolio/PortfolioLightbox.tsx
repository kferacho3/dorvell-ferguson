"use client";

import type { DorvellImage } from "@/content/dorvell.schema";
import { ImmersiveLightbox } from "../ImmersiveLightbox";

type LightboxOrigin = { x: number; y: number; width: number; height: number };

/**
 * The Portfolio project drawer — the shared accessible lightbox with a preset
 * "Book similar work" CTA into Contact. Used across every portfolio mode so the
 * detail view stays consistent.
 */
export function PortfolioLightbox(props: {
  images: DorvellImage[];
  index: number;
  origin?: LightboxOrigin;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  return <ImmersiveLightbox {...props} ctaHref="/contact" ctaLabel="Book similar work" />;
}
