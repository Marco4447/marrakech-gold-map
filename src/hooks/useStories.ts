import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserLocation } from "@/hooks/useUserLocation";

export interface Story {
  id: string;
  source_type: "admin" | "partner" | "user";
  user_id: string | null;
  place_id: string | null;
  media_url: string;
  media_type: string;
  badge: string | null;
  caption: string | null;
  is_featured: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  expires_at: string;
  // joined
  place_name?: string | null;
  place_category?: string | null;
  place_rating?: number | null;
  place_address?: string | null;
  place_slug?: string | null;
  avatar_url?: string | null;
  author_name?: string | null;
  viewed?: boolean;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useStories(userId?: string | null) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const location = useUserLocation();

  const fetchStories = useCallback(async () => {
    // Fetch stories
    const { data: rawStories } = await supabase
      .from("stories" as any)
      .select("*")
      .eq("is_hidden", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    if (!rawStories || rawStories.length === 0) {
      setStories([]);
      setLoading(false);
      return;
    }

    const storiesData = rawStories as any[];

    // Fetch place info for stories with place_id
    const placeIds = [...new Set(storiesData.filter((s) => s.place_id).map((s) => s.place_id!))];
    let placesMap: Record<string, any> = {};
    if (placeIds.length > 0) {
      const { data: places } = await supabase
        .from("places")
        .select("id, name, category, rating, address, slug, image_url")
        .in("id", placeIds);
      if (places) placesMap = Object.fromEntries(places.map((p) => [p.id, p]));
    }

    // Fetch user profiles
    const userIds = [...new Set(storiesData.filter((s) => s.user_id).map((s) => s.user_id!))];
    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles_public" as any)
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      if (profiles) profilesMap = Object.fromEntries((profiles as any[]).map((p) => [p.user_id, p]));
    }

    // Fetch viewed story IDs
    let viewed = new Set<string>();
    if (userId) {
      const storyIds = storiesData.map((s) => s.id);
      const { data: views } = await supabase
        .from("story_views" as any)
        .select("story_id")
        .eq("user_id", userId)
        .in("story_id", storyIds);
      if (views) viewed = new Set((views as any[]).map((v) => v.story_id));
    }
    setViewedIds(viewed);

    // Build enriched stories
    const enriched: Story[] = storiesData.map((s) => {
      const place = s.place_id ? placesMap[s.place_id] : null;
      const profile = s.user_id ? profilesMap[s.user_id] : null;
      return {
        ...s,
        place_name: place?.name || null,
        place_category: place?.category || null,
        place_rating: place?.rating || null,
        place_address: place?.address || null,
        place_slug: place?.slug || null,
        avatar_url: place?.image_url || profile?.avatar_url || null,
        author_name: s.source_type === "admin" ? "Weshkech" : (place?.name || profile?.full_name || "Anon"),
        viewed: viewed.has(s.id),
      };
    });

    // Sort: priority admin > partner > user, then unviewed first, then proximity/freshness
    enriched.sort((a, b) => {
      const typePriority: Record<string, number> = { admin: 0, partner: 1, user: 2 };
      // Featured first
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      // Source type
      const ta = typePriority[a.source_type] ?? 2;
      const tb = typePriority[b.source_type] ?? 2;
      if (ta !== tb) return ta - tb;
      // Unviewed first
      if (!a.viewed && b.viewed) return -1;
      if (a.viewed && !b.viewed) return 1;
      // Proximity
      if (position && a.latitude && b.latitude && a.longitude && b.longitude) {
        const distA = getDistance(position.lat, position.lng, a.latitude, a.longitude);
        const distB = getDistance(position.lat, position.lng, b.latitude, b.longitude);
        if (Math.abs(distA - distB) > 500) return distA - distB;
      }
      // Freshness
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setStories(enriched);
    setLoading(false);
  }, [userId, position]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const markViewed = useCallback(async (storyId: string) => {
    if (viewedIds.has(storyId)) return;
    setViewedIds((prev) => new Set(prev).add(storyId));
    setStories((prev) => prev.map((s) => (s.id === storyId ? { ...s, viewed: true } : s)));
    await supabase.from("story_views" as any).insert({ story_id: storyId, user_id: userId || null } as any);
  }, [userId, viewedIds]);

  return { stories, loading, markViewed, refetch: fetchStories };
}
