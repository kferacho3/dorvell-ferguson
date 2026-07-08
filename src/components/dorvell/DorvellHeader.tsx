"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Portfolio", href: "/work" },
  { label: "Modeling", href: "/modeling" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DorvellHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navClassName = ["site-nav", scrolled ? "is-scrolled" : "", open ? "is-open" : ""].filter(Boolean).join(" ");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={navClassName}>
      <Link className="brand-mark" href="/" aria-label="Dorvell Ferguson Jr. home">
        <Image src="/dorvell-ferguson-symbol-v2.png" alt="" width={44} height={44} priority />
        <span>Dorvell Ferguson Jr.</span>
      </Link>
      <button
        className="nav-toggle"
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="primary-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
        <span className="sr-only">Menu</span>
      </button>
      <nav id="primary-navigation" className={open ? "nav-links is-open" : "nav-links"} aria-label="Primary">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActiveRoute(pathname, item.href) ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link className="nav-cta" href="/contact" onClick={() => setOpen(false)}>
          Book
        </Link>
      </nav>
    </header>
  );
}
