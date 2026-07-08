import { AboutStory } from "@/components/dorvell/AboutStory";
import { DeferredHomeSection } from "@/components/dorvell/DeferredHomeSection";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { EntryPreviewGate } from "@/components/dorvell/EntryPreviewGate";
import { FeaturedWorkStrip } from "@/components/dorvell/FeaturedWorkStrip";
import { GalleryAtlasHero } from "@/components/dorvell/GalleryAtlasHero";
import { ServicesBooking } from "@/components/dorvell/ServicesBooking";
import { SocialMotionSpotlight } from "@/components/dorvell/SocialMotionSpotlight";
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
    entryImages,
    heroImages,
    featuredImages,
    socialImages,
    archiveImages,
    aboutImages,
    bookingImages,
  } = buildHomeImageCollections(lanes);

  return (
    <DorvellShell>
      <EntryPreviewGate images={entryImages} totalFrames={data.generated.images.length} />
      <div id="portfolio" className="portfolio-entry-target">
        <GalleryAtlasHero images={heroImages} summary={data.generated.scrapeSummary} laneTotals={laneTotals} />
      </div>
      <DeferredHomeSection minHeight={860}>
        <FeaturedWorkStrip images={featuredImages} />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={920}>
        <SocialMotionSpotlight images={socialImages} />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={760}>
        <WorkArchive images={archiveImages} variant="preview" />
      </DeferredHomeSection>
      <DeferredHomeSection minHeight={1450}>
        <AboutStory manual={data.manual} images={aboutImages} />
        <ServicesBooking compact services={data.manual.services} email={data.manual.profile.email} images={bookingImages} />
      </DeferredHomeSection>
    </DorvellShell>
  );
}
