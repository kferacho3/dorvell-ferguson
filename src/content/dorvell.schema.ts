import { z } from "zod";

export const dorvellCategories = [
  "Portraits",
  "Fashion",
  "Music",
  "Events",
  "Athletics",
  "Graphic Design",
  "Modeling",
  "Runway",
  "Behind The Scenes",
  "Uncategorized",
] as const;

export type DorvellCategory = (typeof dorvellCategories)[number];

export const dorvellImageSchema = z.object({
  id: z.string(),
  sourceUrl: z.string().url(),
  sourcePage: z.string().url(),
  localOriginal: z.string(),
  localOptimized: z.object({
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
  }),
  blur: z.string().optional(),
  width: z.number().positive(),
  height: z.number().positive(),
  aspectRatio: z.number().positive(),
  alt: z.string(),
  caption: z.string().optional(),
  category: z.enum(dorvellCategories),
  tags: z.array(z.string()),
  detectedFrom: z.enum(["img", "srcset", "background", "network", "json", "manual"]),
  hash: z.string(),
  needsAltReview: z.boolean(),
  needsCreditReview: z.boolean(),
  projectSlug: z.string().optional(),
  projectTitle: z.string().optional(),
});

export const dorvellSiteContentSchema = z.object({
  source: z.string().url(),
  scrapedAt: z.string(),
  pages: z.array(
    z.object({
      url: z.string().url(),
      title: z.string(),
      headings: z.array(z.string()),
      paragraphs: z.array(z.string()),
      links: z.array(z.object({ text: z.string(), href: z.string() })),
    }),
  ),
  images: z.array(dorvellImageSchema),
  contacts: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    instagram: z.array(z.string()).optional(),
  }),
  scrapeSummary: z
    .object({
      pagesScraped: z.number(),
      imagesFound: z.number(),
      imagesDownloaded: z.number(),
      duplicatesRemoved: z.number(),
      missingAltText: z.number(),
      categories: z.record(z.number()),
      warnings: z.array(z.string()),
    })
    .optional(),
});

export type DorvellImage = z.infer<typeof dorvellImageSchema>;
export type DorvellSiteContent = z.infer<typeof dorvellSiteContentSchema>;
