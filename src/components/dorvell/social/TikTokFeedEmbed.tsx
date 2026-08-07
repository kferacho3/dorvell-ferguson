"use client";

import Script from "next/script";
import { useState } from "react";
import { socialLinks } from "@/lib/social-links";
import { trackFilmEvent } from "@/lib/analytics";

/**
 * The live TikTok creator feed — click to load.
 *
 * TikTok's embed pulls in third-party script, its own chrome and its own
 * post-playback recommendations. That is fine here, on a page whose whole job
 * is the social layer, and unacceptable on the landing page, which is why this
 * component exists instead of the old always-on embed.
 *
 * Nothing from tiktok.com is requested until the visitor presses the button.
 */
export function TikTokFeedEmbed() {
  const [loaded, setLoaded] = useState(false);
  const url = socialLinks.tiktok;
  if (!url) return null;

  const handle = url.split("@")[1]?.replace(/\/$/, "") ?? "2kferg";

  if (!loaded) {
    return (
      <div className="shub-embed shub-embed--gate">
        <p className="shub-embed__label">Live TikTok feed</p>
        <p className="shub-embed__note">
          Loads TikTok&rsquo;s player and its own tracking. Nothing is requested from tiktok.com
          until you choose to load it.
        </p>
        <button
          type="button"
          className="fv-btn fv-btn--primary"
          onClick={() => {
            setLoaded(true);
            trackFilmEvent("film_social_click", {
              placement: "social-page",
              platform: "tiktok",
              destination: "profile",
            });
          }}
        >
          Load the @{handle} feed
        </button>
        <a className="shub-embed__direct" href={url} target="_blank" rel="noreferrer noopener">
          Or open TikTok directly
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    );
  }

  return (
    <div className="shub-embed">
      <p className="shub-embed__label">Live TikTok feed · @{handle}</p>
      <div className="shub-embed__frame">
        <blockquote
          className="tiktok-embed"
          cite={url}
          data-unique-id={handle}
          data-embed-from="oembed"
          data-embed-type="creator"
          style={{ maxWidth: "780px", minWidth: "288px" }}
        >
          <section>
            <a target="_blank" rel="noreferrer noopener" href={`${url}?refer=creator_embed`}>
              @{handle}
            </a>
          </section>
        </blockquote>
      </div>
      <Script id="dorvell-tiktok-embed" src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
    </div>
  );
}
