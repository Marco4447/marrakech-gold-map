import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useBlocks() {
  const { user } = useAuth();
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  const fetchBlocks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_blocks" as any)
      .select("blocked_id")
      .eq("blocker_id", user.id);
    if (data) setBlockedIds(new Set(data.map((b: any) => b.blocked_id)));
  }, [user]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const blockUser = useCallback(async (targetId: string, reason?: string) => {
    if (!user || targetId === user.id) return;
    setBlockedIds(prev => new Set(prev).add(targetId));
    await supabase.from("user_blocks" as any).insert({
      blocker_id: user.id,
      blocked_id: targetId,
      reason: reason || null,
    });
  }, [user]);

  const unblockUser = useCallback(async (targetId: string) => {
    if (!user) return;
    setBlockedIds(prev => { const next = new Set(prev); next.delete(targetId); return next; });
    await supabase.from("user_blocks" as any).delete().eq("blocker_id", user.id).eq("blocked_id", targetId);
  }, [user]);

  const isBlocked = useCallback((userId: string) => blockedIds.has(userId), [blockedIds]);

  return { blockedIds, isBlocked, blockUser, unblockUser, refetch: fetchBlocks };
}
