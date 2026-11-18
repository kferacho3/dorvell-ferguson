import Image from "next/image";
import Link from "next/link";
import { dorvellManual } from "@/content/dorvell.manual";
import { portfolioLinks, secondaryLinks } from "@/lib/site-navigation";
import { getSocialLinks } from "@/lib/social-links";
import { SocialLinks } from "./contact/SocialLinks";

const footerLinks = [
  ...portfolioLinks,
  ...secondaryLinks,
  { label: "Projects", href: "/projects" },
];
const footerLink =
  "inline-flex min-h-11 min-w-11 items-center text-sm text-[var(--df-text-soft)] hover:text-[var(--df-text)] hover:underline focus-visible:outline-offset-2";

export function DorvellFooter() {
  const { name, location, email } = dorvellManual.profile;
  const year = new Date().getFullYear();

  return (
    <footer
      id="closing-frame"
      data-studio-section="closing"
      className="border-t border-[var(--df-line)] bg-[var(--df-bg)]"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-6 pt-10 md:px-8 md:pt-14">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] md:gap-12">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/dorvell-ferguson-mark.png"
                alt=""
                width={35}
                height={35}
              />
              <div>
                <p className="font-bold text-[var(--df-text)]">{name}</p>
                <p className="text-sm text-[var(--df-text-soft)]">{location}</p>
              </div>
            </div>
            <a className={footerLink} href={`mailto:${email}`}>
              {email}
            </a>
            <SocialLinks links={getSocialLinks()} />
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-4 lg:grid-cols-3">
              {footerLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} prefetch={false} className={footerLink}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-8 border-t border-[var(--df-line)] pt-4 text-xs text-[var(--df-text-soft)]">
          © {year} {name}
        </p>
      </div>
    </footer>
  );
}
