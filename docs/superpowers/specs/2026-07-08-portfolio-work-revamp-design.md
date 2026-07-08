# Portfolio (`/work`) Revamp — Design Spec

Date: 2026-07-08 · Status: approved (build directly on `main`)

## Goal
Transform the `/work` "Work Index" into the most immersive, polished, professional
section of the site — Awwwards-caliber and cinematic, but still a practical, calm-friendly
photographer's portfolio. Four "gallery modes" let users explore the same body of work as
different rooms in one gallery. Must feel cohesive with About/Contact and NOT duplicate `/modeling`.

## Confirmed decisions
- Revamp `/work` in place: keep URL, `<DorvellShell>`, `route-page work-route` wrapper, brand tokens.
- Brand palette stays (teal/brown/cream/charcoal); adopt the modeling page's velvet-black cinematic
  ambiance and quality bar. Gradient carousel sits on a **black stage** so reactive color blooms pop.
- Mode labels: **Cinematic / Calm / Archive / Story**.
- Full immersive build now (all sections).
- Category chips render for every category that actually contains media (counted multi-category-aware).

## Data & taxonomy (foundation — built first)
- `src/content/dorvell.schema.ts`: add optional `categories?: DorvellCategory[]` and
  `mediaType?: "photo" | "video"` (additive, back-compat). Consumers read `imageCategories(img)` =
  `img.categories ?? [img.category]`. Expand `dorvellCategories` with `Headshots`, `Studio`,
  `Photojournalism`, `Video` (added to the existing set).
- `src/lib/social-links.ts` already exists and matches the shared `socialLinks` spec — reuse it.
- New `src/lib/portfolio-taxonomy.ts`: maps each `DorvellCategory` → `{ label, descriptor, laneKey
  (accent), blurb }`; `countByCategory(images)` (multi-category aware); `activeCategories(images)`
  (count>0 only); `imageCategories(img)`; `imageMatchesCategory(img, cat)`.
- New `src/lib/portfolio-selection.ts`: `featuredImages(images, n)`, `storyStripImages`,
  `chapterImages`, deterministic sampling (no `Math.random` at module scope — SSR safe).
- New `src/lib/color-extract.ts`: client util — downscale to 48px on offscreen canvas, HSL histogram
  (36 hue × 5 sat bins), prefer saturated mid-tones, return `{ primary, secondary }` rgb; cached per src.

## State
- `src/components/dorvell/portfolio/PortfolioModeProvider.tsx`: `mode: cinematic|calm|archive|story`;
  default cinematic desktop, calm on mobile / `prefers-reduced-motion`; persisted in `localStorage`
  (`df-portfolio-mode`). Category + subcategory filter state. Hooks `usePortfolioMode`,
  `usePortfolioFilters`. Mode switch is a real `role="radiogroup"` w/ `aria-checked`.

## Sections (mode switch swaps the primary gallery body; hero/nav/CTA persist)
1. PortfolioHero (+ mode switch, category chips, CTA) — Atlas hero + `AtlasOrbitField` WebGL backdrop (Cinematic).
2. PortfolioCategoryNav — proof strip; counts, tags, mini previews; desktop threshold-gated hover trail.
3. FeaturedGradientCarousel (NEW) — CSS-3D cards on black stage + Canvas-2D reactive gradient; physics drag/wheel/keys.
4. HorizontalStoryStrips — DOM parallax, varied per-row rates.
5. ImmersiveImageRoom (NEW raw three.js) — curved image wall, scroll-velocity vertex bend; `ssr:false`,
   IO-mount, offscreen/hidden pause, DPR cap, static-grid fallback; skipped on calm/reduced-motion.
6. ArchiveContactSheet — elevated `WorkArchive` engine (backbone).
7. ScrollFormationChapters — 2–4 chapters, scatter→assemble on scroll (IO + rAF), split-text titles.
8. SelectedWorkRing — CSS-3D ring transition, subtle grain/vignette.
9. ProjectLightbox / Drawer — extend `ImmersiveLightbox` (related images, prev/next, location/date/credit, "Book similar work").
10. PortfolioCTA — calm closing, `getSocialLinks()`.

Mode → body: Cinematic {3,5,8} · Calm {static masonry/strips} · Archive {6} · Story {4,7 + drawers}.

## Studio (`/studio`) + client doc
- Add new categories to `DEFAULT_CATEGORIES` and `dorvellCategories`; extend `SCRAPED_CATEGORY_MAP`.
- Video awareness: detect video uploads by MIME/extension → `mediaType: "video"`, auto-suggest the
  `Video` category; support dual categorization via the existing `category_primary` + `category_tags`.
- Client-facing guide: `docs/dorvell-media-categorization-guide.md`.

## Guardrails
Dark-only; cream text; teal primary + per-lane `--lane-accent`; Big Shoulders / Space Grotesk; 8px radii;
`clamp()` fluid; `--df-fast/med` easing; `min(1220px)` container; 1100/760 breakpoints. New CSS appended to
the **tail of `dorvell.css`**; every new image frame added to the `object-fit:contain` `:is(...)` list;
every new animation registered in the `prefers-reduced-motion` block. WebGL dynamically imported, IO-mounted,
paused offscreen/hidden, DPR-capped, DOM fallbacks. Full keyboard + focus-trap + alt text. npm (not pnpm).
No hydration errors, no console spam.

## Verification
`npm run lint` (--max-warnings=0), `npx tsc --noEmit`, dev smoke of `/work` in all four modes + `/studio`,
adversarial multi-agent review, then commit to `main` (local; no push unless asked).
