import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { buildGalleryLanes } from "@/lib/gallery-lanes";
import { getPortfolioData } from "@/lib/portfolio-data";
import { getSocialLinks } from "@/lib/social-links";
import { PhoneIcon } from "@/components/dorvell/social-icons";
import { SocialLinks } from "@/components/dorvell/contact/SocialLinks";

const footerRoutes = [
  { href: "/work", label: "Portfolio" },
  { href: "/modeling", label: "Modeling" },
  { href: "/creative", label: "Creative" },
  { href: "/projects", label: "Projects" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function DorvellFooter() {
  const { generated, manual } = getPortfolioData();
  const lanes = buildGalleryLanes(generated.images);
  const bookingHref = `mailto:${manual.profile.email}?subject=${encodeURIComponent("Dorvell Ferguson Jr. booking inquiry")}`;
  const year = new Date().getFullYear();

  // A short, cinematic closing reel drawn from the live gallery lanes — the
  // single visual artifact of the footer.
  const closingReel = lanes.flatMap((lane) =>
    lane.images.slice(0, 3).map((image) => ({ image, lane })),
  );

  return (
    <footer className="site-footer" id="closing-frame" data-studio-section="closing">
      <div className="footer-closing">
        <Image src="/dorvell-ferguson-symbol-v2.png" alt="" width={52} height={52} />
        <p className="eyebrow">DF Archive</p>
        <h2>Fashion, music, movement, and the exact second it becomes a frame.</h2>
        <a className="button-primary" href={bookingHref}>
          Send the brief
        </a>
      </div>

      <div className="footer-reel" aria-label="Closing portfolio reel">
        {closingReel.concat(closingReel.slice(0, 6)).map(({ image, lane }, index) => (
          <Link
            href={`/work#${lane.slug}`}
            key={`${image.id}-${index}`}
            style={{ "--lane-accent": lane.accent } as CSSProperties}
          >
            <Image src={image.localOptimized.sm} alt="" width={image.width} height={image.height} />
            <span>{lane.label}</span>
          </Link>
        ))}
      </div>

      <div className="footer-grid">
        <div className="footer-identity">
          <div className="footer-identity__head">
            <Image src="/dorvell-ferguson-symbol-v2.png" alt="" width={42} height={42} />
            <div>
              <strong>Dorvell Ferguson Jr.</strong>
              <span>Tampa, Florida</span>
            </div>
          </div>
          <p>{manual.profile.shortBio}</p>
          <a className="footer-identity__email" href={`mailto:${manual.profile.email}`}>
            {manual.profile.email}
          </a>
        </div>

        <nav className="footer-sitemap" aria-label="Footer">
          <p className="footer-col__label">Explore</p>
          {footerRoutes.map((route) => (
            <Link href={route.href} key={route.href}>
              {route.label}
            </Link>
          ))}
        </nav>

        <div className="footer-connect">
          <div>
            <p className="footer-col__label">Connect</p>
            <SocialLinks links={getSocialLinks()} />
          </div>
          <a className="footer-phone" href={`tel:${manual.profile.phone.replace(/\D/g, "")}`}>
            <PhoneIcon />
            {manual.profile.phone}
          </a>
        </div>

        <div className="footer-meta-line">
          <span>© {year} Dorvell Ferguson Jr.</span>
          <span>{generated.images.length} frames catalogued</span>
          <span>Built for fashion / music / motion</span>
        </div>
      </div>
    </footer>
  );
}
