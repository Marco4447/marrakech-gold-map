/**
 * Live Energy Scoring System for places.
 * Calculates how "hot" a place is RIGHT NOW based on recent vibes and engagement.
 */

export interface EnergyLevel {
  score: number;
  label: string;
  emoji: string;
  color: string; // tailwind class
  cssColor: string; // for map markers
}

const LEVELS: Omit<EnergyLevel, "score">[] = [
  { label: "HOT NOW", emoji: "🔥", color: "text-orange-400", cssColor: "#fb923c" },
  { label: "PACKED", emoji: "🔴", color: "text-red-400", cssColor: "#f87171" },
  { label: "CHILL", emoji: "🟡", color: "text-yellow-400", cssColor: "#facc15" },
  { label: "HIDDEN GEM", emoji: "🟢", color: "text-emerald-400", cssColor: "#34d399" },
];

interface VibeData {
  location: string | null;
  likes: number;
  super_vibes: number;
  created_at: string;
  is_official?: boolean;
}

/**
 * Compute energy scores per place from a list of vibes.
 * Returns a Map<locationName (lowercase), EnergyLevel>
 */
export function computeEnergyScores(vibes: VibeData[]): Map<string, EnergyLevel> {
  const now = Date.now();
  const ONE_HOUR = 3600000;
  const scores = new Map<string, number>();

  for (const v of vibes) {
    if (!v.location) continue;
    const key = v.location.toLowerCase();
    const age = now - new Date(v.created_at).getTime();
    const isRecent = age < ONE_HOUR;

    // Formula: recent vibes worth 3x, likes 2x, super_vibes 4x, partner boost 2x
    let pts = 0;
    pts += isRecent ? 3 : 1;                      // vibe recency
    pts += (v.likes || 0) * 2;                     // engagement
    pts += (v.super_vibes || 0) * 4;               // super engagement
    pts += v.is_official ? 2 : 0;                  // partner boost

    scores.set(key, (scores.get(key) || 0) + pts);
  }

  const result = new Map<string, EnergyLevel>();
  for (const [key, score] of scores) {
    let level: Omit<EnergyLevel, "score">;
    if (score >= 20) level = LEVELS[0];       // HOT NOW
    else if (score >= 12) level = LEVELS[1];  // PACKED
    else if (score >= 5) level = LEVELS[2];   // CHILL
    else level = LEVELS[3];                    // HIDDEN GEM

    result.set(key, { ...level, score });
  }

  return result;
}

/**
 * Get energy for a specific place name.
 */
export function getEnergy(energyMap: Map<string, EnergyLevel>, placeName: string | null): EnergyLevel | null {
  if (!placeName) return null;
  return energyMap.get(placeName.toLowerCase()) || null;
}

/**
 * Get distance in meters between two coordinates.
 */
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format distance for display.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
