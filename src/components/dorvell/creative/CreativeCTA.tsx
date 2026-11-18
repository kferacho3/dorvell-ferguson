"use client";

import { useRouter } from "next/navigation";
import { ElasticButton } from "../contact/ElasticButton";
import { SocialLinks } from "@/components/dorvell/contact/SocialLinks";
import { getSocialLinks } from "@/lib/social-links";

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
        <h2 id="cw-cta-title" className="cw-cta__title">
          Have a scene in mind?
        </h2>

        <div className="cw-cta__primary-actions">
          <ElasticButton
            onClick={() => router.push("/contact")}
            aria-label="Book a creative shoot"
          >
            Book a creative shoot
          </ElasticButton>
        </div>

        <SocialLinks links={socials} className="cw-cta__social" />
      </div>
    </section>
  );
}
