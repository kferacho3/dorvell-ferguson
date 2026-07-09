"use client";

import Link from "next/link";
import { featuredCreativeItems, heroCreativeItem } from "@/content/creative";
import { Reveal } from "./Reveal";
import { VideoPlayer } from "./VideoPlayer";
import { useCreativeLightbox } from "./CreativeLightbox";

function runtimeLabel(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Section 3 — Featured creative film ("The Threshold"). Editorial asymmetric
 * layout: large clip on the left, metadata + director's note + CTAs on the
 * right; stacks video-first on mobile.
 */
export function FeaturedCreativeFilm() {
  const item = heroCreativeItem;
  const { open } = useCreativeLightbox();

  const specs: { label: string; value: string }[] = [
    { label: "Type", value: "Cinematic short" },
    { label: "Format", value: "Video study" },
    { label: "Mood", value: "Shadow · Discipline · Suspense" },
    { label: "Visual language", value: "blinds, mirrors, body, closeup, blur, gym, low light" },
    { label: "Runtime", value: runtimeLabel(item.duration) },
    { label: "Orientation", value: item.orientation },
    { label: "Source", value: item.sourceFolderLabel },
  ];

  return (
    <section id="cw-featured" className="cw-section cw-featured" aria-labelledby="cw-featured-title">
      <div className="cw-container cw-featured__grid">
        <Reveal className="cw-featured__stage">
          <VideoPlayer item={item} mode="ambient" loop controls />
        </Reveal>

        <div className="cw-featured__meta">
          <p className="cw-eyebrow">Featured film</p>
          <h2 id="cw-featured-title" className="cw-h2">
            {item.title}
          </h2>
          <p className="cw-lede">{item.description}</p>

          <dl className="cw-featured__specs">
            {specs.map((spec) => (
              <div key={spec.label} className="cw-featured__spec">
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>

          {item.directorNote ? (
            <blockquote className="cw-featured__note">
              <span className="cw-featured__note-label">Director&rsquo;s note</span>
              {item.directorNote}
            </blockquote>
          ) : null}

          <div className="cw-actions cw-featured__actions">
            <button type="button" className="cw-btn cw-btn--primary" onClick={() => open(item, featuredCreativeItems)}>
              Play film
            </button>
            <a className="cw-btn" href="#cw-archive">
              View creative archive
            </a>
            <Link className="cw-btn cw-btn--accent" href="/contact">
              Book a creative shoot
            </Link>
            <Link className="cw-btn cw-btn--ghost" href="/contact">
              Send a concept
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
