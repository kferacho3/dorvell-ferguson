import type { DorvellImage } from "@/content/dorvell.schema";
import { readPhotoCategorizationLedgerSync } from "@/lib/dorvell-photo-categorization-ledger";
import { buildGalleryLanes } from "@/lib/gallery-lanes";
import { modelingImages, portfolioImages } from "@/lib/photos/getPublicPhotos";

const homePhotoIds = {
  lead: "df-4cdbbe8250a8",
  portrait: "df-9c884ce53046",
  modeling: "fd-d17c518c3d44",
} as const;

export function getHomeImages(images: DorvellImage[]) {
  const { scrapDecisions } = readPhotoCategorizationLedgerSync();
  const homeImages = images.filter(
    (image) => !scrapDecisions[image.id] && image.localOptimized.md,
  );
  const portraits =
    buildGalleryLanes(portfolioImages(homeImages)).find(
      (lane) => lane.key === "portraits",
    )?.images ?? [];
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
  };
}
