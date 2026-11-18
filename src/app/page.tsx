import Image from "next/image";
import Link from "next/link";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { filmIndexItems } from "@/content/creative";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { galleryLaneDefinitions } from "@/lib/gallery-lanes";
import { getHomeImages } from "@/lib/home-image-collections";
import { blurImageProps, imageAlt } from "@/lib/images";
import { getPortfolioData } from "@/lib/portfolio-data";
import { portfolioLinks } from "@/lib/site-navigation";

type PortfolioHref = (typeof portfolioLinks)[number]["href"];

type WorkPreview = {
  src?: string;
  blur?: string;
  position: string;
};

export default function Home() {
  const { generated } = getPortfolioData();
  const { lead, portrait, modeling } = getHomeImages(generated.images);
  const film = filmIndexItems[0];

  const previews: Record<PortfolioHref, WorkPreview> = {
    "/work/portraits": {
      src: portrait?.localOptimized.md,
      blur: portrait?.blur,
      position: "object-[center_36%]",
    },
    "/modeling": {
      src: modeling?.localOptimized.md,
      blur: modeling?.blur,
      position: "object-[center_32%]",
    },
    "/creative": {
      src: film ? resolveCreativeAsset(film.posterSrc) : undefined,
      position: "object-center",
    },
  };

  return (
    <DorvellShell>
      <div className="bg-[var(--df-bg)]">
        <div className="mx-auto max-w-[84rem] px-4 sm:px-8 lg:px-12">
          <section
            className="grid items-center gap-5 pb-8 pt-7 md:grid-cols-[.9fr_1.1fr] md:gap-12 md:pb-14 md:pt-10"
            aria-labelledby="home-title"
          >
            <div className="md:pb-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--df-text-soft)] md:mb-4">
                Tampa, Florida
              </p>
              <h1
                id="home-title"
                className="text-[clamp(3.25rem,12vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.025em] [font-family:var(--font-display)] md:text-[clamp(5rem,8vw,8rem)]"
              >
                Dorvell
                <br />
                Ferguson Jr.
              </h1>
              <p className="mt-3 text-base leading-relaxed text-[var(--df-text-soft)] sm:text-lg md:mt-6 md:text-xl">
                Portrait photography, modeling, and filmmaking.
              </p>
              <a
                className="mt-2 inline-flex min-h-11 items-center gap-3 text-sm font-semibold underline decoration-[var(--df-line-strong)] underline-offset-4 hover:decoration-current md:mt-5"
                href="#portfolio"
              >
                Explore the work
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            {lead ? (
              <div className="relative aspect-[1.13] max-h-[36rem] overflow-hidden bg-[var(--df-panel-solid)] md:aspect-[1.28]">
                <Image
                  src={lead.localOptimized.lg || lead.localOptimized.md}
                  alt={
                    lead.id === "df-4cdbbe8250a8"
                      ? "Editorial portrait of a person in a brown leather jacket against a brick wall"
                      : imageAlt(lead)
                  }
                  className="object-cover object-[center_46%]"
                  fill
                  preload
                  sizes="(min-width: 1344px) 660px, (min-width: 768px) 52vw, 100vw"
                  {...blurImageProps(lead)}
                />
              </div>
            ) : null}
          </section>

          <section
            aria-labelledby="selected-work-title"
            className="scroll-mt-0 border-t border-[var(--df-line)] pb-10 pt-6 md:pb-14 md:pt-8"
            id="portfolio"
          >
            <h2
              className="mb-4 text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-none [font-family:var(--font-display)] md:mb-6"
              id="selected-work-title"
            >
              Selected work
            </h2>
            <ul className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6">
              {portfolioLinks.map(({ href, label }) => {
                const { src, blur, position } = previews[href];

                return (
                  <li className="min-w-0" key={href}>
                    <Link
                      className="group block border-b border-[var(--df-line)] hover:border-[var(--df-text-soft)]"
                      href={href}
                      prefetch={false}
                    >
                      {src ? (
                        <div className="relative aspect-square overflow-hidden bg-[var(--df-panel-solid)] sm:aspect-[4/3]">
                          <Image
                            alt=""
                            className={`object-cover ${position}`}
                            fill
                            sizes="(min-width: 1344px) 400px, 33vw"
                            src={src}
                            unoptimized={href === "/creative"}
                            {...(blur
                              ? {
                                  placeholder: "blur" as const,
                                  blurDataURL: blur,
                                }
                              : {})}
                          />
                        </div>
                      ) : null}
                      <span className="flex min-h-12 items-center justify-between gap-3 break-words text-[0.8125rem] font-semibold leading-tight sm:text-base lg:min-h-14 lg:text-xl">
                        {label}
                        <span aria-hidden="true" className="hidden md:block">
                          →
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            aria-labelledby="photography-collections-title"
            className="scroll-mt-0 border-t border-[var(--df-line)] pb-10 pt-6 md:flex md:items-baseline md:justify-between md:gap-8 md:pb-14 md:pt-8"
            id="archive"
          >
            <h2
              className="text-2xl font-bold [font-family:var(--font-display)]"
              id="photography-collections-title"
            >
              More photography
            </h2>
            <ul className="mt-2 flex flex-wrap gap-x-6 md:mt-0">
              {galleryLaneDefinitions
                .filter((lane) => lane.key !== "portraits")
                .map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      className="inline-flex min-h-11 items-center text-sm underline decoration-[var(--df-line-strong)] underline-offset-4 hover:decoration-current"
                      href={href}
                      prefetch={false}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              <li>
                <Link
                  className="inline-flex min-h-11 items-center text-sm underline decoration-[var(--df-line-strong)] underline-offset-4 hover:decoration-current"
                  href="/work"
                  prefetch={false}
                >
                  All Photography
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </DorvellShell>
  );
}
