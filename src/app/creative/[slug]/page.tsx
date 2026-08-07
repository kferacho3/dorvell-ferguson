import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { FilmRoute } from "@/components/dorvell/film/FilmRoute";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { filmPageUrl } from "@/lib/campaign-links";
import { filmIndexItems, getFilmBySlug, orientationLabel } from "@/content/creative";

/**
 * Dedicated, shareable film routes.
 *
 * These exist so a link posted to Instagram, TikTok or Facebook lands on a
 * complete page — poster and premise immediately, then the full player,
 * credits, related work and a booking path. The Creative Hub opens the same
 * films in a viewer, but a direct visit must never be a lesser experience.
 */

export function generateStaticParams() {
  return filmIndexItems.map((film) => ({ slug: film.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const film = getFilmBySlug(slug);
  if (!film) return {};

  const poster = resolveCreativeAsset(film.posterSrc);
  const title = `${film.title} — a film by Dorvell Ferguson Jr.`;

  return {
    title: film.title,
    description: film.description,
    alternates: { canonical: `/creative/${film.slug}` },
    openGraph: {
      type: "video.other",
      title,
      description: film.description,
      url: filmPageUrl(film.slug),
      images: [{ url: poster, width: film.width, height: film.height, alt: `${film.title} — ${film.category}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: film.description,
      images: [poster],
    },
  };
}

export default async function FilmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const film = getFilmBySlug(slug);
  if (!film) notFound();

  const poster = resolveCreativeAsset(film.posterSrc);
  const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: film.title,
    description: film.synopsis ?? film.description,
    thumbnailUrl: [poster],
    contentUrl: resolveCreativeAsset(film.mp4Src),
    duration: `PT${Math.round(film.duration)}S`,
    genre: film.category,
    keywords: film.tags.join(", "),
    creator: {
      "@type": "Person",
      name: "Dorvell Ferguson Jr.",
      url: filmPageUrl(film.slug),
    },
    ...(film.location ? { contentLocation: { "@type": "Place", name: film.location } } : {}),
    ...(film.roles?.length ? { creditText: film.roles.join(" · ") } : {}),
    additionalProperty: [
      { "@type": "PropertyValue", name: "Orientation", value: orientationLabel(film.orientation) },
    ],
  };

  return (
    <DorvellShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />
      <FilmRoute film={film} />
    </DorvellShell>
  );
}
