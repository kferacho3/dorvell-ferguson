import type { SocialKey } from "@/lib/social-links";

/**
 * Shared inline social/contact glyphs. Single source so the footer, the
 * contact page, and the about page all render identical marks. Every icon is
 * a 24×24 stroke glyph tuned for the site's `stroke: currentColor` treatments;
 * callers control color via the surrounding icon well.
 */

export function LinkedInIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 10.4V17M8 7.2v.02M11.4 17v-3.6a2 2 0 0 1 4 0V17" />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17.1" cy="6.9" r="0.8" />
    </svg>
  );
}

export function TikTokIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M14.2 4v10.05a4.1 4.1 0 1 1-3.5-4.05v3.08a1.25 1.25 0 1 0 .88 1.2V4h2.62Z" />
      <path d="M14.2 4c.42 2.65 2 4.18 4.56 4.48v3.02c-1.74-.08-3.22-.6-4.56-1.72V4Z" />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 6.8h16v10.4H4z" />
      <path d="m4.6 7.4 7.4 5.5 7.4-5.5" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M8.4 5.1 6.5 6.4c-.62.42-.82 1.24-.48 1.92 2.08 4.15 5.5 7.57 9.66 9.66.68.34 1.5.14 1.92-.48l1.3-1.9-3.4-2.25-1.23 1.08c-1.7-.9-2.8-2-3.7-3.7l1.08-1.23L8.4 5.1Z" />
    </svg>
  );
}

/** Maps an ordered social key from `getSocialLinks()` to its glyph. */
export function SocialGlyph({ social }: { social: SocialKey }) {
  if (social === "linkedin") return <LinkedInIcon />;
  if (social === "tiktok") return <TikTokIcon />;
  return <InstagramIcon />;
}
