import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFollows() {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFollows = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    
    const [followingRes, followerRes, followingCountRes] = await Promise.all([
      supabase.from("follows" as any).select("following_id").eq("follower_id", user.id),
      supabase.from("follows" as any).select("id", { count: "exact", head: true }).eq("following_id", user.id),
      supabase.from("follows" as any).select("id", { count: "exact", head: true }).eq("follower_id", user.id),
    ]);

    if (followingRes.data) {
      setFollowingIds(new Set((followingRes.data as any[]).map((f: any) => f.following_id)));
    }
    setFollowerCount(followerRes.count || 0);
    setFollowingCount(followingCountRes.count || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFollows(); }, [fetchFollows]);

  const isFollowing = useCallback((userId: string) => followingIds.has(userId), [followingIds]);

  const toggleFollow = useCallback(async (targetUserId: string) => {
    if (!user || targetUserId === user.id) return;

    const wasFollowing = followingIds.has(targetUserId);

    // Optimistic update
    setFollowingIds(prev => {
      const next = new Set(prev);
      if (wasFollowing) next.delete(targetUserId);
      else next.add(targetUserId);
      return next;
    });
    setFollowingCount(prev => wasFollowing ? prev - 1 : prev + 1);

    if (wasFollowing) {
      await supabase.from("follows" as any).delete().eq("follower_id", user.id).eq("following_id", targetUserId);
    } else {
      await supabase.from("follows" as any).insert({ follower_id: user.id, following_id: targetUserId } as any);
    }
  }, [user, followingIds]);

  const getFollowerCount = useCallback(async (userId: string) => {
    const { count } = await supabase.from("follows" as any).select("id", { count: "exact", head: true }).eq("following_id", userId);
    return count || 0;
  }, []);

  const getFollowingCount = useCallback(async (userId: string) => {
    const { count } = await supabase.from("follows" as any).select("id", { count: "exact", head: true }).eq("follower_id", userId);
    return count || 0;
  }, []);

  return {
    followingIds,
    followerCount,
    followingCount,
    loading,
    isFollowing,
    toggleFollow,
    getFollowerCount,
    getFollowingCount,
    refetch: fetchFollows,
  };
}
