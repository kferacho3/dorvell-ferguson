import Link from "next/link";
import type { SocialLink } from "@/lib/social-links";

type Action = {
  key: string;
  label: string;
  detail: string;
  href: string;
  external: boolean;
  internal?: boolean;
};

/**
 * Elegant utility strip — the fast, direct ways to reach Dorvell, distinct from
 * the footer's link dump. TikTok only appears when a verified URL exists.
 */
export function ContactActionStrip({
  email,
  portfolio,
  socials,
}: {
  email: string;
  portfolio: string;
  socials: SocialLink[];
}) {
  const find = (key: string) => socials.find((social) => social.key === key);
  const photography = find("instagramPhotography");
  const linkedin = find("linkedin");
  const tiktok = find("tiktok");

  const actions: Action[] = [
    {
      key: "email",
      label: "Send the inquiry",
      detail: email,
      href: `mailto:${email}?subject=${encodeURIComponent("Dorvell Ferguson Jr. — inquiry")}`,
      external: false,
    },
  ];

  if (photography) {
    actions.push({
      key: "dm",
      label: "DM the studio",
      detail: photography.handle,
      href: photography.href,
      external: true,
    });
  }
  if (linkedin) {
    actions.push({
      key: "linkedin",
      label: "Connect on LinkedIn",
      detail: "Professional profile",
      href: linkedin.href,
      external: true,
    });
  }
  actions.push({
    key: "portfolio",
    label: "View portfolio",
    detail: "Full archive",
    href: "/work",
    external: false,
    internal: true,
  });
  if (portfolio) {
    actions.push({
      key: "external-portfolio",
      label: "External book",
      detail: "myportfolio.com",
      href: portfolio,
      external: true,
    });
  }
  if (tiktok) {
    actions.push({
      key: "tiktok",
      label: "Watch on TikTok",
      detail: tiktok.handle,
      href: tiktok.href,
      external: true,
    });
  }

  return (
    <section className="contact-action-strip" aria-labelledby="contact-action-title">
      <p className="eyebrow" id="contact-action-title">
        Direct lines
      </p>
      <ul className="contact-action-strip__grid">
        {actions.map((action) =>
          action.internal ? (
            <li key={action.key}>
              <Link className="contact-action" href={action.href}>
                <span className="contact-action__label">{action.label}</span>
                <span className="contact-action__detail">{action.detail}</span>
                <span className="contact-action__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ) : (
            <li key={action.key}>
              <a
                className="contact-action"
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noreferrer" : undefined}
              >
                <span className="contact-action__label">{action.label}</span>
                <span className="contact-action__detail">{action.detail}</span>
                <span className="contact-action__arrow" aria-hidden="true">
                  →
                </span>
              </a>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
