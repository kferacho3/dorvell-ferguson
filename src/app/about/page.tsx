import { AboutStory } from "@/components/dorvell/AboutStory";
import { AboutDossierHero } from "@/components/dorvell/AboutDossierHero";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { getPortfolioData } from "@/lib/portfolio-data";

export const metadata = {
  title: "About - Dorvell Ferguson Jr.",
  description: "About Dorvell Ferguson Jr., Tampa-based photographer, model, and multimedia visual storyteller.",
};

export default function AboutPage() {
  const { manual, generated } = getPortfolioData();

  return (
    <DorvellShell>
      <main className="route-page about-route">
        <AboutDossierHero manual={manual} images={generated.images} />
        <AboutStory manual={manual} images={generated.images} expanded />
      </main>
    </DorvellShell>
  );
}
