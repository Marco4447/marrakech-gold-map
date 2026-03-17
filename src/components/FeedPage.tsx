import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Camera, MapPin, Clock, Heart, MessageCircle, Zap, Trash2, Video, Volume2, VolumeX, Crown, Share2, Play, Loader2, AlertCircle, Flame, UserPlus, UserCheck, Film, Rocket, Bookmark, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VibeBoostSheet from "./VibeBoostSheet";
import { useAuth } from "@/hooks/useAuth";
import VibeComments, { useCommentCounts } from "./VibeComments";
import SuperVibeParticles from "./SuperVibeParticles";
import { timeAgo } from "@/lib/timeAgo";
import { getDeviceId } from "@/lib/deviceId";
import { analytics } from "@/lib/analytics";
import type { VibeProfile } from "@/types/models";
import { isBoosted, boostPriority } from "@/lib/boostedPlaces";
import { getShareUrl } from "@/lib/shareUrl";
import { computeEnergyScores, getEnergy, getDistanceMeters, formatDistance } from "@/lib/energy";
import { useUserLocation } from "@/hooks/useUserLocation";
import StoriesModule from "./stories/StoriesModule";
import DoubleTapHeart from "./DoubleTapHeart";
import VibeReactions, { FloatingReaction } from "./VibeReactions";
import WeeklyChallenge from "./WeeklyChallenge";
import { useFollows } from "@/hooks/useFollows";
import TikTokFeed from "./TikTokFeed";
import { useBookmarks } from "@/hooks/useBookmarks";
import { rankFeedVibes, createScoringContext, type FeedVibe } from "@/lib/feedAlgorithm";
import FloatingVipOffer from "./feed/FloatingVipOffer";
import UserStoryUpload from "./stories/UserStoryUpload";
import VibeExpiryBar from "./VibeExpiryBar";

const SIX_HOURS = 6 * 60 * 60 * 1000;
const THIRTY_MIN = 30 * 60 * 1000;

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
      <img src={imageSrc} alt={vibe.caption || "Vibe"} className={className} loading="lazy" onError={handleImageError} />
    );
  }

  return (
    <div className="relative w-full h-full">
      <video src={vibe.image_url} className={className} autoPlay loop muted={muted} playsInline preload="metadata" />
      <button
        onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
        className="absolute bottom-12 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center z-10"
      >
        {muted ? <VolumeX className="w-4 h-4 text-foreground" /> : <Volume2 className="w-4 h-4 text-foreground" />}
      </button>
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

function vibeCountdown(dateStr: string, isOfficial?: boolean) {
  if (isOfficial) return null;
  const expiresAt = new Date(dateStr).getTime() + SIX_HOURS;
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return "Expiré";
  const hours = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
}

function isNew(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < THIRTY_MIN;
}

type FeedTab = "foryou" | "following" | "recents";

// "Ce soir" night filter
function getTonightStart(): Date {
  const now = new Date();
  const tonightStart = new Date();
  tonightStart.setHours(20, 0, 0, 0);
  if (now.getHours() < 6) tonightStart.setDate(tonightStart.getDate() - 1);
  return tonightStart;
}

export default function FeedPage({ refreshSignal = 0, onGoToMap }: { refreshSignal?: number; onGoToMap?: (lat: number, lng: number) => void }) {
  const { user } = useAuth();
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerPlaceNames, setPartnerPlaceNames] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [commentVibeId, setCommentVibeId] = useState<string | null>(null);
  const [superVibeIds, setSuperVibeIds] = useState<Set<string>>(new Set());
  const [superVibeAnimId, setSuperVibeAnimId] = useState<string | null>(null);
  const [canSuperVibe, setCanSuperVibe] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>("foryou");
  const [visibleCount, setVisibleCount] = useState(10);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const commentCounts = useCommentCounts(vibes.map((v) => v.id));
  const [doubleTapId, setDoubleTapId] = useState<string | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  const [reactionsVibeId, setReactionsVibeId] = useState<string | null>(null);
  const [floatingReaction, setFloatingReaction] = useState<{ id: string; emoji: string } | null>(null);
  const { isFollowing, toggleFollow, followingIds } = useFollows();
  const [showReels, setShowReels] = useState(false);
  const [boostVibeId, setBoostVibeId] = useState<string | null>(null);
  const [boostedVibeIds, setBoostedVibeIds] = useState<Set<string>>(new Set());
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [nightOnly, setNightOnly] = useState(() => {
    const h = new Date().getHours();
    return h >= 20 || h < 6;
  });

  const deviceId = getDeviceId();
  const userId = user?.id;
  const userLocation = useUserLocation();
  const energyMap = computeEnergyScores(vibes);

  const userVibeCounts: Record<string, number> = {};
  vibes.forEach((v) => {
    if (v.user_id) userVibeCounts[v.user_id] = (userVibeCounts[v.user_id] || 0) + 1;
  });

  const handleDoubleTap = (vibeId: string) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.id === vibeId && now - lastTapRef.current.time < 300) {
      if (!likedIds.has(vibeId)) handleLike(vibeId);
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

  const fetchVibes = useCallback(async () => {
    setFetchError(null);
    try {
      const { data, error } = await supabase.from("vibes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      if (data) {
        const userIds = [...new Set(data.filter(v => v.user_id).map(v => v.user_id))] as string[];
        let profilesMap: Record<string, VibeProfile> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles_public")
            .select("user_id, full_name, avatar_url, is_vip")
            .in("user_id", userIds);
          if (profiles) profilesMap = Object.fromEntries(profiles.filter(p => p.user_id).map(p => [p.user_id!, p]));
        }
        setVibes(data.map(v => ({ ...v, profile: v.user_id ? profilesMap[v.user_id] || null : null })));
      }
    } catch (err) {
      console.error("Feed fetch error:", err);
      setFetchError("Impossible de charger le feed.");
    }
    setLoading(false);
  }, []);

  const fetchMyLikes = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("vibe_likes").select("vibe_id").eq("user_id", userId);
    if (data) setLikedIds(new Set(data.map((l) => l.vibe_id)));
  }, [userId]);

  const fetchMySuperVibes = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("vibe_super_vibes").select("vibe_id, created_at").eq("user_id", userId);
    if (data) {
      setSuperVibeIds(new Set(data.map((s) => s.vibe_id)));
      const recent = data.some((s) => Date.now() - new Date(s.created_at).getTime() < SIX_HOURS);
      setCanSuperVibe(!recent);
    }
  }, [userId]);

  useEffect(() => {
    fetchVibes();
    fetchMyLikes();
    fetchMySuperVibes();

    // Fetch active boosts
    supabase.from("vibe_boosts").select("vibe_id, boost_expires_at").gt("boost_expires_at", new Date().toISOString()).then(({ data }) => {
      if (data) setBoostedVibeIds(new Set(data.map((b) => b.vibe_id)));
    });

    // Fetch partner place names
    supabase.from("places").select("name").eq("is_partner", true).then(({ data }) => {
      if (data) setPartnerPlaceNames(new Set(data.map((p) => p.name.toLowerCase())));
    });

    const channel = supabase
      .channel("feed-vibes")
      .on("postgres_changes", { event: "*", schema: "public", table: "vibes" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const nv = payload.new as Vibe;
          setVibes((prev) => prev.some((v) => v.id === nv.id) ? prev : [nv, ...prev]);
        } else if (payload.eventType === "DELETE") {
          setVibes((prev) => prev.filter((v) => v.id !== (payload.old as { id: string }).id));
        } else if (payload.eventType === "UPDATE") {
          setVibes((prev) => prev.map((v) => v.id === (payload.new as Vibe).id ? { ...v, ...(payload.new as Vibe) } : v));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchVibes, fetchMyLikes, fetchMySuperVibes, refreshSignal]);

  const handleLike = async (vibeId: string) => {
    if (!userId) { toast("Crée ton compte pour liker 💛", { action: { label: "S'inscrire", onClick: () => window.dispatchEvent(new CustomEvent("wk:goto-auth")) } }); return; }
    const alreadyLiked = likedIds.has(vibeId);
    setAnimatingId(vibeId);
    setTimeout(() => setAnimatingId(null), 400);

    if (alreadyLiked) {
      setLikedIds((prev) => { const next = new Set(prev); next.delete(vibeId); return next; });
      setVibes((prev) => prev.map((v) => (v.id === vibeId ? { ...v, likes: Math.max(0, v.likes - 1) } : v)));
      if (userId) await supabase.from("vibe_likes").delete().eq("vibe_id", vibeId).eq("user_id", userId);
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
    if (!userId) { toast("Crée ton compte pour super-vibe 🚀", { action: { label: "S'inscrire", onClick: () => window.dispatchEvent(new CustomEvent("wk:goto-auth")) } }); return; }
    if (!canSuperVibe || superVibeIds.has(vibeId)) return;
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
      toast.success("Vibe supprimée");
    } catch { toast.error("Impossible de supprimer"); }
    finally { setDeletingId(null); }
  };

  // Feed ranking using the new algorithm
  const top3Vibes = [...vibes].filter(v => !v.is_official && getScore(v) > 0).sort((a, b) => getScore(b) - getScore(a)).slice(0, 3);

  // Create scoring context for the algorithm
  const scoringContext = useMemo(() => createScoringContext({
    vibes: vibes as FeedVibe[],
    userLocation,
    followingIds,
    boostedVibeIds,
    commentCounts,
  }), [vibes, userLocation, followingIds, boostedVibeIds, commentCounts]);

  const sortedFeed = useMemo((): Vibe[] => {
    if (activeTab === "foryou") {
      // Use the ranking algorithm for For You tab
      const ranked = rankFeedVibes(vibes as (Vibe & FeedVibe)[], scoringContext) as Vibe[];
      // Apply boost priority for sponsored places (on top)
      return ranked.sort((a, b) => {
        const aP = boostPriority(a.location);
        const bP = boostPriority(b.location);
        const aB = aP >= 0;
        const bB = bP >= 0;
        if (aB && !bB) return -1;
        if (!aB && bB) return 1;
        if (aB && bB) return aP - bP;
        return 0; // Keep algorithm order otherwise
      });
    } else if (activeTab === "following") {
      // Following tab: chronological, only followed accounts
      return [...vibes]
        .filter(v => v.user_id && followingIds.has(v.user_id))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      // Recents tab: chronological with boost priority
      return [...vibes].sort((a, b) => {
        const aB = isBoosted(a.location);
        const bB = isBoosted(b.location);
        if (aB && !bB) return -1;
        if (!aB && bB) return 1;
        if (a.is_official && !b.is_official) return -1;
        if (!a.is_official && b.is_official) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
  }, [vibes, activeTab, scoringContext, followingIds]);

  // Apply night filter
  const filteredFeed = useMemo(() => {
    if (!nightOnly) return sortedFeed;
    const tonightStart = getTonightStart();
    return sortedFeed.filter(v => new Date(v.created_at) >= tonightStart);
  }, [sortedFeed, nightOnly]);

  const nightVibeCount = nightOnly ? filteredFeed.length : 0;

  const rankMedals = ["🥇", "🥈", "🥉"];

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleCount((prev) => prev + 10);
    }, { rootMargin: "200px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filteredFeed.length]);

  useEffect(() => { setVisibleCount(10); }, [activeTab, nightOnly]);
  const visibleFeed = filteredFeed.slice(0, visibleCount);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 relative">
      {/* Header — Instagram style */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/30 px-4 pt-12 md:pt-4 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const tabs: FeedTab[] = ["foryou", "following", "recents"];
              const idx = tabs.indexOf(activeTab);
              setActiveTab(tabs[(idx + 1) % tabs.length]);
            }}
            className="flex items-center gap-1 active:opacity-70 transition-opacity"
          >
            <h1 className="text-[26px] font-bold text-foreground tracking-tight font-display">
              {activeTab === "foryou" ? "Pour toi" : activeTab === "following" ? "Suivis" : "Récents"}
            </h1>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-foreground mt-1">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReels(true)}
              className="active:scale-90 transition-transform"
            >
              <Film className="w-[26px] h-[26px] text-foreground" />
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("wk:open-notifications"))}
              className="active:scale-90 transition-transform relative"
            >
              <Heart className="w-[26px] h-[26px] text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Stories — directly under header */}
      <StoriesModule userId={user?.id} onAddStory={user ? () => setShowStoryUpload(true) : undefined} />

      {user && (
        <UserStoryUpload
          open={showStoryUpload}
          onClose={() => setShowStoryUpload(false)}
          userId={user.id}
        />
      )}

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
          <h2 className="text-base font-semibold text-foreground mb-1.5">Aucune vibe live</h2>
          <p className="text-[13px] text-muted-foreground">Sois le premier à partager ton vibe !</p>
        </div>
      ) : activeTab === "following" && sortedFeed.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-3">
            <UserPlus className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1.5">Aucun contenu</h2>
          <p className="text-[13px] text-muted-foreground mb-4">Suis des utilisateurs depuis le feed "Pour toi" pour voir leurs vibes ici.</p>
          <button onClick={() => setActiveTab("foryou")} className="px-4 py-2 rounded-xl bg-foreground text-background text-sm font-semibold active:scale-95 transition-transform">
            Explorer le feed
          </button>
        </div>
      ) : (
        <>
          {/* Top 3 */}
          {top3Vibes.length > 0 && activeTab === "foryou" && (
            <div className="pt-3 pb-2 px-4">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm">🔥</span>
                <h2 className="text-[13px] font-semibold text-foreground">Top Vibes</h2>
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
                    className={`relative flex-shrink-0 w-[42vw] aspect-[3/4] rounded-xl overflow-hidden cursor-pointer active:scale-[0.97] transition-transform ${i === 0 ? "ring-2 ring-foreground/20" : "ring-1 ring-border"}`}
                  >
                    <VibeMedia vibe={vibe} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                    <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${i === 0 ? "bg-foreground text-background" : "bg-background/70 backdrop-blur-md text-foreground"}`}>
                      {rankMedals[i]} #{i + 1}
                    </div>
                    <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-md px-1.5 py-0.5 rounded-md">
                      <span className="text-[10px] font-bold text-foreground flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />{getScore(vibe)}</span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-2.5">
                      <div className="flex items-center gap-1.5">
                        {getAvatarUrl(vibe) && <img src={getAvatarUrl(vibe)!} alt="" className="w-4 h-4 rounded-full border border-border object-cover" />}
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

          {/* Main Feed */}
          <div className="divide-y divide-border/30">
            {visibleFeed.map((vibe, i) => {
              const liked = likedIds.has(vibe.id);
              const isAnimating = animatingId === vibe.id;
              const countdown = vibeCountdown(vibe.created_at, vibe.is_official);

              return (
                <motion.div
                  key={vibe.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="bg-background"
                >
                  {/* Header — Instagram style */}
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {getAvatarUrl(vibe) ? (
                        <img src={getAvatarUrl(vibe)!} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-foreground">{getDisplayName(vibe).charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                          {getDisplayName(vibe)}
                        </p>
                        {vibe.location && (
                          <p className="text-[11px] text-muted-foreground truncate leading-tight">{vibe.location}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {vibe.user_id && vibe.user_id !== userId && !vibe.is_official && !isFollowing(vibe.user_id) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFollow(vibe.user_id!); }}
                          className="text-[13px] font-bold text-primary active:opacity-60 transition-opacity"
                        >
                          Suivre
                        </button>
                      )}
                      <button className="p-1" onClick={(e) => {
                        e.stopPropagation();
                        if (user && vibe.user_id === user.id) handleDeleteVibe(vibe.id);
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-foreground">
                          <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Media — full bleed */}
                  <div className="relative aspect-[4/5] bg-black" onClick={() => handleDoubleTap(vibe.id)}>
                    <VibeMedia vibe={vibe} className="w-full h-full object-cover" />
                    <DoubleTapHeart show={doubleTapId === vibe.id} />
                  </div>

                  {/* Action bar — Instagram style */}
                  <div className="flex items-center justify-between px-3 pt-3 pb-1">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <VibeReactions show={reactionsVibeId === vibe.id} onReact={(emoji) => handleReaction(vibe.id, emoji)} onClose={() => setReactionsVibeId(null)} />
                        <button
                          onClick={() => handleLike(vibe.id)}
                          onContextMenu={(e) => { e.preventDefault(); setReactionsVibeId(vibe.id); }}
                          onTouchStart={() => { const timer = setTimeout(() => setReactionsVibeId(vibe.id), 500); (window as unknown as Record<string, ReturnType<typeof setTimeout>>).__reactionTimer = timer; }}
                          onTouchEnd={() => clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>).__reactionTimer)}
                        >
                          <motion.div animate={isAnimating ? { scale: [1, 1.4, 0.9, 1.15, 1] } : {}} transition={{ duration: 0.4, ease: "easeOut" }}>
                            <Heart className={`w-[26px] h-[26px] transition-colors duration-200 ${liked ? "fill-destructive text-destructive" : "text-foreground"}`} />
                          </motion.div>
                        </button>
                        <FloatingReaction emoji={floatingReaction?.id === vibe.id ? floatingReaction.emoji : null} show={floatingReaction?.id === vibe.id} />
                      </div>
                      <button onClick={() => setCommentVibeId(vibe.id)}>
                        <MessageCircle className="w-[26px] h-[26px] text-foreground" />
                      </button>
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
                      >
                        <Share2 className="w-[24px] h-[24px] text-foreground" />
                      </button>
                    </div>
                    <button onClick={() => toggleBookmark(vibe.id)}>
                      <Bookmark className={`w-[24px] h-[24px] transition-colors duration-200 ${isBookmarked(vibe.id) ? "fill-foreground text-foreground" : "text-foreground"}`} />
                    </button>
                  </div>

                  {/* Likes + Caption — Instagram style */}
                  <div className="px-3 pb-3.5 space-y-1">
                    <p className="text-[13px] font-semibold text-foreground">
                      {vibe.likes} J'aime{vibe.likes !== 1 ? "s" : ""}
                    </p>
                    {vibe.caption && (
                      <p className="text-[13px] text-foreground leading-[18px]">
                        <span className="font-semibold mr-1">{getDisplayName(vibe)}</span>{vibe.caption}
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
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{timeAgo(vibe.created_at)}</p>
                  </div>
                </motion.div>
              );
            })}
            {visibleCount < sortedFeed.length ? (
              <div ref={sentinelRef} className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sortedFeed.length > 0 && (
              <div className="flex flex-col items-center py-8 text-center gap-2">
                <span className="text-2xl">🔥</span>
                <p className="text-sm font-semibold text-foreground">Tu as tout vu !</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">Reviens bientôt pour de nouvelles vibes.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Comments sheet */}
      <VibeComments vibeId={commentVibeId || ""} open={!!commentVibeId} onOpenChange={(open) => !open && setCommentVibeId(null)} />

      {/* Reels fullscreen */}
      <AnimatePresence>
        {showReels && <TikTokFeed open={showReels} onClose={() => setShowReels(false)} />}
      </AnimatePresence>

      {/* Vibe Boost */}
      <VibeBoostSheet vibeId={boostVibeId || ""} open={!!boostVibeId} onOpenChange={(open) => !open && setBoostVibeId(null)} />

      {/* Floating VIP Offer CTA */}
      <FloatingVipOffer />
    </div>
  );
}
