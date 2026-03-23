import { supabase } from "@/integrations/supabase/client";

/**
 * Mayor system: user with the most vibes at a place in the last 30 days becomes "Mayor".
 * Minimum 3 vibes required.
 */
export interface MayorInfo {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  vibeCount: number;
}

export async function getMayorOfPlace(placeName: string): Promise<MayorInfo | null> {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: vibes } = await supabase
      .from("vibes")
      .select("user_id")
      .ilike("location", placeName)
      .eq("is_official", false)
      .not("user_id", "is", null)
      .gte("created_at", since);

    if (!vibes || vibes.length === 0) return null;

    // Count per user
    const counts: Record<string, number> = {};
    vibes.forEach(v => {
      if (v.user_id) counts[v.user_id] = (counts[v.user_id] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [topUserId, topCount] = sorted[0];
    if (topCount < 3) return null;

    const { data: profile } = await supabase
      .from("profiles_public")
      .select("full_name, avatar_url")
      .eq("user_id", topUserId)
      .maybeSingle();

    return {
      userId: topUserId,
      fullName: profile?.full_name || null,
      avatarUrl: profile?.avatar_url || null,
      vibeCount: topCount,
    };
  } catch (e) {
   
    return null;
  }
}

/**
 * Get all places where a user is currently mayor (top poster with 3+ vibes in 30 days).
 */
export async function getUserMayorTerritories(userId: string): Promise<{ placeName: string; vibeCount: number }[]> {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: userVibes } = await supabase
      .from("vibes")
      .select("location")
      .eq("user_id", userId)
      .eq("is_official", false)
      .not("location", "is", null)
      .gte("created_at", since);

    if (!userVibes || userVibes.length === 0) return [];

    // Count user's vibes per location
    const userCounts: Record<string, number> = {};
    userVibes.forEach(v => {
      if (v.location) {
        const key = v.location;
        userCounts[key] = (userCounts[key] || 0) + 1;
      }
    });

    // Only consider locations with 3+ vibes
    const candidateLocations = Object.entries(userCounts).filter(([, c]) => c >= 3);
    if (candidateLocations.length === 0) return [];

    const territories: { placeName: string; vibeCount: number }[] = [];

    // For each candidate, check if user is the top poster
    for (const [placeName, userCount] of candidateLocations) {
      const { data: allVibes } = await supabase
        .from("vibes")
        .select("user_id")
        .ilike("location", placeName)
        .eq("is_official", false)
        .not("user_id", "is", null)
        .gte("created_at", since);

      if (!allVibes) continue;

      const counts: Record<string, number> = {};
      allVibes.forEach(v => {
        if (v.user_id) counts[v.user_id] = (counts[v.user_id] || 0) + 1;
      });

      const topCount = Math.max(...Object.values(counts));
      if (counts[userId] === topCount) {
        territories.push({ placeName, vibeCount: userCount });
      }
    }

    return territories;
  } catch (e) {
   
    return [];
  }
}
