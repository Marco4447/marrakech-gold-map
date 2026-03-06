/**
 * Places to boost to the top of all lists (first partner, etc.)
 * Add place names here (case-insensitive matching).
 */
export const BOOSTED_PLACES = ["coco", "kabana"];

export function isBoosted(name: string | null | undefined): boolean {
  if (!name) return false;
  return BOOSTED_PLACES.some(b => name.toLowerCase().includes(b));
}

/**
 * Returns boost priority (lower = higher priority). -1 if not boosted.
 */
export function boostPriority(name: string | null | undefined): number {
  if (!name) return -1;
  const lower = name.toLowerCase();
  const idx = BOOSTED_PLACES.findIndex(b => lower.includes(b));
  return idx === -1 ? -1 : idx;
}

/**
 * Sort comparator that puts boosted places first, respecting order in BOOSTED_PLACES.
 * Use: array.sort(boostSort(item => item.name))
 */
export function boostSort<T>(getName: (item: T) => string | null | undefined) {
  return (a: T, b: T): number => {
    const aP = boostPriority(getName(a));
    const bP = boostPriority(getName(b));
    const aB = aP >= 0;
    const bB = bP >= 0;
    if (aB && !bB) return -1;
    if (!aB && bB) return 1;
    if (aB && bB) return aP - bP;
    return 0;
  };
}
