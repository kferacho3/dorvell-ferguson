import type { DorvellCategory } from "./dorvell.schema";

export type ManualProofState = "verifiedByResume" | "verifiedByPortfolio" | "needsVerification";

export const dorvellManual = {
  profile: {
    name: "Dorvell Ferguson Jr.",
    location: "Tampa, Florida",
    email: "fergusondorvell2@gmail.com",
    phone: "251-623-4376",
    portfolio: "https://dorvellferguson.myportfolio.com/home-2",
    instagram: ["https://www.instagram.com/2kferg/", "https://www.instagram.com/fergphotography/"],
    tiktok: "https://www.tiktok.com/@2kferg",
    headline: "Photographer / Model / Multimedia Visual Storyteller",
    shortBio:
      "Tampa-based multimedia creative with a journalism-trained eye, a runway-aware sense of movement, and a photographer's patience for the exact frame.",
    fullBio:
      "Dorvell Ferguson Jr. is a Tampa-based multimedia creative working across photography, fashion, modeling, music culture, athletics, and social-first storytelling. A Troy University Multimedia Journalism graduate, he brings a story-first eye to portraits, live moments, runway environments, and content built to feel present instead of staged.",
  },
  education: {
    school: "Troy University",
    degree: "B.S. Multimedia Journalism",
    date: "Dec 2021",
    gpa: "3.1",
    proof: "verifiedByResume" as ManualProofState,
  },
  tools: ["Adobe Photoshop", "Adobe Lightroom", "Adobe InDesign", "Adobe Premiere", "CapCut"],
  strengths: [
    "Portrait + fashion photography",
    "Concert / live-event coverage",
    "Athletic event photography",
    "Shoot direction + visual storytelling",
    "Runway / editorial modeling",
    "Social-first content delivery",
    "Adobe photo + layout workflow",
  ],
  services: [
    {
      title: "Portrait Sessions",
      bestFor: "Model books, personal branding, graduation, artist portraits",
      deliverables: "Directed shoot, edited selects, social-ready crops",
      category: "Portraits" as DorvellCategory,
    },
    {
      title: "Fashion / Editorial",
      bestFor: "Lookbooks, designer pulls, styled campaigns, creative tests",
      deliverables: "Mood direction, posing rhythm, retouched image set",
      category: "Fashion" as DorvellCategory,
    },
    {
      title: "Concerts + Live Events",
      bestFor: "Artists, venues, campus events, culture coverage",
      deliverables: "Fast selects, atmosphere shots, recap-ready frames",
      category: "Music" as DorvellCategory,
    },
    {
      title: "Athletics Coverage",
      bestFor: "Game days, team media, university and local sports",
      deliverables: "Action frames, sideline moments, publication-ready edits",
      category: "Athletics" as DorvellCategory,
    },
    {
      title: "Creative Direction",
      bestFor: "Shoot concepts, wardrobe references, visual identity planning",
      deliverables: "Concept board, shot flow, on-set direction",
      category: "Behind The Scenes" as DorvellCategory,
    },
    {
      title: "Modeling / Runway",
      bestFor: "Runway presentations, editorial shoots, fashion content",
      deliverables: "Movement, pose work, camera-aware collaboration",
      category: "Runway" as DorvellCategory,
    },
  ],
  experience: [
    {
      role: "Freelance Photographer & Creative Director",
      org: "Independent",
      location: "Tampa, FL",
      dates: "May 2019-Present",
      proof: "verifiedByResume" as ManualProofState,
    },
    {
      role: "Signed Model - Modeling & Creative Direction",
      org: "The Mixson Method",
      location: "Jacksonville, FL",
      dates: "Dec 2025-Present",
      proof: "verifiedByResume" as ManualProofState,
    },
    {
      role: "University Event/Athletics Photography Intern",
      org: "Troy University",
      location: "Troy, AL",
      dates: "Aug 2021-Dec 2021",
      proof: "verifiedByResume" as ManualProofState,
    },
  ],
  runwayPress: [
    {
      title: "New York Fashion Week participation",
      label: "Runway",
      proof: "needsVerification" as ManualProofState,
    },
    {
      title: "Miami Men's Fashion Week / Miami Swim Week involvement",
      label: "Runway",
      proof: "needsVerification" as ManualProofState,
    },
    {
      title: "Florida Men's Fashion Week-related creative work",
      label: "Fashion",
      proof: "needsVerification" as ManualProofState,
    },
    {
      title: "Featured Interview: Shoutout Atlanta",
      label: "Press",
      year: "2022",
      proof: "needsVerification" as ManualProofState,
    },
  ],
  modelCardTodos: [
    "Current measurements available with model-card packet.",
    "Runway, editorial, and camera-movement notes available for booking teams.",
    "The Mixson Method representation wording should be confirmed before press use.",
  ],
};

export type DorvellManual = typeof dorvellManual;
export type RunwayPressEntry = (typeof dorvellManual.runwayPress)[number];
