import { useEffect, useState, useRef, useCallback } from "react";
import { Camera, MapPin, Clock, X, Loader2, Send, ImageIcon, Heart, TrendingUp, AlertCircle, MessageCircle, Zap, Trash2, Video, Volume2, VolumeX, Flame, Sparkles, Crown, Share2, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import VibeComments, { useCommentCounts } from "./VibeComments";
import SuperVibeParticles from "./SuperVibeParticles";
import { timeAgo } from "@/lib/timeAgo";
import { getDeviceId } from "@/lib/deviceId";
import { analytics } from "@/lib/analytics";
import type { VibeProfile } from "@/types/models";
import { isBoosted } from "@/lib/boostedPlaces";
import { getShareUrl } from "@/lib/shareUrl";
import StoriesModule from "./stories/StoriesModule";
import DoubleTapHeart from "./DoubleTapHeart";
import VibeReactions, { FloatingReaction } from "./VibeReactions";
import StreakBadge from "./StreakBadge";
import TikTokFeed from "./TikTokFeed";
import WeeklyChallenge from "./WeeklyChallenge";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const THIRTY_MIN = 30 * 60 * 1000;
const MAX_POSTS_PER_WINDOW = 3;

// VibeProfile imported from @/types/models

// Badge tier logic (mirrors BadgesSection)
function getUserTier(vibeCount: number): { emoji: string; label: string } | null {
  if (vibeCount >= 20) return { emoji: "👑", label: "Legend" };
  if (vibeCount >= 5) return { emoji: "🔥", label: "Insider" };
  if (vibeCount >= 1) return { emoji: "🧭", label: "Explorer" };
  return null;
}

interface Vibe {
  id: string;
  image_url: string;
  caption: string | null;
  insider_tip: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  likes: number;
  super_vibes: number;
  username: string | null;
  user_id: string | null;
  created_at: string;
  media_type?: string;
  mood?: string | null;
  is_official?: boolean;
  profile?: VibeProfile | null;
}

function withCacheBust(url: string, token: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("cb", token);
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}cb=${encodeURIComponent(token)}`;
  }
}

function VibeMedia({ vibe, className }: { vibe: Vibe; className?: string }) {
  const [muted, setMuted] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [imageSrc, setImageSrc] = useState(() =>
    withCacheBust(vibe.image_url, vibe.created_at || `${Date.now()}`)
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = vibe.media_type === "video";

  useEffect(() => {
    setRetryCount(0);
    setImageSrc(withCacheBust(vibe.image_url, vibe.created_at || `${Date.now()}`));
  }, [vibe.id, vibe.image_url, vibe.created_at]);

  const handleImageError = () => {
    if (retryCount >= 2) return;
    const nextRetry = retryCount + 1;
    setRetryCount(nextRetry);
    setTimeout(() => {
      setImageSrc(withCacheBust(vibe.image_url, `${Date.now()}-${nextRetry}`));
    }, 400 * nextRetry);
  };

  if (!isVideo) {
    return (
      <img
        src={imageSrc}
        alt={vibe.caption || "Vibe"}
        className={className}
        loading="lazy"
        onError={handleImageError}
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={vibe.image_url}
        className={className}
        autoPlay
        loop
        muted={muted}
        playsInline
        preload="metadata"
      />
      <button
        onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
        className="absolute bottom-12 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center z-10"
      >
        {muted ? <VolumeX className="w-4 h-4 text-foreground" /> : <Volume2 className="w-4 h-4 text-foreground" />}
      </button>
      <div className="absolute top-3 left-12 flex items-center gap-1 bg-background/60 backdrop-blur-md px-2 py-1 rounded-lg">
        <Video className="w-3 h-3 text-destructive" />
        <span className="text-[10px] text-foreground font-medium">Vidéo</span>
      </div>
    </div>
  );
}

function getDisplayName(vibe: Vibe): string {
  if (vibe.profile?.full_name) return vibe.profile.full_name;
  if (vibe.profile?.email) {
    const name = vibe.profile.email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  if (vibe.username) return vibe.username;
  return "Anonyme";
}

function getAvatarUrl(vibe: Vibe): string | null {
  return vibe.profile?.avatar_url || null;
}

function getScore(v: Vibe) {
  return v.likes + (v.super_vibes || 0) * 3;
}

// timeAgo and getDeviceId imported from shared libs

function vibeCountdown(dateStr: string, isOfficial?: boolean) {
  if (isOfficial) return null;
  const expiresAt = new Date(dateStr).getTime() + SIX_HOURS;
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return "Expiré";
  const hours = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
}

function isUnderTwoHours(dateStr: string) {
  const age = Date.now() - new Date(dateStr).getTime();
  return age < 2 * 60 * 60 * 1000;
}

function isNew(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < THIRTY_MIN;
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
  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(10);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const commentCounts = useCommentCounts(vibes.map((v) => v.id));
  
  // Double-tap to like
  const [doubleTapId, setDoubleTapId] = useState<string | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  
  // Emoji reactions
  const [reactionsVibeId, setReactionsVibeId] = useState<string | null>(null);
  const [floatingReaction, setFloatingReaction] = useState<{ id: string; emoji: string } | null>(null);

  const handleDoubleTap = (vibeId: string) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.id === vibeId && now - lastTapRef.current.time < 300) {
      // Double tap detected!
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

  // Compute vibe counts per user for tier badges
  const userVibeCounts: Record<string, number> = {};
  vibes.forEach((v) => {
    if (v.user_id) userVibeCounts[v.user_id] = (userVibeCounts[v.user_id] || 0) + 1;
  });

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadLocation, setUploadLocation] = useState("");
  const [uploadUsername] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const deviceId = getDeviceId();

  const fetchVibes = useCallback(async () => {
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from("vibes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) {
        const userIds = [...new Set((data as any[]).filter(v => v.user_id).map(v => v.user_id))];
        let profilesMap: Record<string, VibeProfile> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles_public" as any)
            .select("user_id, full_name, avatar_url, is_vip")
            .in("user_id", userIds);
          if (profiles) {
            profilesMap = Object.fromEntries(profiles.map((p: any) => [p.user_id, p]));
          }
        }
        const vibesWithProfiles = (data as any[]).map(v => ({
          ...v,
          profile: v.user_id ? profilesMap[v.user_id] || null : null,
        }));
        setVibes(vibesWithProfiles);
      }
    } catch (err) {
      console.error("Feed fetch error:", err);
      setFetchError("Impossible de charger le feed. Vérifie ta connexion.");
    }
    setLoading(false);
  }, []);

  // Use user_id for likes/super_vibes (more secure than device_id)
  const userId = user?.id;

  const fetchMyLikes = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("vibe_likes")
      .select("vibe_id")
      .eq("user_id", userId as any);
    if (data) {
      setLikedIds(new Set(data.map((l: any) => l.vibe_id)));
    }
    // Fallback: also check device_id for old likes
    const { data: oldData } = await supabase
      .from("vibe_likes")
      .select("vibe_id")
      .eq("device_id", deviceId)
      .is("user_id" as any, null);
    if (oldData) {
      setLikedIds(prev => {
        const next = new Set(prev);
        oldData.forEach((l: any) => next.add(l.vibe_id));
        return next;
      });
    }
  }, [userId, deviceId]);

  const fetchMySuperVibes = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("vibe_super_vibes")
      .select("vibe_id, created_at")
      .eq("user_id", userId as any);
    if (data) {
      setSuperVibeIds(new Set(data.map((s: any) => s.vibe_id)));
      const recent = (data as any[]).some((s) => Date.now() - new Date(s.created_at).getTime() < SIX_HOURS);
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

    const refreshFeed = () => { void fetchVibes(); };
    const intervalId = setInterval(refreshFeed, 15000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshFeed();
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
      clearInterval(intervalId);
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
        await supabase.from("vibe_likes").delete().eq("vibe_id", vibeId).eq("user_id", userId as any);
      }
      await supabase.from("vibe_likes").delete().eq("vibe_id", vibeId).eq("device_id", deviceId).is("user_id" as any, null);
      await supabase.rpc("increment_vibe_likes", { p_vibe_id: vibeId, p_delta: -1 });
    } else {
      setLikedIds((prev) => new Set(prev).add(vibeId));
      setVibes((prev) => prev.map((v) => (v.id === vibeId ? { ...v, likes: v.likes + 1 } : v)));
      await supabase.from("vibe_likes").insert({ vibe_id: vibeId, device_id: deviceId, user_id: userId } as any);
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
    await supabase.from("vibe_super_vibes").insert({ vibe_id: vibeId, device_id: deviceId, user_id: userId } as any);
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
      console.error("Delete error:", err);
      toast.error("Impossible de supprimer");
    } finally {
      setDeletingId(null);
    }
  };

  // ===== DERIVED DATA =====
  const officialVibes = vibes.filter((v) => v.is_official);
  const regularVibes = vibes.filter((v) => !v.is_official);
  
  // Top 3 by score (non-official only, minimum 1 interaction)
  const top3Vibes = [...regularVibes]
    .filter(v => getScore(v) > 0)
    .sort((a, b) => getScore(b) - getScore(a))
    .slice(0, 3);

  // Feed sorted by active tab — boosted places first
  const sortedFeed = activeTab === "tendances"
    ? [...officialVibes, ...regularVibes].sort((a, b) => {
        // Boosted partner locations first
        const aB = isBoosted(a.location);
        const bB = isBoosted(b.location);
        if (aB && !bB) return -1;
        if (!aB && bB) return 1;
        // Official (sponsored) next
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

  const rankMedals = ["🥇", "🥈", "🥉"];

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

  // Reset visible count when tab changes
  useEffect(() => { setVisibleCount(10); }, [activeTab]);

  const visibleFeed = sortedFeed.slice(0, visibleCount);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 relative">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-0">
        <div className="flex items-center justify-between pb-2.5">
          <h1 className="text-base font-semibold text-foreground tracking-tight font-body">Weshkech</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTikTokFeed(true)}
              className="flex items-center gap-1 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 text-foreground" strokeWidth={1.5} />
            </button>
            <span className="text-xs text-muted-foreground">{vibes.length} live</span>
          </div>
        </div>

        {/* Tabs — underline style */}
        <div className="flex">
          <button
            onClick={() => setActiveTab("tendances")}
            className={`flex-1 py-2.5 text-[13px] font-semibold text-center border-b-2 transition-colors ${
              activeTab === "tendances"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Tendances
          </button>
          <button
            onClick={() => setActiveTab("recents")}
            className={`flex-1 py-2.5 text-[13px] font-semibold text-center border-b-2 transition-colors ${
              activeTab === "recents"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Récents
          </button>
        </div>
      </div>

      {/* Weekly Challenge */}
      <WeeklyChallenge />

      {/* Stories */}
      <StoriesModule userId={user?.id} />

      {/* Streak badge */}
      {user && (
        <div className="px-4 pb-1">
          <StreakBadge userId={user.id} />
        </div>
      )}
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
                  { icon: Zap, label: "Super Vibe ⚡", desc: "Booste x3 ! Propulse un post dans le Top 3. Limité à 1/6h." },
                  { icon: MessageCircle, label: "Commentaires", desc: "Clique sur un post pour laisser un commentaire." },
                  { icon: Flame, label: "Top 3 🔥", desc: "Les 3 vibes les plus populaires sont mises en avant." },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{label}</p>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  localStorage.setItem("weshkech_vibez_tutorial_seen", "1");
                  setShowTutorial(false);
                }}
                className="mt-5 w-full py-2.5 rounded-lg text-[13px] font-semibold bg-foreground text-background"
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
          <p className="text-[13px] text-muted-foreground mb-3">{fetchError}</p>
          <button onClick={() => { setLoading(true); fetchVibes(); }} className="text-[13px] font-semibold text-foreground underline">Réessayer</button>
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
          <p className="text-[13px] text-muted-foreground">
            Sois le premier à partager ton vibe !
          </p>
        </div>
      ) : (
        <>
          {/* ===== TOP 3 PODIUM ===== */}
           {top3Vibes.length > 0 && activeTab === "tendances" && (
            <div className="pt-3 pb-2 px-4">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm">🔥</span>
                <h2 className="text-[13px] font-semibold text-foreground">Top 3</h2>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {top3Vibes.map((vibe, i) => (
                  <motion.div
                    key={`top-${vibe.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setCommentVibeId(vibe.id)}
                    className={`relative flex-shrink-0 w-[42vw] aspect-[3/4] rounded-lg overflow-hidden cursor-pointer active:scale-[0.97] transition-transform ${
                      i === 0 ? "ring-2 ring-foreground/20" : "ring-1 ring-border"
                    }`}
                  >
                    <VibeMedia vibe={vibe} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />

                    {/* Rank */}
                    <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      i === 0 ? "bg-foreground text-background" : "bg-background/70 backdrop-blur-md text-foreground"
                    }`}>
                      {rankMedals[i]} #{i + 1}
                    </div>

                    {/* Score */}
                    <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-md px-1.5 py-0.5 rounded-md">
                      <span className="text-[10px] font-bold text-foreground flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" />{getScore(vibe)}
                      </span>
                    </div>

                    {/* Bottom */}
                    <div className="absolute bottom-0 inset-x-0 p-2.5">
                      <div className="flex items-center gap-1.5">
                        {getAvatarUrl(vibe) ? (
                          <img src={getAvatarUrl(vibe)!} alt="" className="w-4 h-4 rounded-full border border-border object-cover" />
                        ) : null}
                        <p className="text-[11px] font-semibold text-foreground truncate">{getDisplayName(vibe)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-foreground/70 flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{vibe.likes}</span>
                        <span className="text-[10px] text-foreground/70 flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" />{commentCounts[vibe.id] || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ===== MAIN FEED ===== */}
          <div className="divide-y divide-border">
            {visibleFeed.map((vibe, i) => {
              const liked = likedIds.has(vibe.id);
              const isAnimating = animatingId === vibe.id;

              return (
                <motion.div
                  key={vibe.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card"
                >
                  {/* ── Instagram-style HEADER ── */}
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getAvatarUrl(vibe) ? (
                        <img src={getAvatarUrl(vibe)!} alt="" className="w-8 h-8 rounded-full border border-border object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-foreground">{getDisplayName(vibe).charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate flex items-center gap-1.5">
                          {getDisplayName(vibe)}
                          {vibe.is_official && (
                            <span className="text-[9px] bg-gold/15 text-gold px-1.5 py-0.5 rounded font-bold">PRO</span>
                          )}
                          {!vibe.is_official && vibe.profile?.is_vip && (
                            <Crown className="w-3 h-3 text-gold" />
                          )}
                          {!vibe.is_official && vibe.user_id && getUserTier(userVibeCounts[vibe.user_id] || 0) && (
                            <span className="text-[10px] text-muted-foreground">
                              {getUserTier(userVibeCounts[vibe.user_id] || 0)!.emoji}
                            </span>
                          )}
                        </p>
                        {vibe.location && (
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-muted-foreground truncate">{vibe.location}</span>
                            {vibe.latitude != null && vibe.longitude != null && onGoToMap && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onGoToMap(vibe.latitude!, vibe.longitude!); }}
                                className="text-[10px] text-gold font-medium"
                              >
                                · Voir
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {vibe.is_official && (
                        <span className="text-[9px] text-muted-foreground font-medium">Sponsorisé</span>
                      )}
                      {!vibe.is_official && isNew(vibe.created_at) && (
                        <div className="flex items-center gap-1 bg-destructive/15 px-1.5 py-0.5 rounded-full live-badge-blink">
                          <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                          <span className="text-[9px] font-bold text-destructive uppercase">Live</span>
                        </div>
                      )}
                      <span className="text-[11px] text-muted-foreground">{timeAgo(vibe.created_at)}</span>
                      {user && vibe.user_id === user.id && (
                        <button
                          onClick={() => handleDeleteVibe(vibe.id)}
                          disabled={deletingId === vibe.id}
                          className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                        >
                          {deletingId === vibe.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── MEDIA (full width, Instagram square-ish) ── */}
                  <div className="relative aspect-[4/5] bg-background" onClick={() => handleDoubleTap(vibe.id)}>
                    <VibeMedia vibe={vibe} className="w-full h-full object-cover" />
                    <DoubleTapHeart show={doubleTapId === vibe.id} />
                    {activeTab === "tendances" && getScore(vibe) > 0 && (
                      <div className="absolute top-3 right-3 bg-background/70 backdrop-blur-md px-2 py-1 rounded-full">
                        <span className="text-[10px] font-bold text-gold flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" /> {getScore(vibe)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── ACTION BAR (below media, Instagram-style) ── */}
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                    <div className="flex items-center gap-4">
                      {/* Like */}
                      <div className="relative">
                        <VibeReactions
                          show={reactionsVibeId === vibe.id}
                          onReact={(emoji) => handleReaction(vibe.id, emoji)}
                          onClose={() => setReactionsVibeId(null)}
                        />
                        <button
                          onClick={() => handleLike(vibe.id)}
                          onContextMenu={(e) => { e.preventDefault(); setReactionsVibeId(vibe.id); }}
                          onTouchStart={() => {
                            const timer = setTimeout(() => setReactionsVibeId(vibe.id), 500);
                            (window as any).__reactionTimer = timer;
                          }}
                          onTouchEnd={() => clearTimeout((window as any).__reactionTimer)}
                          className="group"
                        >
                          <motion.div
                            animate={isAnimating ? { scale: [1, 1.4, 0.9, 1.15, 1] } : {}}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          >
                            <Heart
                              className={`w-6 h-6 transition-colors duration-200 ${
                                liked
                                  ? "fill-gold text-gold"
                                  : "text-foreground group-hover:text-foreground/70"
                              }`}
                            />
                          </motion.div>
                        </button>
                        <FloatingReaction
                          emoji={floatingReaction?.id === vibe.id ? floatingReaction.emoji : null}
                          show={floatingReaction?.id === vibe.id}
                        />
                      </div>
                      {/* Comment */}
                      <button onClick={() => setCommentVibeId(vibe.id)} className="group">
                        <MessageCircle className="w-6 h-6 text-foreground group-hover:text-foreground/70 transition-colors" />
                      </button>
                      {/* Share */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const url = getShareUrl("vibe", vibe.id);
                          const text = `${vibe.location || "Marrakech"} sur Weshkech 🔥`;
                          if (navigator.share) {
                            try { await navigator.share({ title: "Weshkech", text, url }); } catch {}
                          } else {
                            await navigator.clipboard.writeText(url);
                            toast.success("Lien copié !");
                          }
                        }}
                        className="group"
                      >
                        <Share2 className="w-5 h-5 text-foreground group-hover:text-foreground/70 transition-colors" />
                      </button>
                    </div>
                    {/* Super Vibe (right side, like bookmark) */}
                    <button
                      onClick={() => handleSuperVibe(vibe.id)}
                      disabled={!canSuperVibe || superVibeIds.has(vibe.id)}
                      className="group relative"
                      title="Super Vibe — Booste ce post ×3 !"
                    >
                      <motion.div
                        animate={superVibeAnimId === vibe.id ? { scale: [1, 1.6, 0.8, 1.2, 1], rotate: [0, -10, 10, -5, 0] } : {}}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <Zap
                          className={`w-6 h-6 transition-colors duration-200 ${
                            superVibeIds.has(vibe.id)
                              ? "fill-gold text-gold"
                              : !canSuperVibe
                              ? "text-foreground/30"
                              : "text-foreground group-hover:text-foreground/70"
                          }`}
                        />
                      </motion.div>
                      <SuperVibeParticles active={superVibeAnimId === vibe.id} />
                    </button>
                  </div>

                  {/* ── LIKES + CAPTION (Instagram-style) ── */}
                  <div className="px-3 pb-3 space-y-1">
                    <div className="flex items-center gap-3 text-[13px]">
                      <span className="font-semibold text-foreground">{vibe.likes} J'aime{vibe.likes !== 1 ? "s" : ""}</span>
                      {(vibe.super_vibes || 0) > 0 && (
                        <span className="text-gold font-semibold flex items-center gap-0.5">
                          <Zap className="w-3 h-3" /> {vibe.super_vibes} boost{(vibe.super_vibes || 0) !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {vibe.caption && (
                      <p className="text-[13px] text-foreground">
                        <span className="font-semibold mr-1.5">{getDisplayName(vibe)}</span>
                        {vibe.caption}
                      </p>
                    )}
                    {vibe.insider_tip && (
                      <div className="flex items-start gap-1.5 mt-1 px-2.5 py-2 rounded-lg bg-gold/[0.08] border border-gold/[0.15]">
                        <Sparkles className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                        <p className="text-[12px] text-gold leading-relaxed">
                          <span className="font-semibold">Insider tip :</span> {vibe.insider_tip}
                        </p>
                      </div>
                    )}
                    {(commentCounts[vibe.id] || 0) > 0 && (
                      <button onClick={() => setCommentVibeId(vibe.id)} className="text-[13px] text-muted-foreground">
                        Voir les {commentCounts[vibe.id]} commentaire{(commentCounts[vibe.id] || 0) !== 1 ? "s" : ""}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {/* Infinite scroll sentinel */}
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
