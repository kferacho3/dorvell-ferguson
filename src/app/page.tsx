import { AboutStory } from "@/components/dorvell/AboutStory";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { FeaturedWorkStrip } from "@/components/dorvell/FeaturedWorkStrip";
import { GalleryAtlasHero } from "@/components/dorvell/GalleryAtlasHero";
import { GalleryFlightController } from "@/components/dorvell/GalleryFlightController";
import { GalleryWorlds } from "@/components/dorvell/GalleryWorlds";
import { GraphicDesignGrid } from "@/components/dorvell/GraphicDesignGrid";
import { KineticGalleryDeck } from "@/components/dorvell/KineticGalleryDeck";
import { LaneSequenceLab } from "@/components/dorvell/LaneSequenceLab";
import { MotionPathGalleryPortal } from "@/components/dorvell/MotionPathGalleryPortal";
import { PressFeatures } from "@/components/dorvell/PressFeatures";
import { RunwayTimeline } from "@/components/dorvell/RunwayTimeline";
import { ServicesBooking } from "@/components/dorvell/ServicesBooking";
import { StudioSignalController } from "@/components/dorvell/StudioSignalController";
import { WorkArchive } from "@/components/dorvell/WorkArchive";
import { getPortfolioData } from "@/lib/portfolio-data";

export default function Home() {
  const data = getPortfolioData();
  const previewImages = data.generated.images.slice(0, 30);

  return (
    <DorvellShell>
      <GalleryAtlasHero images={data.generated.images} summary={data.generated.scrapeSummary} />
      <FeaturedWorkStrip images={data.generated.images} />
      <KineticGalleryDeck images={data.generated.images} />
      <LaneSequenceLab images={data.generated.images} />
      <MotionPathGalleryPortal images={data.generated.images} />
      <GalleryFlightController images={data.generated.images} />
      <GalleryWorlds images={data.generated.images} />
      <WorkArchive images={previewImages} variant="preview" />
      <StudioSignalController images={data.generated.images} email={data.manual.profile.email} />
      <RunwayTimeline images={data.generated.images} entries={data.manual.runwayPress} />
      <GraphicDesignGrid tools={data.manual.tools} images={data.generated.images} manual={data.manual} />
      <AboutStory manual={data.manual} images={data.generated.images} />
      <ServicesBooking services={data.manual.services} email={data.manual.profile.email} images={data.generated.images} />
      <PressFeatures entries={data.manual.runwayPress} />
    </DorvellShell>
  );
}
