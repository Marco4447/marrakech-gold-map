/**
 * Database-driven boosted places system.
 * Replaces the old hardcoded BOOSTED_PLACES array.
 * Cached in memory with 5-minute refresh.
 */
import { supabase } from "@/integrations/supabase/client";

interface BoostedPlace {
  place_id: string;
  place_name: string;
  priority: number;
}

let cache: BoostedPlace[] = [];
let cacheTime = 0;
let cacheDisabled = false;
let refreshInFlight: Promise<void> | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function refreshCache() {
  if (cacheDisabled) return;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const { data, error } = await supabase
        .from("boosted_places" as any)
        .select("place_id, priority, places!inner(name)")
        .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
        .order("priority", { ascending: true });

      if (error) {
        if ((error as { code?: string }).code === "PGRST205") {
          cacheDisabled = true;
          cache = [];
          console.warn("[boostedPlaces] Table missing; feature temporarily disabled.");
          return;
        }
        console.error("[boostedPlaces] Query failed:", error);
        return;
      }

      cache = (data ?? []).map((d: any) => ({
        place_id: d.place_id,
        place_name: (d.places?.name || "").toLowerCase(),
        priority: d.priority,
      }));
    } catch (err) {
      console.error("[boostedPlaces] Cache refresh failed:", err);
    } finally {
      cacheTime = Date.now();
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function ensureCache() {
  if (cacheDisabled) return;
  if (Date.now() - cacheTime > CACHE_TTL) {
    void refreshCache();
  }
}

// Initialize on load
void refreshCache();

export function isBoosted(name: string | null | undefined): boolean {
  if (!name) return false;
  ensureCache();
  const lower = name.toLowerCase();
  return cache.some((b) => lower.includes(b.place_name) || b.place_name.includes(lower));
}

export function boostPriority(name: string | null | undefined): number {
  if (!name) return -1;
  ensureCache();
  const lower = name.toLowerCase();
  const match = cache.find((b) => lower.includes(b.place_name) || b.place_name.includes(lower));
  return match ? match.priority : -1;
}

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
