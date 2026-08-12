import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { FollowTheWork } from "@/components/dorvell/social/FollowTheWork";
import { TikTokFeedEmbed } from "@/components/dorvell/social/TikTokFeedEmbed";
import { FilmPlatformGlyph } from "@/components/dorvell/social-icons";
import { resolveCreativeAsset } from "@/lib/creative-assets";
import { getFilmPlatforms, socialLinks } from "@/lib/social-links";
import { filmIndexItems, formatRuntime } from "@/content/creative";

export const metadata: Metadata = {
  title: "Follow the work",
  description:
    "Instagram, TikTok, and Facebook for Dorvell Ferguson Jr. — where the films get distributed, and where each one lives on social.",
  alternates: { canonical: "/social" },
  openGraph: {
    title: "Follow the work | Dorvell Ferguson Jr.",
    description:
      "Every distribution channel in one place: @dorvellfergusonjr, @fergphotography, TikTok, Facebook, and the films behind them.",
  },
};

const ACCOUNTS = [
  {
    key: "instagram-personal",
    platform: "instagram" as const,
    name: "@dorvellfergusonjr",
    role: "Creative world",
    blurb:
      "The films, the experiments, and the person behind the camera. Every piece below is posted here first.",
    href: socialLinks.instagramPersonal,
  },
  {
    key: "instagram-photography",
    platform: "instagram" as const,
    name: "@fergphotography",
    role: "Photography portfolio",
    blurb:
      "Client proof: portraits, fashion, music, and athletics. The polished side of the archive.",
    href: socialLinks.instagramPhotography,
  },
  {
    key: "tiktok",
    platform: "tiktok" as const,
    name: "@2kferg",
    role: "Short-form",
    blurb: "Vertical edits, editing studies, and the fastest read on what's being made right now.",
    href: socialLinks.tiktok,
  },
  {
    key: "facebook",
    platform: "facebook" as const,
    name: "Dorvell Ferguson",
    role: "Community",
    blurb: "Longer updates, event coverage, and the people the work is made with.",
    href: socialLinks.facebook,
  },
];

/**
 * The social hub.
 *
 * The rest of the site keeps third-party embeds out entirely — this is the one
 * page where they belong, and even here TikTok's script is behind a click. It
 * exists so the landing page and the Creative Hub never have to carry a feed
 * wall to prove the social layer is alive.
 */
export default function SocialPage() {
  const platforms = getFilmPlatforms();
  const accounts = ACCOUNTS.filter((account) => Boolean(account.href));

  return (
    <DorvellShell>
      <div className="shub">
        <header className="shub__head">
          <p className="shub__eyebrow">Distribution</p>
          <h1 className="shub__title">Follow the work.</h1>
          <p className="shub__lede">
            The site is where the films live in full. Instagram, TikTok, and Facebook are how they
            travel. Every destination below is a real account — and every film links to its actual
            post, not just a profile.
          </p>
          <FollowTheWork variant="rail" placement="social-page" className="shub__rail" />
        </header>

        <section className="shub__accounts" aria-labelledby="shub-accounts">
          <h2 id="shub-accounts" className="shub__section-label">
            The accounts
          </h2>
          <ul className="shub__account-grid">
            {accounts.map((account) => (
              <li key={account.key}>
                <a
                  className="shub-card"
                  data-platform={account.platform}
                  href={account.href as string}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <span className="shub-card__icon" aria-hidden="true">
                    <FilmPlatformGlyph platform={account.platform} />
                  </span>
                  <span className="shub-card__role">{account.role}</span>
                  <strong className="shub-card__name">{account.name}</strong>
                  <span className="shub-card__blurb">{account.blurb}</span>
                  <span className="shub-card__go">
                    Open
                    <span className="sr-only"> {account.name} (opens in a new tab)</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="shub__films" aria-labelledby="shub-films">
          <h2 id="shub-films" className="shub__section-label">
            The films, and where they live
          </h2>
          <ul className="shub__film-list">
            {filmIndexItems.map((film) => (
              <li key={film.slug} className="shub-film">
                <Link className="shub-film__poster" href={`/creative/${film.slug}`}>
                  <Image
                    src={resolveCreativeAsset(film.thumbSrc)}
                    alt=""
                    fill
                    unoptimized
                    sizes="180px"
                    placeholder={film.blurDataURL ? "blur" : "empty"}
                    blurDataURL={film.blurDataURL}
                  />
                </Link>
                <div className="shub-film__body">
                  <p className="shub-film__index">
                    Film {String(film.filmIndex ?? 1).padStart(2, "0")} ·{" "}
                    {formatRuntime(film.duration)}
                  </p>
                  <h3 className="shub-film__title">
                    <Link href={`/creative/${film.slug}`}>{film.title}</Link>
                  </h3>
                  <p className="shub-film__desc">{film.description}</p>
                  <ul className="shub-film__links">
                    {film.social?.map((action) => (
                      <li key={action.platform}>
                        <a
                          className={action.hasPost ? "shub-film__link is-post" : "shub-film__link"}
                          data-platform={action.platform}
                          href={action.postUrl ?? action.profileUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {action.hasPost ? "Watch on" : "Follow on"} {action.label}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="shub__feed" aria-labelledby="shub-feed">
          <h2 id="shub-feed" className="shub__section-label">
            Live feed
          </h2>
          <TikTokFeedEmbed />
        </section>

        <section className="shub__closing" aria-labelledby="shub-closing">
          <h2 id="shub-closing" className="shub__closing-title">
            Seen something you want made?
          </h2>
          <p className="shub__lede">
            Concept films, social campaigns, editing, portraits, and creative direction.
          </p>
          <div className="shub__closing-actions">
            <Link className="fv-btn fv-btn--primary" href="/contact">
              Book Dorvell
            </Link>
            <Link className="fv-btn" href="/creative">
              Enter Creative Worlds
            </Link>
            <Link className="fv-btn" href="/work">
              Open the photography archive
            </Link>
          </div>
          <FollowTheWork
            variant="stacked"
            placement="social-page"
            label={`${platforms.length} places to follow`}
            className="shub__closing-follow"
          />
        </section>
      </div>
    </DorvellShell>
  );
}
