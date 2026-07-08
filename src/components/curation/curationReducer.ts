import {
  emptyDecision,
  syncDestinationMirrors,
  type CurationPhoto,
  type CurationState,
  type PhotoDecision,
  type ScrapReason,
  type UploadRecord,
} from "@/lib/curation/types";

export type DestinationKey = "portfolio" | "modeling" | "projects";

export type CurationAction =
  | { type: "hydrate"; state: CurationState }
  | { type: "keep"; ids: string[]; now: string }
  | { type: "scrap"; ids: string[]; now: string }
  | { type: "reset-status"; ids: string[]; now: string }
  | { type: "set-category"; ids: string[]; category: string | null; now: string }
  | { type: "add-tag"; ids: string[]; tag: string; now: string }
  | { type: "remove-tag"; ids: string[]; tag: string; now: string }
  | { type: "set-notes"; id: string; notes: string; now: string }
  | { type: "set-scrap-reason"; id: string; reason: ScrapReason; now: string }
  | { type: "set-destination"; ids: string[]; destination: DestinationKey; value: boolean; now: string }
  | { type: "toggle-lock"; id: string; now: string }
  | { type: "add-custom-category"; name: string; now: string }
  | { type: "remove-custom-category"; name: string; now: string }
  | { type: "register-uploads"; records: UploadRecord[]; now: string }
  | { type: "dismiss-desktop-warning"; now: string }
  | { type: "restore-desktop-warning"; now: string }
  | { type: "finalize"; now: string }
  | { type: "unfinalize"; now: string }
  | { type: "clear-all"; empty: CurationState };

export type ReducerEnv = {
  photoById: Map<string, CurationPhoto>;
};

export const DESTINATION_DEFAULT_CATEGORY: Record<DestinationKey, string | null> = {
  portfolio: null,
  modeling: "Modeling",
  projects: "College Project",
};

function decisionFor(
  state: CurationState,
  env: ReducerEnv,
  id: string,
  now: string,
): PhotoDecision | null {
  const existing = state.decisions[id];
  if (existing) return existing;
  const photo = env.photoById.get(id);
  if (!photo) return null;
  return emptyDecision(photo, now);
}

function withDecisions(
  state: CurationState,
  next: Record<string, PhotoDecision>,
  now: string,
): CurationState {
  return { ...state, decisions: next, updatedAt: now, finalizedAt: null };
}

function applyToIds(
  state: CurationState,
  env: ReducerEnv,
  ids: string[],
  now: string,
  mutate: (decision: PhotoDecision) => PhotoDecision,
): CurationState {
  if (ids.length === 0) return state;
  const next = { ...state.decisions };
  let changed = false;
  for (const id of ids) {
    const base = decisionFor(state, env, id, now);
    if (!base) continue;
    const mutated = syncDestinationMirrors({ ...mutate({ ...base }), updated_at: now });
    next[id] = mutated;
    changed = true;
  }
  return changed ? withDecisions(state, next, now) : state;
}

export function createCurationReducer(env: ReducerEnv) {
  return function curationReducer(state: CurationState, action: CurationAction): CurationState {
    switch (action.type) {
      case "hydrate":
        return action.state;

      case "keep":
        return applyToIds(state, env, action.ids, action.now, (d) => ({
          ...d,
          status: "kept",
          scrap_reason: "",
          reviewed_at: action.now,
        }));

      case "scrap":
        // Scrapped photos are never public — clear their destinations.
        return applyToIds(state, env, action.ids, action.now, (d) => ({
          ...d,
          status: "scrapped",
          destinations: { portfolio: false, modeling: false, projects: false },
          reviewed_at: action.now,
        }));

      case "reset-status":
        return applyToIds(state, env, action.ids, action.now, (d) => ({
          ...d,
          status: "unknown",
          scrap_reason: "",
          reviewed_at: undefined,
        }));

      case "set-category":
        return applyToIds(state, env, action.ids, action.now, (d) => ({
          ...d,
          category_primary: action.category,
          // Choosing a category is a keep signal for unreviewed photos.
          status: action.category && d.status === "unknown" ? "kept" : d.status,
          reviewed_at:
            action.category && d.status === "unknown" ? action.now : d.reviewed_at,
        }));

      case "add-tag": {
        const tag = action.tag.trim();
        if (!tag) return state;
        return applyToIds(state, env, action.ids, action.now, (d) => ({
          ...d,
          category_tags: d.category_tags.includes(tag)
            ? d.category_tags
            : [...d.category_tags, tag],
        }));
      }

      case "remove-tag":
        return applyToIds(state, env, action.ids, action.now, (d) => ({
          ...d,
          category_tags: d.category_tags.filter((t) => t !== action.tag),
        }));

      case "set-notes":
        return applyToIds(state, env, [action.id], action.now, (d) => ({
          ...d,
          notes: action.notes,
        }));

      case "set-scrap-reason":
        return applyToIds(state, env, [action.id], action.now, (d) => ({
          ...d,
          scrap_reason: action.reason,
        }));

      case "set-destination": {
        if (action.value) {
          return applyToIds(state, env, action.ids, action.now, (d) => {
            const destinations = d.locked_single_assignment
              ? { portfolio: false, modeling: false, projects: false, [action.destination]: true }
              : { ...d.destinations, [action.destination]: true };
            return {
              ...d,
              destinations,
              // Destinations are public-facing: assigning one keeps the photo.
              status: "kept",
              scrap_reason: "",
              category_primary:
                d.category_primary ?? DESTINATION_DEFAULT_CATEGORY[action.destination],
              reviewed_at: d.reviewed_at ?? action.now,
            };
          });
        }
        return applyToIds(state, env, action.ids, action.now, (d) => ({
          ...d,
          destinations: { ...d.destinations, [action.destination]: false },
        }));
      }

      case "toggle-lock":
        return applyToIds(state, env, [action.id], action.now, (d) => ({
          ...d,
          locked_single_assignment: !d.locked_single_assignment,
        }));

      case "add-custom-category": {
        const name = action.name.trim();
        if (!name || state.customCategories.includes(name)) return state;
        return {
          ...state,
          customCategories: [...state.customCategories, name],
          updatedAt: action.now,
        };
      }

      case "remove-custom-category":
        return {
          ...state,
          customCategories: state.customCategories.filter((c) => c !== action.name),
          updatedAt: action.now,
        };

      case "register-uploads": {
        if (action.records.length === 0) return state;
        const known = new Set(state.uploads.map((u) => u.photo_id));
        const fresh: UploadRecord[] = [];
        for (const record of action.records) {
          if (known.has(record.photo_id)) continue;
          known.add(record.photo_id);
          fresh.push(record);
        }
        if (fresh.length === 0) return { ...state, updatedAt: action.now };
        // New unreviewed photos invalidate a prior finalization.
        return {
          ...state,
          uploads: [...state.uploads, ...fresh],
          finalizedAt: null,
          updatedAt: action.now,
        };
      }

      case "dismiss-desktop-warning":
        return { ...state, desktopWarningDismissed: true, updatedAt: action.now };

      case "restore-desktop-warning":
        return { ...state, desktopWarningDismissed: false, updatedAt: action.now };

      case "finalize":
        return { ...state, finalizedAt: action.now, updatedAt: action.now };

      case "unfinalize":
        return { ...state, finalizedAt: null, updatedAt: action.now };

      case "clear-all":
        return action.empty;

      default:
        return state;
    }
  };
}
