"use client";

import { cn } from "@/lib/cn";
import type { CreativeItem } from "@/content/creative";
import { trackFilmEvent, type FilmPlacement } from "@/lib/analytics";
import { FilmPlatformGlyph } from "@/components/dorvell/social-icons";

type SocialActionBarProps = {
  film: CreativeItem;
  placement: FilmPlacement;
  /** `compact` drops the eyebrow — for cards and tight viewer footers. */
  variant?: "default" | "compact";
  className?: string;
};

/**
 * Per-film platform actions.
 *
 * The single rule this component exists to enforce: a link is labelled
 * "Watch on <Platform>" only when that platform has a verified post for this
 * exact film. Otherwise it reads "Follow on <Platform>" and goes to the
 * profile. Nobody is ever sent to a profile under a label promising the film.
 *
 * Which platforms appear, and their profile URLs, come from the shared social
 * source via the film's `social` array — this component never hardcodes a
 * destination.
 */
export function SocialActionBar({
  film,
  placement,
  variant = "default",
  className,
}: SocialActionBarProps) {
  const actions = film.social;
  if (!actions?.length) return null;

  return (
    <div className={cn("sab", variant === "compact" && "sab--compact", className)}>
      {variant === "default" ? (
        <span className="sab__eyebrow">Watch &amp; follow</span>
      ) : null}
      <ul className="sab__list">
        {actions.map((action) => {
          const verb = action.hasPost ? "Watch on" : "Follow on";
          const href = action.postUrl ?? action.profileUrl;
          return (
            <li key={action.platform}>
              <a
                className={cn("sab__link", action.hasPost && "is-post")}
                data-platform={action.platform}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() =>
                  trackFilmEvent("film_social_click", {
                    film: film.slug,
                    placement,
                    platform: action.platform,
                    destination: action.hasPost ? "post" : "profile",
                  })
                }
              >
                <span className="sab__icon" aria-hidden="true">
                  <FilmPlatformGlyph platform={action.platform} />
                </span>
                <span className="sab__text">
                  <span className="sab__verb">{verb}</span> {action.label}
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
