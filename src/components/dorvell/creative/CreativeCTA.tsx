"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ElasticButton } from "../contact/ElasticButton";
import { getSocialLinks, socialLinks } from "@/lib/social-links";

/**
 * Section 12 — Closing CTA. Matches the Contact page's tactile button system
 * (ElasticButton) and reuses the shared social source (TikTok only when a
 * verified URL exists).
 */
export function CreativeCTA() {
  const router = useRouter();
  const socials = getSocialLinks();

  return (
    <section className="cw-section cw-cta" aria-labelledby="cw-cta-title">
      <div className="cw-container cw-cta__inner">
        <p className="cw-eyebrow">Closing frame</p>
        <h2 id="cw-cta-title" className="cw-cta__title">
          Have a scene in mind?
        </h2>
        <p className="cw-lede cw-cta__lede">
          Book Dorvell for concept shoots, cinematic shorts, creative direction, portraits, editorial visuals,
          and experimental visual storytelling.
        </p>

        <div className="cw-cta__primary-actions">
          <ElasticButton onClick={() => router.push("/contact")} aria-label="Book a creative shoot">
            Book a creative shoot
          </ElasticButton>
          <ElasticButton onClick={() => router.push("/contact")} aria-label="Send a concept">
            Send a concept
          </ElasticButton>
        </div>

        <div className="cw-actions cw-cta__links">
          <Link className="cw-btn" href="/work">
            View Portfolio
          </Link>
          <Link className="cw-btn" href="/modeling">
            View Modeling
          </Link>
          <a
            className="cw-btn cw-btn--ghost"
            href={socialLinks.instagramPhotography}
            target="_blank"
            rel="noreferrer"
          >
            Follow @fergphotography
          </a>
        </div>

        <ul className="cw-cta__socials" aria-label="Social links">
          {socials.map((social) => (
            <li key={social.key}>
              <a href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>
                <span className="cw-cta__social-platform">{social.platform}</span>
                <strong className="cw-cta__social-handle">{social.handle}</strong>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
