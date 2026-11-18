import type { Metadata } from "next";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { getPortfolioData } from "@/lib/portfolio-data";
import { modelingImages } from "@/lib/photos/getPublicPhotos";
import { imageAlt } from "@/lib/images";
import { ModelingExperience } from "@/components/modeling/ModelingExperience";
import { ModelingMotionStrip } from "@/components/dorvell/creative/ModelingMotionStrip";
import type { ModelingImage } from "@/components/modeling/modelingTypes";
import { getCreativeItemsForSurface } from "@/content/creative";

const description =
  "Dorvell Ferguson Jr.'s editorial and runway modeling portfolio, including photographs and runway clips.";

export const metadata: Metadata = {
  title: "Modeling — The Ferguson Room",
  description,
  openGraph: {
    title: "Modeling — The Ferguson Room",
    description,
  },
};

export default function ModelingPage() {
  const { generated } = getPortfolioData();
  const { images } = modelingImages(generated.images);
  const clips = getCreativeItemsForSurface("modeling");

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
      <div className="modeling-route">
        <ModelingExperience images={roomImages} hasClips={clips.length > 0} />
        <ModelingMotionStrip clips={clips} />
      </div>
    </DorvellShell>
  );
}
