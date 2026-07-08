import type { Metadata } from "next";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { getPortfolioData } from "@/lib/portfolio-data";
import { modelingImages } from "@/lib/photos/getPublicPhotos";
import { imageAlt } from "@/lib/images";
import { ModelingExperience } from "@/components/modeling/ModelingExperience";
import type { ModelingImage } from "@/components/modeling/modelingTypes";

export const metadata: Metadata = {
  title: "Modeling — The Ferguson Room",
  description:
    "A members-only look at the modeling side of Dorvell Ferguson Jr. Private set, editorial form, booking by inquiry.",
  openGraph: {
    title: "Modeling — The Ferguson Room",
    description: "The modeling side of the lens. Private set, quiet light, booking by inquiry.",
  },
};

export default function ModelingPage() {
  const { generated } = getPortfolioData();
  const { images, curated } = modelingImages(generated.images);

  const roomImages: ModelingImage[] = images
    .filter((image) => image.width >= 480)
    .sort((a, b) => a.aspectRatio - b.aspectRatio)
    .slice(0, 26)
    .map((image) => ({
      id: image.id,
      src: image.localOptimized.md,
      full: image.localOptimized.lg || image.localOptimized.md,
      blur: image.blur,
      width: image.width,
      height: image.height,
      aspectRatio: image.aspectRatio,
      alt: imageAlt(image),
    }));

  return (
    <DorvellShell>
      <div className="route-page modeling-route">
        <ModelingExperience images={roomImages} curated={curated} />
      </div>
    </DorvellShell>
  );
}
