import type { Metadata } from "next";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { CreativeExperience } from "@/components/dorvell/creative/CreativeExperience";
import { heroCreativeItem } from "@/content/creative";

export const metadata: Metadata = {
  title: "Creative Worlds",
  description:
    "Cinematic shorts, creative photoshoots, motion studies, and experimental visual storytelling by Dorvell Ferguson Jr.",
  openGraph: {
    title: "Creative Worlds | Dorvell Ferguson Jr.",
    description:
      "Cinematic shorts, creative photoshoots, motion studies, and experimental visual storytelling by Dorvell Ferguson Jr.",
    images: [
      {
        url: heroCreativeItem.posterSrc,
        width: heroCreativeItem.width,
        height: heroCreativeItem.height,
        alt: "The Threshold — a cinematic study by Dorvell Ferguson Jr.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Creative Worlds | Dorvell Ferguson Jr.",
    description: "Cinematic shorts, concept shoots, motion studies, and visual experiments.",
    images: [heroCreativeItem.posterSrc],
  },
};

export default function CreativePage() {
  return (
    <DorvellShell>
      <div className="creative-route">
        <CreativeExperience />
      </div>
    </DorvellShell>
  );
}
