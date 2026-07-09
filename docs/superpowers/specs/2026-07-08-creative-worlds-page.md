# Creative Worlds — `/creative` hub

**Date:** 2026-07-08 · **Status:** built, verified (typecheck + lint + build green, live screenshots clean)

A cinematic, video-first, big-type hub for Dorvell's experimental work — shorts,
concept shoots, motion studies, BTS, and future scene concepts. Blends with the
established brand (dark `#070908`, cream `#f8f1e7`, brown-hot/teal/gold accents,
Big Shoulders Display + Space Grotesk) but reads more experimental than the
Portfolio/Modeling pages. Mirrors the Portfolio architecture (Cinematic/Calm
mode via `useSyncExternalStore`, poster-first video, lightbox).

## Media pipeline (real assets, S3-ready)

- Raw clips relocated `public/` → `assets/raw/dorvell ferguson videos/` (git-ignored;
  88 MB of raw HEVC no longer ships). Polaroid stills → `assets/raw/dorvell-2kferg-photomode/`.
- `scripts/optimize-dorvell-videos.mjs` — ffprobe metadata + H.264 mp4 (+faststart, AAC) +
  VP9 webm (kept only when smaller) + poster.jpg/.webp + thumb.webp + blur (LQIP data URI).
  `--only=posters|encode`, `--no-webm`, `--force`, concurrency pool, graceful ffmpeg-missing.
  Output: `public/dorvell/videos/dorvell-ferguson-videos/<slug>/` + `creative.media.generated.json`.
- `scripts/optimize-dorvell-photomode.mjs` — Sharp → responsive webp + LQIP → `creative.photomode.generated.json`.
- 23 clips transcoded (the HEVC hero + 2 others now play in Chrome), 8 polaroids optimized.
  Total optimized video weight ~166 MB, all lazy/poster-first.
- Titles/moods/categories authored from a **vision pass** over each generated poster
  (brand-voiced, e.g. "The Threshold", "Leather Liturgy", "Ember Cage") — not generic filler.
- **S3 seam:** every media `src` renders through `resolveCreativeAsset()` which prepends
  `NEXT_PUBLIC_ASSET_BASE_URL` when set. Data stays raw `/dorvell/...`; switch = one env var.

## Data model — `src/content/creative.ts`

Merges the generated media manifest (paths, dims, duration, orientation) with baked-in
editorial curation by slug. Types: `CreativeItem`, `CreativeMood`, `CreativeMediaType`,
`CreativeSurface`, `CreativeCategory`, `CreativeSceneIdea`, `PhotomodeSet`.
`surfaces: ["creative","modeling"|"events"|"sponsor"]` lets a clip appear on its home page too.
Exports `creativeItems`, `featuredCreativeItems`, `heroCreativeItem`, `creativeCategories`
(8 rooms), `creativeSceneIdeas` (12 concepts), `photomodeSets`, and selectors
(`getCreativeItemsForSurface`, `getCreativeItemsByCategory`, `getRelatedCreativeItems`).

## Sections (all namespaced `.cw-`, tokens only)

Hero video monolith (scroll-scaled, kinetic CREATIVE/WORLDS) · Manifesto (blur-to-sharp) ·
Featured Film "The Threshold" · Creative Rooms (bento, filters archive via event bus) ·
Scroll-Morph gallery (pinned scatter→row→bento→focus, one active clip) · Reel Runway
(full-bleed parallax wordmarks, one active clip, no scroll hijack) · Photoshoot gallery
(bento + contact-sheet strip) · Filterable Archive + Lightbox · Director's Notebook
(scene treatments) · Photomode Polaroids (flip-through) · Particle word (Canvas-2D dust,
dynamic import, reduced-motion → static) · Creative Orbit (CSS-3D ring, dynamic import) · CTA.

## Shared components

`VideoPlayer` (lazy-mount, autoplay-muted-only-in-view, pause offscreen + on `document.hidden`,
reduced-motion → poster-first, full keyboard controls), `CreativeMediaCard` (poster-first,
hover-preview only in Cinematic on hover devices), `CreativeLightbox` (+provider/hook: focus
trap, Esc/arrows/swipe, body-scroll-lock, video stops on close), `CreativeModeSwitch`,
`useInView`, `Reveal`, `icons`, `creativeMode` store, `creativeFilter` event bus.

## Cross-page + wiring

- Nav: "Creative" → `/creative` after Modeling. `sitemap.ts` + `next.config.mjs` immutable
  headers for `/dorvell/videos` + `/dorvell/creative`.
- `ModelingMotionStrip` on `/modeling` pulls `getCreativeItemsForSurface("modeling")`
  (self-contained `.cw-scope` + own lightbox provider; additive, no changes to modeling system).
- Social: reuses shared `getSocialLinks()` / `socialLinks` (TikTok env-gated; no guessed URL).

## Constraints honored

react-hooks/set-state-in-effect + react-hooks/refs (errors) — no direct setState in effect
bodies, no ref read/write in render. `--max-warnings=0` lint clean. No autoplay audio; ≤1
autoplaying clip at a time; IntersectionObserver + `document.hidden` pausing; dynamic import
for canvas/3D; `prefers-reduced-motion` + `Save-Data` respected; no CLS (aspect-boxed + LQIP).

## Follow-ups

- S3/CloudFront migration (set `NEXT_PUBLIC_ASSET_BASE_URL`).
- Real transcripts/captions (data-model stub present).
- Optional: surface music/sponsor clips on dedicated pages if those routes are added.
