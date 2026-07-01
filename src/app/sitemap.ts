import type { MetadataRoute } from "next";
import { getPortfolioData } from "@/lib/portfolio-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/work", "/runway", "/about", "/contact"];
  const projects = getPortfolioData().projects.map((project) => `/work/${project.slug}`);

  return [...routes, ...projects].map((route) => ({
    url: `https://dorvellferguson.com${route}`,
    lastModified: new Date(),
  }));
}
