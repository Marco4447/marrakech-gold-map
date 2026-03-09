import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookmarks")
      .select("vibe_id")
      .eq("user_id", user.id);
    if (data) setBookmarkedIds(new Set(data.map((b: any) => b.vibe_id)));
  }, [user]);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const toggleBookmark = useCallback(async (vibeId: string) => {
    if (!user) return;
    const isBookmarked = bookmarkedIds.has(vibeId);
    
    if (isBookmarked) {
      setBookmarkedIds(prev => { const next = new Set(prev); next.delete(vibeId); return next; });
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("vibe_id", vibeId);
    } else {
      setBookmarkedIds(prev => new Set(prev).add(vibeId));
      await supabase.from("bookmarks").insert({ user_id: user.id, vibe_id: vibeId } as any);
    }
  }, [user, bookmarkedIds]);

  const isBookmarked = useCallback((vibeId: string) => bookmarkedIds.has(vibeId), [bookmarkedIds]);

  return { bookmarkedIds, isBookmarked, toggleBookmark, refetch: fetchBookmarks };
}
