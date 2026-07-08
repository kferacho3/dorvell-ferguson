import type { DorvellImage } from "@/content/dorvell.schema";
import { imageAlt } from "@/lib/images";
import type { CurationPhoto, UploadRecord } from "@/lib/curation/types";

export const SITE_BATCH = "site";

function filenameFromPath(p: string) {
  const clean = p.split(/[?#]/)[0];
  return clean.slice(clean.lastIndexOf("/") + 1) || clean;
}

/**
 * Maps the site's generated image data into the curation manifest.
 * IDs reuse the deterministic `df-<hash>` ids from the scrape pipeline —
 * never array indexes — so reports stay valid across rebuilds.
 */
export function siteManifest(images: DorvellImage[]): CurationPhoto[] {
  return images.map((image) => ({
    photo_id: image.id,
    filename: filenameFromPath(image.localOriginal || image.localOptimized.lg),
    src: image.localOptimized.md,
    thumb: image.localOptimized.sm,
    full: image.localOptimized.lg || image.localOptimized.md,
    blur: image.blur,
    width: image.width,
    height: image.height,
    aspectRatio: image.aspectRatio,
    batch: SITE_BATCH,
    relativePath: image.localOriginal,
    scrapedCategory: image.category,
    alt: imageAlt(image),
    source: "site" as const,
  }));
}

/**
 * Deterministic id for browser uploads: filename + size + lastModified + batch
 * (+ folder-relative path when available, so identical files in different
 * subfolders of one upload don't collide).
 * Survives reloads and re-uploads of the same files from the same folder.
 */
export function uploadPhotoId(
  file: { name: string; size: number; lastModified: number },
  batch: string,
  relativePath?: string,
) {
  const raw = `${relativePath ?? file.name}|${file.size}|${file.lastModified}|${batch}`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i += 1) {
    hash = ((hash << 5) + hash + raw.charCodeAt(i)) | 0;
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 48);
  return `up-${(hash >>> 0).toString(16)}-${safeName}`;
}

/** Manifest entry for a live upload with an object URL preview. */
export function uploadManifestEntry(record: UploadRecord, objectUrl: string | null): CurationPhoto {
  return {
    photo_id: record.photo_id,
    filename: record.filename,
    src: objectUrl ?? "",
    thumb: objectUrl ?? "",
    full: objectUrl ?? "",
    width: 0,
    height: 0,
    aspectRatio: 1,
    batch: record.batch,
    relativePath: record.relativePath,
    alt: record.filename,
    source: "upload" as const,
    previewDisconnected: !objectUrl,
  };
}
