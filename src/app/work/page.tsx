import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { WorkArchive } from "@/components/dorvell/WorkArchive";
import { WorkArchiveHero } from "@/components/dorvell/WorkArchiveHero";
import { getPortfolioData } from "@/lib/portfolio-data";
import { portfolioImages } from "@/lib/photos/getPublicPhotos";

// Legacy scrape artifacts that are not real exhibits.
const hiddenProjectSlugs = new Set(["home-2", "work", "about"]);

export const metadata = {
  title: "Work Archive",
  description: "A full contact-sheet archive of Dorvell Ferguson Jr.'s photography and visual work.",
  openGraph: {
    title: "Work Archive — Dorvell Ferguson Jr.",
    description:
      "The full working archive — portraits, live music, athletics, and fashion direction in one contact sheet.",
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
        <WorkArchiveHero images={archiveImages} projectCount={projectCount} />
        <WorkArchive images={archiveImages} variant="full" />
      </div>
    </DorvellShell>
  );
}
