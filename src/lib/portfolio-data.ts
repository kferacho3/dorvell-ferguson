import generated from "@/content/dorvell.generated.json";
import { dorvellManual } from "@/content/dorvell.manual";
import { dorvellSiteContentSchema, type DorvellCategory, type DorvellImage, type DorvellSiteContent } from "@/content/dorvell.schema";
import { readPhotoCategorizationLedgerSync } from "@/lib/dorvell-photo-categorization-ledger";
import { applyCuratedCategories, filterPublicImages } from "@/lib/photos/getPublicPhotos";

function buildPortfolioData(images: DorvellImage[], generatedData: DorvellSiteContent) {
  const projects = Array.from(
    images.reduce((map, image) => {
      const slug = image.projectSlug ?? "archive";
      const current = map.get(slug) ?? {
        slug,
        title: image.projectTitle ?? "Archive",
        category: image.category,
        images: [] as DorvellImage[],
      };
      current.images.push(image);
      map.set(slug, current);
      return map;
    }, new Map<string, { slug: string; title: string; category: DorvellCategory; images: DorvellImage[] }>()),
  ).map(([, project]) => project);

  const categories = Array.from(new Set(images.map((image) => image.category)));

  return {
    generated: {
      ...generatedData,
      images,
    },
    manual: dorvellManual,
    projects,
    categories,
  };
}

export function getRawPortfolioData() {
  const parsed = dorvellSiteContentSchema.safeParse(generated);

  if (!parsed.success) {
    console.warn(parsed.error.flatten());
    return {
      generated: {
        ...generated,
        images: [] as DorvellImage[],
      },
      manual: dorvellManual,
      projects: [],
      categories: [] as DorvellCategory[],
    };
  }

  return buildPortfolioData(parsed.data.images, parsed.data);
}

export function getPortfolioData() {
  const rawData = getRawPortfolioData();
  const { scrapDecisions } = readPhotoCategorizationLedgerSync();
  const siteScrappedIds = new Set(
    Object.entries(scrapDecisions)
      .filter(([, decision]) => decision === "site")
      .map(([imageId]) => imageId),
  );
  const publicImages = applyCuratedCategories(
    filterPublicImages(rawData.generated.images.filter((image) => !siteScrappedIds.has(image.id))),
  );

  return buildPortfolioData(publicImages, rawData.generated);
}

export function getProject(slug: string) {
  return getPortfolioData().projects.find((project) => project.slug === slug);
}
