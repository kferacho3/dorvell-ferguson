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
import { getPortfolioData } from "@/lib/portfolio-data";

function selectLaneImages(lane: GalleryLane, count: number) {
  const portfolioImages = lane.images.filter((image) => !image.sourcePage.includes("instagram.com"));
  const instagramImages = lane.images.filter((image) => image.sourcePage.includes("instagram.com"));
  const ordered = [
    ...portfolioImages.slice(0, Math.ceil(count * 0.5)),
    ...instagramImages.slice(0, Math.ceil(count * 0.55)),
    ...portfolioImages.slice(Math.ceil(count * 0.5)),
    ...instagramImages.slice(Math.ceil(count * 0.55)),
  ];
  const unique = new Map(ordered.map((image) => [image.id, image]));
  return Array.from(unique.values()).slice(0, count);
}

function imagePool(lanes: GalleryLane[], countPerLane: number) {
  return lanes.flatMap((lane) => selectLaneImages(lane, countPerLane));
}

export default function Home() {
  const data = getPortfolioData();
  const lanes = buildGalleryLanes(data.generated.images);
  const laneTotals: Partial<Record<GalleryLane["key"], number>> = Object.fromEntries(
    lanes.map((lane) => [lane.key, lane.images.length]),
  );
  const heroImages = imagePool(lanes, 14);
  const featuredImages = imagePool(lanes, 8);
  const sectionImages = imagePool(lanes, 10);
  const compactImages = imagePool(lanes, 6);
  const previewImages = imagePool(lanes, 8).slice(0, 32);

  return (
    <DorvellShell>
      <GalleryAtlasHero images={heroImages} summary={data.generated.scrapeSummary} laneTotals={laneTotals} />
      <DeferredHomeSection minHeight={950}>
        <FeaturedWorkStrip images={featuredImages} />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={920}>
        <SocialMotionSpotlight images={featuredImages} />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={2300}>
        <KineticGalleryDeck images={sectionImages} />
        <LaneSequenceLab images={sectionImages} />
        <MotionPathGalleryPortal images={sectionImages} />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={3000}>
        <GalleryFlightController images={compactImages} />
        <GalleryWorlds images={sectionImages} />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={980}>
        <WorkArchive images={previewImages} variant="preview" />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={3300}>
        <StudioSignalController images={compactImages} email={data.manual.profile.email} />
        <RunwayTimeline images={sectionImages} entries={data.manual.runwayPress} />
        <GraphicDesignGrid tools={data.manual.tools} images={sectionImages} manual={data.manual} />
        <AboutStory manual={data.manual} images={sectionImages} />
        <ServicesBooking services={data.manual.services} email={data.manual.profile.email} images={compactImages} />
        <PressFeatures entries={data.manual.runwayPress} />
      </DeferredHomeSection>
    </DorvellShell>
  );
}
