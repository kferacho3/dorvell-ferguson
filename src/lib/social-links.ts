import { dorvellManual } from "@/content/dorvell.manual";

/**
 * Centralized, reusable social sources for the whole site (About, Contact,
 * Portfolio, footer, nav). Single source of truth — derive from the manual so
 * the handles never drift out of sync.
 *
 * TikTok resolves from an env override first, then the verified @2kferg handle
 * in the manual (the live creator feed embeds successfully on the landing
 * page). A `NEXT_PUBLIC_DORVELL_TIKTOK_URL` env value can point it elsewhere;
 * if the manual handle is ever cleared it falls back to `null` and TikTok is
 * omitted everywhere it would render (no broken link ships).
 */
const { profile } = dorvellManual;

// manual.profile.instagram = [personal (@2kferg), photography (@fergphotography)]
const [instagramPersonalUrl, instagramPhotographyUrl] = profile.instagram;

export const socialLinks = {
  linkedin: profile.linkedin,
  instagramPhotography: instagramPhotographyUrl,
  instagramPersonal: instagramPersonalUrl,
  tiktok: process.env.NEXT_PUBLIC_DORVELL_TIKTOK_URL ?? profile.tiktok ?? null,
} as const;

export type SocialKey = "linkedin" | "instagramPhotography" | "instagramPersonal" | "tiktok";

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
 * Ordered, render-ready social links (LinkedIn, @fergphotography, @2kferg,
 * TikTok only when a verified URL exists). Returns plain serializable data so
 * it can cross the server/client boundary and be reused in any component.
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
      handle: "@2kferg",
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

  return links;
}
