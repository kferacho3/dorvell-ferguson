import { AboutClosing } from "@/components/dorvell/AboutClosing";
import { AboutCredits } from "@/components/dorvell/AboutCredits";
import { AboutHero } from "@/components/dorvell/AboutHero";
import { AboutPhilosophy } from "@/components/dorvell/AboutPhilosophy";
import { AboutPointOfView } from "@/components/dorvell/AboutPointOfView";
import { AboutRevealController } from "@/components/dorvell/AboutRevealController";
import { AboutRoleTriptych } from "@/components/dorvell/AboutRoleTriptych";
import { AboutSkills } from "@/components/dorvell/AboutSkills";
import { AboutTimeline } from "@/components/dorvell/AboutTimeline";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { aboutRoles } from "@/content/about.data";
import { pickByCategory, pickHeroPortrait, pickTrailerImages } from "@/lib/about-images";
import { getPortfolioData } from "@/lib/portfolio-data";

export const metadata = {
  title: "About",
  description:
    "Dorvell Ferguson Jr. — a Multimedia Journalism graduate and Tampa-based photographer, model, and visual storyteller working across portraits, concerts, fashion, sports, and editorial.",
  openGraph: {
    title: "About — Dorvell Ferguson Jr.",
    description:
      "The story behind the archive — a Multimedia Journalism graduate shaping culture through portraits, concerts, fashion, sports, and editorial moments.",
  },
};

export default function AboutPage() {
  const { generated } = getPortfolioData();
  const images = generated.images;

  // Deterministic, server-side image selection (dedup across the whole page):
  // hero portrait → role plates → hero cursor-trailer frames.
  const used = new Set<string>();
  const portrait = pickHeroPortrait(images);
  if (portrait) used.add(portrait.id);
  const plates = aboutRoles.map((role) => pickByCategory(images, role.plateCategory, used, 1)[0]);
  // Skill-panel plates keyed to each cluster's real source (Freelance /
  // Troy University / Blue Fish / Freelance workflow).
  const skillPlates = ["Portraits", "Athletics", "Music", "Fashion"].map(
    (category) => pickByCategory(images, category, used, 1)[0],
  );
  const trailerImages = pickTrailerImages(images, used, 6);

  return (
    <DorvellShell>
      <div className="route-page about-route">
        <AboutRevealController />
        <AboutHero portrait={portrait} trailerImages={trailerImages} />
        <AboutPointOfView />
        <AboutRoleTriptych plates={plates} />
        <AboutTimeline />
        <AboutSkills plates={skillPlates} />
        <AboutPhilosophy />
        <AboutCredits />
        <AboutClosing />
      </div>
    </DorvellShell>
  );
}
