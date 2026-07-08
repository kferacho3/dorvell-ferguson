import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { CURATION_SCHEMA } from "@/lib/curation/types";
import { convertReportMarkdownToPublicJson } from "@/lib/curation/publicJson";

const reportPath = path.join(process.cwd(), "src/content/dorvell-photo-curation-report.md");
const publicJsonPath = path.join(process.cwd(), "src/content/curatedPhotos.generated.json");

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

  let body: { markdown?: unknown };
  try {
    body = (await request.json()) as { markdown?: unknown };
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
