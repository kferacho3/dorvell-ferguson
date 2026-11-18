import Image from "next/image";
import Link from "next/link";
import {
  creativeItems,
  filmIndexItems,
  formatRuntime,
  getCreativeItemsByCategory,
  heroCreativeItem,
  photomodeSets,
} from "@/content/creative";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { CreativeClipGrid } from "./CreativeClipGrid";
import { CreativeLightboxProvider } from "./CreativeLightbox";
import { FeaturedFilmPlayButton } from "./FeaturedFilmPlayButton";

const sectionLinks = [
  { label: "Films", href: "#cw-featured" },
  { label: "Video archive", href: "#cw-archive" },
  { label: "Photoshoots", href: "#creative-photoshoots" },
] as const;

const photoDescriptions: Record<string, string> = {
  "effect-1/01":
    "Dorvell in an embroidered vest, standing beside a wooden chair against a white wall",
  "effect-1/02":
    "Six photographs of Dorvell in a cream outfit, posed outdoors in sunlight",
  "effect-1/03":
    "Dorvell leaning against a tree with a wooden chair in the background",
  "effect-1/04":
    "Dorvell lowering the brim of his straw hat beside a wooden chair",
  "effect-1/05": "Dorvell sitting cross-legged in a wooden chair",
  "effect-1/06":
    "Dorvell lowering his head and extending an arm in a sunlit pose",
  "effect-2/01": "Dorvell mid-leap in a black leather coat and painted boots",
  "effect-2/02": "A shadowed leap in black leather with a red spiked headpiece",
};

const sectionHeading =
  "mb-5 text-[clamp(1.85rem,4.5vw,3rem)] font-bold leading-none [font-family:var(--font-display)]";

export function CreativeExperience() {
  const feature = filmIndexItems[0] ?? heroCreativeItem;
  const otherFilms = filmIndexItems.filter(
    (film) => film.slug !== feature.slug,
  );
  const shoots = getCreativeItemsByCategory("creative-photoshoots").filter(
    (item) => item.filmIndex === undefined && item.slug !== feature.slug,
  );
  const shootSlugs = new Set(shoots.map((item) => item.slug));
  const archive = creativeItems.filter(
    (item) =>
      item.filmIndex === undefined &&
      item.slug !== feature.slug &&
      !shootSlugs.has(item.slug),
  );

  return (
    <div className="cw-scope bg-[var(--df-bg)] text-[var(--df-text)]">
      <CreativeLightboxProvider>
        <div className="mx-auto max-w-[84rem] px-4 pb-12 pt-7 sm:px-8 sm:pb-20 sm:pt-10 lg:px-12">
          <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-b border-[var(--df-line)] pb-3 sm:pb-5">
            <h1 className="text-[clamp(2.75rem,7vw,5.75rem)] font-bold leading-tight tracking-tight [font-family:var(--font-display)]">
              Videography
            </h1>
            <nav
              aria-label="Videography sections"
              className="flex flex-wrap gap-x-4 text-sm font-medium text-[var(--df-text-soft)] sm:gap-x-6"
            >
              {sectionLinks.map(({ href, label }) => (
                <a
                  key={href}
                  className="inline-flex min-h-11 items-center underline decoration-[var(--df-line-strong)] underline-offset-4 hover:text-[var(--df-text)]"
                  href={href}
                >
                  {label}
                </a>
              ))}
            </nav>
          </header>

          <section
            id="cw-featured"
            aria-labelledby="cw-featured-title"
            className="scroll-mt-0 pt-5 sm:pt-8"
          >
            <div className="grid gap-4 sm:gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12">
              <div className="relative aspect-video overflow-hidden bg-[var(--df-panel-solid)]">
                <Image
                  src={resolveCreativeAsset(feature.posterSrc)}
                  alt={
                    feature.slug === "unbraided"
                      ? "Dorvell in close-up with red light across his face"
                      : `Still from ${feature.title}`
                  }
                  fill
                  preload
                  unoptimized
                  sizes="(max-width: 767px) 94vw, (max-width: 1344px) 60vw, 800px"
                  placeholder={feature.blurDataURL ? "blur" : "empty"}
                  blurDataURL={feature.blurDataURL}
                  className="object-contain"
                />
              </div>
              <div className="self-center">
                <p className="text-sm font-medium text-[var(--df-text-soft)]">
                  Featured film <span aria-hidden="true">·</span>{" "}
                  {formatRuntime(feature.duration)}
                </p>
                <h2
                  id="cw-featured-title"
                  className="mb-3 mt-1 text-[clamp(2rem,5vw,4rem)] font-bold leading-none [font-family:var(--font-display)]"
                >
                  {feature.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 sm:mt-5">
                  <FeaturedFilmPlayButton film={feature} />
                  {feature.filmIndex !== undefined ? (
                    <Link
                      href={`/creative/${feature.slug}`}
                      className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4 hover:text-[var(--df-teal)]"
                    >
                      Film details
                    </Link>
                  ) : null}
                </div>
                <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-[var(--df-text-soft)] sm:mt-5 sm:text-base">
                  {feature.description}
                </p>
              </div>
            </div>

            {otherFilms.length > 0 ? (
              <div className="mt-4 sm:mt-8">
                <h3 className="mb-2 text-lg font-semibold sm:mb-3">
                  More films
                </h3>
                <ul className="grid gap-2 sm:grid-cols-2 sm:gap-5">
                  {otherFilms.map((film) => (
                    <li key={film.slug}>
                      <Link
                        href={`/creative/${film.slug}`}
                        className="group flex min-h-16 items-center gap-3 border-y border-[var(--df-line)] py-2 sm:gap-4"
                      >
                        <span className="relative aspect-video w-24 shrink-0 overflow-hidden bg-[var(--df-panel-solid)] sm:w-32">
                          <Image
                            src={resolveCreativeAsset(film.thumbSrc)}
                            alt=""
                            fill
                            unoptimized
                            sizes="(min-width: 640px) 128px, 96px"
                            className="object-cover"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold group-hover:underline group-focus-visible:underline">
                            {film.title}
                          </span>
                          <span className="text-sm text-[var(--df-text-soft)]">
                            {formatRuntime(film.duration)}
                          </span>
                        </span>
                        <span
                          className="ml-auto pr-2 text-lg text-[var(--df-text-soft)]"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section
            id="cw-archive"
            aria-labelledby="cw-archive-title"
            className="mt-10 scroll-mt-0 border-t border-[var(--df-line)] pt-7 sm:mt-14 sm:pt-9"
          >
            <h2 id="cw-archive-title" className={sectionHeading}>
              Video archive
            </h2>
            <CreativeClipGrid items={archive} />
          </section>

          <section
            id="creative-photoshoots"
            aria-labelledby="creative-photoshoots-title"
            className="mt-10 scroll-mt-0 border-t border-[var(--df-line)] pt-7 sm:mt-14 sm:pt-9"
          >
            <h2 id="creative-photoshoots-title" className={sectionHeading}>
              Creative photoshoots
            </h2>
            <CreativeClipGrid items={shoots} />
            {photomodeSets.length > 0 ? (
              <details className="mt-7 border-y border-[var(--df-line)] sm:mt-9">
                <summary className="min-h-12 cursor-pointer py-3 text-base font-semibold hover:text-[var(--df-teal)]">
                  Photo studies
                </summary>
                <div className="space-y-6 pb-6">
                  {photomodeSets.map((set) => (
                    <div key={set.slug}>
                      <h3 className="mb-3 text-sm font-medium text-[var(--df-text-soft)]">
                        {set.label}
                      </h3>
                      <ul className="grid grid-cols-2 items-start gap-2 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
                        {set.items.map((item) => (
                          <li key={item.slug}>
                            <Image
                              src={resolveCreativeAsset(item.mdSrc)}
                              alt={
                                photoDescriptions[`${set.slug}/${item.slug}`] ??
                                `${set.label}, photograph ${item.slug}`
                              }
                              width={item.width}
                              height={item.height}
                              unoptimized
                              placeholder={item.blurDataURL ? "blur" : "empty"}
                              blurDataURL={item.blurDataURL}
                              className="h-auto w-full"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </section>
        </div>
      </CreativeLightboxProvider>
    </div>
  );
}
