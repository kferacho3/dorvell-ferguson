import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { buildGalleryLanes } from "@/lib/gallery-lanes";
import { getPortfolioData } from "@/lib/portfolio-data";
import { getSocialLinks } from "@/lib/social-links";
import { MailIcon, PhoneIcon, SocialGlyph } from "@/components/dorvell/social-icons";

const footerRoutes = [
  { href: "/work", label: "Portfolio", index: "01" },
  { href: "/modeling", label: "Modeling", index: "02" },
  { href: "/projects", label: "Projects", index: "03" },
  { href: "/about", label: "About", index: "04" },
  { href: "/contact", label: "Contact", index: "05" },
];

export function DorvellFooter() {
  const { generated, manual } = getPortfolioData();
  const lanes = buildGalleryLanes(generated.images);

  // Sourced from the shared social module so LinkedIn is present and TikTok is
  // omitted unless a verified URL exists — then the booking email is appended.
  const socialItems: {
    platform: string;
    handle: string;
    href: string;
    label: string;
    icon: ReactNode;
    external: boolean;
  }[] = [
    ...getSocialLinks().map((link) => ({
      platform: link.platform,
      handle: link.handle,
      href: link.href,
      label: link.label,
      icon: <SocialGlyph social={link.key} />,
      external: true,
    })),
    {
      platform: "Booking",
      handle: "Email",
      href: `mailto:${manual.profile.email}?subject=${encodeURIComponent("Dorvell Ferguson Jr. booking inquiry")}`,
      label: "Email Dorvell Ferguson Jr.",
      icon: <MailIcon />,
      external: false,
    },
  ];
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
            {socialItems.map((social) => (
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
