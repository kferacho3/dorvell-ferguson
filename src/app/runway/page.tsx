import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { ModelBookPanel } from "@/components/dorvell/ModelBookPanel";
import { RunwayDossierHero } from "@/components/dorvell/RunwayDossierHero";
import { RunwayTimeline } from "@/components/dorvell/RunwayTimeline";
import { getPortfolioData } from "@/lib/portfolio-data";

export const metadata = {
  title: "Runway & Model Book - Dorvell Ferguson Jr.",
  description: "Runway, modeling, and fashion-facing presentation for Dorvell Ferguson Jr.",
};

export default function RunwayPage() {
  const { generated, manual } = getPortfolioData();

  return (
    <DorvellShell>
      <main className="route-page runway-route">
        <RunwayDossierHero manual={manual} images={generated.images} />
        <RunwayTimeline images={generated.images} entries={manual.runwayPress} expanded />
        <ModelBookPanel manual={manual} />
      </main>
    </DorvellShell>
  );
}
