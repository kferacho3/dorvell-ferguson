"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Portfolio", href: "/work" },
  { label: "Modeling", href: "/modeling" },
  { label: "Creative", href: "/creative" },
  { label: "Projects", href: "/projects" },
  { label: "Services", href: "/services" },
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
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  // Direction-aware chrome: the bar condenses to solid glass once you leave the
  // top, slides up out of the way while scrolling down, and snaps back the
  // instant you scroll up. Auto-hide is suppressed under reduced-motion so the
  // header simply stays pinned.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (!reduceMotion) {
        const delta = y - lastY;
        if (delta > 4 && y > 120) setHidden(true);
        else if (delta < -4) setHidden(false);
      }
      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navClassName = [
    "site-nav",
    scrolled ? "is-scrolled" : "",
    open ? "is-open" : "",
    hidden && !open ? "is-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={navClassName}>
      <Link className="brand-mark" href="/" aria-label="Dorvell Ferguson Jr. home">
        <Image src="/dorvell-ferguson-symbol-v2.png" alt="" width={34} height={34} priority />
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
