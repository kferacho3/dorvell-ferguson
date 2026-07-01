import type { DorvellImage } from "@/content/dorvell.schema";

export function imageAlt(image: DorvellImage) {
  if (image.alt && image.alt.trim().length > 0) return image.alt;
  const category = image.category === "Uncategorized" ? "portfolio" : image.category.toLowerCase();
  return `${category} image from Dorvell Ferguson Jr.'s portfolio`;
}

export function blurImageProps(image: DorvellImage) {
  return image.blur
    ? {
        placeholder: "blur" as const,
        blurDataURL: image.blur,
      }
    : {};
}

export function heroImages(images: DorvellImage[], count = 7) {
  const preferred = images.filter((image) =>
    ["Fashion", "Portraits", "Runway", "Music"].includes(image.category),
  );
  return (preferred.length >= count ? preferred : images).slice(0, count);
}

export function categoryTone(category: string) {
  const tones: Record<string, string> = {
    Portraits: "portrait",
    Fashion: "fashion",
    Music: "music",
    Events: "events",
    Athletics: "athletics",
    "Graphic Design": "design",
    Modeling: "modeling",
    Runway: "runway",
    "Behind The Scenes": "bts",
    Uncategorized: "neutral",
  };

  return tones[category] ?? "neutral";
}
