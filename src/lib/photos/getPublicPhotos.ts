import curated from "@/content/curatedPhotos.generated.json";
import type { DorvellImage } from "@/content/dorvell.schema";

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
  };
  for (const photo of data.photos) {
    if (photo.status === "kept") {
      lookup.keptIds.add(photo.photo_id);
      lookup.categoryById.set(photo.photo_id, photo.category_primary);
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
