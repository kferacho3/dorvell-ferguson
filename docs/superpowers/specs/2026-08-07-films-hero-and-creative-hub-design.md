# Films: Landing Hero Motion Portal + Creative Hub Integration

**Date:** 2026-08-07
**Status:** Approved for implementation

## Goal

Bring three new films into the site so that each does one job, the landing page
drives both the photography portfolio *and* the video/social work, and Instagram,
TikTok and Facebook stay permanently visible without ever sitting on top of the
footage.

The site stays the cinematic destination. Social platforms are distribution.

| Film | Source | Role |
| --- | --- | --- |
| `LOOK UP` | 7.94s, 1276×718, landscape | Muted motion doorway inside the landing hero |
| `UNBRAIDED` | 33.99s, 1276×718, landscape | Flagship featured film in the Creative Hub |
| `SUNSET STUDY` | 10.82s, 720×1280, portrait | Vertical editing study; seeds a new Editing Studies room |

## Verified destinations

Confirmed by the site owner. No destination in this spec is inferred.

- Instagram `@2kferg` — https://www.instagram.com/2kferg/
- Instagram `@fergphotography` — https://www.instagram.com/fergphotography/
- TikTok `@2kferg` — https://www.tiktok.com/@2kferg (profile only)
- Facebook — https://www.facebook.com/DJ.ferguson2 (profile only)

Exact cross-posts (drive `Watch on Instagram` rather than `Follow on Instagram`):

- UNBRAIDED — https://www.instagram.com/reel/DbJx1roxURw/
- LOOK UP — https://www.instagram.com/reel/DbWgmR1JtlY/
- SUNSET STUDY — https://www.instagram.com/reel/Dbg1rEPxdJl/

## 1. Media pipeline

Sources are renamed on import so the existing slugifier produces clean slugs:
`unbraided.mp4`, `look-up.mp4`, `sunset-study.mp4` in
`assets/raw/dorvell ferguson videos/` (git-ignored).

`scripts/optimize-dorvell-videos.mjs` gains two additive flags:

- `--loop` — emits `video-loop.mp4`: silent (`-an`), hard-cut to ≤8s, ≤1280 long
  edge, CRF 26, `+faststart`. Recorded in the manifest as `loopSrc`. This is the
  hero rendition: it makes it structurally impossible for the landing page to
  pull a full film, and it drops audio bytes the hero can never use.
- `--poster-at=<seconds>` — pick the poster frame deliberately instead of the
  automatic 15%-in heuristic.

Existing outputs are unchanged: `video.mp4` (≤1920 CRF20), `video-mobile.mp4`
(≤854 CRF27), `poster.jpg`, `poster.webp`, `thumb.webp`, `blur.jpg`.

`scripts/upload-dorvell-assets.mjs` collects `loopSrc` so `npm run upload:assets`
ships it to S3 alongside the other rendered variants.

SUNSET STUDY stays 720×1280 everywhere. No surface center-crops it to landscape.

## 2. Data model — extend, do not fork

A parallel `CreativeFilm` type is explicitly rejected: two types is how titles,
runtimes, posters and social links drift apart. `CreativeItem` in
`src/content/creative.ts` is extended instead, keeping one manifest for the whole
site.

```ts
loopSrc?: string;                     // silent hero/teaser rendition
roles?: string[];                     // Concept · Performance · Direction · …
visualLanguage?: string;              // one editorial line for the meta panel
synopsis?: string;                    // written visual description (a11y)
categoryKeys: CreativeCategoryKey[];  // primary first; replaces the single key
social?: CreativeSocial;              // per-platform profile + optional postUrl
motionPortal?: { priority: number; objectPosition?: string };
filmIndex?: number;                   // 1..3, the featured film index
```

`category` and `categoryKey` remain as derived display values (`categoryKeys[0]`)
so every existing consumer keeps working. The archive filter becomes
`categoryKeys.includes(key)`, which is what lets one film live in several rooms.

A ninth room is added: **Editing Studies** — "Cuts, repetition, split frames, and
social-first experiments" — represented by `sunset-study`.

| Film | Rooms (primary first) | Type | Index |
| --- | --- | --- | --- |
| UNBRAIDED | Cinematic Shorts, Motion Studies | `short` | 01 |
| LOOK UP | Motion Studies, City / Rooftop / Night | `motion-study` | 02 |
| SUNSET STUDY | Editing Studies, Motion Studies, City / Rooftop / Night | `motion-study` | 03 |

**The Threshold keeps its job.** It remains the `/creative` full-bleed hero
monolith (`hero: true`) and stays featured and in the archive. Only the *Featured
Film slot* changes hands to UNBRAIDED.

New selectors: `filmIndexItems` (ordered 01–03), `motionPortalFilms` (hero-eligible,
by priority), `getFilmBySlug`.

## 3. Landing hero — the Motion Portal

`HeroMotionPortal` mounts as the first child of `atlas-stage` inside
`GalleryAtlasHero`. The lane dial, proof rail, headline, photo preview and its
`priority` image are untouched — motion is added to the archive, it does not
replace it.

Load ladder. Zero video bytes transfer until every gate passes:

1. First paint renders the poster only (`next/image` + `blurDataURL`, no
   `priority` — the photography keeps it).
2. The `<video>` source attaches only when **all** hold: portal in view, page
   settled (`requestIdleCallback`), motion not reduced, connection not
   Save-Data/2g, and either desktop or an explicit mobile tap.
3. Playback is `muted loop playsInline` against `loopSrc`.

Chrome: `NOW SHOWING · MOTION 01 / 03`, `LOOK UP`, `0:08`, with `WATCH FILM`
revealed on hover/focus. No paragraph text over the frame. Activation expands the
portal's own rect into the viewer via a FLIP transition.

Hero CTA order: **Open full archive** (primary) · **Watch latest film**
(secondary) · **Book Dorvell** (ghost), followed by the quiet
`FOLLOW THE WORK / INSTAGRAM · TIKTOK · FACEBOOK` line.

Only LOOK UP loads at rest. The playlist lives inside the opened viewer.

## 4. Shared film system

- **`FilmViewer`** — the film-grade viewer: full player with progress, sound and
  fullscreen; manual `01 / 03` index that never auto-advances; meta panel; social
  action bar; related films; a `CONTINUE THE WORLD` end state that appears on
  `ended` and never interrupts playback; focus trap, Escape, focus restoration,
  FLIP entry. Used by the landing hero, the Creative Hub featured slot, and the
  film routes.
- **`CreativeLightbox`** keeps its existing job for the 23-piece archive. Films
  route to `FilmViewer`. Shared pieces are extracted rather than duplicated:
  `useFocusTrap`, `SocialActionBar`, `VideoPlayer`.
- **`SocialActionBar`** — renders `Watch on <Platform>` only when that platform
  has a real `postUrl`, and `Follow on <Platform>` when only a profile exists.
  Always text-labelled; never icon-only.
- **`useConnectionAwareMedia`** — Save-Data / `effectiveType` probe following the
  repo's `useSyncExternalStore` capability pattern.

## 5. Creative Hub

`FeaturedCreativeFilm` becomes a three-film index led by UNBRAIDED: canvas with
play/sound/fullscreen/progress on the left; `FEATURED FILM / 01`, title, thesis,
Type · Format · Mood · Visual language · Runtime · Orientation · Roles, director's
note, and `Play film` / `See the process` / `Book a creative film` on the right —
plus the persistent follow rail and discreet previous/next controls.

The archive picks all three films up automatically through `categoryKeys`, with
`Editing Studies` added to the room chips. No duplicate social-feed section is
introduced anywhere in the hub.

## 6. Film routes

`src/app/creative/[slug]/page.tsx` with `generateStaticParams` over the film
index, serving `/creative/unbraided`, `/creative/look-up`,
`/creative/sunset-study`. Each route carries unique title/description, canonical,
Open Graph poster, `VideoObject` JSON-LD, the full player, director's note,
credits, related work, social actions and a booking CTA. Added to `sitemap.ts`.

Hub cards open the viewer in place and expose an `Open film page ↗` link.
Route-intercepting parallel-route modals are deliberately **not** built: they are
real complexity for a soft-navigation nicety, and direct visits must render as
complete standalone pages either way.

## 7. Social system

Facebook is added to `dorvell.manual.ts` as a verified handle and flows through
`src/lib/social-links.ts` with an env override matching the existing TikTok
pattern, so it appears everywhere `getSocialLinks()` already renders — footer,
About, Contact, Creative CTA — and in the `sameAs` Person schema. A `FacebookIcon`
joins `social-icons.tsx` and the `SocialGlyph` map.

Three layers:

1. **Global** — a `FollowTheWork` editorial rail: monochrome at rest, platform
   colour on hover/focus only, always text-labelled, external-link semantics.
   Placed in the hero, footer, navigation drawer and Creative closing frame.
   Desktop additionally gets a low-opacity edge rail; mobile gets drawer links and
   no fixed rail.
2. **Per film** — `SocialActionBar` in every viewer, film page, and expandable on
   archive cards.
3. **Post-film** — the `CONTINUE THE WORLD` end state, after completion only.

`SocialMotionSpotlight` drops `tiktok/embed.js` and becomes a self-hosted vertical
rail led by SUNSET STUDY, one decoder at a time, closing with a link to the hub.

**New `/social` route** — the one place third-party embeds are allowed. Platform
cards for @2kferg, @fergphotography, TikTok and Facebook; the TikTok creator embed
behind a **click to load** gate so the script never enters any critical path; the
three films with their exact `Watch on` links; and copy-ready UTM campaign links
per platform and film from `src/lib/campaign-links.ts`. Linked from the footer and
the navigation drawer, not the seven-item top navigation.

## 8. Performance, accessibility, analytics

Enforced budgets:

- Zero full-film bytes on the landing page before viewer intent.
- One active video decoder in the initial viewport.
- No layout shift when a poster is replaced by video.
- Poster-first under reduced motion and Save-Data.
- No third-party script in the landing render.

Accessibility: visible play/pause and mute controls, keyboard operation, Escape to
close, focus trap and restoration, text labels on every social action, controls
kept clear of faces and silhouettes, mobile safe areas. Every film carries a
written `synopsis`. VTT caption files are **not** fabricated for music-only pieces
with no dialogue — the written synopsis is the honest equivalent.

`src/lib/analytics.ts` emits the thirteen planned events into `window.dataLayer`
when a tag manager is present and no-ops otherwise. `impression`, `autoplay start`
and `intentional play` are distinct events — muted hero autoplay is never counted
as engagement.

## 9. Styling

New stylesheets `src/styles/film.css` and `src/styles/social.css`, imported from
`globals.css`. Namespaces are fresh and grepped against `dorvell.css` before use
(the repo has a documented class-collision trap): `.fv-`, `.ftw-`, `.sab-`,
`.soc-`, `.atlas-portal-`. Each file ends with its own
`@media (prefers-reduced-motion: reduce)` block, per repo convention.

## 10. Constraints honoured

- npm, not pnpm.
- Raw CSS in per-domain stylesheets; append, never reorder `dorvell.css`.
- `react-hooks` compiler rules run as **errors**: no `setState` in effect bodies,
  no ref access during render, `--max-warnings=0`.
- `public/dorvell/videos/` is git-ignored; media ships via `npm run upload:assets`.
- Files are staged explicitly — never `git add -A` (concurrent sessions).

## 11. Out of scope

- Route-intercepting modal navigation for film routes.
- Re-encoding from original masters (current uploads are the best available
  source; no upscaling is performed or claimed).
- A generic Instagram feed wall, a second film archive, or an auto-playing Reel
  grid anywhere in the Creative Hub.
- Fabricated VTT captions.
