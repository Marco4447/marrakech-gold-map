import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Camera, Heart, AlertCircle, Loader2, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import VibeComments, { useCommentCounts } from "./VibeComments";
import { getDeviceId } from "@/lib/deviceId";
import { analytics } from "@/lib/analytics";
import type { Vibe, VibeProfile } from "@/types/models";
import { isBoosted } from "@/lib/boostedPlaces";
import TikTokFeed from "./TikTokFeed";
import LiveHeader from "./live/LiveHeader";
import Top3Podium from "./live/Top3Podium";
import VibeCard from "./live/VibeCard";

const SIX_HOURS = 6 * 60 * 60 * 1000;
const THIRTY_MIN = 30 * 60 * 1000;
const MAX_POSTS_PER_WINDOW = 3;

function getScore(v: Vibe) {
  return v.likes + (v.super_vibes || 0) * 3;
}

type FeedTab = "tendances" | "recents";

export default function LivePage({ refreshSignal = 0, onGoToMap }: { refreshSignal?: number; onGoToMap?: (lat: number, lng: number) => void }) {
  const { user } = useAuth();
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [postLimitReached, setPostLimitReached] = useState(false);
  const [commentVibeId, setCommentVibeId] = useState<string | null>(null);
  const [superVibeIds, setSuperVibeIds] = useState<Set<string>>(new Set());
  const [superVibeAnimId, setSuperVibeAnimId] = useState<string | null>(null);
  const [canSuperVibe, setCanSuperVibe] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showTikTokFeed, setShowTikTokFeed] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>("tendances");
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem("weshkech_vibez_tutorial_seen");
  });
  const [visibleCount, setVisibleCount] = useState(10);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const commentCounts = useCommentCounts(vibes.map((v) => v.id));
  
  const [doubleTapId, setDoubleTapId] = useState<string | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  const [reactionsVibeId, setReactionsVibeId] = useState<string | null>(null);
  const [floatingReaction, setFloatingReaction] = useState<{ id: string; emoji: string } | null>(null);

  const handleDoubleTap = (vibeId: string) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.id === vibeId && now - lastTapRef.current.time < 300) {
      if (!likedIds.has(vibeId)) {
        handleLike(vibeId);
      }
      setDoubleTapId(vibeId);
      setTimeout(() => setDoubleTapId(null), 800);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { id: vibeId, time: now };
    }
  };

  const handleReaction = (vibeId: string, emoji: string) => {
    setFloatingReaction({ id: vibeId, emoji });
    setReactionsVibeId(null);
    if (!likedIds.has(vibeId)) handleLike(vibeId);
    setTimeout(() => setFloatingReaction(null), 900);
  };

  const userVibeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    vibes.forEach((v) => {
      if (v.user_id) counts[v.user_id] = (counts[v.user_id] || 0) + 1;
    });
    return counts;
  }, [vibes]);

  const deviceId = getDeviceId();

  const fetchVibes = useCallback(async () => {
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from("vibes")
        .select("id, image_url, caption, insider_tip, location, latitude, longitude, likes, super_vibes, username, user_id, created_at, media_type, mood, is_official")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      if (data) {
        const userIds = [...new Set(data.filter(v => v.user_id).map(v => v.user_id))] as string[];
        let profilesMap: Record<string, VibeProfile> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles_public")
            .select("user_id, full_name, avatar_url, is_vip")
            .in("user_id", userIds);
          if (profiles) {
            profilesMap = Object.fromEntries(profiles.filter(p => p.user_id).map(p => [p.user_id!, p]));
          }
        }
        const vibesWithProfiles = data.map(v => ({
          ...v,
          profile: v.user_id ? profilesMap[v.user_id] || null : null,
        }));
        setVibes(vibesWithProfiles);
      }
    } catch (err) {
     
      setFetchError("Impossible de charger le feed. Vérifie ta connexion.");
    }
    setLoading(false);
  }, []);

  const userId = user?.id;

  const fetchMyLikes = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("vibe_likes")
      .select("vibe_id")
      .eq("user_id", userId);
    if (data) {
      setLikedIds(new Set(data.map((l) => l.vibe_id)));
    }
    const { data: oldData } = await supabase
      .from("vibe_likes")
      .select("vibe_id")
      .eq("device_id", deviceId)
      .is("user_id", null);
    if (oldData) {
      setLikedIds(prev => {
        const next = new Set(prev);
        oldData.forEach((l) => next.add(l.vibe_id));
        return next;
      });
    }
  }, [userId, deviceId]);

  const fetchMySuperVibes = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("vibe_super_vibes")
      .select("vibe_id, created_at")
      .eq("user_id", userId);
    if (data) {
      setSuperVibeIds(new Set(data.map((s) => s.vibe_id)));
      const recent = data.some((s) => Date.now() - new Date(s.created_at).getTime() < SIX_HOURS);
      setCanSuperVibe(!recent);
    }
  }, [userId]);

  const checkPostLimit = useCallback(async () => {
    const localPosts = JSON.parse(localStorage.getItem("wk_post_timestamps") || "[]") as number[];
    const recentPosts = localPosts.filter((t) => Date.now() - t < SIX_HOURS);
    setPostLimitReached(recentPosts.length >= MAX_POSTS_PER_WINDOW);
  }, []);

  useEffect(() => {
    fetchVibes();
    fetchMyLikes();
    fetchMySuperVibes();
    checkPostLimit();

    // Only refresh on tab visibility change (realtime handles live updates)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void fetchVibes();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const channel = supabase
      .channel("vibes-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vibes" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newVibe = payload.new as Vibe;
            setVibes((prev) => {
              if (prev.some((v) => v.id === newVibe.id)) return prev;
              return [newVibe, ...prev];
            });
          } else if (payload.eventType === "DELETE") {
            setVibes((prev) => prev.filter((v) => v.id !== (payload.old as any).id));
          } else if (payload.eventType === "UPDATE") {
            setVibes((prev) =>
              prev.map((v) => v.id === (payload.new as Vibe).id ? { ...v, ...(payload.new as Vibe) } : v)
            );
          }
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [fetchVibes, fetchMyLikes, fetchMySuperVibes, checkPostLimit, refreshSignal]);

  const handleLike = async (vibeId: string) => {
    const alreadyLiked = likedIds.has(vibeId);
    analytics.likeVibe(vibeId);
    setAnimatingId(vibeId);
    setTimeout(() => setAnimatingId(null), 400);

    if (alreadyLiked) {
      setLikedIds((prev) => { const next = new Set(prev); next.delete(vibeId); return next; });
      setVibes((prev) => prev.map((v) => (v.id === vibeId ? { ...v, likes: Math.max(0, v.likes - 1) } : v)));
      if (userId) {
        await supabase.from("vibe_likes").delete().eq("vibe_id", vibeId).eq("user_id", userId);
      }
      await supabase.from("vibe_likes").delete().eq("vibe_id", vibeId).eq("device_id", deviceId).is("user_id", null);
      await supabase.rpc("increment_vibe_likes", { p_vibe_id: vibeId, p_delta: -1 });
    } else {
      setLikedIds((prev) => new Set(prev).add(vibeId));
      setVibes((prev) => prev.map((v) => (v.id === vibeId ? { ...v, likes: v.likes + 1 } : v)));
      await supabase.from("vibe_likes").insert({ vibe_id: vibeId, device_id: deviceId, user_id: userId ?? undefined });
      await supabase.rpc("increment_vibe_likes", { p_vibe_id: vibeId, p_delta: 1 });
    }
  };

  const handleSuperVibe = async (vibeId: string) => {
    if (!canSuperVibe || superVibeIds.has(vibeId)) return;
    analytics.superVibe(vibeId);
    setSuperVibeAnimId(vibeId);
    setTimeout(() => setSuperVibeAnimId(null), 700);

    setSuperVibeIds((prev) => new Set(prev).add(vibeId));
    setCanSuperVibe(false);
    setVibes((prev) => prev.map((v) => (v.id === vibeId ? { ...v, super_vibes: (v.super_vibes || 0) + 1 } : v)));
    await supabase.from("vibe_super_vibes").insert({ vibe_id: vibeId, device_id: deviceId, user_id: userId ?? undefined });
    await supabase.rpc("increment_vibe_super_vibes", { p_vibe_id: vibeId, p_delta: 1 });
  };

  const handleDeleteVibe = async (vibeId: string) => {
    setDeletingId(vibeId);
    try {
      const { error } = await supabase.from("vibes").delete().eq("id", vibeId);
      if (error) throw error;
      setVibes((prev) => prev.filter((v) => v.id !== vibeId));
      toast.success("Vibe supprimé");
    } catch (err) {
     
      toast.error("Impossible de supprimer");
    } finally {
      setDeletingId(null);
    }
  };

  // ===== DERIVED DATA =====
  const officialVibes = vibes.filter((v) => v.is_official);
  const regularVibes = vibes.filter((v) => !v.is_official);
  
  const top3Vibes = [...regularVibes]
    .filter(v => getScore(v) > 0)
    .sort((a, b) => getScore(b) - getScore(a))
    .slice(0, 3);

  const sortedFeed = activeTab === "tendances"
    ? [...officialVibes, ...regularVibes].sort((a, b) => {
        const aB = isBoosted(a.location);
        const bB = isBoosted(b.location);
        if (aB && !bB) return -1;
        if (!aB && bB) return 1;
        if (a.is_official && !b.is_official) return -1;
        if (!a.is_official && b.is_official) return 1;
        return getScore(b) - getScore(a);
      })
    : [...officialVibes, ...regularVibes].sort((a, b) => {
        const aB = isBoosted(a.location);
        const bB = isBoosted(b.location);
        if (aB && !bB) return -1;
        if (!aB && bB) return 1;
        if (a.is_official && !b.is_official) return -1;
        if (!a.is_official && b.is_official) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => prev + 10);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sortedFeed.length]);

  useEffect(() => { setVisibleCount(10); }, [activeTab]);

  const visibleFeed = sortedFeed.slice(0, visibleCount);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 relative">
      <LiveHeader
        userId={user?.id}
        vibeCount={vibes.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onShowTikTokFeed={() => setShowTikTokFeed(true)}
      />

      {/* Tutorial overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-5 max-w-sm w-full"
            >
              <h2 className="text-base font-semibold text-foreground text-center mb-4">Comment ça marche ?</h2>
              <div className="space-y-3.5">
                {[
                  { icon: Heart, label: "Like ❤️", desc: "Montre ton soutien — plus un post est liké, plus il monte." },
                  { icon: () => <span className="text-sm">⚡</span>, label: "Super Vibe ⚡", desc: "Booste x3 ! Propulse un post dans le Top 3. Limité à 1/6h." },
                  { icon: () => <span className="text-sm">💬</span>, label: "Commentaires", desc: "Clique sur un post pour laisser un commentaire." },
                  { icon: () => <span className="text-sm">🔥</span>, label: "Top 3 🔥", desc: "Les 3 vibes les plus populaires sont mises en avant." },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0">
                      {typeof Icon === 'function' && Icon.length === 0 ? <Icon /> : <Icon className="w-4 h-4 text-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  localStorage.setItem("weshkech_vibez_tutorial_seen", "1");
                  setShowTutorial(false);
                }}
                className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold bg-foreground text-background"
              >
                C'est compris !
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {fetchError ? (
        <div className="flex flex-col items-center justify-center h-[60vh] px-8 text-center">
          <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">{fetchError}</p>
          <button onClick={() => { setLoading(true); fetchVibes(); }} className="text-sm font-semibold text-foreground underline">Réessayer</button>
        </div>
      ) : loading ? (
        <div className="space-y-0 divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
                <div className="h-3 w-24 bg-card animate-pulse rounded" />
              </div>
              <div className="aspect-[4/5] bg-card animate-pulse" />
            </div>
          ))}
        </div>
      ) : vibes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-3">
            <Camera className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1.5">Aucun vibe live</h2>
          <p className="text-sm text-muted-foreground">Sois le premier à partager ton vibe !</p>
        </div>
      ) : (
        <>
          {activeTab === "tendances" && (
            <Top3Podium
              top3Vibes={top3Vibes}
              commentCounts={commentCounts}
              onOpenComments={setCommentVibeId}
            />
          )}

          {/* ===== MAIN FEED ===== */}
          <div className="divide-y divide-border">
            {visibleFeed.map((vibe, i) => (
              <VibeCard
                key={vibe.id}
                vibe={vibe}
                index={i}
                liked={likedIds.has(vibe.id)}
                isAnimating={animatingId === vibe.id}
                doubleTapId={doubleTapId}
                superVibeIds={superVibeIds}
                superVibeAnimId={superVibeAnimId}
                canSuperVibe={canSuperVibe}
                deletingId={deletingId}
                commentCounts={commentCounts}
                userVibeCounts={userVibeCounts}
                reactionsVibeId={reactionsVibeId}
                floatingReaction={floatingReaction}
                activeTab={activeTab}
                currentUserId={user?.id}
                onLike={handleLike}
                onSuperVibe={handleSuperVibe}
                onDelete={handleDeleteVibe}
                onDoubleTap={handleDoubleTap}
                onOpenComments={setCommentVibeId}
                onReaction={handleReaction}
                onSetReactionsVibeId={setReactionsVibeId}
                onGoToMap={onGoToMap}
              />
            ))}
            {visibleCount < sortedFeed.length ? (
              <div ref={sentinelRef} className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sortedFeed.length > 0 && (
              <div className="flex flex-col items-center py-8 text-center gap-2">
                <span className="text-2xl">🔥</span>
                <p className="text-sm font-semibold text-foreground">Tu as tout vu !</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">Reviens bientôt pour de nouvelles vibes ou partage la tienne.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Comments sheet */}
      <VibeComments
        vibeId={commentVibeId || ""}
        open={!!commentVibeId}
        onOpenChange={(open) => !open && setCommentVibeId(null)}
      />

      {/* TikTok-style Reels Feed */}
      <AnimatePresence>
        {showTikTokFeed && (
          <TikTokFeed open={showTikTokFeed} onClose={() => setShowTikTokFeed(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
