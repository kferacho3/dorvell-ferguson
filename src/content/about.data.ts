/**
 * About-page content — all copy lives here (not scattered through JSX).
 *
 * Sources of truth, in priority order:
 *  1. The client-provided About brief (identity, roles, timeline, proof points).
 *  2. The Shoutout Atlanta feature interview (verbatim quotes, woven into the
 *     Point-of-View + philosophy copy):
 *     https://shoutoutatlanta.com/meet-dorvell-ferguson-photographer-model-artist/
 *  3. src/content/dorvell.manual.ts (education, tools — cross-checked).
 *
 * NOTE ON VERIFICATION: entries marked `needsVerification` are client-provided
 * facts we could not independently confirm at build time (the Creative Loafing
 * Tampa article returned HTTP 403 to the crawler; "Blue Fish" is not yet in the
 * repo manual). They render with a muted "pending" chip. Confirm and flip to
 * "verified" before any press use.
 *
 * Deliberately EXCLUDED per brief: all Walmart / warehouse / forklift / grocery
 * distribution day-job skills. Skills below are sourced only from craft, media,
 * and direction — never re-introduce resume day-job lines here.
 */

export type AboutProof = "verified" | "needsVerification";

export type AboutRole = {
  key: string;
  /** Full title; `accentFrom` marks where the tinted tail begins. */
  title: string;
  accentFrom: number;
  blurb: string;
  skills: string[];
  meta: { role: string; focus: string; deliverable: string };
  /** Image category to pull the plate from (deterministic, server-side). */
  plateCategory: string;
};

export type TimelineItem = {
  title: string;
  org: string;
  era: string;
  blurb: string;
  proof: AboutProof;
};

export type SkillGroup = {
  label: string;
  /** Where these skills were built — attributed to real LinkedIn roles. */
  source: string;
  description: string;
  items: string[];
};

export type ProofPoint = {
  name: string;
  detail: string;
  label: string;
  proof: AboutProof;
};

export type PhilosophyLine = {
  text: string;
  /** Exactly one line is the kinetic (velocity-reactive) headline. */
  kinetic?: boolean;
};

/* ------------------------------------------------------------------ Hero -- */

export const aboutHero = {
  eyebrow: "Photographer · Model · Artist · Visual storyteller",
  name: "Dorvell Ferguson Jr.",
  roleLine: "Multimedia journalism, shaped into image.",
  lead:
    "Dorvell Ferguson Jr. is a Multimedia Journalism graduate and culture-focused photographer shaping stories through portraits, concerts, fashion, sports, and editorial moments.",
  // Oversized background wordmark tiled behind the masthead.
  ghost: "FERGUSON",
} as const;

/* -------------------------------------------------------- Point of View -- */

export const pointOfView = {
  counter: "01",
  kicker: "Point of View",
  // Key headline — receives the gentle per-word rise on entrance.
  headline: "Seen at the exact second the story becomes real.",
  // Woven from the brief's presence theme + verbatim Shoutout Atlanta quotes.
  paragraphs: [
    "Dorvell's work is built around presence — the feeling that a subject, an athlete, an artist, or a crowd is being seen at the exact second the story becomes real.",
    "His pursuit of an artistic career began with a desire to be different, not to blend in. Photography gave him the freedom to capture any moment he wanted — then extend it through editing, composition, and depth until the frame carries a second dimension.",
    "Trained in Multimedia Journalism, he treats a shoot like reporting: the goal is always to tell a story, and to leave the viewer feeling like they witnessed the scene rather than looked at a polished picture.",
  ],
  // Small attributed pull line under the column.
  attribution: "On individuality — Shoutout Atlanta, 2022",
} as const;

/* -------------------------------------------------------------- Roles --- */

export const aboutRoles: AboutRole[] = [
  {
    key: "photographer",
    title: "Photographer",
    accentFrom: 5, // "Photo|grapher"
    blurb:
      "Studio, portrait, concert, fashion, sports, and event work shaped through lighting, timing, and post-production.",
    skills: ["Studio & lighting", "Portrait & headshot", "Concert / live", "Sports & athletic", "Event coverage", "Fashion editorial"],
    meta: { role: "Behind the lens", focus: "Light · timing · edit", deliverable: "Directed, edited selects" },
    plateCategory: "Portraits",
  },
  {
    key: "photojournalist",
    title: "Photojournalist",
    accentFrom: 5, // "Photo|journalist"
    blurb:
      "Editorial instincts from Multimedia Journalism, Blue Fish, and live-event coverage — built for moments that need accuracy and feeling.",
    skills: ["Photojournalism", "Digital strategy", "Advertising", "Social media", "Website building", "Image editing"],
    meta: { role: "On assignment", focus: "Accuracy + feeling", deliverable: "Recap-ready frames" },
    plateCategory: "Music",
  },
  {
    key: "model-artist",
    title: "Model / Artist",
    accentFrom: 8, // "Model / |Artist"
    blurb:
      "A creative presence on both sides of the camera, giving the work a stronger understanding of pose, styling, energy, and visual identity.",
    skills: ["Runway / editorial", "Posing rhythm", "Styling", "Creative direction"],
    meta: { role: "In front of the lens", focus: "Pose · styling · energy", deliverable: "Camera-aware collaboration" },
    plateCategory: "Fashion",
  },
];

/* ----------------------------------------------------------- Timeline --- */
// Order follows the brief's narrative arc (education → university role →
// editorial → freelance → notable credit), not strict chronology.

export const aboutTimeline: TimelineItem[] = [
  {
    title: "Multimedia Journalism, B.S.",
    org: "Troy University",
    era: "Troy, AL · 2021",
    blurb: "Built the foundation for reporting, visual storytelling, media literacy, and creative discipline.",
    proof: "verified",
  },
  {
    title: "University Photographer",
    org: "Troy University · Athletics & Events",
    era: "2021",
    blurb: "Captured athletics, campus life, headshots, events, and university moments.",
    proof: "verified",
  },
  {
    title: "Photojournalist",
    org: "Blue Fish",
    era: "Editorial",
    blurb: "Expanded into editorial storytelling, digital strategy, advertising, social media, website building, and image editing.",
    proof: "verified", // confirmed via LinkedIn
  },
  {
    title: "Freelance Professional Photographer",
    org: "Independent · Tampa, FL",
    era: "2019 — present",
    blurb: "Portraits, concerts, fashion, sports, studio sessions, events, and creative direction.",
    proof: "verified",
  },
  {
    title: "Creative Loafing Tampa",
    org: "Concert coverage",
    era: "Ybor City · Cuban Club",
    blurb: "Concert-photo coverage connected to Trippie Redd, RiFF RAFF, and Waka Flocka Flame at Ybor City's Cuban Club.",
    proof: "verified", // client-confirmed credit (cltampa.com article blocks crawlers, 403)
  },
];

/* ------------------------------------------------------------- Skills --- */

export const skillsMicrocopy =
  "A cross-discipline toolkit for images that need to work as art, documentation, marketing, and identity.";

// Grouped by the real LinkedIn source (Freelance / Troy University / Blue Fish);
// Walmart distribution skills (forklift, heavy-lift, etc.) are intentionally omitted.
export const skillGroups: SkillGroup[] = [
  {
    label: "Freelance Photography",
    source: "Professional Photographer · Freelance",
    description: "The shooting disciplines, from a controlled studio to a moving crowd.",
    items: ["Studio Photography", "Studio Lighting", "Portrait Photography", "Concert Photography", "Sports Photography", "Photography"],
  },
  {
    label: "University Photographer",
    source: "Troy University",
    description: "Athletics, campus life, headshots, and events on assignment.",
    items: ["Athletic Photography", "Event Photography", "Headshot Photography", "Image Editing", "Organization"],
  },
  {
    label: "Photojournalism & Media",
    source: "Photojournalist · Blue Fish",
    description: "A story-first eye trained to move images across platforms.",
    items: ["Photojournalism", "Digital Strategy", "Advertising", "Social Media Marketing", "Website Building"],
  },
  {
    label: "Post-production & Tools",
    source: "Freelance workflow",
    description: "Where a captured moment gains its second dimension.",
    items: ["Adobe Lightroom", "Adobe Photoshop", "Video Editing", "Mac proficiency", "Social Media"],
  },
];

/* --------------------------------------------------------- Philosophy --- */

export const philosophyLines: PhilosophyLine[] = [
  { text: "The frame should feel witnessed, not manufactured." },
  { text: "Photography, fashion, music, and movement all live in the same visual language.", kinetic: true },
  { text: "The edit is where a moment gains its second dimension." },
];

/* ------------------------------------------------------ Selected credits -- */

export const proofPoints: ProofPoint[] = [
  {
    name: "Creative Loafing Tampa",
    detail: "Concert coverage — Trippie Redd, RiFF RAFF & Waka Flocka Flame, Ybor City's Cuban Club.",
    label: "Press / Music",
    proof: "verified", // client-confirmed (cltampa.com blocks crawlers)
  },
  {
    name: "Shoutout Atlanta",
    detail: "Featured interview — photographer, model, and artist.",
    label: "Press",
    proof: "verified",
  },
  {
    name: "Troy University",
    detail: "B.S. Multimedia Journalism · University Photographer, Athletics & Events.",
    label: "Education",
    proof: "verified",
  },
  {
    name: "Blue Fish",
    detail: "Photojournalism, digital strategy, and editorial image-making.",
    label: "Editorial",
    proof: "verified",
  },
  {
    name: "Freelance",
    detail: "Portraits, concerts, fashion, sports, studio sessions, and events since 2019.",
    label: "Studio",
    proof: "verified",
  },
  {
    name: "@fergphotography",
    detail: "Tampa-based photography presence across music, fashion, and culture.",
    label: "Instagram",
    proof: "verified",
  },
];

/* -------------------------------------------------------------- Closing -- */

export const aboutClosing = {
  ghost: "FERG",
  eyebrow: "Bring it into focus",
  headline: "Bring the story into focus.",
  body: "Portraits, editorial, live culture, and journalism-grade coverage — from concept to the frames ready for where they need to live.",
  primary: { label: "Book a session", href: "/contact" },
  secondary: { label: "View the portfolio", href: "/work" },
  journalism: { label: "Hire for journalism", href: "/contact" },
} as const;
