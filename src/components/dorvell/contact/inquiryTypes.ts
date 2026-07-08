/**
 * Inquiry categories for the contact form. `helper` adapts the message-field
 * guidance to what Dorvell needs for that kind of work; `accent` maps each
 * category to a brand token so the selected pill glows on-brand.
 */
export type InquiryType = {
  id: string;
  label: string;
  helper: string;
  accent: string;
};

export const INQUIRY_TYPES = [
  {
    id: "shoot",
    label: "Book a Shoot",
    helper: "Share the look, location, timeline, and how the images will be used.",
    accent: "var(--df-teal)",
  },
  {
    id: "journalism",
    label: "Hire for Journalism",
    helper: "Tell me the publication, event, subject, deadline, and usage needs.",
    accent: "var(--df-blue)",
  },
  {
    id: "concert",
    label: "Concert / Event Coverage",
    helper: "Share the venue, artist/event name, access details, and turnaround needs.",
    accent: "var(--df-red)",
  },
  {
    id: "sports",
    label: "Sports / Athletic Coverage",
    helper: "Share the team, sport, date, location, and image usage.",
    accent: "var(--df-blue)",
  },
  {
    id: "portraits",
    label: "Portraits / Headshots",
    helper: "Share the style, location/studio needs, number of looks, and intended use.",
    accent: "var(--df-gold)",
  },
  {
    id: "fashion",
    label: "Studio / Fashion Session",
    helper: "Share moodboard, wardrobe/styling, location, and deliverable needs.",
    accent: "var(--df-teal)",
  },
  {
    id: "modeling",
    label: "Modeling / Creative Collaboration",
    helper: "Share the concept, direction, dates, and what we're building together.",
    accent: "var(--df-gold)",
  },
  {
    id: "social",
    label: "Social / Website Content",
    helper: "Share the platforms, content volume, cadence, and delivery format.",
    accent: "var(--df-teal)",
  },
  {
    id: "misc",
    label: "Miscellaneous",
    helper: "Give a quick overview and the best way to reach you.",
    accent: "var(--df-brown-hot)",
  },
] as const satisfies readonly InquiryType[];

export const DEFAULT_INQUIRY_ID = INQUIRY_TYPES[0].id;

export function getInquiryType(id: string): InquiryType {
  return INQUIRY_TYPES.find((type) => type.id === id) ?? INQUIRY_TYPES[0];
}
