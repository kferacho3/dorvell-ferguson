import type { DorvellImage } from "@/content/dorvell.schema";
import { readPhotoCategorizationLedgerSync } from "@/lib/dorvell-photo-categorization-ledger";
import { buildGalleryLanes } from "@/lib/gallery-lanes";
import { modelingImages, portfolioImages } from "@/lib/photos/getPublicPhotos";

const homePhotoIds = {
  lead: "df-4cdbbe8250a8",
  portrait: "df-9c884ce53046",
  modeling: "fd-d17c518c3d44",
} as const;

const entranceSelections = [
  { label: "Portraits", lane: "portraits", id: "ig-3b4a4bb360a7" },
  { label: "Music", lane: "music-live", id: "df-34e74942d9f8" },
  { label: "Athletics", lane: "sports-athletics", id: "df-9f7c51f9c009" },
  { label: "Modeling", lane: "fashion-creative", id: "fd-e8e98c1c8194" },
] as const;

export function getHomeImages(images: DorvellImage[]) {
  const { scrapDecisions } = readPhotoCategorizationLedgerSync();
  const homeImages = images.filter(
    (image) => !scrapDecisions[image.id] && image.localOptimized.md,
  );
  const lanes = buildGalleryLanes(portfolioImages(homeImages));
  const portraits =
    lanes.find((lane) => lane.key === "portraits")?.images ?? [];
  const models = modelingImages(homeImages).images;
  const lead =
    portraits.find((image) => image.id === homePhotoIds.lead) ??
    portraits[0] ??
    homeImages[0];

  return {
    lead,
    portrait:
      portraits.find((image) => image.id === homePhotoIds.portrait) ??
      portraits.find((image) => image.id !== lead?.id) ??
      lead,
    modeling:
      models.find((image) => image.id === homePhotoIds.modeling) ?? models[0],
    entrance: entranceSelections.flatMap(({ label, lane, id }) => {
      const candidates =
        label === "Modeling"
          ? models
          : (lanes.find((collection) => collection.key === lane)?.images ?? []);
      const image =
        homeImages.find((entry) => entry.id === id) ?? candidates[0];
      return image
        ? [{ label, src: image.localOptimized.md, blur: image.blur }]
        : [];
    }),
  };
}
