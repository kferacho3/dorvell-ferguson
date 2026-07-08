import type { SocialLink } from "@/lib/social-links";
import { SocialGlyph } from "@/components/dorvell/social-icons";

type SocialLinksProps = {
  links: SocialLink[];
  className?: string;
  variant?: "row" | "rail";
};

/**
 * Reusable social row. Renders LinkedIn, @fergphotography, @2kferg and TikTok
 * (only when a verified URL exists — the caller passes the already-filtered
 * list from `getSocialLinks`).
 */
export function SocialLinks({ links, className, variant = "row" }: SocialLinksProps) {
  return (
    <ul
      className={className ? `social-links social-links--${variant} ${className}` : `social-links social-links--${variant}`}
      aria-label="Social profiles"
    >
      {links.map((link) => (
        <li key={link.key}>
          <a
            className="social-links__item"
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={link.label}
          >
            <span className="social-links__icon" aria-hidden="true">
              <SocialGlyph social={link.key} />
            </span>
            <span className="social-links__text">
              <strong>{link.platform}</strong>
              <em>{link.handle}</em>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
