import curated from "@/content/curatedPhotos.generated.json";
import { dorvellCategories, type DorvellCategory, type DorvellImage } from "@/content/dorvell.schema";

export const CURATED_PUBLIC_SCHEMA = "dorvell-photo-curation-public/v1";

export type CuratedPublicPhoto = {
  photo_id: string;
  filename: string;
  status: "kept" | "scrapped";
  category_primary: string | null;
  category_tags: string[];
  portfolio: boolean;
  modeling: boolean;
  projects: boolean;
};

export type CuratedPublicData = {
  schema: string;
  generatedAt: string | null;
  finalized: boolean;
  sourceReportExportedAt: string | null;
  photos: CuratedPublicPhoto[];
};

function loadCurated(): CuratedPublicData {
  const data = curated as unknown as CuratedPublicData;
  if (data.schema !== CURATED_PUBLIC_SCHEMA || !Array.isArray(data.photos)) {
    return {
      schema: CURATED_PUBLIC_SCHEMA,
      generatedAt: null,
      finalized: false,
      sourceReportExportedAt: null,
      photos: [],
    };
  }
  return data;
}

export type CuratedLookup = {
  finalized: boolean;
  hasData: boolean;
  keptIds: Set<string>;
  scrappedIds: Set<string>;
  portfolioIds: Set<string>;
  modelingIds: Set<string>;
  projectIds: Set<string>;
  categoryById: Map<string, string | null>;
  tagsById: Map<string, string[]>;
};

let cachedLookup: CuratedLookup | null = null;

export function getCuratedLookup(): CuratedLookup {
  if (cachedLookup) return cachedLookup;
  const data = loadCurated();
  const lookup: CuratedLookup = {
    finalized: data.finalized,
    hasData: data.photos.length > 0,
    keptIds: new Set(),
    scrappedIds: new Set(),
    portfolioIds: new Set(),
    modelingIds: new Set(),
    projectIds: new Set(),
    categoryById: new Map(),
    tagsById: new Map(),
  };
  for (const photo of data.photos) {
    if (photo.status === "kept") {
      lookup.keptIds.add(photo.photo_id);
      lookup.categoryById.set(photo.photo_id, photo.category_primary);
      if (Array.isArray(photo.category_tags) && photo.category_tags.length > 0) {
        lookup.tagsById.set(photo.photo_id, photo.category_tags);
      }
      if (photo.portfolio) lookup.portfolioIds.add(photo.photo_id);
      if (photo.modeling) lookup.modelingIds.add(photo.photo_id);
      if (photo.projects) lookup.projectIds.add(photo.photo_id);
    } else {
      lookup.scrappedIds.add(photo.photo_id);
    }
  }
  cachedLookup = lookup;
  return lookup;
}

/**
 * Site-wide public pool. Once a finalized curation report exists, only KEPT
 * photos are ever publicly visible — scrapped and unreviewed photos disappear.
 * Before finalization, the full input list passes through unchanged.
 */
export function filterPublicImages(images: DorvellImage[]): DorvellImage[] {
  const lookup = getCuratedLookup();
  if (!lookup.finalized) return images;
  const kept = images.filter((image) => lookup.keptIds.has(image.id));
  // Defensive: a finalized dataset that matches nothing on this site must not
  // blank every page — fall back to the uncurated pool.
  return kept.length > 0 ? kept : images;
}

/** Portfolio page pool: kept + portfolio-assigned once final data exists. */
export function portfolioImages(images: DorvellImage[]): DorvellImage[] {
  const lookup = getCuratedLookup();
  if (!lookup.finalized) return images;
  const assigned = images.filter((image) => lookup.portfolioIds.has(image.id));
  if (assigned.length > 0) return assigned;
  // If nothing was explicitly assigned to Portfolio, all kept photos qualify;
  // and if nothing matches at all, never blank the archive.
  const kept = images.filter((image) => lookup.keptIds.has(image.id));
  return kept.length > 0 ? kept : images;
}

/**
 * Modeling page pool: kept + modeling-assigned once curation data exists
 * (works pre-finalization too — the Room fills as photos are marked MODELING).
 * Fallback before any curation: Modeling/Runway categories and @2kferg-tagged
 * frames already present in the archive.
 */
export function modelingImages(images: DorvellImage[]): { images: DorvellImage[]; curated: boolean } {
  const lookup = getCuratedLookup();
  if (lookup.modelingIds.size > 0) {
    const assigned = images.filter((image) => lookup.modelingIds.has(image.id));
    if (assigned.length > 0) return { images: assigned, curated: true };
  }
  if (lookup.finalized) return { images: [], curated: true };
  const fallback = images.filter(
    (image) =>
      image.category === "Modeling" ||
      image.category === "Runway" ||
      image.tags.some((tag) => tag.toLowerCase().includes("2kferg")),
  );
  return { images: fallback, curated: false };
}

/** Projects page pool: kept + project-assigned once curation data exists. */
export function projectImages(images: DorvellImage[]): DorvellImage[] {
  const lookup = getCuratedLookup();
  if (lookup.projectIds.size === 0) return [];
  return images.filter((image) => lookup.projectIds.has(image.id));
}

/**
 * Maps a Studio curation category label onto the site's published DorvellCategory
 * taxonomy. Studio uses a broader working vocabulary; unmapped labels (Travel,
 * Landscape, College Project, …) return null and are simply dropped from the
 * public category set.
 */
const STUDIO_TO_SITE_CATEGORY: Record<string, DorvellCategory> = {
  Portrait: "Portraits",
  Headshots: "Headshots",
  Editorial: "Fashion",
  Event: "Events",
  Street: "Photojournalism",
  Product: "Studio",
  Lifestyle: "Portraits",
  Studio: "Studio",
  Photojournalism: "Photojournalism",
  Video: "Video",
  "Behind-the-Scenes": "Behind The Scenes",
  Modeling: "Modeling",
  Fashion: "Fashion",
  Music: "Music",
  Athletics: "Athletics",
  "Graphic Design": "Graphic Design",
  Runway: "Runway",
};
const SITE_CATEGORY_SET = new Set<string>(dorvellCategories);

function toSiteCategory(name: string | null | undefined): DorvellCategory | null {
  if (!name) return null;
  if (STUDIO_TO_SITE_CATEGORY[name]) return STUDIO_TO_SITE_CATEGORY[name];
  if (SITE_CATEGORY_SET.has(name)) return name as DorvellCategory;
  return null;
}

/**
 * Applies the client's Studio categorisation (primary + additional categories +
 * video flag) onto the images so the portfolio's category chips / filters reflect
 * curated intent. Inert until a curation report has categories (currently a
 * no-op), so it never changes the pre-curation, scrape-derived categories.
 */
export function applyCuratedCategories(images: DorvellImage[]): DorvellImage[] {
  const lookup = getCuratedLookup();
  if (lookup.categoryById.size === 0 && lookup.tagsById.size === 0) return images;

  return images.map((image) => {
    const primary = lookup.categoryById.get(image.id);
    const tags = lookup.tagsById.get(image.id);
    if (primary === undefined && tags === undefined) return image;

    const mapped: DorvellCategory[] = [];
    const sitePrimary = toSiteCategory(primary);
    if (sitePrimary) mapped.push(sitePrimary);
    for (const tag of tags ?? []) {
      const siteTag = toSiteCategory(tag);
      if (siteTag) mapped.push(siteTag);
    }
    const unique = Array.from(new Set(mapped));
    if (unique.length === 0) return image;

    return {
      ...image,
      category: unique[0],
      categories: unique,
      mediaType: unique.includes("Video") ? ("video" as const) : image.mediaType,
    };
  });
}
