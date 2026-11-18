import type { DorvellImage } from "@/content/dorvell.schema";
import { imageAlt } from "@/lib/images";

export type PhotoGalleryImage = {
  id: string;
  src: string;
  full: string;
  width: number;
  height: number;
  alt: string;
  blur?: string;
};

export function toPhotoGalleryImage(image: DorvellImage): PhotoGalleryImage {
  return {
    id: image.id,
    src: image.localOptimized.md,
    full: image.localOptimized.lg || image.localOptimized.md,
    width: image.width,
    height: image.height,
    alt: imageAlt(image),
    blur: image.blur,
  };
}
