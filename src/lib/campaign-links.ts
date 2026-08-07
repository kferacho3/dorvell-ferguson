import type { FilmPlatform } from "@/lib/social-links";

export const SITE_ORIGIN = "https://dorvellferguson.com";

/**
 * Campaign links for posts that point back at the site.
 *
 * Instagram, TikTok and Facebook all strip or obscure the referrer, so without
 * explicit tagging every social visit lands in "direct" and there is no way to
 * tell which platform — or which edit — actually drove a booking. These are the
 * URLs to paste into a bio, a caption, or a link-in-bio tool.
 */
export type CampaignContent =
  | "teaser"
  | "director-cut"
  | "bts"
  | "profile-link"
  | "story"
  | "bio";

export function filmCampaignUrl(
  slug: string,
  platform: FilmPlatform,
  content: CampaignContent = "profile-link",
): string {
  const url = new URL(`/creative/${slug}`, SITE_ORIGIN);
  url.searchParams.set("utm_source", platform);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", slug);
  url.searchParams.set("utm_content", content);
  return url.toString();
}

export function filmPageUrl(slug: string): string {
  return `${SITE_ORIGIN}/creative/${slug}`;
}
