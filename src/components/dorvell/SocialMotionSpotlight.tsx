import Image from "next/image";
import Script from "next/script";
import type { DorvellImage } from "@/content/dorvell.schema";
import { blurImageProps, imageAlt } from "@/lib/images";

const tiktokUrl = "https://www.tiktok.com/@2kferg";

function motionFramePool(images: DorvellImage[]) {
  const motionCategories = new Set(["Fashion", "Modeling", "Runway", "Music", "Behind The Scenes"]);
  const matches = images.filter((image) => motionCategories.has(image.category));
  return matches.length >= 6 ? matches : images;
}

export function SocialMotionSpotlight({ images }: { images: DorvellImage[] }) {
  const frames = motionFramePool(images).slice(0, 9);
  const lead = frames[0] ?? images[0];
  const supportingFrames = frames.slice(1, 7);

  return (
    <section className="social-motion" aria-labelledby="social-motion-title">
      <div className="social-motion__copy">
        <p className="eyebrow">TikTok / motion feed</p>
        <h2 id="social-motion-title">The first scroll hits like a moving contact sheet.</h2>
        <p>
          Dorvell&apos;s vertical work brings runway energy, styling notes, and behind-the-lens pacing into the archive,
          giving the still portfolio a live social pulse from @2kferg.
        </p>
        <div className="social-motion__actions">
          <a className="button-primary" href={tiktokUrl} target="_blank" rel="noreferrer">
            Watch @2kferg
          </a>
          <a className="button-secondary" href="/runway">
            Open runway book
          </a>
        </div>
      </div>

      <div className="social-motion__stage" aria-label="TikTok creator feed and portfolio motion frames">
        {lead ? (
          <figure className="social-motion__poster">
            <Image
              src={lead.localOptimized.md}
              alt={imageAlt(lead)}
              width={lead.width}
              height={lead.height}
              sizes="(max-width: 900px) 82vw, 34vw"
              {...blurImageProps(lead)}
            />
            <figcaption>
              <span>Live social layer</span>
              <strong>@2kferg</strong>
            </figcaption>
          </figure>
        ) : null}

        <div className="social-motion__phone">
          <div className="social-motion__phone-top" aria-hidden="true">
            <span />
            <strong>2kferg</strong>
            <em>creator feed</em>
          </div>
          <div className="social-motion__embed">
            <blockquote
              className="tiktok-embed"
              cite={tiktokUrl}
              data-unique-id="2kferg"
              data-embed-from="oembed"
              data-embed-type="creator"
              style={{ maxWidth: "780px", minWidth: "288px" }}
            >
              <section>
                <a target="_blank" rel="noreferrer" href={`${tiktokUrl}?refer=creator_embed`}>
                  @2kferg
                </a>
              </section>
            </blockquote>
          </div>
          <div className="social-motion__phone-bottom" aria-hidden="true">
            <span>frame</span>
            <span>fit</span>
            <span>walk</span>
            <span>cut</span>
          </div>
        </div>

        {supportingFrames.length > 0 ? (
          <div className="social-motion__strip" aria-hidden="true">
            {[...supportingFrames, ...supportingFrames].map((image, index) => (
              <span key={`${image.id}-${index}`}>
                <Image
                  src={image.localOptimized.sm}
                  alt=""
                  width={image.width}
                  height={image.height}
                  {...blurImageProps(image)}
                />
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <Script id="dorvell-tiktok-embed" src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
    </section>
  );
}
