/**
 * Creative Worlds — content model for the /creative hub.
 *
 * Two sources merge here by slug:
 *  1. `creative.media.generated.json` — produced by scripts/optimize-dorvell-videos.mjs
 *     (web-safe mp4/webm paths, poster/blur/thumb, real width/height/duration/orientation
 *     read from ffprobe). Committed; never hand-edited.
 *  2. The editorial curation baked in this file (title, description, director's note,
 *     room/category, moods, tags) — authored from a vision pass over each clip's poster.
 *
 * Every clip belongs to Creative. `surfaces` lets a clip ALSO appear on the page
 * it was shot for (modeling clips on /modeling, etc.) without duplicating data.
 *
 * Raw public paths are stored as-is; resolution to a CDN base happens at render
 * via `resolveCreativeAsset` (see @/lib/creative-assets).
 */

import mediaManifest from "./creative.media.generated.json";
import photomodeManifest from "./creative.photomode.generated.json";
import { getFilmPlatforms, type FilmPlatform } from "@/lib/social-links";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreativeMediaType =
  | "video"
  | "photo"
  | "photoshoot"
  | "short"
  | "bts"
  | "motion-study"
  | "concept";

export type CreativeMood =
  | "cinematic"
  | "horror"
  | "suspense"
  | "thriller"
  | "comedy"
  | "liminal"
  | "nature"
  | "city"
  | "rooftop"
  | "abandoned"
  | "fashion"
  | "gym"
  | "shadow"
  | "reflection"
  | "surreal"
  | "documentary"
  | "experimental";

/** A clip belongs to Creative and optionally surfaces on its "home" page too. */
export type CreativeSurface = "creative" | "modeling" | "events" | "sponsor";

export type CreativeOrientation = "portrait" | "landscape" | "square";

export type CreativeStatus = "concept" | "in-progress" | "shot" | "released";

/** The nine "Creative Rooms" / concept categories. */
export type CreativeCategoryKey =
  | "cinematic-shorts"
  | "creative-photoshoots"
  | "motion-studies"
  | "editing-studies"
  | "liminal-suspense"
  | "city-night"
  | "nature-surreal"
  | "comedy-character"
  | "behind-the-scenes";

// ---------------------------------------------------------------------------
// Film social distribution
// ---------------------------------------------------------------------------

/**
 * A film's action on one platform. `postUrl` is present ONLY when the exact
 * cross-post is verified — that is what lets the UI say "Watch on Instagram"
 * instead of "Follow on Instagram". Never send someone to a profile under a
 * label that promises the film.
 */
export type CreativeSocialLink = {
  platform: FilmPlatform;
  /** Full platform name; always rendered as text, never icon-only. */
  label: string;
  handle: string;
  profileUrl: string;
  postUrl?: string;
  /** True when `postUrl` exists — the "Watch on" vs "Follow on" switch. */
  hasPost: boolean;
};

export type CreativeItem = {
  id: string;
  slug: string;
  title: string;
  type: CreativeMediaType;
  category: string;
  categoryKey: CreativeCategoryKey;
  moods: CreativeMood[];
  tags: string[];
  /** Every room this piece belongs to, primary first. `categoryKey` is [0]. */
  categoryKeys: CreativeCategoryKey[];
  description: string;
  directorNote?: string;
  /** Credited roles — what Dorvell actually did on this piece. */
  roles?: string[];
  /** One editorial line describing the shot language, for the meta panel. */
  visualLanguage?: string;
  /** Written visual description, for dialogue-free cinematic pieces (a11y). */
  synopsis?: string;
  /** Per-platform actions. Absent for archive pieces that were never posted. */
  social?: CreativeSocialLink[];
  /** Set when this piece is one of the numbered featured films (1-based). */
  filmIndex?: number;
  /** Landing-hero eligibility. Lower priority wins the portal. */
  motionPortal?: { priority: number; objectPosition?: string };
  // media (raw public paths — resolve at render)
  mp4Src: string; // desktop / HD (near-original)
  mobileSrc: string; // mobile / compressed
  /** Silent <=8s cut for hero/teaser autoplay. Never the full film. */
  loopSrc?: string;
  posterSrc: string;
  posterWebpSrc: string;
  thumbSrc: string;
  blurSrc: string;
  blurDataURL?: string;
  width: number;
  height: number;
  duration: number;
  orientation: CreativeOrientation;
  hasAudio: boolean;
  sourceFolderLabel: string;
  originalFileName: string;
  surfaces: CreativeSurface[];
  featured?: boolean;
  hero?: boolean;
  location?: string;
  status: CreativeStatus;
  /** Optional transcript/caption stub — TODO: author real transcripts. */
  transcript?: string;
};

export type CreativeCategory = {
  key: CreativeCategoryKey;
  label: string;
  blurb: string;
  /** Slug whose poster represents the room in the Rooms grid. */
  representativeSlug: string;
  tags: string[];
};

export type CreativeSceneIdea = {
  id: string;
  title: string;
  mood: string;
  location: string;
  note: string;
  shotLanguage: string;
  runtime: string;
  status: CreativeStatus;
  tags: string[];
  /** A poster reused purely as background texture for the treatment card. */
  textureSlug?: string;
};

export type PhotomodeImage = {
  slug: string;
  originalFileName: string;
  width: number;
  height: number;
  orientation: CreativeOrientation;
  lgSrc: string;
  mdSrc: string;
  blurSrc: string;
  blurDataURL: string;
};

export type PhotomodeSet = {
  slug: string;
  label: string;
  sourceFolder: string;
  items: PhotomodeImage[];
};

// ---------------------------------------------------------------------------
// Categories — the eight Creative Rooms
// ---------------------------------------------------------------------------

export const creativeCategories: CreativeCategory[] = [
  {
    key: "cinematic-shorts",
    label: "Cinematic Shorts",
    blurb: "Short films built around mood, movement, and scene.",
    representativeSlug: "the-threshold",
    tags: ["shadow", "suspense", "story", "score"],
  },
  {
    key: "creative-photoshoots",
    label: "Creative Photoshoots",
    blurb: "Unusual concepts, styling, experimental light, and visual worlds.",
    representativeSlug: "misc-creative-4",
    tags: ["styling", "chiaroscuro", "editorial", "concept"],
  },
  {
    key: "motion-studies",
    label: "Motion Studies",
    blurb: "Body language, pacing, walking, silhouette, and reflection.",
    representativeSlug: "modeling-1",
    tags: ["walk", "silhouette", "reflection", "runway"],
  },
  {
    key: "editing-studies",
    label: "Editing Studies",
    blurb: "Cuts, repetition, split frames, and social-first experiments.",
    representativeSlug: "sunset-study",
    tags: ["cut", "repetition", "split-frame", "experiment"],
  },
  {
    key: "liminal-suspense",
    label: "Liminal / Horror / Suspense",
    blurb: "Empty rooms, blinds, shadows, hallways, night streets.",
    representativeSlug: "misc-creative-6",
    tags: ["liminal", "shadow", "still", "tension"],
  },
  {
    key: "city-night",
    label: "City / Rooftop / Night",
    blurb: "Urban atmosphere, skyline pressure, neon, parking decks.",
    representativeSlug: "fireworks",
    tags: ["skyline", "night", "crowd", "neon"],
  },
  {
    key: "nature-surreal",
    label: "Nature / Surreal",
    blurb: "Open horizons, water, light, and a strange kind of calm.",
    representativeSlug: "sponsor-2",
    tags: ["horizon", "light", "calm", "surreal"],
  },
  {
    key: "comedy-character",
    label: "Comedy / Character",
    blurb: "Playful scenes, expressive sketches, unexpected edits.",
    representativeSlug: "kicked-out-1",
    tags: ["character", "candid", "timing", "play"],
  },
  {
    key: "behind-the-scenes",
    label: "Behind the Scenes",
    blurb: "Lighting tests, wardrobe, camera setup, the creative process.",
    representativeSlug: "modeling-3",
    tags: ["process", "lighting", "wardrobe", "outtakes"],
  },
];

const categoryKeyByLabel: Record<string, CreativeCategoryKey> = Object.fromEntries(
  creativeCategories.map((c) => [c.label, c.key]),
);

// ---------------------------------------------------------------------------
// Editorial curation (authored from a vision pass over each poster) + wiring
// ---------------------------------------------------------------------------

type Curation = {
  slug: string;
  title: string;
  /** description shown on cards / lightbox */
  description: string;
  directorNote: string;
  /** Primary room label. Extra rooms go in `alsoIn`. */
  category: string;
  /** Additional room labels this piece also belongs to. */
  alsoIn?: string[];
  moods: CreativeMood[];
  tags: string[];
  type: CreativeMediaType;
  roles?: string[];
  visualLanguage?: string;
  synopsis?: string;
  /**
   * Verified exact cross-posts, per platform. Profile URLs are NOT declared
   * here — they come from `getFilmPlatforms()` so a handle can never drift.
   * A platform omitted here still renders, as "Follow on <Platform>".
   */
  posts?: Partial<Record<FilmPlatform, string>>;
  filmIndex?: number;
  motionPortal?: { priority: number; objectPosition?: string };
  featured?: boolean;
  hero?: boolean;
  location?: string;
  status?: CreativeStatus;
};

/**
 * Ordered newest-forward. `type` reflects the media's creative form; `category`
 * is the room. `surfaces` is derived from the slug below.
 */
const curation: Curation[] = [
  {
    slug: "unbraided",
    title: "Unbraided",
    description:
      "A self-directed study of release — hair, frame, light, rhythm, and movement loosening together.",
    directorNote:
      "It starts outside, braided and composed, then moves indoors and never leaves the warm room again. The camera stays close enough to make the hands the subject: fingers working a braid loose, the weight of it dropping, the shape of the head changing frame by frame. Backlight through the blinds keeps him a silhouette while the work is still private, and only once the hair is fully out does the key come around to the face. The last look into the lens is the whole point — nothing has been added, something has just been let go.",
    category: "Cinematic Shorts",
    alsoIn: ["Motion Studies"],
    moods: ["cinematic", "documentary", "fashion", "reflection", "experimental"],
    tags: ["hair", "portrait", "transformation", "warm light", "self-direction", "motion", "freedom"],
    type: "short",
    roles: ["Concept", "Performance", "Direction", "Shooting", "Editing"],
    visualLanguage: "Window silhouette, warm interior key, hands in frame, macro on the braid, close-up eye, golden fall-off",
    synopsis:
      "A man stands outside in a red tank top, hair braided close to the scalp. The film moves indoors, where he works in front of a bright window — first as a backlit silhouette, then in close-up under warm lamplight. His hands take each braid apart in turn; the hair lifts and widens until it fills the frame. Macro shots hold on texture and on one eye. The final shot is a direct look into the lens with the hair fully loose. No dialogue; music-led throughout.",
    posts: { instagram: "https://www.instagram.com/reel/DbJx1roxURw/" },
    filmIndex: 1,
    featured: true,
    status: "released",
  },
  {
    slug: "look-up",
    title: "Look Up",
    description:
      "A held breath above the city — skyline, fading light, and a moment of stillness before the archive opens.",
    directorNote:
      "Eight seconds, two ideas. The skyline first, held long enough that the sky does the work: Tampa going magenta behind the Truist crown and the PNC tower, the whole grid dimming a stop at a time. Then the cut to the back of his head against a pale, emptied sky — no face, no eyeline, just the gesture of looking up. It was shot to be the smallest possible film, the kind you can put in the corner of a page and let breathe.",
    category: "Motion Studies",
    alsoIn: ["City / Rooftop / Night"],
    moods: ["cinematic", "city", "rooftop", "nature"],
    tags: ["skyline", "sunset", "breath", "rooftop", "silhouette", "Tampa", "atmosphere"],
    type: "motion-study",
    roles: ["Concept", "Shooting", "Editing"],
    visualLanguage: "Locked wide on the skyline, long dusk hold, cut to a low back-of-head against open sky",
    synopsis:
      "The Tampa skyline at dusk, shot wide and static. The sky runs orange to magenta behind the towers; lit signage and windows pick out the buildings as the light drops. The film cuts to a low angle behind a man's head and shoulders, framed against a pale, near-empty sky, his face turned upward and away from camera. No dialogue; ambient and music-led.",
    posts: { instagram: "https://www.instagram.com/reel/DbWgmR1JtlY/" },
    filmIndex: 2,
    motionPortal: { priority: 1 },
    featured: true,
    location: "Tampa, FL",
    status: "released",
  },
  {
    slug: "sunset-study",
    title: "Sunset Study",
    description:
      "A vertical editing experiment built from a rooftop, a silhouette, repeating frames, and the last light of the day.",
    directorNote:
      "This one is about the cut, not the shot. Everything was captured on the same parking deck in the same twenty minutes, then taken apart in the edit: the same silhouette returning in different sizes, hard drops to black between beats, a defocus repeated until it reads as a rhythm instead of a mistake. It lives in a 9:16 canvas with the frame letterboxed inside it on purpose — built for the phone, framed like a film. This is the start of a lane, not a one-off.",
    category: "Editing Studies",
    alsoIn: ["Motion Studies", "City / Rooftop / Night"],
    moods: ["experimental", "cinematic", "city", "rooftop", "reflection"],
    tags: ["sunset", "editing study", "vertical", "frame repetition", "rooftop", "silhouette", "letterbox"],
    type: "motion-study",
    roles: ["Concept", "Performance", "Shooting", "Editing"],
    visualLanguage: "9:16 canvas with letterboxed frame, hard cuts to black, repeated silhouette, deliberate defocus",
    synopsis:
      "A vertical piece whose image sits letterboxed inside the frame, with black above and below. On a parking-deck roof at sunset, a man stands and then sits against the low wall, silhouetted against an orange and pink sky with towers and palms behind him. The edit cuts hard to black between beats and returns to the same silhouette at different sizes, ending on repeated, deliberately defocused frames of the figure against the colour. No dialogue; music-led.",
    posts: { instagram: "https://www.instagram.com/reel/Dbg1rEPxdJl/" },
    filmIndex: 3,
    featured: true,
    location: "Tampa, FL",
    status: "released",
  },
  {
    slug: "the-threshold",
    title: "The Threshold",
    description:
      "A short cinematic study built around shadow, reflection, discipline, and the feeling of stepping into frame.",
    directorNote:
      "The piece moves between silhouette, eye contact, abstract blur, and gym/body imagery — a visual study of pressure before action. Shoot him as a shape, never a face, and let the dusk bleed through the slats while the figure decides whether to cross the line between the room and the world.",
    category: "Cinematic Shorts",
    moods: ["cinematic", "liminal", "shadow", "suspense"],
    tags: ["low light", "blinds", "closeup", "mirror", "body language", "training"],
    type: "short",
    featured: true,
    hero: true,
    status: "released",
  },
  {
    slug: "modeling-2",
    title: "Ember Cage",
    description: "Wire and ember bloom where a face should be, the studio held in blue silence.",
    directorNote:
      "Keep the key light flat and cold so the rust mask is the only pulse in frame, let the open leather and chain breathe, and shoot the turn slow enough that the wire crown trembles.",
    category: "Creative Photoshoots",
    moods: ["fashion", "experimental", "surreal", "cinematic", "shadow"],
    tags: ["mask", "wire", "ember", "couture", "chain", "studio"],
    type: "photoshoot",
    featured: true,
  },
  {
    slug: "misc-creative-4",
    title: "Leather Liturgy",
    description: "A silver cross holds the last warm light before black leather swallows it whole.",
    directorNote:
      "Shot from below in single-source chiaroscuro so cream light only grazes the beard, the zipper, and the crucifix while everything else dissolves into black.",
    category: "Creative Photoshoots",
    moods: ["cinematic", "fashion", "shadow", "experimental"],
    tags: ["leather", "crucifix", "chiaroscuro", "close-up", "warm-light", "shadow"],
    type: "photoshoot",
    featured: true,
  },
  {
    slug: "modeling-1",
    title: "Twin Shadows",
    description: "One man crosses the white; two shadows follow where one should.",
    directorNote:
      "Head-on in a blown-out cove with hard cross-light, the cobalt hood carries the frame's only color while paired shadows fan out like wings, turning a simple walk into an arrival.",
    category: "Motion Studies",
    moods: ["cinematic", "fashion", "shadow", "reflection", "experimental"],
    tags: ["cobalt", "hood", "double-shadow", "runway", "silhouette", "reflection"],
    type: "motion-study",
    featured: true,
  },
  {
    slug: "misc-creative-5",
    title: "Crimson Exit",
    description: "He steps from a warm crimson doorway into winter, wrapped in fur and silence.",
    directorNote:
      "Let the vermilion facade read as a wall of heat and have him emerge from it — fur heavy, head bowed, loafers finding the snow — so the exit plays as reluctance rather than swagger.",
    category: "Creative Photoshoots",
    moods: ["fashion", "city", "cinematic", "liminal"],
    tags: ["fur coat", "crimson", "storefront", "snow", "doorway", "winter"],
    type: "photoshoot",
    featured: true,
  },
  {
    slug: "fireworks",
    title: "The Gathering Hour",
    description: "A city holds its breath in the last warm light before the sky ignites.",
    directorNote:
      "Shoot wide and patient, letting the crowd's small movements and the Tampa skyline carry the anticipation while dusk haze does the emotional work, so every burst of color is saved for the sky itself.",
    category: "City / Rooftop / Night",
    moods: ["cinematic", "city", "documentary", "nature"],
    tags: ["crowd", "skyline", "dusk", "palms", "gathering"],
    type: "video",
    featured: true,
    location: "Tampa, FL",
  },
  {
    slug: "music-event-swaelee",
    title: "Nobody Breathe",
    description: "A crimson stage, a thousand glowing screens, and one breath held before the drop.",
    directorNote:
      "Shot from inside the crush of raised phones, letting the red wash sink the crowd into silhouette so the artist stays the only warm body in the frame.",
    category: "City / Rooftop / Night",
    moods: ["cinematic", "documentary", "city", "shadow"],
    tags: ["concert", "crimson", "silhouette", "crowd", "phones", "stage-light"],
    type: "video",
    featured: true,
  },
  {
    slug: "modeling-5",
    title: "Gilded Ascent",
    description: "A phoenix in black walks the runway dark, gold burning at his chest.",
    directorNote:
      "Hold the walk on a long lens so the gold Quintus phoenix reads as a single moving ember while the seated crowd dissolves to shadow on either side.",
    category: "Motion Studies",
    moods: ["fashion", "cinematic", "shadow", "documentary"],
    tags: ["runway", "phoenix", "gold", "silhouette", "fashion-week", "spotlight"],
    type: "motion-study",
  },
  {
    slug: "modeling-4",
    title: "Skyline Cadence",
    description: "A man in black cuts across a burning skyline, keeping the city's time.",
    directorNote:
      "Shot the walk as one unbroken beat, letting the LED skyline breathe behind him so the runway reads like a lit street at midnight.",
    category: "Motion Studies",
    moods: ["fashion", "cinematic", "city", "shadow"],
    tags: ["runway", "skyline", "silhouette", "monochrome", "night", "walk"],
    type: "motion-study",
  },
  {
    slug: "modeling-3",
    title: "Amber Nocturne",
    description: "A silk-draped stride through the amber hush after hours.",
    directorNote:
      "Slow push-in on the approaching walk so the room reads as a runway he already owns, warm practicals held in tension against one cold teal screen.",
    category: "Motion Studies",
    moods: ["cinematic", "fashion", "reflection", "shadow"],
    tags: ["walk", "silk", "medallion", "amber", "reflection", "night"],
    type: "motion-study",
  },
  {
    slug: "misc-creative-6",
    title: "Platform 9927",
    description: "Head bowed on cold tile, a figure in black holds the platform to himself.",
    directorNote:
      "Shoot him full-length and dead-center so the mirrored steel train car becomes a moving backdrop, letting the yellow edge-line and warm station bounce carry the only color against his all-black silhouette.",
    category: "City / Rooftop / Night",
    moods: ["cinematic", "city", "fashion", "documentary", "shadow"],
    tags: ["subway", "all-black", "overcoat", "steel", "platform", "solitude"],
    type: "video",
  },
  {
    slug: "misc-creative-1",
    title: "Service Entrance",
    description: "Rust against teal, he turns a service door into a runway.",
    directorNote:
      "Shoot it flat and patient in overcast light — let the teal wall and the warm plaid fight for the frame while he holds dead-still, the only motion the tilt of his head.",
    category: "Creative Photoshoots",
    moods: ["fashion", "city", "cinematic", "experimental"],
    tags: ["streetwear", "teal", "loading-dock", "industrial", "plaid", "complementary"],
    type: "photoshoot",
  },
  {
    slug: "misc-creative-2",
    title: "Two Twenty-Three",
    description: "He pauses at door 223, bleached denim against slate, weekend not yet begun.",
    directorNote:
      "Shoot it flat and frontal so the painted facade reads as a stage flat, letting the bent profile, frayed hem, and lone cross-body strap carry all the motion.",
    category: "Creative Photoshoots",
    moods: ["fashion", "city", "cinematic", "documentary"],
    tags: ["streetwear", "denim", "doorway", "profile", "slate", "sidewalk"],
    type: "photoshoot",
  },
  {
    slug: "misc-creative-3",
    title: "Hothouse",
    description: "Barred light, borrowed ivy, one still figure holding the warm room together.",
    directorNote:
      "Root him dead-center between the twin orange chairs, let the louvered sun stripe the floor, and use the standing mirror to quietly double the look.",
    category: "Creative Photoshoots",
    moods: ["fashion", "cinematic", "shadow", "reflection", "nature"],
    tags: ["sunroom", "houseplants", "louvered-light", "mirror", "layered-styling", "warm-daylight"],
    type: "photoshoot",
  },
  {
    slug: "misc-creative-7",
    title: "Chrome & Cream",
    description: "Noon caught in chrome lenses, a face tilted just past the world's gaze.",
    directorNote:
      "Shoot tight and low so the mirrored lens becomes a second frame — let the reflected street tell its own story while the cream nova-check and diamond stud carry all the warmth.",
    category: "Creative Photoshoots",
    moods: ["fashion", "cinematic", "reflection", "experimental"],
    tags: ["sunglasses", "reflection", "plaid", "close-up", "daylight", "streetwear"],
    type: "photoshoot",
  },
  {
    slug: "misc-creative-8",
    title: "Adornment",
    description: "He dresses like a rite — burgundy wool, raw denim, silver at the throat.",
    directorNote:
      "Shoot it close and unhurried, letting the hands, the layered pearls, and the tucked hem carry the scene while one soft key light holds the warm room.",
    category: "Creative Photoshoots",
    moods: ["fashion", "cinematic", "documentary", "experimental"],
    tags: ["burgundy", "raw-denim", "pearls", "styling", "warm-light", "portrait"],
    type: "photoshoot",
  },
  {
    slug: "music-event-ian",
    title: "Red Hour",
    description: "Shades on in the black, one figure holds the red as the room goes to sound.",
    directorNote:
      "Let the darkness carry it — a single red-washed silhouette in sunglasses, the crowd reduced to shapes, so the yellow date lands like a flyer flashed in a dark room.",
    category: "Cinematic Shorts",
    moods: ["cinematic", "shadow", "documentary", "fashion"],
    tags: ["night", "red-light", "sunglasses", "silhouette", "concert", "crowd"],
    type: "short",
  },
  {
    slug: "music-event",
    title: "Black Encore",
    description: "All leather and low light, he walks the dark toward a room that already knows him.",
    directorNote:
      "Shoot it as one unbroken push-in — keep him dead-center against the cool seamless wall and let the studded leather catch the only warm glint in an otherwise blacked-out frame.",
    category: "Creative Photoshoots",
    moods: ["fashion", "cinematic", "shadow", "experimental"],
    tags: ["silhouette", "leather", "runway", "monochrome", "low-light", "stride"],
    type: "video",
  },
  {
    slug: "sponsor-1",
    title: "Cold Front",
    description: "A red parcel burns against the white; the man stays cold.",
    directorNote:
      "Shot high-key on draped muslin so the red Cold Culture parcel reads as the only heat in the frame — stance, pearls, and wide-leg denim carry the pitch instead of the product.",
    category: "Creative Photoshoots",
    moods: ["fashion", "cinematic", "documentary"],
    tags: ["streetwear", "high-key", "red-accent", "studio", "pearls", "product"],
    type: "photoshoot",
  },
  {
    slug: "sponsor-2",
    title: "Salt Horizon",
    description: "He listens to something the ocean can't hear, back turned to the glare.",
    directorNote:
      "Hold a single over-the-shoulder as the blown-out horizon swallows the frame, letting the maroon collar and the thin white cord stay the only anchors in the light.",
    category: "Nature / Surreal",
    moods: ["cinematic", "nature", "fashion", "documentary"],
    tags: ["ocean", "over-the-shoulder", "high-key", "earbuds", "coastal", "profile"],
    type: "short",
  },
  {
    slug: "misc-creative-9",
    title: "Corridor Serenade",
    description: "Between two doors, he borrows a stranger's song and sells it like his own.",
    directorNote:
      "Keep the lens low, close, and slightly warped so the corridor carpet and warm wood crowd the frame, and never let the take feel rehearsed.",
    category: "Comedy / Character",
    moods: ["documentary", "experimental", "comedy", "fashion"],
    tags: ["selfie", "corridor", "lip-sync", "handheld", "pearls", "candid"],
    type: "video",
  },
  {
    slug: "kicked-out-1",
    title: "Eighty-Sixed",
    description: "Tossed to the frozen curb at closing time, he makes the exit a performance.",
    directorNote:
      "Shoot it handheld under the sodium light and let him stumble into frame — the joke lives in the recovery, not the fall.",
    category: "Comedy / Character",
    moods: ["comedy", "city", "cinematic", "fashion"],
    tags: ["night", "sidewalk", "motion", "streetlight", "winter", "candid"],
    type: "video",
  },
  {
    slug: "kicked-out-2",
    title: "Grand Exit",
    description: "Escorted out in camel and cobalt, he makes the pavement look rehearsed.",
    directorNote:
      "Shoot it wide and unbroken so the tailoring reads before the pratfall does — the joke is the dignity, never the tumble.",
    category: "Comedy / Character",
    moods: ["comedy", "city", "fashion", "documentary"],
    tags: ["sidewalk", "pratfall", "camel-coat", "cobalt", "daylight", "onlookers"],
    type: "video",
  },
];

// ---------------------------------------------------------------------------
// Merge media + curation → creativeItems
// ---------------------------------------------------------------------------

type RawMedia = {
  slug: string;
  originalFileName: string;
  sourceFolderLabel: string;
  codec: string;
  width: number;
  height: number;
  orientation: string;
  duration: number;
  hasAudio: boolean;
  publicDir: string;
  mp4Src: string;
  mobileSrc?: string;
  loopSrc?: string;
  posterSrc: string;
  posterWebpSrc: string;
  thumbSrc: string;
  blurSrc: string;
  blurDataURL?: string;
};

const media = mediaManifest as Record<string, RawMedia>;

/** Derive the surfaces a clip appears on from its slug family. */
function surfacesFor(slug: string): CreativeSurface[] {
  if (slug.startsWith("modeling-")) return ["creative", "modeling"];
  if (slug.startsWith("music-event")) return ["creative", "events"];
  if (slug.startsWith("sponsor-")) return ["creative", "sponsor"];
  return ["creative"];
}

/** Resolve a room label to its key, failing loudly on a typo. */
function categoryKeyFor(label: string, slug: string): CreativeCategoryKey {
  const key = categoryKeyByLabel[label];
  if (!key) throw new Error(`[creative.ts] Unknown category "${label}" for ${slug}`);
  return key;
}

/**
 * Build a film's per-platform actions. Profile destinations always come from
 * `getFilmPlatforms()`; the curation entry contributes only verified post URLs.
 * A platform with no post still renders — as "Follow on", never "Watch on".
 */
function buildSocial(c: Curation): CreativeSocialLink[] | undefined {
  if (!c.posts && c.filmIndex === undefined) return undefined;
  return getFilmPlatforms().map((source) => {
    const postUrl = c.posts?.[source.platform];
    return {
      platform: source.platform,
      label: source.label,
      handle: source.handle,
      profileUrl: source.profileUrl,
      postUrl,
      hasPost: Boolean(postUrl),
    };
  });
}

function buildItem(c: Curation): CreativeItem {
  const m = media[c.slug];
  if (!m) {
    throw new Error(
      `[creative.ts] No optimized media for "${c.slug}". Run: node scripts/optimize-dorvell-videos.mjs`,
    );
  }
  const categoryKeys = [c.category, ...(c.alsoIn ?? [])].map((label) =>
    categoryKeyFor(label, c.slug),
  );
  const categoryKey = categoryKeys[0];
  return {
    id: c.slug,
    slug: c.slug,
    title: c.title,
    type: c.type,
    category: c.category,
    categoryKey,
    categoryKeys,
    moods: c.moods,
    tags: c.tags,
    description: c.description,
    directorNote: c.directorNote,
    roles: c.roles,
    visualLanguage: c.visualLanguage,
    synopsis: c.synopsis,
    social: buildSocial(c),
    filmIndex: c.filmIndex,
    motionPortal: c.motionPortal,
    mp4Src: m.mp4Src,
    mobileSrc: m.mobileSrc ?? m.mp4Src,
    loopSrc: m.loopSrc,
    posterSrc: m.posterSrc,
    posterWebpSrc: m.posterWebpSrc,
    thumbSrc: m.thumbSrc,
    blurSrc: m.blurSrc,
    blurDataURL: m.blurDataURL,
    width: m.width,
    height: m.height,
    duration: m.duration,
    orientation: (m.orientation as CreativeOrientation) ?? "portrait",
    hasAudio: m.hasAudio,
    sourceFolderLabel: m.sourceFolderLabel,
    originalFileName: m.originalFileName,
    surfaces: surfacesFor(c.slug),
    featured: c.featured,
    hero: c.hero,
    location: c.location,
    status: c.status ?? "released",
  };
}

export const creativeItems: CreativeItem[] = curation.map(buildItem);

export const featuredCreativeItems: CreativeItem[] = creativeItems.filter((i) => i.featured);

export const heroCreativeItem: CreativeItem =
  creativeItems.find((i) => i.hero) ?? creativeItems[0];

// ---------------------------------------------------------------------------
// Films — the numbered, socially-distributed pieces
// ---------------------------------------------------------------------------

/**
 * The featured film index, ordered 01..N. This is what the Creative Hub's
 * featured slot pages through and what the viewer uses as its playlist. It is
 * deliberately small: everything else lives in the archive.
 */
export const filmIndexItems: CreativeItem[] = creativeItems
  .filter((i) => i.filmIndex !== undefined)
  .sort((a, b) => (a.filmIndex ?? 0) - (b.filmIndex ?? 0));

/**
 * Films eligible for the landing-page motion portal, best first. Only films
 * with a silent `loopSrc` qualify — the hero must never be able to reach for a
 * full film's bytes.
 */
export const motionPortalFilms: CreativeItem[] = creativeItems
  .filter((i) => i.motionPortal && i.loopSrc)
  .sort((a, b) => (a.motionPortal?.priority ?? 99) - (b.motionPortal?.priority ?? 99));

/** The single film that quietly brings the landing hero to life. */
export const motionPortalFilm: CreativeItem | undefined = motionPortalFilms[0];

export function getFilmBySlug(slug: string): CreativeItem | undefined {
  return filmIndexItems.find((i) => i.slug === slug);
}

/** Runtime as `m:ss` — one formatter, so no surface can disagree with another. */
export function formatRuntime(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const m = Math.floor(safe / 60);
  const s = Math.round(safe % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Human label for an orientation, used in film metadata panels. */
export function orientationLabel(orientation: CreativeOrientation): string {
  if (orientation === "portrait") return "Vertical · 9:16";
  if (orientation === "landscape") return "Landscape · 16:9";
  return "Square · 1:1";
}

// ---------------------------------------------------------------------------
// Director's Notebook — future scene concepts (worlds still being built)
// ---------------------------------------------------------------------------

export const creativeSceneIdeas: CreativeSceneIdea[] = [
  {
    id: "liminal-gym",
    title: "Liminal Gym",
    mood: "Liminal · Pressure",
    location: "Empty 24-hour gym, fluorescent",
    note: "Empty machines, fluorescent hum, slow breath — one body moving through a space that feels too still.",
    shotLanguage: "Locked wide → slow dolly → single hard cut on the rep.",
    runtime: "0:30–0:45",
    status: "in-progress",
    tags: ["gym", "liminal", "fluorescent", "solitude"],
    textureSlug: "the-threshold",
  },
  {
    id: "rooftop-pressure",
    title: "Rooftop Pressure",
    mood: "City · Tension",
    location: "Downtown rooftop at blue hour",
    note: "Wide skyline, wind on the clothes, a slow push-in and one sudden look into camera.",
    shotLanguage: "Drone-low push → handheld snap → hold on the eyes.",
    runtime: "0:30–0:45",
    status: "concept",
    tags: ["rooftop", "skyline", "wind", "city"],
    textureSlug: "modeling-4",
  },
  {
    id: "abandoned-house",
    title: "Abandoned House",
    mood: "Suspense · Memory",
    location: "Vacant house, dust and daylight",
    note: "Soft dust, open doorways, footsteps, and a subject framed like a memory.",
    shotLanguage: "Doorway framing → rack focus → footstep sound design.",
    runtime: "0:30–0:45",
    status: "concept",
    tags: ["abandoned", "dust", "doorway", "memory"],
    textureSlug: "misc-creative-6",
  },
  {
    id: "parking-deck",
    title: "Parking Deck",
    mood: "Night · Neon",
    location: "Level 6 parking deck",
    note: "Sodium light, wet concrete, headlight streaks — a figure between the pillars.",
    shotLanguage: "Symmetrical wide → headlight flare → strobe cut.",
    runtime: "0:30",
    status: "concept",
    tags: ["parking", "neon", "night", "concrete"],
    textureSlug: "misc-creative-1",
  },
  {
    id: "window-blinds",
    title: "Window Blinds / Shadow Lines",
    mood: "Shadow · Study",
    location: "Bare room, low sun",
    note: "Horizontal shadow lines crossing the body, a hand breaking the light, breath fogging glass.",
    shotLanguage: "Macro on the slats → tilt to face → dissolve to black.",
    runtime: "0:30",
    status: "in-progress",
    tags: ["blinds", "shadow", "closeup", "light"],
    textureSlug: "the-threshold",
  },
  {
    id: "night-streets",
    title: "Night Streets",
    mood: "City · Motion",
    location: "Wet downtown streets after rain",
    note: "Reflections in puddles, passing headlights, a walk that never breaks stride.",
    shotLanguage: "Tracking gimbal → puddle reflection → neon sign wipe.",
    runtime: "0:30–0:45",
    status: "concept",
    tags: ["night", "reflection", "walk", "neon"],
    textureSlug: "misc-creative-2",
  },
  {
    id: "horror-hallway",
    title: "Horror Hallway",
    mood: "Horror · Dread",
    location: "Long motel corridor",
    note: "A hallway that stretches, a light that flickers one beat late, a door left ajar.",
    shotLanguage: "Center-frame dolly → flicker on the off-beat → whip to the door.",
    runtime: "0:30",
    status: "concept",
    tags: ["horror", "hallway", "flicker", "dread"],
    textureSlug: "misc-creative-9",
  },
  {
    id: "nature-dusk",
    title: "Nature at Dusk",
    mood: "Nature · Calm",
    location: "Open field / shoreline, golden hour",
    note: "Tall grass or shoreline, wind, a subject small against the light — a strange, held calm.",
    shotLanguage: "Long lens compression → backlit rim → slow fade up of score.",
    runtime: "0:45",
    status: "concept",
    tags: ["nature", "dusk", "wind", "calm"],
    textureSlug: "sponsor-2",
  },
  {
    id: "mirrors-reflections",
    title: "Mirrors / Reflections",
    mood: "Surreal · Identity",
    location: "Room of mirrors / storefront glass",
    note: "The subject multiplied and split, reflections that move a half-second out of sync.",
    shotLanguage: "Reflection-first reveal → focus pull between selves → match cut.",
    runtime: "0:30",
    status: "concept",
    tags: ["mirror", "reflection", "surreal", "identity"],
    textureSlug: "misc-creative-3",
  },
  {
    id: "comedy-character",
    title: "Comedy Character Bit",
    mood: "Comedy · Timing",
    location: "Everyday public space",
    note: "A small everyday situation played completely straight until one perfectly-timed beat breaks it.",
    shotLanguage: "Deadpan lock-off → hold too long → single reaction cut.",
    runtime: "0:30",
    status: "in-progress",
    tags: ["comedy", "character", "timing", "deadpan"],
    textureSlug: "kicked-out-1",
  },
  {
    id: "thriller-chase",
    title: "Thriller Chase Fragment",
    mood: "Thriller · Kinetic",
    location: "Stairwells / alleys, night",
    note: "Fragments of a chase — breath, footsteps, a glance back — never showing who or why.",
    shotLanguage: "Handheld fragments → hard cuts on impact → sound-led edit.",
    runtime: "0:30",
    status: "concept",
    tags: ["thriller", "chase", "kinetic", "night"],
    textureSlug: "misc-creative-6",
  },
  {
    id: "fashion-motion-test",
    title: "Fashion Motion Test",
    mood: "Fashion · Movement",
    location: "Seamless studio / found runway",
    note: "Wardrobe in motion — fabric weight, a turn, a walk — testing how a look reads as a scene.",
    shotLanguage: "Long-lens walk → fabric close-up → mirror double.",
    runtime: "0:30–0:45",
    status: "shot",
    tags: ["fashion", "motion", "runway", "fabric"],
    textureSlug: "modeling-2",
  },
];

// ---------------------------------------------------------------------------
// Photomode (polaroid) sets — @2kferg TikTok stills
// ---------------------------------------------------------------------------

export const photomodeSets: PhotomodeSet[] = Object.values(
  photomodeManifest as Record<string, PhotomodeSet>,
);

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export function getCreativeItem(slug: string): CreativeItem | undefined {
  return creativeItems.find((i) => i.slug === slug);
}

/** Items that should appear on a given surface (page). */
export function getCreativeItemsForSurface(surface: CreativeSurface): CreativeItem[] {
  return creativeItems.filter((i) => i.surfaces.includes(surface));
}

/** Every piece in a room — including pieces whose primary room is another one. */
export function getCreativeItemsByCategory(key: CreativeCategoryKey): CreativeItem[] {
  return creativeItems.filter((i) => i.categoryKeys.includes(key));
}

/** Related items — same category first, then shared moods, excluding self. */
export function getRelatedCreativeItems(slug: string, limit = 3): CreativeItem[] {
  const item = getCreativeItem(slug);
  if (!item) return [];
  const scored = creativeItems
    .filter((i) => i.slug !== slug)
    .map((i) => {
      const sharedMoods = i.moods.filter((m) => item.moods.includes(m)).length;
      const sharedRooms = i.categoryKeys.filter((k) => item.categoryKeys.includes(k)).length;
      return { i, score: sharedRooms * 3 + sharedMoods };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.i);
}

/** The distinct moods present across the library (for archive filters). */
export const creativeMoodFacets: CreativeMood[] = Array.from(
  new Set(creativeItems.flatMap((i) => i.moods)),
).sort();

export const creativeFormatFacets: CreativeOrientation[] = ["portrait", "landscape", "square"];

/** Total runtime of the library in seconds (for a stat line). */
export const creativeTotalRuntime = Math.round(
  creativeItems.reduce((sum, i) => sum + i.duration, 0),
);
