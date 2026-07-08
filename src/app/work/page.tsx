import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { PortfolioExperience } from "@/components/dorvell/portfolio/PortfolioExperience";
import { getPortfolioData } from "@/lib/portfolio-data";
import { portfolioImages } from "@/lib/photos/getPublicPhotos";

// Legacy scrape artifacts that are not real exhibits.
const hiddenProjectSlugs = new Set(["home-2", "work", "about"]);

export const metadata = {
  title: "The Work Index",
  description:
    "Portraits, concerts, sports, studio work, fashion, events, and photojournalism — Dorvell Ferguson Jr.'s photography explored across cinematic, calm, archive, and story views.",
  openGraph: {
    title: "The Work Index — Dorvell Ferguson Jr.",
    description:
      "A living index of Dorvell Ferguson Jr.'s visual world — portraits, live music, athletics, fashion, and photojournalism across four gallery modes.",
  },
};

export default function WorkPage() {
  const { generated, projects } = getPortfolioData();
  const projectCount = projects.filter((project) => !hiddenProjectSlugs.has(project.slug)).length;
  // Once curation is finalized, the archive narrows to kept + portfolio-assigned frames.
  const archiveImages = portfolioImages(generated.images);

  return (
    <DorvellShell>
      <div className="route-page work-route">
        <PortfolioExperience images={archiveImages} projectCount={projectCount} />
      </div>
    </DorvellShell>
  );
}
