import {
  CURATION_SCHEMA,
  type CurationState,
  type PhotoDecision,
  type UploadRecord,
} from "@/lib/curation/types";

/**
 * Small storage utility, deliberately swappable. localStorage comfortably holds
 * ~2k decision records (< 1MB); if the collection grows past that, replace the
 * adapter with IndexedDB without touching callers.
 */
export const CURATION_STORAGE_KEY = "dorvell-photo-curation/v1";

export type StorageAdapter = {
  read(): string | null;
  write(value: string): void;
  clear(): void;
};

const localStorageAdapter: StorageAdapter = {
  read() {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(CURATION_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  write(value: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CURATION_STORAGE_KEY, value);
    } catch {
      // Quota exceeded or private mode — surfaced through autosave status upstream.
      throw new Error("Local storage is unavailable or full.");
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(CURATION_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};

let adapter: StorageAdapter = localStorageAdapter;

export function setStorageAdapter(next: StorageAdapter) {
  adapter = next;
}

export function emptyCurationState(now: string): CurationState {
  return {
    schema: CURATION_SCHEMA,
    decisions: {},
    customCategories: [],
    uploads: [],
    desktopWarningDismissed: false,
    finalizedAt: null,
    updatedAt: now,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeDecision(raw: unknown): PhotoDecision | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.photo_id !== "string" || raw.photo_id.length === 0) return null;
  const destinations = isRecord(raw.destinations) ? raw.destinations : {};
  const status = raw.status === "kept" || raw.status === "scrapped" ? raw.status : "unknown";
  const decision: PhotoDecision = {
    photo_id: raw.photo_id,
    filename: typeof raw.filename === "string" ? raw.filename : raw.photo_id,
    src: typeof raw.src === "string" ? raw.src : undefined,
    relativePath: typeof raw.relativePath === "string" ? raw.relativePath : undefined,
    batch: typeof raw.batch === "string" ? raw.batch : "site",
    status,
    category_primary:
      typeof raw.category_primary === "string" && raw.category_primary.length > 0
        ? raw.category_primary
        : null,
    category_tags: Array.isArray(raw.category_tags)
      ? raw.category_tags.filter((t): t is string => typeof t === "string")
      : [],
    destinations: {
      portfolio: destinations.portfolio === true,
      modeling: destinations.modeling === true,
      projects: destinations.projects === true,
    },
    model_assigned: false,
    project_assigned: false,
    portfolio_assigned: false,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    scrap_reason:
      raw.scrap_reason === "duplicate" ||
      raw.scrap_reason === "quality" ||
      raw.scrap_reason === "not_aligned" ||
      raw.scrap_reason === "off_brand" ||
      raw.scrap_reason === "test_shot" ||
      raw.scrap_reason === "other"
        ? raw.scrap_reason
        : "",
    locked_single_assignment: raw.locked_single_assignment === true,
    reviewed_at: typeof raw.reviewed_at === "string" ? raw.reviewed_at : undefined,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
    imported_from_report: raw.imported_from_report === true,
  };
  decision.portfolio_assigned = decision.destinations.portfolio;
  decision.model_assigned = decision.destinations.modeling;
  decision.project_assigned = decision.destinations.projects;
  return decision;
}

function sanitizeUpload(raw: unknown): UploadRecord | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.photo_id !== "string" || typeof raw.filename !== "string") return null;
  return {
    photo_id: raw.photo_id,
    filename: raw.filename,
    size: typeof raw.size === "number" ? raw.size : 0,
    lastModified: typeof raw.lastModified === "number" ? raw.lastModified : 0,
    type: typeof raw.type === "string" ? raw.type : "",
    batch: typeof raw.batch === "string" ? raw.batch : "upload",
    relativePath: typeof raw.relativePath === "string" ? raw.relativePath : undefined,
    addedAt: typeof raw.addedAt === "string" ? raw.addedAt : new Date(0).toISOString(),
  };
}

/** Parses persisted state defensively — a corrupt entry never wipes the rest. */
export function parseCurationState(json: string, now: string): CurationState {
  const empty = emptyCurationState(now);
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return empty;
  }
  if (!isRecord(raw)) return empty;
  if (raw.schema !== CURATION_SCHEMA) return empty;

  const decisions: Record<string, PhotoDecision> = {};
  if (isRecord(raw.decisions)) {
    for (const value of Object.values(raw.decisions)) {
      const decision = sanitizeDecision(value);
      if (decision) decisions[decision.photo_id] = decision;
    }
  }

  return {
    schema: CURATION_SCHEMA,
    decisions,
    customCategories: Array.isArray(raw.customCategories)
      ? raw.customCategories.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
      : [],
    uploads: Array.isArray(raw.uploads)
      ? raw.uploads.map(sanitizeUpload).filter((u): u is UploadRecord => u !== null)
      : [],
    desktopWarningDismissed: raw.desktopWarningDismissed === true,
    finalizedAt: typeof raw.finalizedAt === "string" ? raw.finalizedAt : null,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

export function loadCurationState(now: string): CurationState {
  const stored = adapter.read();
  if (!stored) return emptyCurationState(now);
  return parseCurationState(stored, now);
}

export function saveCurationState(state: CurationState): void {
  adapter.write(JSON.stringify(state));
}

export function clearCurationState(): void {
  adapter.clear();
}
