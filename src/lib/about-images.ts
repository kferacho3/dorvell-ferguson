import type { DorvellImage } from "@/content/dorvell.schema";

/**
 * Deterministic, server-side image picks for the About page. Selection is
 * stable (first-match by category over the ordered public pool) so server and
 * client render identical markup — no hydration drift.
 */

export function pickByCategory(
  images: DorvellImage[],
  category: string,
  used: Set<string>,
  count = 1,
): DorvellImage[] {
  const out: DorvellImage[] = [];
  for (const image of images) {
    if (out.length >= count) break;
    if (image.category === category && !used.has(image.id)) {
      out.push(image);
      used.add(image.id);
    }
  }
  return out;
}

/**
 * Hero portrait of Dorvell. There is no image tagged `projectSlug === "about"`,
 * so we prefer the small Modeling pool (photos OF him), then Fashion, then
 * Portraits, then any image.
 *
 * TODO (client): confirm / replace with the final chosen hero portrait asset.
 */
export function pickHeroPortrait(images: DorvellImage[]): DorvellImage | undefined {
  return (
    images.find((image) => image.category === "Modeling") ??
    images.find((image) => image.category === "Fashion") ??
    images.find((image) => image.category === "Portraits") ??
    images[0]
  );
}

/** A small, deduped set of frames for the hero cursor trailer. */
export function pickTrailerImages(images: DorvellImage[], exclude: Set<string>, count = 6): DorvellImage[] {
  const out: DorvellImage[] = [];
  const categories = ["Fashion", "Music", "Portraits", "Athletics"];
  let ci = 0;
  while (out.length < count && ci < categories.length * 4) {
    const category = categories[ci % categories.length];
    const next = images.find(
      (image) => image.category === category && !exclude.has(image.id),
    );
    if (next) {
      out.push(next);
      exclude.add(next.id);
    }
    ci += 1;
  }
  // Top up from anywhere if categories ran dry.
  for (const image of images) {
    if (out.length >= count) break;
    if (!exclude.has(image.id)) {
      out.push(image);
      exclude.add(image.id);
    }
  }
  return out;
}
