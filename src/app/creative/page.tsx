import type { Metadata } from "next";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { CreativeExperience } from "@/components/dorvell/creative/CreativeExperience";
import { filmIndexItems, heroCreativeItem } from "@/content/creative";
import { resolveCreativeAsset } from "@/lib/creative-assets";

const feature = filmIndexItems[0] ?? heroCreativeItem;
const poster = resolveCreativeAsset(feature.posterSrc);
const description =
  "Watch short films, motion and editing studies, and creative photoshoots by Dorvell Ferguson Jr.";

export const metadata: Metadata = {
  title: "Videography",
  description,
  alternates: { canonical: "/creative" },
  openGraph: {
    title: "Videography | Dorvell Ferguson Jr.",
    description,
    images: [
      {
        url: poster,
        width: feature.width,
        height: feature.height,
        alt: `Still from ${feature.title} by Dorvell Ferguson Jr.`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Videography | Dorvell Ferguson Jr.",
    description,
    images: [poster],
  },
};

export default function CreativePage() {
  return (
    <DorvellShell>
      <CreativeExperience />
    </DorvellShell>
  );
}
