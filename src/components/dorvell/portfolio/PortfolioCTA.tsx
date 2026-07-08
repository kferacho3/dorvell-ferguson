import Link from "next/link";
import { getSocialLinks } from "@/lib/social-links";

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

        <ul className="pf-cta__socials" aria-label="Social links">
          {socials.map((social) => (
            <li key={social.key}>
              <a
                href={social.href}
                aria-label={social.label}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel={social.href.startsWith("http") ? "noreferrer" : undefined}
              >
                <span>{social.platform}</span>
                <strong>{social.handle} ↗</strong>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
