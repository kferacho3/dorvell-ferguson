import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { WorkArchive } from "@/components/dorvell/WorkArchive";
import { WorkArchiveHero } from "@/components/dorvell/WorkArchiveHero";
import { getPortfolioData } from "@/lib/portfolio-data";

export const metadata = {
  title: "Work Archive - Dorvell Ferguson Jr.",
  description: "A full contact-sheet archive of Dorvell Ferguson Jr.'s photography and visual work.",
};

export default function WorkPage() {
  const { generated } = getPortfolioData();

  return (
    <DorvellShell>
      <main className="route-page work-route">
        <WorkArchiveHero images={generated.images} summary={generated.scrapeSummary} />
        <WorkArchive images={generated.images} variant="full" />
      </main>
    </DorvellShell>
  );
}
