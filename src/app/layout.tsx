import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { getPortfolioData } from "@/lib/portfolio-data";

const { generated, manual } = getPortfolioData();
const ogImage = generated.images[0]?.localOptimized.lg || "/dorvell-ferguson-symbol-v2.png";
const socialProfiles = [...manual.profile.instagram, manual.profile.tiktok];

export const metadata: Metadata = {
  metadataBase: new URL("https://dorvellferguson.com"),
  title: "Dorvell Ferguson Jr. - Photographer, Model & Visual Storyteller",
  description:
    "Tampa-based photographer, model, and multimedia visual storyteller creating authentic imagery across fashion, music, live events, athletics, and editorial portraiture.",
  icons: {
    icon: [
      { url: "/dorvell-ferguson-favicon/favicon.ico" },
      { url: "/dorvell-ferguson-favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/dorvell-ferguson-favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/dorvell-ferguson-favicon/apple-touch-icon.png",
  },
  openGraph: {
    title: "Dorvell Ferguson Jr. - Photographer, Model & Visual Storyteller",
    description:
      "A Tampa-based creative portfolio across fashion, music, athletics, portraits, runway, and visual direction.",
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 800, alt: "Dorvell Ferguson Jr. portfolio image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dorvell Ferguson Jr. - Photographer, Model & Visual Storyteller",
    description: "Fashion-aware, story-first imagery from both sides of the camera.",
    images: [ogImage],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: manual.profile.name,
    jobTitle: ["Photographer", "Graphic Designer", "Runway / Fashion Model", "Visual Storyteller"],
    email: manual.profile.email,
    telephone: manual.profile.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tampa",
      addressRegion: "FL",
      addressCountry: "US",
    },
    url: manual.profile.portfolio,
    sameAs: socialProfiles,
  };

  const gallerySchema = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "Dorvell Ferguson Jr. Portfolio Archive",
    image: generated.images.slice(0, 24).map((image) => ({
      "@type": "ImageObject",
      contentUrl: image.localOptimized.lg,
      name: image.projectTitle ?? image.category,
      description: image.alt,
    })),
  };

  return (
    <html lang="en">
      <body>
        <Script
          id="dorvell-person-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <Script
          id="dorvell-gallery-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(gallerySchema) }}
        />
        {children}
      </body>
    </html>
  );
}
