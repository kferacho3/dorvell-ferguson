import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { PhotographyCollections } from "@/components/dorvell/portfolio/PhotographyCollections";
import { PortfolioExperience } from "@/components/dorvell/portfolio/PortfolioExperience";
import { toPhotoGalleryImage } from "@/components/dorvell/portfolio/photoGalleryImage";
import { getPortfolioData } from "@/lib/portfolio-data";
import { portfolioImages } from "@/lib/photos/getPublicPhotos";
import {
  activePortfolioCategories,
  imageCategories,
} from "@/lib/portfolio-taxonomy";

export const metadata = {
  title: "Photography",
  description:
    "Browse portraits, live music, sports, fashion, and photojournalism by Dorvell Ferguson Jr.",
};

export default function WorkPage() {
  const { generated } = getPortfolioData();
  const archiveImages = portfolioImages(generated.images);
  const categories = activePortfolioCategories(archiveImages).map(
    ({ category, label }) => ({ category, label }),
  );
  const images = archiveImages.map((image) => ({
    ...toPhotoGalleryImage(image),
    categories: imageCategories(image),
  }));

  return (
    <DorvellShell>
      <div className="bg-[var(--df-bg)]">
        <div className="mx-auto max-w-[84rem] px-4 pb-16 pt-7 sm:px-8 sm:pt-10 lg:px-12">
          <PortfolioExperience images={images} categories={categories} />
          <PhotographyCollections />
        </div>
      </div>
    </DorvellShell>
  );
}
