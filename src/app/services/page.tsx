import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { ServicesExperience } from "@/components/dorvell/services/ServicesExperience";
import type { IntroFrame } from "@/components/dorvell/services/ServicesIntro";
import type { ServiceCardData } from "@/components/dorvell/services/ServicesPricing";
import type { DorvellImage } from "@/content/dorvell.schema";
import { imageAlt } from "@/lib/images";
import { getPortfolioData } from "@/lib/portfolio-data";
import { ORBIT_SLOTS, type OrbitTile } from "@/lib/services-content";
import { getCategoryDef, imageCategories } from "@/lib/portfolio-taxonomy";

export const metadata = {
  title: "Services",
  description:
    "Book Dorvell Ferguson Jr. for portraits, fashion, live music, athletics, runway, and creative direction. $75 for the first hour, +$50 each additional hour — one click to the brief.",
  openGraph: {
    title: "Services — Dorvell Ferguson Jr.",
    description:
      "Every frame you need, one photographer, booked in one click. Portraits, fashion, live events, athletics, runway and creative direction from $75.",
  },
};

type MediaVariant = "sm" | "md" | "lg";

function hasOptimized(image: DorvellImage) {
  return Boolean(image.localOptimized.sm && image.localOptimized.md && image.localOptimized.lg);
}

function mediaFrom(image: DorvellImage, variant: MediaVariant) {
  return {
    src: image.localOptimized[variant],
    alt: imageAlt(image),
    width: image.width,
    height: image.height,
    blurDataURL: image.blur,
  };
}

export default function ServicesPage() {
  const { generated, manual } = getPortfolioData();
  const images = generated.images.filter(hasOptimized);
  const email = manual.profile.email;

  // Pick images without repeats; prefer a matching category, fall back to any.
  const used = new Set<string>();
  const pick = (category?: string) => {
    const preferred = category
      ? images.find((image) => !used.has(image.id) && imageCategories(image).includes(category as never))
      : undefined;
    const chosen = preferred ?? images.find((image) => !used.has(image.id));
    if (chosen) used.add(chosen.id);
    return chosen;
  };

  // Orbit tiles — attach a portfolio frame to every photo slot; the video slot
  // renders the reel and carries no image.
  const tiles: OrbitTile[] = ORBIT_SLOTS.map((slot) => {
    if (slot.kind === "video") return { ...slot };
    const image = pick(slot.category);
    return { ...slot, image: image ? mediaFrom(image, "sm") : undefined };
  });

  // Service cards — real services from the manual, tinted by category, each with
  // a representative frame.
  const services: ServiceCardData[] = manual.services.map((service) => {
    const image = pick(service.category);
    return {
      title: service.title,
      bestFor: service.bestFor,
      deliverables: service.deliverables,
      category: getCategoryDef(service.category).label,
      accent: getCategoryDef(service.category).accent,
      image: image ? mediaFrom(image, "md") : undefined,
    };
  });

  // Intro montage — a broad, evenly-spread sample of the archive for the flash.
  const introCount = 16;
  const stride = Math.max(1, Math.floor(images.length / introCount));
  const introFrames: IntroFrame[] = Array.from({ length: introCount }, (_, index) => images[(index * stride) % images.length])
    .filter((image): image is DorvellImage => Boolean(image))
    .map((image) => ({ src: image.localOptimized.md, alt: "", blurDataURL: image.blur }));

  return (
    <DorvellShell>
      <ServicesExperience
        introFrames={introFrames}
        symbolSrc="/dorvell-ferguson-symbol-v2.png"
        tiles={tiles}
        services={services}
        email={email}
      />
    </DorvellShell>
  );
}
