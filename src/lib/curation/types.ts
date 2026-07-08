export const CURATION_SCHEMA = "dorvell-photo-curation-report/v1" as const;

export type PhotoStatus = "unknown" | "kept" | "scrapped";

export type ScrapReason =
  | "duplicate"
  | "quality"
  | "not_aligned"
  | "off_brand"
  | "test_shot"
  | "other"
  | "";

export type PhotoDestination = {
  portfolio: boolean;
  modeling: boolean;
  projects: boolean;
};

export type PhotoDecision = {
  photo_id: string;
  filename: string;
  src?: string;
  relativePath?: string;
  batch: string;
  status: PhotoStatus;
  category_primary: string | null;
  category_tags: string[];
  destinations: PhotoDestination;
  model_assigned: boolean;
  project_assigned: boolean;
  portfolio_assigned: boolean;
  notes: string;
  scrap_reason?: ScrapReason;
  locked_single_assignment?: boolean;
  reviewed_at?: string;
  updated_at: string;
  imported_from_report?: boolean;
};

/** A reviewable photo surfaced in the studio — from the site manifest or a browser upload. */
export type CurationPhoto = {
  photo_id: string;
  filename: string;
  /** Preview source: optimized md for site photos, object URL for uploads. */
  src: string;
  /** Small thumbnail source for dense grids. */
  thumb: string;
  /** Largest available source for focus review. */
  full: string;
  blur?: string;
  width: number;
  height: number;
  aspectRatio: number;
  batch: string;
  relativePath?: string;
  /** Category hint carried over from the original scrape/site data. */
  scrapedCategory?: string;
  alt: string;
  source: "site" | "upload";
  /** Upload previews are object URLs and vanish on reload until re-uploaded. */
  previewDisconnected?: boolean;
};

/** Metadata persisted for browser uploads so decisions survive reloads without file data. */
export type UploadRecord = {
  photo_id: string;
  filename: string;
  size: number;
  lastModified: number;
  type: string;
  batch: string;
  relativePath?: string;
  addedAt: string;
};

export type CurationState = {
  schema: typeof CURATION_SCHEMA;
  decisions: Record<string, PhotoDecision>;
  customCategories: string[];
  uploads: UploadRecord[];
  desktopWarningDismissed: boolean;
  finalizedAt: string | null;
  updatedAt: string;
};

export type CurationSummary = {
  total: number;
  reviewed: number;
  remaining: number;
  kept: number;
  scrapped: number;
  categorized: number;
  needsCategory: number;
  portfolio: number;
  modeling: number;
  projects: number;
  percentComplete: number;
};

export type ValidationIssue = {
  photo_id: string;
  filename: string;
  reason: "needs_category" | "unreviewed";
};

export type ValidationResult = {
  readyToFinalize: boolean;
  /** Kept photos missing a primary category — hard blockers. */
  blockers: ValidationIssue[];
  /** Unreviewed photos — block “complete finalization” only. */
  unreviewed: ValidationIssue[];
};

export type ImportSummaryResult = {
  ok: boolean;
  error?: string;
  errorHint?: string;
  totalInReport: number;
  restored: number;
  matchedById: number;
  matchedByFilename: number;
  missingFromCurrent: string[];
  newSinceReport: string[];
  conflicts: string[];
  validationIssues: string[];
};

export const SCRAP_REASONS: { value: ScrapReason; label: string }[] = [
  { value: "duplicate", label: "Duplicate" },
  { value: "quality", label: "Quality" },
  { value: "not_aligned", label: "Not aligned" },
  { value: "off_brand", label: "Off-brand" },
  { value: "test_shot", label: "Test shot" },
  { value: "other", label: "Other" },
];

/**
 * Default categories. The first block is the required baseline set; the second
 * mirrors the categories already present in Dorvell's scraped collection so
 * existing work maps cleanly. Defaults are always visible and cannot be deleted.
 */
export const DEFAULT_CATEGORIES = [
  "Portrait",
  "Editorial",
  "Travel",
  "Event",
  "Street",
  "Landscape",
  "Product",
  "Lifestyle",
  "Behind-the-Scenes",
  "College Project",
  "Modeling",
  "Fashion",
  "Music",
  "Athletics",
  "Graphic Design",
  "Runway",
] as const;

/** Maps legacy scraped categories onto curation defaults for one-tap suggestions. */
export const SCRAPED_CATEGORY_MAP: Record<string, string> = {
  Portraits: "Portrait",
  Fashion: "Fashion",
  Music: "Music",
  Events: "Event",
  Athletics: "Athletics",
  "Graphic Design": "Graphic Design",
  Modeling: "Modeling",
  Runway: "Runway",
  "Behind The Scenes": "Behind-the-Scenes",
  Uncategorized: "",
};

export function emptyDecision(photo: CurationPhoto, now: string): PhotoDecision {
  return {
    photo_id: photo.photo_id,
    filename: photo.filename,
    src: photo.source === "site" ? photo.src : undefined,
    relativePath: photo.relativePath,
    batch: photo.batch,
    status: "unknown",
    category_primary: null,
    category_tags: [],
    destinations: { portfolio: false, modeling: false, projects: false },
    model_assigned: false,
    project_assigned: false,
    portfolio_assigned: false,
    notes: "",
    scrap_reason: "",
    updated_at: now,
  };
}

/** Keeps the flat *_assigned mirrors in sync with `destinations` so export tables stay simple. */
export function syncDestinationMirrors(decision: PhotoDecision): PhotoDecision {
  return {
    ...decision,
    portfolio_assigned: decision.destinations.portfolio,
    model_assigned: decision.destinations.modeling,
    project_assigned: decision.destinations.projects,
  };
}
