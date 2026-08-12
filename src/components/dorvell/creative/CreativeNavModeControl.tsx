"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import {
  CREATIVE_MODES,
  dockCreativeModeSwitch,
  isCreativeModeDocked,
  subscribeCreativeModeDock,
  useCreativeMode,
  type CreativeMode,
} from "./creativeMode";

/**
 * Creative Worlds mode control for the site chrome.
 * Desktop: lives in the navbar center until a mode is chosen, then docks to a
 * corner chip so it stops competing with the page. Mobile: corner from the start.
 */
export function CreativeNavModeControl() {
  const { mode, setMode } = useCreativeMode();
  const docked = useSyncExternalStore(
    subscribeCreativeModeDock,
    isCreativeModeDocked,
    () => true,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const onSelect = (next: CreativeMode) => {
    setMode(next);
    dockCreativeModeSwitch();
    setMenuOpen(false);
  };

  const active = CREATIVE_MODES.find((option) => option.key === mode) ?? CREATIVE_MODES[0];
  const showNavCenter = !docked && !isMobile;

  if (showNavCenter) {
    return (
      <div className="site-nav__mode site-nav__mode--center" role="group" aria-label="Creative experience mode">
        <span className="site-nav__mode-kicker">Mode</span>
        <div className="site-nav__mode-switch">
          {CREATIVE_MODES.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={mode === option.key}
              className={cn("site-nav__mode-btn", mode === option.key && "is-active")}
              onClick={() => onSelect(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return createPortal(
    <div
      ref={rootRef}
      className={cn("site-nav__mode site-nav__mode--corner", menuOpen && "is-open")}
    >
      <button
        type="button"
        className="site-nav__mode-chip"
        aria-haspopup="true"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onClick={() => setMenuOpen((value) => !value)}
      >
        <span className="site-nav__mode-chip-kicker">Mode</span>
        <strong>{active.label}</strong>
      </button>
      {menuOpen ? (
        <div id={menuId} className="site-nav__mode-menu" role="group" aria-label="Creative experience mode">
          {CREATIVE_MODES.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={mode === option.key}
              className={cn("site-nav__mode-menu-btn", mode === option.key && "is-active")}
              onClick={() => onSelect(option.key)}
            >
              <strong>{option.label}</strong>
              <small>{option.tagline}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
