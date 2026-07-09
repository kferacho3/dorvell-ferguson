import type { SocialLink } from "@/lib/social-links";
import { SocialGlyph } from "@/components/dorvell/social-icons";

type SocialLinksProps = {
  links: SocialLink[];
  className?: string;
};

/**
 * Shared bare-icon social row. Each link renders as an icon-only target with its
 * handle revealed on hover/focus; the accessible name always lives on the
 * anchor. Single source so the footer, About hero, and About closing render an
 * identical row.
 */
export function SocialLinks({ links, className }: SocialLinksProps) {
  return (
    <ul className={className ? `social-links ${className}` : "social-links"} aria-label="Social profiles">
      {links.map((link) => (
        <li key={link.key}>
          <a
            className="social-links__item"
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${link.label} (opens in a new tab)`}
          >
            <span className="social-links__icon" aria-hidden="true">
              <SocialGlyph social={link.key} />
            </span>
            <span className="social-links__tip" aria-hidden="true">
              {link.handle}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
