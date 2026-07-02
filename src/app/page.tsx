import { AboutStory } from "@/components/dorvell/AboutStory";
import { DeferredHomeSection } from "@/components/dorvell/DeferredHomeSection";
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
import { SocialMotionSpotlight } from "@/components/dorvell/SocialMotionSpotlight";
import { StudioSignalController } from "@/components/dorvell/StudioSignalController";
import { WorkArchive } from "@/components/dorvell/WorkArchive";
import { buildGalleryLanes, type GalleryLane } from "@/lib/gallery-lanes";
import { buildHomeImageCollections } from "@/lib/home-image-collections";
import { getPortfolioData } from "@/lib/portfolio-data";

export default function Home() {
  const data = getPortfolioData();
  const lanes = buildGalleryLanes(data.generated.images);
  const laneTotals: Partial<Record<GalleryLane["key"], number>> = Object.fromEntries(
    lanes.map((lane) => [lane.key, lane.images.length]),
  );
  const {
    heroImages,
    featuredImages,
    socialImages,
    kineticImages,
    sequenceImages,
    motionPathImages,
    flightImages,
    worldsImages,
    archiveImages,
    studioImages,
    runwayImages,
    designImages,
    aboutImages,
    bookingImages,
  } = buildHomeImageCollections(lanes);

  return (
    <DorvellShell>
      <GalleryAtlasHero images={heroImages} summary={data.generated.scrapeSummary} laneTotals={laneTotals} />
      <DeferredHomeSection minHeight={950}>
        <FeaturedWorkStrip images={featuredImages} />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={920}>
        <SocialMotionSpotlight images={socialImages} />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={2300}>
        <KineticGalleryDeck images={kineticImages} />
        <LaneSequenceLab images={sequenceImages} />
        <MotionPathGalleryPortal images={motionPathImages} />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={3000}>
        <GalleryFlightController images={flightImages} />
        <GalleryWorlds images={worldsImages} />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={980}>
        <WorkArchive images={archiveImages} variant="preview" />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={3300}>
        <StudioSignalController images={studioImages} email={data.manual.profile.email} />
        <RunwayTimeline images={runwayImages} entries={data.manual.runwayPress} />
        <GraphicDesignGrid tools={data.manual.tools} images={designImages} manual={data.manual} />
        <AboutStory manual={data.manual} images={aboutImages} />
        <ServicesBooking services={data.manual.services} email={data.manual.profile.email} images={bookingImages} />
        <PressFeatures entries={data.manual.runwayPress} />
      </DeferredHomeSection>
    </DorvellShell>
  );
}
