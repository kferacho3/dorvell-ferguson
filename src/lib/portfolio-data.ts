import generated from "@/content/dorvell.generated.json";
import { dorvellManual } from "@/content/dorvell.manual";
import { dorvellSiteContentSchema, type DorvellCategory, type DorvellImage } from "@/content/dorvell.schema";

export function getPortfolioData() {
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

  const projects = Array.from(
    parsed.data.images.reduce((map, image) => {
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

  const categories = Array.from(new Set(parsed.data.images.map((image) => image.category)));

  return {
    generated: parsed.data,
    manual: dorvellManual,
    projects,
    categories,
  };
}

export function getProject(slug: string) {
  return getPortfolioData().projects.find((project) => project.slug === slug);
}
