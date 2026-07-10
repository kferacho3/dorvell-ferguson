/**
 * Single seam for where Creative media is served from.
 *
 * The optimized video/photo library lives in a public-read S3 bucket, so we
 * serve from it BY DEFAULT — prod and dev need zero env config. Data stays
 * portable (raw `/dorvell/...` paths); resolution to the base happens only at
 * render. Override with `NEXT_PUBLIC_ASSET_BASE_URL` (e.g. a CloudFront domain),
 * or set it to "" to serve from local `/public` instead.
 *
 * Upload after (re)optimizing: `npm run upload:assets`. To point at a CDN later,
 * change DEFAULT_ASSET_BASE (or set the env var) — nothing else changes.
 */

const DEFAULT_ASSET_BASE = "https://dorvell-ferguson.s3.us-east-2.amazonaws.com";
// undefined env → S3 default; explicit "" → local /public; explicit URL → that URL
const RAW_BASE = (process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? DEFAULT_ASSET_BASE).replace(/\/+$/, "");

/** Prepend the asset base (when configured) to a root-relative public path. */
export function resolveCreativeAsset<T extends string | null | undefined>(path: T): T {
  if (!path) return path;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  if (!RAW_BASE) return path;
  return (`${RAW_BASE}${path.startsWith("/") ? "" : "/"}${path}`) as T;
}

/** Whether the library is being served from an external base (S3/CDN). */
export const usesExternalAssetBase = RAW_BASE.length > 0;
