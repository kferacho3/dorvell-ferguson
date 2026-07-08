"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { DorvellImage } from "@/content/dorvell.schema";
import {
  activePortfolioCategories,
  filterByCategory,
  type ActivePortfolioCategory,
} from "@/lib/portfolio-taxonomy";
import { usePortfolioFilters } from "./portfolioMode";

type PortfolioDataContextValue = {
  images: DorvellImage[];
  categories: ActivePortfolioCategory[];
  projectCount: number;
};

const PortfolioDataContext = createContext<PortfolioDataContextValue | null>(null);

export function PortfolioModeProvider({
  images,
  projectCount,
  children,
}: {
  images: DorvellImage[];
  projectCount: number;
  children: ReactNode;
}) {
  const value = useMemo<PortfolioDataContextValue>(
    () => ({
      images,
      categories: activePortfolioCategories(images),
      projectCount,
    }),
    [images, projectCount],
  );

  return <PortfolioDataContext.Provider value={value}>{children}</PortfolioDataContext.Provider>;
}

export function usePortfolioData(): PortfolioDataContextValue {
  const value = useContext(PortfolioDataContext);
  if (!value) {
    throw new Error("usePortfolioData must be used within a PortfolioModeProvider");
  }
  return value;
}

/** Images filtered by the currently selected category (memoised). */
export function useFilteredImages(): DorvellImage[] {
  const { images } = usePortfolioData();
  const { category } = usePortfolioFilters();
  return useMemo(() => filterByCategory(images, category), [images, category]);
}
