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
    // Fetch real stories
    const { data: rawStories } = await supabase
      .from("stories" as any)
      .select("*")
      .eq("is_hidden", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    const hasRealStories = rawStories && rawStories.length > 0;

    // Fallback: use recent vibes as stories when table is empty
    let storiesData: any[] = [];
    if (hasRealStories) {
      storiesData = rawStories as any[];
    } else {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: vibes } = await supabase
        .from("vibes")
        .select("*")
        .gt("created_at", sixHoursAgo)
        .order("created_at", { ascending: false })
        .limit(20);

      if (vibes && vibes.length > 0) {
        const moodBadge: Record<string, string> = {
          hot: "HOT TONIGHT",
          chill: "RESTAURANT",
          secret: "INSIDER",
          foodie: "RESTAURANT",
        };
        storiesData = vibes.map((v: any) => ({
          id: v.id,
          source_type: v.is_official ? "partner" : "user",
          user_id: v.user_id,
          place_id: null,
          media_url: v.image_url,
          media_type: v.media_type || "photo",
          badge: moodBadge[v.mood] || (v.is_official ? "ROOFTOP" : "INSIDER"),
          caption: v.caption,
          is_featured: v.is_official,
          latitude: v.latitude,
          longitude: v.longitude,
          created_at: v.created_at,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          _vibe_location: v.location,
          _vibe_username: v.username,
          _vibe_image_url: v.image_url,
        }));
      }
    }

    if (storiesData.length === 0) {
      setStories([]);
      setLoading(false);
      return;
    }

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

    // Fetch viewed story IDs (only for real stories)
    let viewed = new Set<string>();
    if (userId && hasRealStories) {
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
        place_name: place?.name || s._vibe_location || null,
        place_category: place?.category || null,
        place_rating: place?.rating || null,
        place_address: place?.address || null,
        place_slug: place?.slug || null,
        avatar_url: place?.image_url || profile?.avatar_url || s._vibe_image_url || null,
        author_name: s.source_type === "admin" ? "Weshkech" : (place?.name || s._vibe_location || profile?.full_name || s._vibe_username || "Anon"),
        viewed: viewed.has(s.id),
      };
    });

    // Sort: priority admin > partner > user, then unviewed first, then proximity/freshness
    enriched.sort((a, b) => {
      const typePriority: Record<string, number> = { admin: 0, partner: 1, user: 2 };
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      const ta = typePriority[a.source_type] ?? 2;
      const tb = typePriority[b.source_type] ?? 2;
      if (ta !== tb) return ta - tb;
      if (!a.viewed && b.viewed) return -1;
      if (a.viewed && !b.viewed) return 1;
      if (location && a.latitude && b.latitude && a.longitude && b.longitude) {
        const distA = getDistance(location.lat, location.lng, a.latitude, a.longitude);
        const distB = getDistance(location.lat, location.lng, b.latitude, b.longitude);
        if (Math.abs(distA - distB) > 500) return distA - distB;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setStories(enriched);
    setLoading(false);
  }, [userId, location]);

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
