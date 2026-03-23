import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useFollows() {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFollows = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    
    try {
      const [followingRes, followerRes, followingCountRes] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);

      if (followingRes.data) {
        setFollowingIds(new Set(followingRes.data.map((f) => f.following_id)));
      }
      setFollowerCount(followerRes.count || 0);
      setFollowingCount(followingCountRes.count || 0);
    } catch (err) {
     
    } finally {
      setLoading(false);
    }
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

    try {
      if (wasFollowing) {
        const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
        // Insert in-app notification for the followed user
        try {
          await supabase.from("notifications" as any).insert({
            user_id: targetUserId,
            type: "follow",
            title: "Nouvel abonné",
            body: "Quelqu'un s'est abonné à toi sur Weshkech 👀",
            vibe_id: null,
          });
        } catch {
          // Silent fail — notification is not critical
        }
      }
    } catch (err: unknown) {
     
      toast.error("Erreur lors du suivi");
      // Revert optimistic update
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (wasFollowing) next.add(targetUserId);
        else next.delete(targetUserId);
        return next;
      });
      setFollowingCount(prev => wasFollowing ? prev + 1 : prev - 1);
    }
  }, [user, followingIds]);

  const getFollowerCount = useCallback(async (userId: string) => {
    const { count } = await supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId);
    return count || 0;
  }, []);

  const getFollowingCount = useCallback(async (userId: string) => {
    const { count } = await supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId);
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
