import type { DorvellImage } from "@/content/dorvell.schema";
import { readPhotoCategorizationLedgerSync } from "@/lib/dorvell-photo-categorization-ledger";
import { isMisfiledFashionCreativeImage, type GalleryLane } from "@/lib/gallery-lanes";

export type HomeImageCollections = {
  entryImages: DorvellImage[];
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
  ["featuredImages", 5],
  ["socialImages", 5],
  ["kineticImages", 8],
  ["sequenceImages", 5],
  ["motionPathImages", 5],
  ["flightImages", 4],
  ["worldsImages", 6],
  ["archiveImages", 5],
  ["studioImages", 4],
  ["runwayImages", 5],
  ["designImages", 4],
  ["aboutImages", 3],
  ["bookingImages", 4],
] as const;

function isInstagramImage(image: DorvellImage) {
  return image.sourcePage.includes("instagram.com");
}

function isInstagramAccountImage(image: DorvellImage, account: string) {
  return image.sourcePage.includes(`instagram.com/${account}/`);
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
  if (!isInstagramImage(image)) return image.localOriginal || image.sourceUrl || image.id;
  return image.sourcePage.replace(/\?.*$/, "");
}

function orderedLaneImages(lane: GalleryLane, salt: number) {
  const eligibleImages = lane.images.filter((image) => !isMisfiledFashionCreativeImage(image) && hasOptimizedImage(image));
  const portfolioImages = rotate(
    eligibleImages.filter((image) => !isInstagramImage(image)),
    salt,
  );
  const personalImages = rotate(
    eligibleImages.filter((image) => isInstagramAccountImage(image, "2kferg")),
    salt * 5,
  );
  const photographyImages = rotate(
    eligibleImages.filter((image) => isInstagramAccountImage(image, "fergphotography")),
    salt * 7,
  );
  const ordered: DorvellImage[] = [];
  const maxLength = Math.max(portfolioImages.length, personalImages.length, photographyImages.length);

  for (let index = 0; index < maxLength; index += 1) {
    const portfolioImage = portfolioImages[index];
    const personalImage = personalImages[index];
    const photographyImage = photographyImages[index];
    if (portfolioImage) ordered.push(portfolioImage);
    if (personalImage) ordered.push(personalImage);
    if (photographyImage) ordered.push(photographyImage);
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
  const { scrapDecisions } = readPhotoCategorizationLedgerSync();
  const homeScrappedIds = new Set(
    Object.entries(scrapDecisions)
      .filter(([, decision]) => decision === "landing" || decision === "site")
      .map(([imageId]) => imageId),
  );
  const homeLanes = lanes.map((lane) => ({
    ...lane,
    images: lane.images.filter((image) => !homeScrappedIds.has(image.id)),
  }));
  const heroImages = imagePool(homeLanes, 10, usedIds, usedPosts, 0);
  const entryImages = imagePool(homeLanes, 1, usedIds, usedPosts, 83);
  const collections = { entryImages, heroImages } as HomeImageCollections;

  sectionPlan.forEach(([key, countPerLane], sectionIndex) => {
    collections[key] = imagePool(homeLanes, countPerLane, usedIds, usedPosts, 11 + sectionIndex * 17);
  });

  return collections;
}
