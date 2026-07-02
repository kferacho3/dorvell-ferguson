import type { DorvellImage } from "@/content/dorvell.schema";
import type { GalleryLane } from "@/lib/gallery-lanes";

export type HomeImageCollections = {
  heroImages: DorvellImage[];
  featuredImages: DorvellImage[];
  socialImages: DorvellImage[];
  kineticImages: DorvellImage[];
  sequenceImages: DorvellImage[];
  motionPathImages: DorvellImage[];
  flightImages: DorvellImage[];
  worldsImages: DorvellImage[];
  archiveImages: DorvellImage[];
  studioImages: DorvellImage[];
  runwayImages: DorvellImage[];
  designImages: DorvellImage[];
  aboutImages: DorvellImage[];
  bookingImages: DorvellImage[];
};

const sectionPlan = [
  ["featuredImages", 8],
  ["socialImages", 9],
  ["kineticImages", 18],
  ["sequenceImages", 12],
  ["motionPathImages", 10],
  ["flightImages", 7],
  ["worldsImages", 16],
  ["archiveImages", 8],
  ["studioImages", 6],
  ["runwayImages", 10],
  ["designImages", 8],
  ["aboutImages", 4],
  ["bookingImages", 8],
] as const;

function isInstagramImage(image: DorvellImage) {
  return image.sourcePage.includes("instagram.com");
}

function hasOptimizedImage(image: DorvellImage) {
  return Boolean(image.localOptimized.sm && image.localOptimized.md && image.localOptimized.lg);
}

function rotate<T>(items: T[], offset: number) {
  if (items.length === 0) return items;
  const start = offset % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

function sourcePostKey(image: DorvellImage) {
  return image.sourcePage.replace(/\?.*$/, "");
}

function orderedLaneImages(lane: GalleryLane, salt: number) {
  const portfolioImages = rotate(
    lane.images.filter((image) => !isInstagramImage(image) && hasOptimizedImage(image)),
    salt,
  );
  const instagramImages = rotate(
    lane.images.filter((image) => isInstagramImage(image) && hasOptimizedImage(image)),
    salt * 7,
  );
  const ordered: DorvellImage[] = [];
  const maxLength = Math.max(portfolioImages.length, instagramImages.length);

  for (let index = 0; index < maxLength; index += 1) {
    const portfolioImage = portfolioImages[index];
    const instagramImage = instagramImages[index];
    if (portfolioImage) ordered.push(portfolioImage);
    if (instagramImage) ordered.push(instagramImage);
  }

  return ordered;
}

function selectLaneImages(lane: GalleryLane, count: number, usedIds: Set<string>, usedPosts: Set<string>, salt: number) {
  const candidates = orderedLaneImages(lane, salt).filter((image) => !usedIds.has(image.id));
  const selected: DorvellImage[] = [];
  const selectedIds = new Set<string>();
  const localPosts = new Set<string>();

  for (const image of candidates) {
    const postKey = sourcePostKey(image);
    if (usedPosts.has(postKey) || localPosts.has(postKey)) continue;
    selected.push(image);
    selectedIds.add(image.id);
    localPosts.add(postKey);
    if (selected.length >= count) break;
  }

  for (const image of candidates) {
    if (selected.length >= count) break;
    if (selectedIds.has(image.id)) continue;
    const postKey = sourcePostKey(image);
    if (localPosts.has(postKey)) continue;
    selected.push(image);
    selectedIds.add(image.id);
    localPosts.add(postKey);
  }

  for (const image of candidates) {
    if (selected.length >= count) break;
    if (selectedIds.has(image.id)) continue;
    selected.push(image);
    selectedIds.add(image.id);
  }

  selected.forEach((image) => {
    usedIds.add(image.id);
    usedPosts.add(sourcePostKey(image));
  });
  return selected;
}

function imagePool(lanes: GalleryLane[], countPerLane: number, usedIds: Set<string>, usedPosts: Set<string>, salt: number) {
  return lanes.flatMap((lane, laneIndex) => selectLaneImages(lane, countPerLane, usedIds, usedPosts, salt + laneIndex * 3));
}

export function buildHomeImageCollections(lanes: GalleryLane[]): HomeImageCollections {
  const usedIds = new Set<string>();
  const usedPosts = new Set<string>();
  const heroImages = imagePool(lanes, 14, usedIds, usedPosts, 0);
  const collections = { heroImages } as HomeImageCollections;

  sectionPlan.forEach(([key, countPerLane], sectionIndex) => {
    collections[key] = imagePool(lanes, countPerLane, usedIds, usedPosts, 11 + sectionIndex * 17);
  });

  return collections;
}
