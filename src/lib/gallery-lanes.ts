import type { DorvellImage } from "@/content/dorvell.schema";

export type GalleryLaneKey = "portraits" | "music-live" | "sports-athletics" | "fashion-creative";

export type GalleryLane = {
  key: GalleryLaneKey;
  label: string;
  eyebrow: string;
  slug: string;
  href: string;
  accent: string;
  accentSoft: string;
  deckLabel: string;
  description: string;
  projectSlugs: string[];
  images: DorvellImage[];
};

export const galleryLaneDefinitions: Omit<GalleryLane, "images">[] = [
  {
    key: "portraits",
    label: "Portraits",
    eyebrow: "01 / Face & Frame",
    slug: "portraits",
    href: "#portraits",
    accent: "#f0b35a",
    accentSoft: "rgba(240, 179, 90, 0.18)",
    deckLabel: "Portrait contact",
    description: "Controlled mood, styling, expression, and presence without losing the human read.",
    projectSlugs: ["fashion-shoots-2023"],
  },
  {
    key: "music-live",
    label: "Music & Live",
    eyebrow: "02 / Stage Heat",
    slug: "music-live",
    href: "#music-live",
    accent: "#f04d5e",
    accentSoft: "rgba(240, 77, 94, 0.2)",
    deckLabel: "Live archive",
    description: "Performance frames with sweat, light, crowd noise, and motion still intact.",
    projectSlugs: ["concerts-musical-artist"],
  },
  {
    key: "sports-athletics",
    label: "Sports / Athletics",
    eyebrow: "03 / Movement",
    slug: "sports-athletics",
    href: "#sports-athletics",
    accent: "#48c7ff",
    accentSoft: "rgba(72, 199, 255, 0.18)",
    deckLabel: "Athletic timing",
    description: "Game-speed coverage, discipline, impact, and the split-second body language around it.",
    projectSlugs: ["sports"],
  },
  {
    key: "fashion-creative",
    label: "Fashion / Creative Direction",
    eyebrow: "04 / Styled World",
    slug: "fashion-creative",
    href: "#fashion-creative",
    accent: "#35e0bb",
    accentSoft: "rgba(53, 224, 187, 0.18)",
    deckLabel: "Model / direction",
    description: "Runway-aware image direction, fit language, model presence, and authored visual taste.",
    projectSlugs: ["fashioncreative-direction-coming-soon", "home-2", "about", "work"],
  },
];

export function laneKeyForImage(image: DorvellImage): GalleryLaneKey {
  const projectSlug = image.projectSlug ?? "";
  const lane = galleryLaneDefinitions.find((definition) => definition.projectSlugs.includes(projectSlug));
  return lane?.key ?? "fashion-creative";
}

export function buildGalleryLanes(images: DorvellImage[]): GalleryLane[] {
  return galleryLaneDefinitions.map((definition) => {
    const laneImages = images.filter((image) => definition.projectSlugs.includes(image.projectSlug ?? ""));
    return {
      ...definition,
      images: laneImages.length > 0 ? laneImages : images.filter((image) => laneKeyForImage(image) === definition.key),
    };
  });
}

export function galleryLaneByKey(images: DorvellImage[], key: GalleryLaneKey) {
  return buildGalleryLanes(images).find((lane) => lane.key === key);
}
