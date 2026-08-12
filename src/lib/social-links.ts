import { dorvellManual } from "@/content/dorvell.manual";

/**
 * Centralized, reusable social sources for the whole site (About, Contact,
 * Portfolio, footer, nav, film viewers). Single source of truth — derive from
 * the manual so the handles never drift out of sync.
 *
 * TikTok and Facebook each resolve from an env override first, then the
 * verified handle in the manual. A `NEXT_PUBLIC_DORVELL_TIKTOK_URL` /
 * `NEXT_PUBLIC_DORVELL_FACEBOOK_URL` value can point either elsewhere; if a
 * manual handle is ever cleared it falls back to `null` and that platform is
 * omitted everywhere it would render (no broken link ships).
 */
const { profile } = dorvellManual;

// manual.profile.instagram = [personal (@dorvellfergusonjr), photography (@fergphotography)]
const [instagramPersonalUrl, instagramPhotographyUrl] = profile.instagram;

export const socialLinks = {
  linkedin: profile.linkedin,
  instagramPhotography: instagramPhotographyUrl,
  instagramPersonal: instagramPersonalUrl,
  tiktok: process.env.NEXT_PUBLIC_DORVELL_TIKTOK_URL ?? profile.tiktok ?? null,
  facebook: process.env.NEXT_PUBLIC_DORVELL_FACEBOOK_URL ?? profile.facebook ?? null,
} as const;

export type SocialKey =
  | "linkedin"
  | "instagramPhotography"
  | "instagramPersonal"
  | "tiktok"
  | "facebook";

export type SocialLink = {
  key: SocialKey;
  /** Tasteful editorial descriptor shown as the small over-line label. */
  platform: string;
  /** The handle / name shown as the primary line. */
  handle: string;
  href: string;
  /** Accessible label for the anchor. */
  label: string;
};

/**
 * Ordered, render-ready social links (LinkedIn, @fergphotography,
 * @dorvellfergusonjr, then TikTok and Facebook only when a verified URL
 * exists). Returns plain serializable data so it can cross the server/client
 * boundary and be reused in any component.
 */
export function getSocialLinks(): SocialLink[] {
  const links: SocialLink[] = [
    {
      key: "linkedin",
      platform: "Professional profile",
      handle: "Dorvell Ferguson Jr.",
      href: socialLinks.linkedin,
      label: "Open Dorvell Ferguson Jr. on LinkedIn",
    },
    {
      key: "instagramPhotography",
      platform: "Photography work",
      handle: "@fergphotography",
      href: socialLinks.instagramPhotography,
      label: "Open Ferg Photography on Instagram",
    },
    {
      key: "instagramPersonal",
      platform: "Personal / creative world",
      handle: "@dorvellfergusonjr",
      href: socialLinks.instagramPersonal,
      label: "Open Dorvell on Instagram",
    },
  ];

  if (socialLinks.tiktok) {
    links.push({
      key: "tiktok",
      platform: "Short-form work",
      handle: "@2kferg",
      href: socialLinks.tiktok,
      label: "Open Dorvell on TikTok",
    });
  }

  if (socialLinks.facebook) {
    links.push({
      key: "facebook",
      platform: "Community / updates",
      handle: "Dorvell Ferguson",
      href: socialLinks.facebook,
      label: "Open Dorvell Ferguson on Facebook",
    });
  }

  return links;
}

// ---------------------------------------------------------------------------
// Film distribution platforms
// ---------------------------------------------------------------------------

/**
 * The three channels the films are distributed through. LinkedIn and the
 * photography account are deliberately excluded — this is the "Follow the work"
 * set that appears beside the films, not the full professional profile list.
 */
export type FilmPlatform = "instagram" | "tiktok" | "facebook";

export type FilmPlatformSource = {
  platform: FilmPlatform;
  /** Full platform name — always rendered as text, never icon-only (a11y). */
  label: string;
  handle: string;
  profileUrl: string;
};

/**
 * Ordered film platforms, omitting any whose destination is unverified. Films
 * declare only their own post URLs; profile destinations always come from here
 * so a handle can never drift between the hero, a film page, and the footer.
 */
export function getFilmPlatforms(): FilmPlatformSource[] {
  const platforms: FilmPlatformSource[] = [
    {
      platform: "instagram",
      label: "Instagram",
      handle: "@dorvellfergusonjr",
      profileUrl: socialLinks.instagramPersonal,
    },
  ];

  if (socialLinks.tiktok) {
    platforms.push({
      platform: "tiktok",
      label: "TikTok",
      handle: "@2kferg",
      profileUrl: socialLinks.tiktok,
    });
  }

  if (socialLinks.facebook) {
    platforms.push({
      platform: "facebook",
      label: "Facebook",
      handle: "Dorvell Ferguson",
      profileUrl: socialLinks.facebook,
    });
  }

  return platforms;
}
