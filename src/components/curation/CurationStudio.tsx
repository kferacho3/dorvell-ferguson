"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_CATEGORIES,
  type CurationPhoto,
  type ImportSummaryResult,
  type ScrapReason,
  type UploadRecord,
} from "@/lib/curation/types";
import {
  clearCurationState,
  emptyCurationState,
  loadCurationState,
  saveCurationState,
} from "@/lib/curation/storage";
import { exportMarkdownReport, downloadTextFile } from "@/lib/curation/exportMarkdown";
import { exportPdfReport } from "@/lib/curation/exportPdf";
import { importMarkdownReport } from "@/lib/curation/importMarkdown";
import { summarize, validateForFinalization } from "@/lib/curation/validation";
import { uploadManifestEntry, uploadPhotoId } from "@/lib/curation/manifest";
import {
  createCurationReducer,
  type CurationAction,
  type DestinationKey,
  type ReducerEnv,
} from "@/components/curation/curationReducer";
import type { ReviewFilter, SaveStatus, StudioMode, StudioToast } from "@/components/curation/studioTypes";
import { CurationToolbar } from "@/components/curation/CurationToolbar";
import { FocusReview } from "@/components/curation/FocusReview";
import { ImportSummary } from "@/components/curation/ImportSummary";
import { StudioModal } from "@/components/curation/StudioModal";
import { InstructionsPanel } from "@/components/curation/InstructionsPanel";
import { PhotoReviewCard } from "@/components/curation/PhotoReviewCard";
import { ProgressPanel } from "@/components/curation/ProgressPanel";
import { QueueView } from "@/components/curation/QueueView";
import { UploadPanel } from "@/components/curation/UploadPanel";

const CHUNK = 60;
const UNLOCK_KEY = "df-studio-unlocked";

const DESTINATION_LABEL: Record<DestinationKey, string> = {
  portfolio: "PORTFOLIO",
  modeling: "MODELING",
  projects: "PROJECTS",
};

type CurationStudioProps = {
  sitePhotos: CurationPhoto[];
};

export function CurationStudio({ sitePhotos }: CurationStudioProps) {
  // ----- reducer with a mutable env so lazily-created decisions can see uploads
  const [{ photoLookup, reducer }] = useState(() => {
    const lookup: ReducerEnv["photoById"] = new Map();
    return { photoLookup: lookup, reducer: createCurationReducer({ photoById: lookup }) };
  });
  const [state, dispatch] = useReducer(reducer, undefined, () => emptyCurationState(new Date(0).toISOString()));

  const [hydrated, setHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [needsPasscode, setNeedsPasscode] = useState(false);
  const [passcodeDraft, setPasscodeDraft] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  const [mode, setMode] = useState<StudioMode>("grid");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<ReadonlySet<string>>(new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(CHUNK);
  const [saveMark, setSaveMark] = useState<{ updatedAt: string | null; at: string | null; error: boolean }>({
    updatedAt: null,
    at: null,
    error: false,
  });
  const [toasts, setToasts] = useState<StudioToast[]>([]);
  const [importResult, setImportResult] = useState<ImportSummaryResult | null>(null);
  const [showFinalize, setShowFinalize] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [urlVersion, bumpObjectUrls] = useState(0);

  // Stable Map held in state (not a ref) so render-time reads are legal;
  // mutations bump urlVersion, which downstream memos depend on.
  const [objectUrls] = useState(() => new Map<string, string>());
  const toastId = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const pushToast = useCallback((message: string, tone: StudioToast["tone"] = "info") => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((prev) => [...prev.slice(-3), { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5200);
  }, []);

  // ----- hydrate persisted state + passcode gate
  /* eslint-disable react-hooks/set-state-in-effect -- one-shot mount hydration: localStorage/sessionStorage are only readable client-side, after first paint */
  useEffect(() => {
    const now = new Date().toISOString();
    dispatch({ type: "hydrate", state: loadCurationState(now) });
    const passcode = process.env.NEXT_PUBLIC_STUDIO_PASSCODE;
    if (passcode && window.sessionStorage.getItem(UNLOCK_KEY) !== "1") {
      setNeedsPasscode(true);
    } else {
      setUnlocked(true);
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ----- debounced autosave (status is derived, never set synchronously in the effect)
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      try {
        saveCurationState(state);
        setSaveMark({ updatedAt: state.updatedAt, at: new Date().toISOString(), error: false });
      } catch {
        setSaveMark((mark) => ({ ...mark, error: true }));
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [state, hydrated]);

  const saveNow = useCallback(() => {
    try {
      saveCurationState(state);
      setSaveMark({ updatedAt: state.updatedAt, at: new Date().toISOString(), error: false });
    } catch {
      setSaveMark((mark) => ({ ...mark, error: true }));
    }
  }, [state]);

  const saveStatus: SaveStatus = saveMark.error
    ? "error"
    : !hydrated || state.updatedAt === saveMark.updatedAt
      ? "saved"
      : "unsaved";
  const lastSavedAt = saveMark.at;

  // ----- revoke object URLs on unmount
  useEffect(() => {
    return () => {
      for (const url of objectUrls.values()) URL.revokeObjectURL(url);
      objectUrls.clear();
    };
  }, [objectUrls]);

  // ----- flush pending autosave on tab close / navigation / unmount so the
  // last <600ms of decisions are never lost to the debounce window.
  const latestState = useRef<{ hydrated: boolean; state: typeof state }>({ hydrated: false, state });
  useEffect(() => {
    latestState.current = { hydrated, state };
  }, [state, hydrated]);
  useEffect(() => {
    const flush = () => {
      // Never write the pre-hydration empty state over real saved progress.
      if (!latestState.current.hydrated) return;
      try {
        saveCurationState(latestState.current.state);
      } catch {
        // Nothing else we can do mid-unload; the debounced path surfaces errors.
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  // ----- manifest: site photos + uploads (urlVersion invalidates after reconnects)
  const allPhotos = useMemo(() => {
    void urlVersion;
    const uploads = state.uploads.map((record) =>
      uploadManifestEntry(record, objectUrls.get(record.photo_id) ?? null),
    );
    return [...sitePhotos, ...uploads];
  }, [sitePhotos, state.uploads, objectUrls, urlVersion]);

  // Keep the reducer's lookup in sync — contents of a stable Map, refreshed after render.
  useEffect(() => {
    photoLookup.clear();
    for (const photo of allPhotos) photoLookup.set(photo.photo_id, photo);
  }, [photoLookup, allPhotos]);

  const categories = useMemo(
    () => [...DEFAULT_CATEGORIES, ...state.customCategories],
    [state.customCategories],
  );

  const batches = useMemo(() => {
    const set = new Set<string>(["site"]);
    for (const upload of state.uploads) set.add(upload.batch);
    return Array.from(set);
  }, [state.uploads]);

  // ----- filtering
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allPhotos.filter((photo) => {
      const decision = state.decisions[photo.photo_id];
      switch (reviewFilter) {
        case "unreviewed":
          if (decision && decision.status !== "unknown") return false;
          break;
        case "reviewed":
          if (!decision || decision.status === "unknown") return false;
          break;
        case "kept":
          if (decision?.status !== "kept") return false;
          break;
        case "scrapped":
          if (decision?.status !== "scrapped") return false;
          break;
        case "needs-category":
          if (!(decision?.status === "kept" && !decision.category_primary)) return false;
          break;
        case "modeling":
          if (!decision?.destinations.modeling) return false;
          break;
        case "projects":
          if (!decision?.destinations.projects) return false;
          break;
        case "portfolio":
          if (!decision?.destinations.portfolio) return false;
          break;
        default:
          break;
      }
      if (categoryFilter && decision?.category_primary !== categoryFilter) return false;
      if (batchFilter && photo.batch !== batchFilter) return false;
      if (query) {
        const haystack = `${photo.filename} ${decision?.notes ?? ""} ${(decision?.category_tags ?? []).join(" ")} ${photo.scrapedCategory ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [allPhotos, state.decisions, reviewFilter, categoryFilter, batchFilter, search]);

  // Reset grid chunking whenever the filter context changes (adjust-during-render).
  const filterKey = `${reviewFilter}|${categoryFilter}|${batchFilter}|${search}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(CHUNK);
  }

  // ----- chunked grid growth
  useEffect(() => {
    if (mode !== "grid") return;
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= filtered.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + CHUNK, filtered.length));
        }
      },
      { rootMargin: "1200px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [mode, visibleCount, filtered.length]);

  const summary = useMemo(() => summarize(allPhotos, state.decisions), [allPhotos, state.decisions]);
  const validation = useMemo(
    () => validateForFinalization(allPhotos, state.decisions),
    [allPhotos, state.decisions],
  );

  // ----- action helpers
  const act = useCallback((action: CurationAction) => dispatch(action), []);
  const now = () => new Date().toISOString();

  const handleKeep = useCallback((id: string) => act({ type: "keep", ids: [id], now: now() }), [act]);
  const handleScrap = useCallback((id: string) => act({ type: "scrap", ids: [id], now: now() }), [act]);
  const handleSetCategory = useCallback(
    (id: string, category: string | null) => act({ type: "set-category", ids: [id], category, now: now() }),
    [act],
  );
  const handleScrapReason = useCallback(
    (id: string, reason: ScrapReason) => act({ type: "set-scrap-reason", id, reason, now: now() }),
    [act],
  );
  const handleAddTag = useCallback(
    (id: string, tag: string) => act({ type: "add-tag", ids: [id], tag, now: now() }),
    [act],
  );
  const handleRemoveTag = useCallback(
    (id: string, tag: string) => act({ type: "remove-tag", ids: [id], tag, now: now() }),
    [act],
  );
  const handleSetNotes = useCallback(
    (id: string, notes: string) => act({ type: "set-notes", id, notes, now: now() }),
    [act],
  );
  const handleToggleLock = useCallback((id: string) => act({ type: "toggle-lock", id, now: now() }), [act]);

  const handleToggleDestination = useCallback(
    (id: string, destination: DestinationKey, value: boolean) => {
      if (value && state.decisions[id]?.status === "scrapped") {
        pushToast(
          `Moved back to KEEP because ${DESTINATION_LABEL[destination]} is a public-facing section.`,
          "warning",
        );
      }
      act({ type: "set-destination", ids: [id], destination, value, now: now() });
    },
    [act, state.decisions, pushToast],
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedIds = useMemo(() => Array.from(selection), [selection]);

  const bulkDestination = useCallback(
    (destination: DestinationKey, value: boolean) => {
      if (value) {
        const movedBack = selectedIds.filter((id) => state.decisions[id]?.status === "scrapped").length;
        if (movedBack > 0) {
          pushToast(
            `Moved ${movedBack} photo${movedBack === 1 ? "" : "s"} back to KEEP because ${DESTINATION_LABEL[destination]} is a public-facing section.`,
            "warning",
          );
        }
      }
      act({ type: "set-destination", ids: selectedIds, destination, value, now: now() });
    },
    [act, selectedIds, state.decisions, pushToast],
  );

  // ----- uploads
  const handleFiles = useCallback(
    (files: File[], batchLabel: string) => {
      const nowIso = now();
      const records: UploadRecord[] = [];
      let reconnected = 0;
      const knownUploadIds = new Set(state.uploads.map((u) => u.photo_id));
      for (const file of files) {
        const relativePath =
          (file as File & { webkitRelativePath?: string }).webkitRelativePath || undefined;
        const existing = state.uploads.find(
          (u) => u.filename === file.name && u.size === file.size,
        );
        // Decisions imported from a report on a fresh browser have no upload
        // record yet — adopt their photo_id so re-uploading reconnects them.
        const orphanDecision = existing
          ? undefined
          : Object.values(state.decisions).find(
              (d) =>
                d.photo_id.startsWith("up-") &&
                d.filename === file.name &&
                !knownUploadIds.has(d.photo_id),
            );
        const id =
          existing?.photo_id ?? orphanDecision?.photo_id ?? uploadPhotoId(file, batchLabel, relativePath);
        const previous = objectUrls.get(id);
        if (previous) URL.revokeObjectURL(previous);
        objectUrls.set(id, URL.createObjectURL(file));
        if (existing) {
          reconnected += 1;
        } else {
          if (orphanDecision) reconnected += 1;
          records.push({
            photo_id: id,
            filename: file.name,
            size: file.size,
            lastModified: file.lastModified,
            type: file.type,
            batch: orphanDecision?.batch ?? batchLabel,
            relativePath,
            addedAt: nowIso,
          });
        }
      }
      if (records.length > 0) act({ type: "register-uploads", records, now: nowIso });
      bumpObjectUrls((v) => v + 1);
      const parts: string[] = [];
      if (records.length > 0) parts.push(`added ${records.length} to “${batchLabel}”`);
      if (reconnected > 0) parts.push(`reconnected ${reconnected}`);
      if (parts.length > 0) pushToast(`Photos ${parts.join(", ")}.`, "success");
    },
    [act, state.uploads, state.decisions, pushToast, objectUrls],
  );

  const disconnectedCount = useMemo(() => {
    void urlVersion;
    return state.uploads.filter((u) => !objectUrls.has(u.photo_id)).length;
  }, [state.uploads, objectUrls, urlVersion]);

  // ----- export / import / finalize
  const handleExportMarkdown = useCallback(() => {
    downloadTextFile("photos_report.md", exportMarkdownReport(allPhotos, state, now()));
    pushToast("photos_report.md downloaded. Keep it safe — it restores your progress.", "success");
  }, [allPhotos, state, pushToast]);

  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true);
    try {
      await exportPdfReport(allPhotos, state, now());
      pushToast("photos_report.pdf downloaded.", "success");
    } catch {
      pushToast("PDF export failed — the markdown export is unaffected.", "error");
    } finally {
      setExportingPdf(false);
    }
  }, [allPhotos, state, pushToast]);

  const handleImportFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      const outcome = importMarkdownReport(text, allPhotos, state, now());
      setImportResult(outcome.summary);
      if (outcome.summary.ok && outcome.state) {
        dispatch({ type: "hydrate", state: outcome.state });
      }
    },
    [allPhotos, state],
  );

  const syncToRepo = useCallback(async () => {
    try {
      const response = await fetch("/api/studio/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: exportMarkdownReport(allPhotos, state, now()) }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string; finalized?: boolean };
      if (payload.ok) {
        pushToast(
          `Report synced to the repo${payload.finalized ? " — public pages will use it on the next build." : " (draft)."}`,
          "success",
        );
      } else {
        pushToast(payload.error ?? "Sync failed.", "error");
      }
    } catch {
      pushToast("Sync failed — is the dev server running?", "error");
    }
  }, [allPhotos, state, pushToast]);

  const handleClearAll = useCallback(() => {
    clearCurationState();
    for (const url of objectUrls.values()) URL.revokeObjectURL(url);
    objectUrls.clear();
    dispatch({ type: "clear-all", empty: emptyCurationState(now()) });
    setSelection(new Set());
    setShowClearConfirm(false);
    pushToast("Local progress cleared.", "info");
  }, [pushToast, objectUrls]);

  // ----- focus mode navigation
  const focusIndex = focusId ? filtered.findIndex((p) => p.photo_id === focusId) : -1;
  const focusPhoto = focusIndex >= 0 ? filtered[focusIndex] : null;

  const openFocus = useCallback((id: string) => {
    setFocusId(id);
    setMode("focus");
  }, []);

  const stepFocus = useCallback(
    (delta: number) => {
      if (filtered.length === 0) return;
      const current = focusId ? filtered.findIndex((p) => p.photo_id === focusId) : -1;
      const next = ((current < 0 ? 0 : current + delta) + filtered.length) % filtered.length;
      setFocusId(filtered[next].photo_id);
    },
    [filtered, focusId],
  );

  // In focus mode with a stale/absent selection, snap to the first match (adjust-during-render).
  if (mode === "focus" && !focusPhoto && filtered.length > 0 && focusId !== filtered[0].photo_id) {
    setFocusId(filtered[0].photo_id);
  }

  // ----- keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      // Dialogs own Escape/Tab via StudioModal; every other key stops here too.
      const modalOpen = importResult !== null || showFinalize || showClearConfirm || showShortcuts;

      if (event.key === "Escape") {
        if (modalOpen) return;
        if (inField) return (target as HTMLElement).blur();
        if (mode === "focus") {
          setMode("grid");
          setFocusId(null);
        } else if (selection.size > 0) {
          setSelection(new Set());
        }
        return;
      }
      if (inField || modalOpen) return;
      // Never intercept browser/system shortcuts (Cmd+S, Ctrl+R, …).
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (event.key === "?") {
        setShowShortcuts((v) => !v);
        return;
      }
      if (mode !== "focus" || !focusPhoto) return;

      const id = focusPhoto.photo_id;
      const decision = state.decisions[id];
      switch (event.key.toLowerCase()) {
        case "k":
          handleKeep(id);
          break;
        case "s":
          handleScrap(id);
          break;
        case "m":
          handleToggleDestination(id, "modeling", !decision?.destinations.modeling);
          break;
        case "p":
          handleToggleDestination(id, "portfolio", !decision?.destinations.portfolio);
          break;
        case "r":
          handleToggleDestination(id, "projects", !decision?.destinations.projects);
          break;
        case "j":
        case "arrowright":
          stepFocus(1);
          break;
        case "h":
        case "arrowleft":
          stepFocus(-1);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    mode,
    focusPhoto,
    state.decisions,
    selection.size,
    importResult,
    showFinalize,
    showClearConfirm,
    showShortcuts,
    handleKeep,
    handleScrap,
    handleToggleDestination,
    stepFocus,
  ]);

  // ----- gates
  if (!hydrated) {
    return (
      <div className="studio-root studio-root--loading" aria-busy="true">
        <p>Loading the studio…</p>
      </div>
    );
  }

  if (needsPasscode && !unlocked) {
    return (
      <div className="studio-root studio-root--gate">
        <form
          className="studio-gate"
          onSubmit={(event) => {
            event.preventDefault();
            if (passcodeDraft === process.env.NEXT_PUBLIC_STUDIO_PASSCODE) {
              window.sessionStorage.setItem(UNLOCK_KEY, "1");
              setUnlocked(true);
              setPasscodeError(false);
            } else {
              setPasscodeError(true);
            }
          }}
        >
          <h1>Photo Curation Studio</h1>
          <p>This area is for Dorvell&apos;s photo review workflow.</p>
          <label>
            <span>Passcode</span>
            <input
              type="password"
              value={passcodeDraft}
              onChange={(event) => setPasscodeDraft(event.target.value)}
              autoFocus
            />
          </label>
          {passcodeError ? <p className="studio-gate__error" role="alert">That passcode didn&apos;t match.</p> : null}
          <button type="submit" className="studio-button studio-button--primary">
            Enter studio
          </button>
        </form>
      </div>
    );
  }

  const gridPhotos = filtered.slice(0, visibleCount);
  const finalizeBlocked = !validation.readyToFinalize;

  return (
    <div className="studio-root">
      {/* ---------- header ---------- */}
      <header className="studio-header">
        <div className="studio-header__brand">
          <p className="studio-header__kicker">Dorvell Ferguson — internal</p>
          <h1>Photo Curation Studio</h1>
        </div>
        <div className="studio-header__actions">
          <button type="button" className="studio-button studio-button--ghost" onClick={() => setShowShortcuts(true)}>
            Shortcuts
          </button>
          <button type="button" className="studio-button studio-button--ghost" onClick={() => importInputRef.current?.click()}>
            Import Report
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".md,text/markdown,text/plain"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImportFile(file);
              event.target.value = "";
            }}
          />
          <button type="button" className="studio-button studio-button--ghost" onClick={handleExportMarkdown}>
            Export Markdown
          </button>
          <button
            type="button"
            className="studio-button studio-button--ghost"
            onClick={() => void handleExportPdf()}
            disabled={exportingPdf}
          >
            {exportingPdf ? "Preparing PDF…" : "Export PDF"}
          </button>
          {process.env.NODE_ENV !== "production" ? (
            <button type="button" className="studio-button studio-button--ghost" onClick={() => void syncToRepo()}>
              Sync to repo
            </button>
          ) : null}
          <button
            type="button"
            className={`studio-button studio-button--primary${finalizeBlocked ? " is-blocked" : ""}`}
            onClick={() => setShowFinalize(true)}
          >
            Finalize Classification
          </button>
        </div>
      </header>

      {/* ---------- desktop warning ---------- */}
      {!state.desktopWarningDismissed ? (
        <div className="studio-warning" role="note">
          <p>
            <strong>Please use a laptop or desktop for this workflow.</strong> Photos are
            high-resolution and not optimized yet.
          </p>
          <button
            type="button"
            className="studio-button studio-button--ghost"
            onClick={() => act({ type: "dismiss-desktop-warning", now: now() })}
          >
            Got it
          </button>
        </div>
      ) : null}

      <div className="studio-layout">
        {/* ---------- sidebar ---------- */}
        <aside className="studio-sidebar">
          <ProgressPanel
            summary={summary}
            validation={validation}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
            finalized={Boolean(state.finalizedAt)}
            onSaveNow={saveNow}
          />
          <InstructionsPanel defaultOpen={summary.reviewed === 0} />
          <UploadPanel onFiles={handleFiles} disconnectedCount={disconnectedCount} />
          <div className="studio-sidebar__footer">
            {state.desktopWarningDismissed ? (
              <button
                type="button"
                className="studio-link"
                onClick={() => act({ type: "restore-desktop-warning", now: now() })}
              >
                Show the desktop warning again
              </button>
            ) : null}
            <button type="button" className="studio-link studio-link--danger" onClick={() => setShowClearConfirm(true)}>
              Clear local progress…
            </button>
            <Link href="/" className="studio-link">
              ← Back to the site
            </Link>
          </div>
        </aside>

        {/* ---------- main ---------- */}
        <main className="studio-main">
          <CurationToolbar
            mode={mode}
            onModeChange={(m) => {
              setMode(m);
              if (m === "focus" && !focusId && filtered.length > 0) setFocusId(filtered[0].photo_id);
            }}
            reviewFilter={reviewFilter}
            onReviewFilterChange={setReviewFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            batchFilter={batchFilter}
            onBatchFilterChange={setBatchFilter}
            batches={batches}
            categories={categories}
            search={search}
            onSearchChange={setSearch}
            searchInputRef={searchInputRef}
            visibleCount={filtered.length}
            totalCount={allPhotos.length}
            selectedCount={selection.size}
            onSelectAllVisible={() => setSelection(new Set(filtered.map((p) => p.photo_id)))}
            onClearSelection={() => setSelection(new Set())}
            onBulkKeep={() => act({ type: "keep", ids: selectedIds, now: now() })}
            onBulkScrap={() => act({ type: "scrap", ids: selectedIds, now: now() })}
            onBulkCategory={(category) => act({ type: "set-category", ids: selectedIds, category, now: now() })}
            onBulkTag={(tag) => act({ type: "add-tag", ids: selectedIds, tag, now: now() })}
            onBulkDestination={bulkDestination}
            onAddCategory={(name) => {
              act({ type: "add-custom-category", name, now: now() });
              pushToast(`Category “${name}” added.`, "success");
            }}
          />

          {mode === "grid" ? (
            filtered.length === 0 ? (
              <div className="studio-empty">
                <h2>Nothing matches these filters.</h2>
                <p>Try “All”, clear the search, or pick a different batch.</p>
              </div>
            ) : (
              <>
                <div className="studio-grid">
                  {gridPhotos.map((photo) => (
                    <PhotoReviewCard
                      key={photo.photo_id}
                      photo={photo}
                      decision={state.decisions[photo.photo_id]}
                      categories={categories}
                      selected={selection.has(photo.photo_id)}
                      onToggleSelect={handleToggleSelect}
                      onKeep={handleKeep}
                      onScrap={handleScrap}
                      onSetCategory={handleSetCategory}
                      onSetScrapReason={handleScrapReason}
                      onToggleDestination={handleToggleDestination}
                      onOpenFocus={openFocus}
                    />
                  ))}
                </div>
                {visibleCount < filtered.length ? (
                  <div className="studio-grid__more" ref={sentinelRef}>
                    <button
                      type="button"
                      className="studio-button studio-button--ghost"
                      onClick={() => setVisibleCount((count) => Math.min(count + CHUNK * 2, filtered.length))}
                    >
                      Show more ({(filtered.length - visibleCount).toLocaleString()} remaining)
                    </button>
                  </div>
                ) : null}
              </>
            )
          ) : null}

          {mode === "focus" ? (
            focusPhoto ? (
              <FocusReview
                photo={focusPhoto}
                decision={state.decisions[focusPhoto.photo_id]}
                index={focusIndex}
                total={filtered.length}
                categories={categories}
                onKeep={handleKeep}
                onScrap={handleScrap}
                onSetCategory={handleSetCategory}
                onSetScrapReason={handleScrapReason}
                onToggleDestination={handleToggleDestination}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                onSetNotes={handleSetNotes}
                onToggleLock={handleToggleLock}
                onPrev={() => stepFocus(-1)}
                onNext={() => stepFocus(1)}
                onExit={() => {
                  setMode("grid");
                  setFocusId(null);
                }}
              />
            ) : (
              <div className="studio-empty">
                <h2>No photos match these filters.</h2>
                <p>Switch back to Grid review and adjust the filters.</p>
              </div>
            )
          ) : null}

          {mode === "queue" ? (
            <QueueView photos={allPhotos} decisions={state.decisions} onOpenFocus={openFocus} />
          ) : null}
        </main>
      </div>

      {/* ---------- toasts ---------- */}
      <div className="studio-toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <p key={toast.id} className={`studio-toast studio-toast--${toast.tone}`}>
            {toast.message}
          </p>
        ))}
      </div>

      {/* ---------- dialogs ---------- */}
      {importResult ? <ImportSummary result={importResult} onClose={() => setImportResult(null)} /> : null}

      {showShortcuts ? (
        <StudioModal labelledBy="studio-shortcuts-title" narrow onClose={() => setShowShortcuts(false)}>
          <h2 id="studio-shortcuts-title">Keyboard shortcuts</h2>
          <dl className="studio-shortcuts">
            <div><dt><kbd>K</kbd></dt><dd>Keep (Focus review)</dd></div>
            <div><dt><kbd>S</kbd></dt><dd>Scrap (Focus review)</dd></div>
            <div><dt><kbd>M</kbd></dt><dd>Toggle Modeling</dd></div>
            <div><dt><kbd>P</kbd></dt><dd>Toggle Portfolio</dd></div>
            <div><dt><kbd>R</kbd></dt><dd>Toggle Projects</dd></div>
            <div><dt><kbd>J</kbd> / <kbd>→</kbd></dt><dd>Next photo</dd></div>
            <div><dt><kbd>H</kbd> / <kbd>←</kbd></dt><dd>Previous photo</dd></div>
            <div><dt><kbd>/</kbd></dt><dd>Focus the search box</dd></div>
            <div><dt><kbd>Esc</kbd></dt><dd>Close / back to grid / clear selection</dd></div>
            <div><dt><kbd>?</kbd></dt><dd>Show or hide this help</dd></div>
          </dl>
          <div className="studio-modal__actions">
            <button type="button" className="studio-button studio-button--primary" onClick={() => setShowShortcuts(false)}>
              Close
            </button>
          </div>
        </StudioModal>
      ) : null}

      {showClearConfirm ? (
        <StudioModal labelledBy="studio-clear-title" narrow onClose={() => setShowClearConfirm(false)}>
          <h2 id="studio-clear-title">Clear all local progress?</h2>
          <p>
            This removes every decision saved in this browser. If you haven&apos;t exported a
            report, that work is gone. Consider “Export Markdown” first.
          </p>
          <div className="studio-modal__actions">
            <button type="button" className="studio-button studio-button--ghost" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </button>
            <button type="button" className="studio-button studio-button--scrap" onClick={handleClearAll}>
              Clear everything
            </button>
          </div>
        </StudioModal>
      ) : null}

      {showFinalize ? (
        <StudioModal labelledBy="studio-finalize-title" onClose={() => setShowFinalize(false)}>
          <h2 id="studio-finalize-title">Finalize classification</h2>
            {finalizeBlocked ? (
              <>
                <p className="studio-import__error">Not ready yet — resolve these first:</p>
                {validation.blockers.length > 0 ? (
                  <section>
                    <h3>Kept without a primary category ({validation.blockers.length.toLocaleString()})</h3>
                    <ul className="studio-import__names">
                      {validation.blockers.slice(0, 10).map((issue) => (
                        <li key={issue.photo_id}>{issue.filename}</li>
                      ))}
                      {validation.blockers.length > 10 ? (
                        <li>… and {(validation.blockers.length - 10).toLocaleString()} more (use the “Needs category” filter)</li>
                      ) : null}
                    </ul>
                  </section>
                ) : null}
                {validation.unreviewed.length > 0 ? (
                  <section>
                    <h3>Still unreviewed ({validation.unreviewed.length.toLocaleString()})</h3>
                    <p>Every photo needs a KEEP or SCRAP decision before complete finalization.</p>
                  </section>
                ) : null}
                <p className="studio-import__hint">
                  You can keep exporting progress reports at any time — only finalization is blocked.
                </p>
              </>
            ) : state.finalizedAt ? (
              <>
                <p>
                  Finalized {new Date(state.finalizedAt).toLocaleString()}. Download the final report
                  below — it drives the public Portfolio, Modeling, and Projects pages.
                </p>
                <div className="studio-modal__actions studio-modal__actions--stack">
                  <button type="button" className="studio-button studio-button--primary" onClick={handleExportMarkdown}>
                    Download final Markdown
                  </button>
                  <button type="button" className="studio-button studio-button--primary" onClick={() => void handleExportPdf()} disabled={exportingPdf}>
                    {exportingPdf ? "Preparing PDF…" : "Download final PDF"}
                  </button>
                  {process.env.NODE_ENV !== "production" ? (
                    <button type="button" className="studio-button studio-button--ghost" onClick={() => void syncToRepo()}>
                      Sync to repo (updates public pages on next build)
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <p>
                  Every photo is reviewed and every kept photo has a primary category. Finalizing
                  marks this classification as the source of truth for the public site.
                </p>
                <dl className="studio-import__stats">
                  <div><dt>Kept</dt><dd>{summary.kept.toLocaleString()}</dd></div>
                  <div><dt>Scrapped</dt><dd>{summary.scrapped.toLocaleString()}</dd></div>
                  <div><dt>Portfolio</dt><dd>{summary.portfolio.toLocaleString()}</dd></div>
                  <div><dt>Modeling</dt><dd>{summary.modeling.toLocaleString()}</dd></div>
                  <div><dt>Projects</dt><dd>{summary.projects.toLocaleString()}</dd></div>
                </dl>
                <div className="studio-modal__actions">
                  <button
                    type="button"
                    className="studio-button studio-button--primary"
                    onClick={() => {
                      act({ type: "finalize", now: now() });
                      pushToast("Classification finalized. Download the final report.", "success");
                    }}
                  >
                    Finalize now
                  </button>
                </div>
              </>
            )}
          <div className="studio-modal__actions">
            <button type="button" className="studio-button studio-button--ghost" onClick={() => setShowFinalize(false)}>
              Close
            </button>
          </div>
        </StudioModal>
      ) : null}
    </div>
  );
}
