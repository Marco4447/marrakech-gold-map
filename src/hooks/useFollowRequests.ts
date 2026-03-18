import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface FollowRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: string;
  created_at: string;
}

export function useFollowRequests() {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<FollowRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FollowRequest[]>([]);

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    const [{ data: incoming }, { data: outgoing }] = await Promise.all([
      supabase.from("follow_requests" as any)
        .select("*")
        .eq("target_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase.from("follow_requests" as any)
        .select("*")
        .eq("requester_id", user.id)
        .eq("status", "pending"),
    ]);

    if (incoming) setPendingRequests(incoming as any[]);
    if (outgoing) setSentRequests(outgoing as any[]);
  }, [user]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const sendRequest = useCallback(async (targetId: string) => {
    if (!user || targetId === user.id) return;
    const { error } = await supabase.from("follow_requests" as any).insert({
      requester_id: user.id,
      target_id: targetId,
    });
    if (error) {
      if (error.code === "23505") toast.info("Demande déjà envoyée");
      else toast.error("Erreur lors de l'envoi");
      return;
    }
    setSentRequests(prev => [...prev, { id: "", requester_id: user.id, target_id: targetId, status: "pending", created_at: new Date().toISOString() }]);
    toast.success("Demande d'abonnement envoyée");

    // Notify target user
    try {
      await supabase.from("notifications" as any).insert({
        user_id: targetId,
        type: "follow_request",
        title: "Demande d'abonnement",
        body: "Quelqu'un souhaite te suivre",
      });
    } catch {}
  }, [user]);

  const acceptRequest = useCallback(async (requestId: string, requesterId: string) => {
    if (!user) return;
    await supabase.from("follow_requests" as any).update({ status: "accepted" } as any).eq("id", requestId);
    // Actually create the follow
    await supabase.from("follows").insert({ follower_id: requesterId, following_id: user.id });
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    toast.success("Abonnement accepté");
  }, [user]);

  const rejectRequest = useCallback(async (requestId: string) => {
    await supabase.from("follow_requests" as any).update({ status: "rejected" } as any).eq("id", requestId);
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  const cancelRequest = useCallback(async (targetId: string) => {
    if (!user) return;
    await supabase.from("follow_requests" as any).delete().eq("requester_id", user.id).eq("target_id", targetId);
    setSentRequests(prev => prev.filter(r => r.target_id !== targetId));
  }, [user]);

  const hasPendingRequest = useCallback((targetId: string) => {
    return sentRequests.some(r => r.target_id === targetId);
  }, [sentRequests]);

  return {
    pendingRequests,
    sentRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    hasPendingRequest,
    refetch: fetchRequests,
    pendingCount: pendingRequests.length,
  };
}
