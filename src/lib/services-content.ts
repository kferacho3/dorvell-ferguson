import type { DorvellCategory } from "@/content/dorvell.schema";

/**
 * Static configuration for the /services page. Everything here is serializable so
 * it can be assembled on the server (page.tsx attaches real portfolio images to
 * the orbit slots) and handed to the client `ServicesExperience` component.
 *
 * The page is a DF-skinned, near-1:1 re-creation of the "Marketeam" hero: a
 * typewriter headline, a rotating concentric-orbit visualization with a count-up
 * centre, and an infinite discipline ticker — re-tinted entirely through the
 * `--df-*` design tokens. See src/styles/services.css.
 */

/** Accent glow families available to orbit tiles — each maps to a `--df-*` token in CSS. */
export type GlowToken = "teal" | "gold" | "red" | "blue" | "rust";

/** Concentric orbit diameters (px), innermost → outermost. Tile radius = diameter / 2. */
export const ORBIT_DIAMETERS = [353, 501, 649, 797] as const;

/** Per-orbit spin: duration (s) and direction. `reverse` = counter-clockwise. */
export const ORBIT_SPINS = [
  { duration: 30, direction: "reverse" },
  { duration: 40, direction: "normal" },
  { duration: 50, direction: "normal" },
  { duration: 60, direction: "reverse" },
] as const;

export type OrbitIndex = 0 | 1 | 2 | 3;

/** A placement slot on an orbit. Images are attached server-side (see page.tsx). */
export interface OrbitSlot {
  id: string;
  orbit: OrbitIndex;
  /** Angle around the orbit, degrees (0 = right, 90 = bottom). */
  angle: number;
  /** Rendered tile size, px. */
  size: number;
  shape: "round" | "square";
  /** Corner radius (px) for square tiles. */
  cornerRadius?: number;
  glow: GlowToken;
  /** "video" tiles render the DF reel; "photo" tiles render a portfolio frame. */
  kind: "photo" | "video";
  /** Preferred portfolio category for the attached photo (falls back gracefully). */
  category?: DorvellCategory;
  /** Fly-in animation delay, seconds. */
  flyDelay: number;
}

/**
 * The nine orbit placements — geometry mirrors the reference exactly (angles,
 * radii, sizes, shapes), while glows are re-tinted to DF's accent tokens. One
 * outer tile is the looping DF reel.
 */
export const ORBIT_SLOTS: readonly OrbitSlot[] = [
  { id: "o1-portraits", orbit: 0, angle: 270, size: 58, shape: "square", cornerRadius: 20, glow: "teal", kind: "photo", category: "Portraits", flyDelay: 0.6 },
  { id: "o2-fashion", orbit: 1, angle: 60, size: 58, shape: "round", glow: "gold", kind: "photo", category: "Fashion", flyDelay: 0.8 },
  { id: "o2-music", orbit: 1, angle: 180, size: 78, shape: "round", glow: "red", kind: "photo", category: "Music", flyDelay: 1.0 },
  { id: "o2-athletics", orbit: 1, angle: 300, size: 58, shape: "square", cornerRadius: 20, glow: "blue", kind: "photo", category: "Athletics", flyDelay: 1.2 },
  { id: "o3-runway", orbit: 2, angle: 130, size: 88, shape: "round", glow: "red", kind: "photo", category: "Runway", flyDelay: 1.4 },
  { id: "o4-studio", orbit: 3, angle: 30, size: 58, shape: "round", glow: "teal", kind: "photo", category: "Studio", flyDelay: 1.6 },
  { id: "o4-reel", orbit: 3, angle: 95, size: 96, shape: "square", cornerRadius: 24, glow: "rust", kind: "video", flyDelay: 1.85 },
  { id: "o4-events", orbit: 3, angle: 220, size: 88, shape: "square", cornerRadius: 24, glow: "red", kind: "photo", category: "Events", flyDelay: 2.1 },
  { id: "o4-headshots", orbit: 3, angle: 320, size: 58, shape: "round", glow: "teal", kind: "photo", category: "Headshots", flyDelay: 2.3 },
] as const;

/** A resolved orbit tile ready to render (photo slots carry an image). */
export interface OrbitTile extends OrbitSlot {
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    blurDataURL?: string;
  };
}

/** Paths to the compressed DF reel (transcoded from the source .mov). */
export const REEL = {
  mp4: "/dorvell/media/dorvell-reel.mp4",
  webm: "/dorvell/media/dorvell-reel.webm",
  poster: "/dorvell/media/dorvell-reel.jpg",
} as const;

// ── Hero copy ────────────────────────────────────────────────────────────────

/** Headline split into a lead (cream) and an accent tail (teal gradient). */
export const HERO_HEADING = {
  lead: "Every frame you need — one photographer, ",
  accent: "booked in one click.",
} as const;

export const HERO_SUBHEAD =
  "Portraits, fashion, live music, athletics, runway and creative direction — a journalism-trained eye on both sides of the camera, in Tampa and on location.";

// ── Intro flash ──────────────────────────────────────────────────────────────

/** Kinetic phrases cycled during the intro montage before the page reveals. */
export const INTRO_PHRASES = [
  "Need photos?",
  "Need a moment framed?",
  "Need a look that lands?",
  "Need it shot right?",
] as const;

export const INTRO_RESOLVE = "Let's build the shot.";

// ── Discipline ticker ────────────────────────────────────────────────────────

export const DISCIPLINES = [
  "Portraits",
  "Fashion",
  "Music & Live",
  "Athletics",
  "Runway",
  "Editorial",
  "Events",
  "Creative Direction",
] as const;

// ── Centre count-up stat ─────────────────────────────────────────────────────

export const CENTER_STAT = {
  /** Count-up target; rendered as `${value}${suffix}`. */
  target: 5,
  suffix: "k+",
  label: "Frames delivered",
} as const;

// ── Pricing ──────────────────────────────────────────────────────────────────

export const PRICING = {
  /** Flat rate for the first hour. */
  base: 75,
  /** Added for every hour beyond the first. */
  hourlyAddon: 50,
  minHours: 1,
  maxHours: 8,
} as const;

/** Session total for a given number of hours: base + addon × (hours − 1). */
export function sessionTotal(hours: number): number {
  const clamped = Math.min(Math.max(Math.round(hours), PRICING.minHours), PRICING.maxHours);
  return PRICING.base + PRICING.hourlyAddon * (clamped - 1);
}

/**
 * Build a `mailto:` link that opens the visitor's default mail client with the
 * booking brief pre-filled (session length, estimate, and prompts to complete).
 */
export function buildBookingMailto(email: string, hours: number, serviceTitle?: string): string {
  const total = sessionTotal(hours);
  const hourLabel = hours === 1 ? "1 hour" : `${hours} hours`;
  const focus = serviceTitle ? `${serviceTitle} — ` : "";
  const subject = `${focus}Booking inquiry (${hourLabel} · $${total} est.)`;
  const body = [
    `Hi Dorvell,`,
    ``,
    `I'd like to book a session.`,
    ``,
    `• Session length: ${hourLabel}`,
    `• Estimated rate: $${total} ($${PRICING.base} first hour + $${PRICING.hourlyAddon}/additional hour)`,
    serviceTitle ? `• Focus: ${serviceTitle}` : `• Focus: (portraits / fashion / event / other)`,
    `• Date & time: `,
    `• Location: `,
    `• What we're shooting: `,
    ``,
    `Thanks!`,
  ].join("\n");
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
