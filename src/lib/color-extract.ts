/**
 * Client-only dominant-colour extraction for the reactive gradient carousel.
 * Downscales an image to 48px, builds an HSL hue histogram that favours saturated
 * mid-tones (skipping near-white / near-black / grey pixels), and returns a
 * primary + secondary colour. Lightness is normalised so the two colours always
 * read as luminous blooms on the carousel's black stage. Results are cached per src.
 *
 * Ported from the gradientslider technique; no dependencies, no build step.
 */

export type Palette = {
  /** rgb triplet 0-255 */
  primary: [number, number, number];
  secondary: [number, number, number];
};

const SAMPLE_SIZE = 48;
const HUE_BINS = 36;

const cache = new Map<string, Palette>();
const inflight = new Map<string, Promise<Palette>>();

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  const seg = Math.floor(h * 6) % 6;
  if (seg === 0) [r, g, b] = [c, x, 0];
  else if (seg === 1) [r, g, b] = [x, c, 0];
  else if (seg === 2) [r, g, b] = [0, c, x];
  else if (seg === 3) [r, g, b] = [0, x, c];
  else if (seg === 4) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function normalizeBloom(rgb: [number, number, number], targetLightness: number): [number, number, number] {
  const [h, s] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  const boostedSat = Math.min(1, Math.max(0.5, s * 1.15));
  return hslToRgb(h, boostedSat, targetLightness);
}

/** A safe warm-teal palette used before extraction resolves or if it fails. */
export function fallbackPalette(seedHex = "#35e0bb"): Palette {
  const base = hexToRgb(seedHex);
  return {
    primary: normalizeBloom(base, 0.52),
    secondary: normalizeBloom(base, 0.64),
  };
}

function extractFromPixels(data: Uint8ClampedArray): Palette | null {
  const weights = new Float64Array(HUE_BINS);
  const sumR = new Float64Array(HUE_BINS);
  const sumG = new Float64Array(HUE_BINS);
  const sumB = new Float64Array(HUE_BINS);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3] / 255;
    if (a < 0.4) continue;
    const [h, s, l] = rgbToHsl(r, g, b);
    if (l < 0.1 || l > 0.92 || s < 0.08) continue;
    const w = a * s * s * (1 - Math.abs(l - 0.5) * 0.6);
    const bin = Math.min(HUE_BINS - 1, Math.floor(h * HUE_BINS));
    weights[bin] += w;
    sumR[bin] += r * w;
    sumG[bin] += g * w;
    sumB[bin] += b * w;
  }

  let primaryBin = -1;
  let primaryWeight = 0;
  for (let bin = 0; bin < HUE_BINS; bin += 1) {
    if (weights[bin] > primaryWeight) {
      primaryWeight = weights[bin];
      primaryBin = bin;
    }
  }
  if (primaryBin === -1) return null;

  const binColor = (bin: number): [number, number, number] => [
    sumR[bin] / weights[bin],
    sumG[bin] / weights[bin],
    sumB[bin] / weights[bin],
  ];

  // Secondary: strongest bin at least ~25° away in hue.
  let secondaryBin = -1;
  let secondaryWeight = 0;
  for (let bin = 0; bin < HUE_BINS; bin += 1) {
    if (weights[bin] <= 0) continue;
    const dist = Math.min(Math.abs(bin - primaryBin), HUE_BINS - Math.abs(bin - primaryBin));
    if (dist >= 3 && weights[bin] > secondaryWeight) {
      secondaryWeight = weights[bin];
      secondaryBin = bin;
    }
  }

  const primary = normalizeBloom(binColor(primaryBin), 0.52);
  const secondary =
    secondaryBin !== -1 && secondaryWeight >= primaryWeight * 0.35
      ? normalizeBloom(binColor(secondaryBin), 0.64)
      : normalizeBloom(binColor(primaryBin), 0.7);
  return { primary, secondary };
}

/**
 * Extract a palette for an image src. Resolves to a normalised primary/secondary
 * bloom. Never rejects — returns a fallback derived from `fallbackHex` on any error.
 */
export function extractPalette(src: string, fallbackHex = "#35e0bb"): Promise<Palette> {
  if (typeof window === "undefined") return Promise.resolve(fallbackPalette(fallbackHex));
  const cached = cache.get(src);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(src);
  if (pending) return pending;

  const task = (async (): Promise<Palette> => {
    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.src = src;
      await image.decode();

      const scale = Math.min(1, SAMPLE_SIZE / Math.max(image.naturalWidth, image.naturalHeight, 1));
      const w = Math.max(1, Math.round(image.naturalWidth * scale));
      const h = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("no 2d context");
      ctx.drawImage(image, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const palette = extractFromPixels(data) ?? fallbackPalette(fallbackHex);
      cache.set(src, palette);
      return palette;
    } catch {
      const palette = fallbackPalette(fallbackHex);
      cache.set(src, palette);
      return palette;
    } finally {
      inflight.delete(src);
    }
  })();

  inflight.set(src, task);
  return task;
}

export function rgbString([r, g, b]: [number, number, number], alpha = 1): string {
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
