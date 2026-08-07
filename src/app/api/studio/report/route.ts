import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { CURATION_SCHEMA } from "@/lib/curation/types";
import { convertReportMarkdownToPublicJson } from "@/lib/curation/publicJson";

const reportPath = path.join(process.cwd(), "src/content/dorvell-photo-curation-report.md");
const publicJsonPath = path.join(process.cwd(), "src/content/curatedPhotos.generated.json");

/** Staleness signals from a report's machine-readable block. */
function reportMeta(markdown: string): { finalized: boolean; maxUpdatedAt: string } | null {
  const sectionIndex = markdown.indexOf("## Machine Readable State");
  const fenceStart = markdown.indexOf("```json", sectionIndex >= 0 ? sectionIndex : 0);
  const bodyStart = fenceStart >= 0 ? markdown.indexOf("\n", fenceStart) : -1;
  const fenceEnd = markdown.lastIndexOf("```");
  if (fenceStart === -1 || fenceEnd <= bodyStart) return null;
  try {
    const payload = JSON.parse(markdown.slice(bodyStart + 1, fenceEnd)) as {
      finalized?: unknown;
      photos?: unknown;
    };
    let maxUpdatedAt = "";
    if (Array.isArray(payload.photos)) {
      for (const photo of payload.photos as { updated_at?: unknown }[]) {
        if (typeof photo?.updated_at === "string" && photo.updated_at > maxUpdatedAt) {
          maxUpdatedAt = photo.updated_at;
        }
      }
    }
    return { finalized: payload.finalized === true, maxUpdatedAt };
  } catch {
    return null;
  }
}

/**
 * Dev-only sync: persists the studio's current report markdown into the repo
 * and regenerates the public classification JSON in one step. Production
 * builds ship with whatever was committed — the downloadable report is
 * always the portable source of truth.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  let body: { markdown?: unknown; allowStale?: unknown };
  try {
    body = (await request.json()) as { markdown?: unknown; allowStale?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const markdown = body.markdown;
  if (typeof markdown !== "string" || !markdown.includes(CURATION_SCHEMA)) {
    return NextResponse.json(
      { error: "Body must include the report markdown produced by the studio." },
      { status: 400 },
    );
  }

  // A browser that never imported the current repo report would silently
  // roll back its decisions (and the finalized flag). Compare staleness
  // signals and refuse unless the caller explicitly opts in.
  if (body.allowStale !== true) {
    let existing: string | null = null;
    try {
      existing = await readFile(reportPath, "utf8");
    } catch {
      existing = null;
    }
    const repoMeta = existing ? reportMeta(existing) : null;
    const incomingMeta = reportMeta(markdown);
    if (repoMeta && incomingMeta) {
      if (incomingMeta.maxUpdatedAt < repoMeta.maxUpdatedAt) {
        return NextResponse.json(
          {
            error:
              "The repo report has newer decisions than this browser — use “Import Report” with src/content/dorvell-photo-curation-report.md first, then sync.",
          },
          { status: 409 },
        );
      }
      if (repoMeta.finalized && !incomingMeta.finalized) {
        return NextResponse.json(
          {
            error:
              "The repo report is finalized but this browser's state is not — import the repo report first so syncing doesn't un-finalize the site.",
          },
          { status: 409 },
        );
      }
    }
  }

  const conversion = convertReportMarkdownToPublicJson(markdown, new Date().toISOString());
  if (!conversion.ok) {
    return NextResponse.json({ error: conversion.error }, { status: 422 });
  }

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, markdown, "utf8");
  await writeFile(publicJsonPath, `${JSON.stringify(conversion.output, null, 2)}\n`, "utf8");

  return NextResponse.json({
    ok: true,
    reportPath: "src/content/dorvell-photo-curation-report.md",
    publicJsonPath: "src/content/curatedPhotos.generated.json",
    finalized: conversion.output.finalized,
    decisions: conversion.output.photos.length,
    warnings: conversion.warnings,
  });
}
