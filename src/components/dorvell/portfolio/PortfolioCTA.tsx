import Link from "next/link";
import { getSocialLinks } from "@/lib/social-links";
import { SocialLinks } from "@/components/dorvell/contact/SocialLinks";

/**
 * Closing CTA — calm, professional, echoing the Contact page language. Booking
 * routes plus the shared social links (LinkedIn, @fergphotography, @2kferg, and
 * TikTok only when a verified URL is configured).
 */
export function PortfolioCTA() {
  const socials = getSocialLinks();

  return (
    <section className="pf-cta" aria-labelledby="pf-cta-title">
      <div className="pf-container pf-cta__inner">
        <p className="pf-eyebrow">Next Frame</p>
        <h2 id="pf-cta-title">Need coverage, portraits, or a visual story with presence?</h2>
        <p className="pf-cta__lead">
          Portraits and headshots, live music and athletics, studio and fashion direction, events and
          photojournalism — booked directly with Dorvell.
        </p>

        <div className="pf-cta__actions">
          <Link className="button-primary" href="/contact">
            Book a shoot
          </Link>
          <Link className="button-secondary" href="/contact">
            Hire for journalism
          </Link>
          <Link className="button-secondary" href="/contact">
            Contact Dorvell
          </Link>
        </div>

        <SocialLinks links={socials} className="pf-cta__social" />
      </div>
    </section>
  );
}
