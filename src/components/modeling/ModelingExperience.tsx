import Link from "next/link";
import { CreativeClipGrid } from "@/components/dorvell/creative/CreativeClipGrid";
import { CreativeLightboxProvider } from "@/components/dorvell/creative/CreativeLightbox";
import {
  PhotoGallery,
  type PhotoGalleryImage,
} from "@/components/dorvell/portfolio/PhotoGallery";
import { getCreativeItemsForSurface } from "@/content/creative";

type ModelingExperienceProps = {
  images: PhotoGalleryImage[];
};

export function ModelingExperience({ images }: ModelingExperienceProps) {
  const clips = getCreativeItemsForSurface("modeling");

  return (
    <div className="bg-[var(--df-bg)]">
      <div className="mx-auto max-w-[84rem] px-4 pb-12 pt-7 sm:px-8 sm:pb-16 sm:pt-10 lg:px-12">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 sm:mb-8">
          <div>
            <h1 className="text-[clamp(2.75rem,7vw,5.75rem)] font-extrabold leading-[0.95] tracking-tight [font-family:var(--font-display)]">
              Modeling
            </h1>
            <p className="mt-3 text-base text-[var(--df-text-soft)] sm:text-lg">
              Editorial, fashion, and runway work.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {clips.length > 0 ? (
              <a
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--df-text-soft)] underline decoration-[var(--df-line-strong)] underline-offset-4 hover:text-[var(--df-text)]"
                href="#modeling-clips"
              >
                Runway clips <span aria-hidden="true">↓</span>
              </a>
            ) : null}
            <Link
              className="inline-flex min-h-11 items-center border border-[var(--df-line-strong)] px-4 text-sm font-semibold hover:border-[var(--df-text-soft)]"
              href="/contact"
            >
              Book Dorvell
            </Link>
          </div>
        </header>
        <section aria-labelledby="modeling-gallery-title">
          <h2 className="sr-only" id="modeling-gallery-title">
            Modeling portfolio
          </h2>
          <PhotoGallery
            images={images}
            label="Modeling portfolio"
            emptyMessage="Modeling photos are currently unavailable."
          />
        </section>

        {clips.length > 0 ? (
          <section
            aria-labelledby="modeling-clips-title"
            className="mt-12 scroll-mt-0 border-t border-[var(--df-line)] pt-7 sm:mt-16 sm:pt-9"
            id="modeling-clips"
          >
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 sm:mb-6">
              <h2
                className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold [font-family:var(--font-display)]"
                id="modeling-clips-title"
              >
                Runway &amp; movement
              </h2>
              <Link
                className="inline-flex min-h-11 items-center text-sm font-semibold underline decoration-[var(--df-line-strong)] underline-offset-4 hover:decoration-current"
                href="/creative"
                prefetch={false}
              >
                More videography
              </Link>
            </div>
            <div className="cw-scope">
              <CreativeLightboxProvider>
                <CreativeClipGrid items={clips} />
              </CreativeLightboxProvider>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
