import type { Metadata } from "next";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { ModelingExperience } from "@/components/modeling/ModelingExperience";
import { toPhotoGalleryImage } from "@/components/dorvell/portfolio/photoGalleryImage";
import { modelingImages } from "@/lib/photos/getPublicPhotos";
import { getPortfolioData } from "@/lib/portfolio-data";

const modelingDescription =
  "Browse Dorvell Ferguson Jr.'s editorial, fashion, and runway modeling portfolio, including photos and motion studies.";

const modelingLeads = [
  "fd-d17c518c3d44",
  "fd-d0d3598a5f43",
  "fd-c616be4d3d55",
  "fd-52d257da4be0",
];

export const metadata: Metadata = {
  title: "Modeling",
  description: modelingDescription,
  openGraph: {
    title: "Modeling | Dorvell Ferguson Jr.",
    description: modelingDescription,
  },
};

export default function ModelingPage() {
  const { generated } = getPortfolioData();
  const { images } = modelingImages(generated.images);
  const gallery = images
    .filter((image) => image.width >= 480)
    .sort((a, b) => a.aspectRatio - b.aspectRatio)
    .slice(0, 26);
  const leadImages = modelingLeads.flatMap((id) =>
    gallery.filter((image) => image.id === id),
  );
  const remainingImages = gallery.filter(
    (image) => !modelingLeads.includes(image.id),
  );

  return (
    <DorvellShell>
      <ModelingExperience
        images={[...leadImages, ...remainingImages].map(toPhotoGalleryImage)}
      />
    </DorvellShell>
  );
}
