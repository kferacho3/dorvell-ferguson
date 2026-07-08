export type ReviewFilter =
  | "all"
  | "unreviewed"
  | "reviewed"
  | "kept"
  | "scrapped"
  | "needs-category"
  | "modeling"
  | "projects"
  | "portfolio";

export type StudioMode = "grid" | "focus" | "queue";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export const REVIEW_FILTER_LABELS: Record<ReviewFilter, string> = {
  all: "All",
  unreviewed: "Unreviewed",
  reviewed: "Reviewed",
  kept: "Kept",
  scrapped: "Scrapped",
  "needs-category": "Needs category",
  modeling: "In Modeling",
  projects: "In Projects",
  portfolio: "In Portfolio",
};

export type StudioToast = {
  id: number;
  tone: "info" | "success" | "warning" | "error";
  message: string;
};
