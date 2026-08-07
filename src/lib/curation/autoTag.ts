/**
 * Category implication rules shared by the studio reducer and the
 * auto-tag script. Some categories always travel with a companion tag:
 * music photos are events by definition, and modeling frames are portraits.
 */
export const CATEGORY_IMPLICATIONS: Record<string, readonly string[]> = {
  Music: ["Event"],
  Modeling: ["Portrait"],
};

/**
 * Returns the tag list expanded with every implied companion category,
 * deduped, with the primary category never repeated as a tag.
 * Original tag order is preserved; implied tags append after it.
 */
export function withImpliedTags(primary: string | null, tags: readonly string[]): string[] {
  const active = new Set<string>(primary ? [primary, ...tags] : tags);
  const queue = Array.from(active);
  while (queue.length > 0) {
    const category = queue.pop() as string;
    for (const implied of CATEGORY_IMPLICATIONS[category] ?? []) {
      if (!active.has(implied)) {
        active.add(implied);
        queue.push(implied);
      }
    }
  }
  const result: string[] = [];
  for (const tag of [...tags, ...active]) {
    if (tag === primary || result.includes(tag)) continue;
    result.push(tag);
  }
  return result;
}
