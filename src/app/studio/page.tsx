import type { Metadata } from "next";
import { getRawPortfolioData } from "@/lib/portfolio-data";
import { siteManifest } from "@/lib/curation/manifest";
import { CurationStudio } from "@/components/curation/CurationStudio";

export const metadata: Metadata = {
  title: "Photo Curation Studio",
  description: "Internal photo review workflow for Dorvell Ferguson.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function StudioPage() {
  // Raw (unfiltered) data on purpose: scrapped photos must remain reviewable here.
  const { generated } = getRawPortfolioData();
  const photos = siteManifest(generated.images);

  return <CurationStudio sitePhotos={photos} />;
}
