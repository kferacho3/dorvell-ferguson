import type { DorvellCategory, DorvellImage } from "@/content/dorvell.schema";
import type { GalleryLaneKey } from "@/lib/gallery-lanes";

/**
 * Category-level taxonomy for the Portfolio page. This is a finer grain than the
 * 4 gallery "lanes" (which stay the accent/world grouping used by WorkArchive and
 * the footer). Each category maps back to a lane for its accent colour and to a
 * human descriptor. Category chips render only for categories that actually
 * contain media (see `activePortfolioCategories`), so empty categories never
 * create a dead-end gallery — and new categories light up automatically as the
 * client tags media in the Studio.
 *
 * Accent hex values intentionally mirror the `--df-*` tokens in dorvell.css
 * (gold #f0b35a, teal #35e0bb, red #f04d5e, blue #48c7ff, rust #9d5c39). They are
 * injected as the `--lane-accent` custom property, exactly like gallery-lanes.ts,
 * so all colour still resolves through the themeable var in CSS.
 */

export type PortfolioCategoryFilter = DorvellCategory | "All";

export type PortfolioCategoryDef = {
  category: DorvellCategory;
  /** User-facing label (may differ from the raw enum, e.g. "Music & Live"). */
  label: string;
  /** One-line editorial descriptor. */
  descriptor: string;
  /** Accent colour (mirrors a --df-* token). */
  accent: string;
  /** Lane this category belongs to for world grouping / accent inheritance. */
  lane: GalleryLaneKey;
  /** When true this is represented elsewhere (Modeling has its own /modeling room). */
  crossLinkHref?: string;
};

const ACCENT = {
  gold: "#f0b35a",
  teal: "#35e0bb",
  red: "#f04d5e",
  blue: "#48c7ff",
  rust: "#9d5c39",
} as const;

/** Ordered for chip display — strongest / most-populated categories lead. */
export const PORTFOLIO_CATEGORIES: readonly PortfolioCategoryDef[] = [
  { category: "Portraits", label: "Portraits", descriptor: "Presence, identity, expression.", accent: ACCENT.gold, lane: "portraits" },
  { category: "Headshots", label: "Headshots", descriptor: "Clean, professional, intentional.", accent: ACCENT.gold, lane: "portraits" },
  { category: "Music", label: "Music & Live", descriptor: "Live energy, stage light, crowd movement.", accent: ACCENT.red, lane: "music-live" },
  { category: "Athletics", label: "Sports / Athletics", descriptor: "Timing, motion, intensity.", accent: ACCENT.blue, lane: "sports-athletics" },
  { category: "Fashion", label: "Fashion", descriptor: "Pose, styling, visual direction.", accent: ACCENT.teal, lane: "fashion-creative" },
  { category: "Studio", label: "Studio", descriptor: "Lighting, control, polish.", accent: ACCENT.teal, lane: "fashion-creative" },
  { category: "Events", label: "Events", descriptor: "Atmosphere, people, story.", accent: ACCENT.rust, lane: "music-live" },
  { category: "Photojournalism", label: "Photojournalism", descriptor: "Context, accuracy, humanity.", accent: ACCENT.rust, lane: "music-live" },
  { category: "Video", label: "Video / Social", descriptor: "Motion, social, moving image.", accent: ACCENT.blue, lane: "fashion-creative" },
  { category: "Modeling", label: "Modeling", descriptor: "Movement, pose, camera-aware.", accent: ACCENT.teal, lane: "fashion-creative", crossLinkHref: "/modeling" },
  { category: "Runway", label: "Runway", descriptor: "Fashion-week walks and shows.", accent: ACCENT.teal, lane: "fashion-creative", crossLinkHref: "/modeling" },
  { category: "Graphic Design", label: "Graphic Design", descriptor: "Layout, type, designed image.", accent: ACCENT.gold, lane: "portraits" },
  { category: "Behind The Scenes", label: "Behind the Scenes", descriptor: "On-set, process, prep.", accent: ACCENT.rust, lane: "fashion-creative" },
  { category: "Uncategorized", label: "Selected", descriptor: "Selected frames.", accent: ACCENT.teal, lane: "fashion-creative" },
];

const DEF_BY_CATEGORY = new Map<DorvellCategory, PortfolioCategoryDef>(
  PORTFOLIO_CATEGORIES.map((def) => [def.category, def]),
);

export function getCategoryDef(category: DorvellCategory): PortfolioCategoryDef {
  return DEF_BY_CATEGORY.get(category) ?? PORTFOLIO_CATEGORIES[0];
}

/** The categories an image belongs to. Falls back to the single `category` field. */
export function imageCategories(image: DorvellImage): DorvellCategory[] {
  const list = image.categories && image.categories.length > 0 ? image.categories : [image.category];
  // De-dupe while preserving order.
  return Array.from(new Set(list));
}

export function imageMatchesCategory(image: DorvellImage, category: PortfolioCategoryFilter): boolean {
  if (category === "All") return true;
  return imageCategories(image).includes(category);
}

export function isVideo(image: DorvellImage): boolean {
  return image.mediaType === "video" || imageCategories(image).includes("Video");
}

/** Count of images per category, counting an image once for EACH category it carries. */
export function countByCategory(images: DorvellImage[]): Map<DorvellCategory, number> {
  const counts = new Map<DorvellCategory, number>();
  for (const image of images) {
    for (const category of imageCategories(image)) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  return counts;
}

export type ActivePortfolioCategory = PortfolioCategoryDef & {
  count: number;
  sample?: DorvellImage;
};

/**
 * Ordered list of categories that actually contain media, each with its count and
 * a representative sample image. "Uncategorized" is always suppressed from chips.
 */
export function activePortfolioCategories(images: DorvellImage[]): ActivePortfolioCategory[] {
  const counts = countByCategory(images);
  const sampleFor = (category: DorvellCategory) =>
    images.find((image) => imageMatchesCategory(image, category));

  return PORTFOLIO_CATEGORIES.filter(
    (def) => def.category !== "Uncategorized" && (counts.get(def.category) ?? 0) > 0,
  ).map((def) => ({
    ...def,
    count: counts.get(def.category) ?? 0,
    sample: sampleFor(def.category),
  }));
}

export function filterByCategory(
  images: DorvellImage[],
  category: PortfolioCategoryFilter,
): DorvellImage[] {
  if (category === "All") return images;
  return images.filter((image) => imageMatchesCategory(image, category));
}
