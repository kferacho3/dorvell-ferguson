import type { MetadataRoute } from "next";
import { getPortfolioData } from "@/lib/portfolio-data";

// Legacy scrape artifacts and placeholder exhibits kept out of the index.
const excludedProjectSlugs = new Set(["home-2", "work", "about", "fashioncreative-direction-coming-soon"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const data = getPortfolioData();
  const scrapedAt = new Date(data.generated.scrapedAt);
  const lastModified = Number.isNaN(scrapedAt.getTime()) ? new Date() : scrapedAt;

  const routes = ["", "/work", "/modeling", "/projects", "/about", "/contact"];
  const projects = data.projects
    .filter((project) => !excludedProjectSlugs.has(project.slug))
    .map((project) => `/work/${project.slug}`);

  return [...routes, ...projects].map((route) => ({
    url: `https://dorvellferguson.com${route}`,
    lastModified,
  }));
}
