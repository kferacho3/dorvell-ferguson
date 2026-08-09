"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FollowTheWork } from "./social/FollowTheWork";
import "@/styles/site-nav.css";

const navItems = [
  { label: "Portfolio", href: "/work" },
  { label: "Modeling", href: "/modeling" },
  { label: "Creative", href: "/creative" },
  // Hidden for now — page still exists at /projects.
  { label: "Projects", href: "/projects", hidden: true },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DorvellHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  // Direction-aware chrome: the bar condenses once you leave the top, slides
  // up while scrolling down, and returns on scroll-up. Auto-hide is off under
  // reduced-motion so the header stays pinned.
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

  const visibleItems = navItems.filter((item) => !("hidden" in item && item.hidden));

  return (
    <header className={navClassName}>
      <Link className="brand-mark" href="/" aria-label="Dorvell Ferguson Jr. home">
        <span className="brand-mark__seal">
          <Image src="/dorvell-ferguson-mark.png" alt="" width={40} height={40} priority />
        </span>
        <span className="brand-mark__copy">
          <span className="brand-mark__kicker">DF Archive</span>
          <span className="brand-mark__name">Dorvell Ferguson Jr.</span>
        </span>
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
        {visibleItems.map((item) => (
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
        {/* Follow group — full text links inside the drawer. Desktop keeps the
            top bar lean; /social lives here and in the footer. */}
        <div className="nav-follow">
          <Link className="nav-follow__hub" href="/social" onClick={() => setOpen(false)}>
            Follow the work
          </Link>
          <FollowTheWork variant="stacked" placement="nav" label="Channels" />
        </div>
      </nav>
    </header>
  );
}
