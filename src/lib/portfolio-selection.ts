import type { DorvellImage } from "@/content/dorvell.schema";
import { buildGalleryLanes, type GalleryLane } from "@/lib/gallery-lanes";

/**
 * Deterministic selection helpers for the Portfolio page. Everything here is a
 * pure function of the input images (no Math.random / Date at module scope) so
 * server and client render identical output and there are no hydration mismatches.
 */

/** Cheap "is this a strong featured frame" score — prefers reviewed alt + captioned. */
function featureScore(image: DorvellImage): number {
  let score = 0;
  if (!image.needsAltReview) score += 2;
  if (image.caption && image.caption.trim().length > 0) score += 1;
  // Landscape frames read better as wide featured prints; nudge them up slightly.
  if (image.aspectRatio >= 1) score += 1;
  return score;
}

/**
 * A curated, category-spread set of featured frames. Round-robins across the four
 * lanes so no single category dominates, picking the strongest frames first.
 */
export function featuredImages(images: DorvellImage[], count = 8): DorvellImage[] {
  const lanes = buildGalleryLanes(images);
  const pools = lanes
    .map((lane) => [...lane.images].sort((a, b) => featureScore(b) - featureScore(a)))
    .filter((pool) => pool.length > 0);

  if (pools.length === 0) return images.slice(0, count);

  const picked: DorvellImage[] = [];
  const seen = new Set<string>();
  let round = 0;
  while (picked.length < count && pools.some((pool) => pool.length > round)) {
    for (const pool of pools) {
      if (picked.length >= count) break;
      const image = pool[round];
      if (image && !seen.has(image.id)) {
        seen.add(image.id);
        picked.push(image);
      }
    }
    round += 1;
  }
  return picked;
}

/** Non-empty lanes with images capped for a horizontal strip. */
export function laneStrips(images: DorvellImage[], perStrip = 14): GalleryLane[] {
  return buildGalleryLanes(images)
    .filter((lane) => lane.images.length > 0)
    .map((lane) => ({ ...lane, images: lane.images.slice(0, perStrip) }));
}

export type PortfolioChapter = {
  lane: GalleryLane;
  images: DorvellImage[];
};

/** 2–4 scroll chapters (one per populated lane), each with 8–16 frames. */
export function portfolioChapters(images: DorvellImage[], perChapter = 12): PortfolioChapter[] {
  return buildGalleryLanes(images)
    .filter((lane) => lane.images.length >= 4)
    .map((lane) => ({ lane, images: lane.images.slice(0, perChapter) }));
}

/** A ring / orbit selection — one strong frame per lane, padded from the first lane. */
export function ringImages(images: DorvellImage[], count = 8): DorvellImage[] {
  const featured = featuredImages(images, count);
  if (featured.length >= count) return featured.slice(0, count);
  // Pad from the remaining pool without duplicates.
  const seen = new Set(featured.map((image) => image.id));
  const padded = [...featured];
  for (const image of images) {
    if (padded.length >= count) break;
    if (!seen.has(image.id)) {
      seen.add(image.id);
      padded.push(image);
    }
  }
  return padded;
}
