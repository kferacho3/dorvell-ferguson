"use client";

import { cn } from "@/lib/cn";
import { getFilmPlatforms } from "@/lib/social-links";
import { trackFilmEvent, type FilmPlacement } from "@/lib/analytics";
import { FilmPlatformGlyph } from "@/components/dorvell/social-icons";

type FollowTheWorkProps = {
  /**
   * `rail` — a quiet single editorial line for the hero and closing frames.
   * `stacked` — full-width rows for the nav drawer and footer.
   * `edge` — the fixed desktop-only edge rail (hidden on small screens in CSS).
   */
  variant?: "rail" | "stacked" | "edge";
  label?: string;
  placement: FilmPlacement;
  className?: string;
};

/**
 * The site-wide "Follow the work" group.
 *
 * Deliberately editorial rather than a row of brand-coloured buttons: monochrome
 * at rest, the platform's own colour arriving only on hover/focus. Platform
 * names are always real text — the glyph is decorative — so the row is legible
 * to screen readers and to anyone who doesn't recognise a mark.
 *
 * Destinations come from `getFilmPlatforms()`, which omits any platform whose
 * URL is unverified, so this component can never render a broken promise.
 */
export function FollowTheWork({
  variant = "rail",
  label = "Follow the work",
  placement,
  className,
}: FollowTheWorkProps) {
  const platforms = getFilmPlatforms();
  if (!platforms.length) return null;

  return (
    <div className={cn("ftw", `ftw--${variant}`, className)}>
      <span className="ftw__label">{label}</span>
      <ul className="ftw__list">
        {platforms.map((platform) => (
          <li key={platform.platform}>
            <a
              className="ftw__link"
              data-platform={platform.platform}
              href={platform.profileUrl}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() =>
                trackFilmEvent("film_social_click", {
                  placement,
                  platform: platform.platform,
                  destination: "profile",
                })
              }
            >
              <span className="ftw__icon" aria-hidden="true">
                <FilmPlatformGlyph platform={platform.platform} />
              </span>
              <span className="ftw__name">{platform.label}</span>
              {variant === "stacked" ? <span className="ftw__handle">{platform.handle}</span> : null}
              <span className="sr-only"> (opens in a new tab)</span>
              <svg className="ftw__out" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 15 15 9M10 9h5v5" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
