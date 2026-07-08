import type {
  CurationPhoto,
  CurationSummary,
  PhotoDecision,
  ValidationResult,
} from "@/lib/curation/types";

export function isReviewed(decision: PhotoDecision | undefined): boolean {
  return decision?.status === "kept" || decision?.status === "scrapped";
}

/** Complete = scrapped, or kept with a primary category. */
export function isComplete(decision: PhotoDecision | undefined): boolean {
  if (!decision) return false;
  if (decision.status === "scrapped") return true;
  return decision.status === "kept" && Boolean(decision.category_primary);
}

export function needsCategory(decision: PhotoDecision | undefined): boolean {
  return decision?.status === "kept" && !decision.category_primary;
}

export function summarize(
  photos: CurationPhoto[],
  decisions: Record<string, PhotoDecision>,
): CurationSummary {
  let reviewed = 0;
  let kept = 0;
  let scrapped = 0;
  let categorized = 0;
  let missingCategory = 0;
  let portfolio = 0;
  let modeling = 0;
  let projects = 0;
  let complete = 0;

  for (const photo of photos) {
    const decision = decisions[photo.photo_id];
    if (!decision) continue;
    if (decision.status === "kept") {
      reviewed += 1;
      kept += 1;
      if (decision.category_primary) {
        categorized += 1;
        complete += 1;
      } else {
        missingCategory += 1;
      }
      if (decision.destinations.portfolio) portfolio += 1;
      if (decision.destinations.modeling) modeling += 1;
      if (decision.destinations.projects) projects += 1;
    } else if (decision.status === "scrapped") {
      reviewed += 1;
      scrapped += 1;
      complete += 1;
    }
  }

  const total = photos.length;
  return {
    total,
    reviewed,
    remaining: total - reviewed,
    kept,
    scrapped,
    categorized,
    needsCategory: missingCategory,
    portfolio,
    modeling,
    projects,
    percentComplete: total === 0 ? 0 : Math.round((complete / total) * 100),
  };
}

export function validateForFinalization(
  photos: CurationPhoto[],
  decisions: Record<string, PhotoDecision>,
): ValidationResult {
  const blockers: ValidationResult["blockers"] = [];
  const unreviewed: ValidationResult["unreviewed"] = [];

  for (const photo of photos) {
    const decision = decisions[photo.photo_id];
    if (!isReviewed(decision)) {
      unreviewed.push({ photo_id: photo.photo_id, filename: photo.filename, reason: "unreviewed" });
    } else if (needsCategory(decision)) {
      blockers.push({ photo_id: photo.photo_id, filename: photo.filename, reason: "needs_category" });
    }
  }

  return {
    readyToFinalize: blockers.length === 0 && unreviewed.length === 0,
    blockers,
    unreviewed,
  };
}

export function categoryCounts(
  photos: CurationPhoto[],
  decisions: Record<string, PhotoDecision>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const photo of photos) {
    const decision = decisions[photo.photo_id];
    if (decision?.status === "kept" && decision.category_primary) {
      counts[decision.category_primary] = (counts[decision.category_primary] ?? 0) + 1;
    }
  }
  return counts;
}
