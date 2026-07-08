import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { buildGalleryLanes } from "@/lib/gallery-lanes";
import { getPortfolioData } from "@/lib/portfolio-data";

const footerRoutes = [
  { href: "/work", label: "Portfolio", index: "01" },
  { href: "/modeling", label: "Modeling", index: "02" },
  { href: "/projects", label: "Projects", index: "03" },
  { href: "/about", label: "About", index: "04" },
  { href: "/contact", label: "Contact", index: "05" },
];

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17.1" cy="6.9" r="0.8" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M14.2 4v10.05a4.1 4.1 0 1 1-3.5-4.05v3.08a1.25 1.25 0 1 0 .88 1.2V4h2.62Z" />
      <path d="M14.2 4c.42 2.65 2 4.18 4.56 4.48v3.02c-1.74-.08-3.22-.6-4.56-1.72V4Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 6.8h16v10.4H4z" />
      <path d="m4.6 7.4 7.4 5.5 7.4-5.5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M8.4 5.1 6.5 6.4c-.62.42-.82 1.24-.48 1.92 2.08 4.15 5.5 7.57 9.66 9.66.68.34 1.5.14 1.92-.48l1.3-1.9-3.4-2.25-1.23 1.08c-1.7-.9-2.8-2-3.7-3.7l1.08-1.23L8.4 5.1Z" />
    </svg>
  );
}

export function DorvellFooter() {
  const { generated, manual } = getPortfolioData();
  const lanes = buildGalleryLanes(generated.images);
  const closingReel = lanes.flatMap((lane) =>
    lane.images.slice(0, 3).map((image) => ({
      image,
      lane,
    })),
  );

  return (
    <footer className="site-footer" id="closing-frame" data-studio-section="closing">
      <div className="footer-mark">
        <Image src="/dorvell-ferguson-symbol-v2.png" alt="" width={56} height={56} />
        <div>
          <p className="eyebrow">DF Archive</p>
          <h2>Fashion, music, movement, and the exact second it becomes a frame.</h2>
        </div>
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

      <div className="footer-signal-board" aria-label="Closing contact board">
        <div>
          <p className="eyebrow">Next Frame</p>
          <strong>Clear direction, clean edits, and frames ready for where they need to live.</strong>
        </div>
        <div className="footer-signal-board__stats">
          <span>
            <em>{generated.images.length}</em>
            catalogued frames
          </span>
          <span>
            <em>{lanes.length}</em>
            live lanes
          </span>
          <span>
            <em>Tampa</em>
            travel by inquiry
          </span>
        </div>
        <a href={`mailto:${manual.profile.email}?subject=${encodeURIComponent("Dorvell Ferguson Jr. booking inquiry")}`}>
          Send the brief
        </a>
      </div>

      <nav className="footer-lanes" aria-label="Gallery lanes">
        {lanes.map((lane, index) => (
          <Link key={lane.key} href={`/work#${lane.slug}`} style={{ "--lane-accent": lane.accent } as CSSProperties}>
            {lane.images[0] ? (
              <Image
                src={lane.images[0].localOptimized.sm}
                alt=""
                width={lane.images[0].width}
                height={lane.images[0].height}
              />
            ) : null}
            <em>{String(index + 1).padStart(2, "0")}</em>
            <span>{lane.eyebrow}</span>
            <strong>{lane.label}</strong>
          </Link>
        ))}
      </nav>
      <div className="footer-grid">
        <div className="footer-identity">
          <Image src="/dorvell-ferguson-symbol-v2.png" alt="" width={46} height={46} />
          <div>
            <strong>Dorvell Ferguson Jr.</strong>
            <span>Tampa, Florida</span>
          </div>
          <p>{manual.profile.shortBio}</p>
          <a className="footer-identity__email" href={`mailto:${manual.profile.email}`}>
            {manual.profile.email}
          </a>
        </div>

        <nav className="footer-route-chips" aria-label="Footer">
          {footerRoutes.map((route) => (
            <Link href={route.href} key={route.href}>
              <span>{route.index}</span>
              {route.label}
            </Link>
          ))}
        </nav>

        <div className="footer-social-panel">
          <span className="footer-social-panel__label">Social / contact</span>
          <div className="footer-socials">
            {[
              {
                platform: "Instagram",
                handle: "@2kferg",
                href: "https://www.instagram.com/2kferg/",
                label: "Open Dorvell on Instagram",
                icon: <InstagramIcon />,
                external: true,
              },
              {
                platform: "Studio IG",
                handle: "@fergphotography",
                href: "https://www.instagram.com/fergphotography/",
                label: "Open Ferg Photography on Instagram",
                icon: <InstagramIcon />,
                external: true,
              },
              {
                platform: "TikTok",
                handle: "@2kferg",
                href: manual.profile.tiktok,
                label: "Open Dorvell on TikTok",
                icon: <TikTokIcon />,
                external: true,
              },
              {
                platform: "Email",
                handle: "Booking",
                href: `mailto:${manual.profile.email}?subject=${encodeURIComponent("Dorvell Ferguson Jr. booking inquiry")}`,
                label: "Email Dorvell Ferguson Jr.",
                icon: <MailIcon />,
                external: false,
              },
            ].map((social) => (
              <a
                aria-label={social.label}
                className="footer-social"
                href={social.href}
                key={`${social.platform}-${social.handle}`}
                rel={social.external ? "noreferrer" : undefined}
                target={social.external ? "_blank" : undefined}
              >
                <span className="footer-social__icon">{social.icon}</span>
                <span className="footer-social__text">
                  <strong>{social.platform}</strong>
                  <em>{social.handle}</em>
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="footer-meta-line">
          <span>{generated.images.length} frames catalogued</span>
          <a href={`tel:${manual.profile.phone.replace(/\D/g, "")}`}>
            <PhoneIcon />
            {manual.profile.phone}
          </a>
          <span>Built for fashion / music / motion</span>
        </div>
      </div>
    </footer>
  );
}
