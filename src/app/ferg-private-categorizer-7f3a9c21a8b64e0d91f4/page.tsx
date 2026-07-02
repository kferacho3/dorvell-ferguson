import { notFound } from "next/navigation";
import { PhotoCategorizerClient, type CategorizerImage } from "@/components/dorvell/PhotoCategorizerClient";
import {
  photoCategorizationLedgerPath,
  readPhotoCategorizationLedger,
} from "@/lib/dorvell-photo-categorization-ledger";
import { laneKeyForImage } from "@/lib/gallery-lanes";
import { getRawPortfolioData } from "@/lib/portfolio-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Private Photo Categorizer - Dorvell Ferguson Jr.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PrivatePhotoCategorizerPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const { generated } = getRawPortfolioData();
  const initialLedger = await readPhotoCategorizationLedger();
  const images: CategorizerImage[] = generated.images.map((image) => ({
    id: image.id,
    src: image.localOptimized.md || image.localOptimized.sm || image.localOptimized.lg || image.localOriginal || image.sourceUrl,
    width: image.width,
    height: image.height,
    blur: image.blur,
    alt: image.alt,
    originalCategory: image.category,
    laneGuess: laneKeyForImage(image),
    projectLabel: image.projectTitle ?? image.projectSlug ?? "Archive",
    sourcePage: image.sourcePage,
  }));

  return (
    <PhotoCategorizerClient
      images={images}
      initialAssignments={initialLedger.assignments}
      initialScrapDecisions={initialLedger.scrapDecisions}
      ledgerPath={photoCategorizationLedgerPath}
    />
  );
}
