import { ContactStudio } from "@/components/dorvell/contact/ContactStudio";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { creativeItems } from "@/content/creative";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { getPortfolioData } from "@/lib/portfolio-data";

export const metadata = {
  title: "Contact",
  description:
    "Book Dorvell Ferguson Jr. — send the brief for photography, journalism, events, portraits, fashion, modeling, and creative collaborations.",
  openGraph: {
    title: "Contact — Dorvell Ferguson Jr.",
    description: "Let’s build the shot — send the brief.",
  },
};

// Cap the photo bank passed to the client so the immersive trail feels infinite
// without bloating the static payload with all ~1.8k paths.
const TRAIL_TARGET = 900;

export default function ContactPage() {
  const { manual, generated } = getPortfolioData();

  // Creative videos for the ripple panel (resolve raw public paths at render).
  const videos = creativeItems
    .filter((item) => item.mp4Src)
    .map((item) => ({
      slug: item.slug,
      title: item.title,
      orientation: item.orientation,
      mp4: resolveCreativeAsset(item.mp4Src),
      mobile: resolveCreativeAsset(item.mobileSrc),
      poster: resolveCreativeAsset(item.posterSrc),
    }));

  // Evenly sample the large photo bank (deterministic — spreads across
  // categories); the client shuffles for order so repeats stay rare.
  const images = generated.images;
  const stride = Math.max(1, Math.ceil(images.length / TRAIL_TARGET));
  const photos = images
    .filter((_, index) => index % stride === 0)
    .map((image) => resolveCreativeAsset(image.localOptimized.sm));

  return (
    <DorvellShell>
      <div className="route-page contact-studio-route">
        <ContactStudio email={manual.profile.email} videos={videos} photos={photos} />
      </div>
    </DorvellShell>
  );
}
