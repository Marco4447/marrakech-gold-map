/**
 * Places to boost to the top of all lists (first partner, etc.)
 * Add place names here (case-insensitive matching).
 */
export const BOOSTED_PLACES = ["kabana"];

export function isBoosted(name: string | null | undefined): boolean {
  if (!name) return false;
  return BOOSTED_PLACES.some(b => name.toLowerCase().includes(b));
}

/**
 * Sort comparator that puts boosted places first.
 * Use: array.sort(boostSort(item => item.name))
 */
export function boostSort<T>(getName: (item: T) => string | null | undefined) {
  return (a: T, b: T): number => {
    const aB = isBoosted(getName(a));
    const bB = isBoosted(getName(b));
    if (aB && !bB) return -1;
    if (!aB && bB) return 1;
    return 0;
  };
}
