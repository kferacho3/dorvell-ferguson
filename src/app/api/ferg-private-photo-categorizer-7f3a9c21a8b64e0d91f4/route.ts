import { NextResponse } from "next/server";
import {
  manualPhotoCategories,
  readPhotoCategorizationLedger,
  writePhotoCategorizationLedger,
  type ManualPhotoCategory,
  type PhotoScrapDecision,
} from "@/lib/dorvell-photo-categorization-ledger";
import { getRawPortfolioData } from "@/lib/portfolio-data";

export const dynamic = "force-dynamic";

function disabledInProduction() {
  return process.env.NODE_ENV === "production";
}

function isManualPhotoCategory(value: unknown): value is ManualPhotoCategory {
  return typeof value === "string" && manualPhotoCategories.includes(value as ManualPhotoCategory);
}

function isPhotoScrapDecision(value: unknown): value is PhotoScrapDecision {
  return value === "landing" || value === "site";
}

export async function POST(request: Request) {
  if (disabledInProduction()) {
    return NextResponse.json({ error: "Photo categorizer is disabled in production." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    imageId?: unknown;
    category?: unknown;
    scrapDecision?: unknown;
  } | null;
  if (!body || typeof body.imageId !== "string") {
    return NextResponse.json({ error: "Missing imageId." }, { status: 400 });
  }

  const hasCategoryUpdate = "category" in body;
  const hasScrapUpdate = "scrapDecision" in body;
  if (!hasCategoryUpdate && !hasScrapUpdate) {
    return NextResponse.json({ error: "Missing category or scrapDecision." }, { status: 400 });
  }

  if (hasCategoryUpdate && body.category !== "Unreviewed" && !isManualPhotoCategory(body.category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  if (hasScrapUpdate && body.scrapDecision !== "keep" && !isPhotoScrapDecision(body.scrapDecision)) {
    return NextResponse.json({ error: "Invalid scrapDecision." }, { status: 400 });
  }

  const { generated } = getRawPortfolioData();
  const imageExists = generated.images.some((image) => image.id === body.imageId);
  if (!imageExists) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const ledger = await readPhotoCategorizationLedger();
  if (hasCategoryUpdate) {
    if (body.category === "Unreviewed") {
      delete ledger.assignments[body.imageId];
    } else {
      ledger.assignments[body.imageId] = body.category as ManualPhotoCategory;
    }
  }

  if (hasScrapUpdate) {
    if (body.scrapDecision === "keep") {
      delete ledger.scrapDecisions[body.imageId];
    } else {
      ledger.scrapDecisions[body.imageId] = body.scrapDecision as PhotoScrapDecision;
    }
  }

  const result = await writePhotoCategorizationLedger(generated.images, ledger.assignments, ledger.scrapDecisions);
  return NextResponse.json({
    ok: true,
    imageId: body.imageId,
    category: body.category,
    scrapDecision: body.scrapDecision,
    reviewedCount: result.reviewedCount,
    categorizedCount: result.categorizedCount,
    landingScrapCount: result.landingScrapCount,
    siteScrapCount: result.siteScrapCount,
    totalImages: result.totalImages,
  });
}
