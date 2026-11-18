"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { portfolioLinks, secondaryLinks } from "@/lib/site-navigation";

type NavigationLink = (typeof portfolioLinks | typeof secondaryLinks)[number];

const keyboardFocus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--df-teal)]";
const navigationLink =
  "flex min-w-11 items-center text-[var(--df-text-soft)] hover:text-[var(--df-text)] aria-[current]:text-[var(--df-text)]";

function currentLink(pathname: string, href: NavigationLink["href"]) {
  if (pathname === href) return "page";
  if (
    href === "/work" &&
    (pathname === "/work/portraits" || pathname.startsWith("/work/portraits/"))
  ) {
    return undefined;
  }
  return pathname.startsWith(`${href}/`) ? "location" : undefined;
}

export function DorvellHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };

    const dismissOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", dismissOnEscape);
    document.addEventListener("pointerdown", dismissOutside);
    return () => {
      document.removeEventListener("keydown", dismissOnEscape);
      document.removeEventListener("pointerdown", dismissOutside);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-[80] border-b border-[var(--df-line)] bg-[var(--df-bg)] pt-[env(safe-area-inset-top)]">
      <div className="relative mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 md:flex md:min-h-16 md:gap-5 md:px-8 xl:gap-8">
        <Link
          href="/"
          aria-label="Dorvell Ferguson Jr. home"
          aria-current={pathname === "/" ? "page" : undefined}
          className={cn(
            "inline-flex min-h-12 min-w-0 items-center justify-self-start gap-2.5 text-sm font-bold text-[var(--df-text)] md:shrink-0",
            keyboardFocus,
          )}
        >
          <Image
            src="/dorvell-ferguson-mark.png"
            alt=""
            width={30}
            height={30}
            className="shrink-0"
          />
          <span>Dorvell Ferguson Jr.</span>
        </Link>

        <div
          className="md:ml-auto xl:hidden"
          ref={menuRef}
          onBlur={(event) => {
            if (
              event.relatedTarget &&
              !event.currentTarget.contains(event.relatedTarget)
            ) {
              setOpen(false);
            }
          }}
        >
          <button
            type="button"
            ref={triggerRef}
            aria-expanded={open}
            aria-controls="secondary-navigation"
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-[var(--df-text-soft)] hover:text-[var(--df-text)] aria-expanded:text-[var(--df-text)]",
              keyboardFocus,
            )}
          >
            Menu
            <span
              aria-hidden="true"
              className="size-2 -translate-y-0.5 rotate-45 border-b border-r border-current"
            />
          </button>

          <nav
            id="secondary-navigation"
            aria-label="More pages"
            hidden={!open}
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-6.125rem-env(safe-area-inset-top,0px))] overflow-y-auto overscroll-contain border border-[var(--df-line)] bg-[var(--df-bg)] px-4 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 md:left-auto md:right-8 md:w-60 md:max-h-[calc(100dvh-4.0625rem-env(safe-area-inset-top,0px))]"
          >
            <ul className="divide-y divide-[var(--df-line)]">
              {secondaryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={link.href === "/work" ? false : undefined}
                    aria-current={currentLink(pathname, link.href)}
                    onClick={() => {
                      setOpen(false);
                      if (pathname === link.href) triggerRef.current?.focus();
                    }}
                    className={cn(
                      navigationLink,
                      "min-h-11 px-2 text-sm font-medium aria-[current]:underline aria-[current]:underline-offset-4",
                      keyboardFocus,
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <nav
          aria-label="Portfolio"
          className="col-span-2 -mx-4 border-t border-[var(--df-line)] px-4 md:mx-0 md:border-0 md:px-0 xl:ml-auto"
        >
          <ul className="grid grid-cols-3 gap-1 md:flex md:items-center md:gap-2">
            {portfolioLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  aria-current={currentLink(pathname, link.href)}
                  className={cn(
                    navigationLink,
                    "min-h-12 justify-center border-b-2 border-transparent px-1 text-sm font-semibold hover:border-[var(--df-line-strong)] aria-[current]:border-[var(--df-teal)] md:px-3",
                    keyboardFocus,
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav
          aria-label="More pages"
          className="hidden border-l border-[var(--df-line)] pl-6 xl:block"
        >
          <ul className="flex items-center gap-4 text-sm font-medium">
            {secondaryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={link.href === "/work" ? false : undefined}
                  aria-current={currentLink(pathname, link.href)}
                  className={cn(
                    navigationLink,
                    "min-h-11 whitespace-nowrap aria-[current]:underline aria-[current]:underline-offset-4",
                    link.href === "/contact" &&
                      "border border-[var(--df-line-strong)] px-4 text-[var(--df-text)] hover:border-[var(--df-text)]",
                    keyboardFocus,
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
