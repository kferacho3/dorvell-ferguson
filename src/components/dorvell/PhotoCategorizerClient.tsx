"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";

export type CategorizerImage = {
  id: string;
  src: string;
  width: number;
  height: number;
  blur?: string;
  alt: string;
  originalCategory: string;
  laneGuess: string;
  projectLabel: string;
  sourcePage: string;
};

type AssignmentMap = Record<string, string>;
type ScrapDecision = "landing" | "site";
type ScrapMap = Record<string, ScrapDecision>;

const apiPath = "/api/ferg-private-photo-categorizer-7f3a9c21a8b64e0d91f4";

const categoryOptions = [
  { label: "Fashion / Creative Direction", short: "Fashion", accent: "#35e0bb" },
  { label: "Runway / Modeling", short: "Runway", accent: "#b7ff5a" },
  { label: "Portraits", short: "Portraits", accent: "#f0b35a" },
  { label: "Music & Live", short: "Music", accent: "#f04d5e" },
  { label: "Sports / Athletics", short: "Sports", accent: "#48c7ff" },
  { label: "Graphic Design", short: "Design", accent: "#b889ff" },
  { label: "Behind The Scenes", short: "BTS", accent: "#ff8a4c" },
  { label: "Uncategorized", short: "Other", accent: "#f8f1e7" },
] as const;

const reviewFilters = ["All", "Unreviewed", "Reviewed", "Scrapped", "Landing scraps", "Entire scraps"] as const;

function normalized(value: string) {
  return value.toLowerCase().trim();
}

function categoryAccent(category: string | undefined) {
  return categoryOptions.find((option) => option.label === category)?.accent ?? "rgba(248, 241, 231, 0.42)";
}

function scrapLabel(scrapDecision: ScrapDecision | undefined) {
  if (scrapDecision === "landing") return "Scrap landing";
  if (scrapDecision === "site") return "Scrap entirely";
  return "Keep";
}

function blurProps(blur: string | undefined) {
  return blur
    ? {
        placeholder: "blur" as const,
        blurDataURL: blur,
      }
    : {};
}

export function PhotoCategorizerClient({
  images,
  initialAssignments,
  initialScrapDecisions,
  ledgerPath,
}: {
  images: CategorizerImage[];
  initialAssignments: AssignmentMap;
  initialScrapDecisions: ScrapMap;
  ledgerPath: string;
}) {
  const [assignments, setAssignments] = useState<AssignmentMap>(initialAssignments);
  const [scrapDecisions, setScrapDecisions] = useState<ScrapMap>(initialScrapDecisions);
  const [query, setQuery] = useState("");
  const [reviewFilter, setReviewFilter] = useState<(typeof reviewFilters)[number]>("All");
  const [manualFilter, setManualFilter] = useState("All categories");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState("Ready");

  const reviewedCount = new Set([...Object.keys(assignments), ...Object.keys(scrapDecisions)]).size;
  const landingScrapCount = Object.values(scrapDecisions).filter((decision) => decision === "landing").length;
  const siteScrapCount = Object.values(scrapDecisions).filter((decision) => decision === "site").length;
  const categoryCounts = useMemo(
    () =>
      categoryOptions.map((option) => ({
        ...option,
        count: Object.values(assignments).filter((category) => category === option.label).length,
      })),
    [assignments],
  );

  const filteredImages = useMemo(() => {
    const search = normalized(query);
    return images.filter((image) => {
      const assignedCategory = assignments[image.id];
      const scrapDecision = scrapDecisions[image.id];
      const reviewed = Boolean(assignedCategory || scrapDecision);

      if (reviewFilter === "Unreviewed" && reviewed) return false;
      if (reviewFilter === "Reviewed" && !reviewed) return false;
      if (reviewFilter === "Scrapped" && !scrapDecision) return false;
      if (reviewFilter === "Landing scraps" && scrapDecision !== "landing") return false;
      if (reviewFilter === "Entire scraps" && scrapDecision !== "site") return false;
      if (manualFilter !== "All categories" && assignedCategory !== manualFilter) return false;
      if (!search) return true;

      return [
        image.id,
        image.alt,
        image.originalCategory,
        image.laneGuess,
        image.projectLabel,
        image.sourcePage,
        assignedCategory ?? "",
        scrapLabel(scrapDecision),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [assignments, images, manualFilter, query, reviewFilter, scrapDecisions]);

  const setCategory = async (imageId: string, category: string) => {
    const previousCategory = assignments[imageId];
    const nextAssignments = { ...assignments };
    if (category === "Unreviewed") {
      delete nextAssignments[imageId];
    } else {
      nextAssignments[imageId] = category;
    }

    setAssignments(nextAssignments);
    setSavingId(imageId);
    setSaveStatus(`Saving ${imageId}...`);

    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, category }),
      });

      if (!response.ok) throw new Error(await response.text());
      const result = (await response.json()) as { reviewedCount: number; totalImages: number };
      setSaveStatus(`Saved ${result.reviewedCount} / ${result.totalImages}`);
    } catch {
      setAssignments((current) => {
        const reverted = { ...current };
        if (previousCategory) reverted[imageId] = previousCategory;
        else delete reverted[imageId];
        return reverted;
      });
      setSaveStatus(`Could not save ${imageId}`);
    } finally {
      setSavingId(null);
    }
  };

  const setScrapDecision = async (imageId: string, scrapDecision: ScrapDecision | "keep") => {
    const previousScrapDecision = scrapDecisions[imageId];
    const nextScrapDecisions = { ...scrapDecisions };
    if (scrapDecision === "keep") {
      delete nextScrapDecisions[imageId];
    } else {
      nextScrapDecisions[imageId] = scrapDecision;
    }

    setScrapDecisions(nextScrapDecisions);
    setSavingId(imageId);
    setSaveStatus(`Saving ${imageId}...`);

    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, scrapDecision }),
      });

      if (!response.ok) throw new Error(await response.text());
      const result = (await response.json()) as { reviewedCount: number; totalImages: number };
      setSaveStatus(`Saved ${result.reviewedCount} / ${result.totalImages}`);
    } catch {
      setScrapDecisions((current) => {
        const reverted = { ...current };
        if (previousScrapDecision) reverted[imageId] = previousScrapDecision;
        else delete reverted[imageId];
        return reverted;
      });
      setSaveStatus(`Could not save ${imageId}`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="photo-categorizer">
      <header className="photo-categorizer__header">
        <div>
          <p className="eyebrow">Private local tool / not deployed</p>
          <h1>Manual photo categorizer</h1>
          <p>
            Click a category on each image. Every click rewrites the markdown ledger so the final categories stop
            depending on scraped captions.
          </p>
        </div>
        <div className="photo-categorizer__stats" aria-label="Categorization progress">
          <span>
            <strong>{reviewedCount}</strong>
            reviewed
          </span>
          <span>
            <strong>{images.length - reviewedCount}</strong>
            left
          </span>
          <span>
            <strong>{filteredImages.length}</strong>
            shown
          </span>
          <span>
            <strong>{landingScrapCount}</strong>
            landing scrap
          </span>
          <span>
            <strong>{siteScrapCount}</strong>
            scrap entirely
          </span>
        </div>
      </header>

      <section className="photo-categorizer__toolbar" aria-label="Categorizer controls">
        <label>
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="id, caption, source, current guess..."
          />
        </label>
        <label>
          <span>Review</span>
          <select value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value as (typeof reviewFilters)[number])}>
            {reviewFilters.map((filter) => (
              <option key={filter}>{filter}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Manual category</span>
          <select value={manualFilter} onChange={(event) => setManualFilter(event.target.value)}>
            <option>All categories</option>
            {categoryOptions.map((option) => (
              <option key={option.label}>{option.label}</option>
            ))}
          </select>
        </label>
        <div className="photo-categorizer__save-state" aria-live="polite">
          <span>{saveStatus}</span>
          <small>{ledgerPath}</small>
        </div>
      </section>

      <nav className="photo-categorizer__category-strip" aria-label="Manual category counts">
        {categoryCounts.map((option) => (
          <button
            className={manualFilter === option.label ? "is-active" : ""}
            key={option.label}
            onClick={() => setManualFilter(manualFilter === option.label ? "All categories" : option.label)}
            style={{ "--category-accent": option.accent } as CSSProperties}
            type="button"
          >
            <strong>{option.short}</strong>
            <span>{option.count}</span>
          </button>
        ))}
      </nav>

      <section className="photo-categorizer__grid" aria-label="All portfolio photos">
        {filteredImages.map((image, index) => {
          const assignedCategory = assignments[image.id];
          const scrapDecision = scrapDecisions[image.id];
          const accent = scrapDecision === "site" ? "#ff2f4f" : scrapDecision === "landing" ? "#ff8a4c" : categoryAccent(assignedCategory);
          const cardClassName = [
            "photo-categorizer-card",
            assignedCategory || scrapDecision ? "is-reviewed" : "",
            scrapDecision === "landing" ? "is-scrap-landing" : "",
            scrapDecision === "site" ? "is-scrap-site" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <article
              className={cardClassName}
              key={image.id}
              style={{ "--category-accent": accent } as CSSProperties}
            >
              <figure className="photo-categorizer-card__image">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 760px) 92vw, (max-width: 1240px) 44vw, 24vw"
                  unoptimized
                  {...blurProps(image.blur)}
                />
                <figcaption>
                  <span>DF-{String(index + 1).padStart(4, "0")}</span>
                  <strong>{assignedCategory ?? "Unreviewed"}</strong>
                  <em>{scrapLabel(scrapDecision)}</em>
                </figcaption>
              </figure>

              <div className="photo-categorizer-card__meta">
                <strong>{image.id}</strong>
                <span>{image.projectLabel}</span>
                <small>
                  scraped: {image.originalCategory} / guess: {image.laneGuess}
                </small>
              </div>

              <div className="photo-categorizer-card__actions" aria-label={`Categorize ${image.id}`}>
                {categoryOptions.map((option) => (
                  <button
                    aria-pressed={assignedCategory === option.label}
                    className={assignedCategory === option.label ? "is-active" : ""}
                    disabled={savingId === image.id}
                    key={option.label}
                    onClick={() => setCategory(image.id, option.label)}
                    style={{ "--category-accent": option.accent } as CSSProperties}
                    type="button"
                  >
                    {option.short}
                  </button>
                ))}
                <button disabled={savingId === image.id} onClick={() => setCategory(image.id, "Unreviewed")} type="button">
                  Clear
                </button>
              </div>
              <div className="photo-categorizer-card__scrap-actions" aria-label={`Scrap controls for ${image.id}`}>
                <button
                  aria-pressed={scrapDecision === "landing"}
                  className={scrapDecision === "landing" ? "is-active" : ""}
                  disabled={savingId === image.id}
                  onClick={() => setScrapDecision(image.id, "landing")}
                  type="button"
                >
                  Scrap landing
                </button>
                <button
                  aria-pressed={scrapDecision === "site"}
                  className={scrapDecision === "site" ? "is-active" : ""}
                  disabled={savingId === image.id}
                  onClick={() => setScrapDecision(image.id, "site")}
                  type="button"
                >
                  Scrap entirely
                </button>
                <button disabled={savingId === image.id} onClick={() => setScrapDecision(image.id, "keep")} type="button">
                  Keep
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
