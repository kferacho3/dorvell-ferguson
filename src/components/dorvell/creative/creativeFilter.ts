import type { CreativeCategoryKey } from "@/content/creative";

/**
 * Tiny decoupled bus so the Creative Rooms and Scene ideas can focus the
 * archive filter without prop-drilling through the orchestrator.
 */
export const CREATIVE_FILTER_EVENT = "cw:creative-filter";

export type CreativeFilterDetail = { category: CreativeCategoryKey };

export function emitCreativeFilter(category: CreativeCategoryKey) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CreativeFilterDetail>(CREATIVE_FILTER_EVENT, { detail: { category } }));
}
