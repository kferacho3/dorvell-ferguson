/**
 * Single seam for where Creative media is served from.
 *
 * Today every optimized video/photo lives under `public/dorvell/...` and these
 * helpers are pass-throughs. When Dorvell moves the library to S3/CloudFront,
 * set `NEXT_PUBLIC_ASSET_BASE_URL` (e.g. "https://cdn.dorvellferguson.com") and
 * every creative asset resolves through it — no data or component changes. Data
 * stays portable (raw `/dorvell/...` paths); resolution happens only at render.
 */

const RAW_BASE = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/+$/, "") ?? "";

/** Prepend the asset base (when configured) to a root-relative public path. */
export function resolveCreativeAsset<T extends string | null | undefined>(path: T): T {
  if (!path) return path;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  if (!RAW_BASE) return path;
  return (`${RAW_BASE}${path.startsWith("/") ? "" : "/"}${path}`) as T;
}

/** Whether the library is being served from an external base (S3/CDN). */
export const usesExternalAssetBase = RAW_BASE.length > 0;
