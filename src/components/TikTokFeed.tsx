import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Heart, MessageCircle, Zap, MapPin, Share2, Volume2, VolumeX, X, Crown, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getDeviceId } from "@/lib/deviceId";
import { analytics } from "@/lib/analytics";
import { toast } from "sonner";
import { timeAgo } from "@/lib/timeAgo";
import DoubleTapHeart from "./DoubleTapHeart";
import VibeReactions, { FloatingReaction } from "./VibeReactions";
import type { VibeProfile } from "@/types/models";

interface ReelVibe {
  id: string;
  image_url: string;
  caption: string | null;
  location: string | null;
  likes: number;
  super_vibes: number;
  username: string | null;
  user_id: string | null;
  created_at: string;
  media_type?: string;
  mood: string | null;
  is_official?: boolean;
  profile?: VibeProfile | null;
}

const MOOD_EMOJI: Record<string, string> = { hot: "🔥", chill: "🍸", secret: "✨", foodie: "🥗" };

export default function TikTokFeed({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [vibes, setVibes] = useState<ReelVibe[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [doubleTapId, setDoubleTapId] = useState<string | null>(null);
  const [mutedMap, setMutedMap] = useState<Record<string, boolean>>({});
  const [reactionsVibeId, setReactionsVibeId] = useState<string | null>(null);
  const [floatingReaction, setFloatingReaction] = useState<{ id: string; emoji: string } | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const deviceId = getDeviceId();
  const userId = user?.id;

  const fetchVibes = useCallback(async () => {
    const { data } = await supabase
      .from("vibes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.filter(v => v.user_id).map(v => v.user_id!))];
    let profilesMap: Record<string, VibeProfile> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles_public" as any)
        .select("user_id, full_name, avatar_url, is_vip")
        .in("user_id", userIds);
      if (profiles) profilesMap = Object.fromEntries((profiles as any[]).map(p => [p.user_id, p]));
    }

    setVibes(data.map(v => ({ ...v, profile: v.user_id ? profilesMap[v.user_id] || null : null })));
    setLoading(false);
  }, []);

  const fetchMyLikes = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("vibe_likes")
      .select("vibe_id")
      .eq("user_id", userId as any);
    if (data) setLikedIds(new Set(data.map((l: any) => l.vibe_id)));
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    fetchVibes();
    fetchMyLikes();
  }, [open, fetchVibes, fetchMyLikes]);

  // Pause/play videos based on current index
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, el]) => {
      if (!el) return;
      const idx = vibes.findIndex(v => v.id === id);
      if (idx === currentIndex) {
        el.play().catch(() => {});
      } else {
        el.pause();
        el.currentTime = 0;
      }
    });
  }, [currentIndex, vibes]);

  const handleLike = async (vibeId: string) => {
    const alreadyLiked = likedIds.has(vibeId);
    analytics.likeVibe(vibeId);
    setAnimatingId(vibeId);
    setTimeout(() => setAnimatingId(null), 400);

    if (alreadyLiked) {
      setLikedIds(prev => { const next = new Set(prev); next.delete(vibeId); return next; });
      setVibes(prev => prev.map(v => v.id === vibeId ? { ...v, likes: Math.max(0, v.likes - 1) } : v));
      if (userId) await supabase.from("vibe_likes").delete().eq("vibe_id", vibeId).eq("user_id", userId as any);
      await supabase.rpc("increment_vibe_likes", { p_vibe_id: vibeId, p_delta: -1 });
    } else {
      setLikedIds(prev => new Set(prev).add(vibeId));
      setVibes(prev => prev.map(v => v.id === vibeId ? { ...v, likes: v.likes + 1 } : v));
      await supabase.from("vibe_likes").insert({ vibe_id: vibeId, device_id: deviceId, user_id: userId } as any);
      await supabase.rpc("increment_vibe_likes", { p_vibe_id: vibeId, p_delta: 1 });
    }
  };

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

  const toggleMute = (vibeId: string) => {
    setMutedMap(prev => ({ ...prev, [vibeId]: !prev[vibeId] }));
    const el = videoRefs.current[vibeId];
    if (el) el.muted = !(mutedMap[vibeId] ?? true);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.y < -threshold && currentIndex < vibes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (info.offset.y > threshold && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const getName = (v: ReelVibe) => {
    if (v.profile?.full_name) return v.profile.full_name;
    if (v.username) return v.username;
    return "Anonyme";
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-[env(safe-area-inset-top)] mt-3 right-4 z-[10001] w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Progress dots */}
      <div className="absolute top-[env(safe-area-inset-top)] mt-4 left-1/2 -translate-x-1/2 z-[10001] flex gap-1">
        {vibes.slice(Math.max(0, currentIndex - 3), currentIndex + 4).map((v, i) => {
          const actualIndex = Math.max(0, currentIndex - 3) + i;
          return (
            <div
              key={v.id}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                actualIndex === currentIndex ? "bg-white scale-125" : "bg-white/30"
              }`}
            />
          );
        })}
      </div>

      {loading ? (
        <div className="h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vibes.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-3 text-white">
          <Play className="w-12 h-12 opacity-40" />
          <p className="text-sm opacity-60">Aucun vibe pour le moment</p>
        </div>
      ) : (
        <motion.div
          className="h-full w-full relative overflow-hidden"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={vibes[currentIndex]?.id}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0"
              onClick={() => handleDoubleTap(vibes[currentIndex].id)}
            >
              {(() => {
                const vibe = vibes[currentIndex];
                if (!vibe) return null;
                const liked = likedIds.has(vibe.id);
                const isVideo = vibe.media_type === "video";
                const isMuted = mutedMap[vibe.id] ?? true;

                return (
                  <>
                    {/* Media */}
                    {isVideo ? (
                      <video
                        ref={el => { videoRefs.current[vibe.id] = el; }}
                        src={vibe.image_url}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={vibe.image_url}
                        alt={vibe.caption || "Vibe"}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

                    {/* Double tap heart */}
                    <DoubleTapHeart show={doubleTapId === vibe.id} />

                    {/* Right side actions */}
                    <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10">
                      {/* Like with reactions */}
                      <div className="relative">
                        <VibeReactions
                          show={reactionsVibeId === vibe.id}
                          onReact={(emoji) => handleReaction(vibe.id, emoji)}
                          onClose={() => setReactionsVibeId(null)}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLike(vibe.id); }}
                          onContextMenu={(e) => { e.preventDefault(); setReactionsVibeId(vibe.id); }}
                          className="flex flex-col items-center gap-1"
                        >
                          <motion.div
                            animate={animatingId === vibe.id ? { scale: [1, 1.4, 0.9, 1.15, 1] } : {}}
                          >
                            <Heart className={`w-8 h-8 drop-shadow-lg ${liked ? "fill-gold text-gold" : "text-white"}`} />
                          </motion.div>
                          <span className="text-xs font-bold text-white drop-shadow">{vibe.likes}</span>
                        </button>
                        <FloatingReaction
                          emoji={floatingReaction?.id === vibe.id ? floatingReaction.emoji : null}
                          show={floatingReaction?.id === vibe.id}
                        />
                      </div>

                      {/* Comment */}
                      <button className="flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
                        <span className="text-[10px] font-bold text-white drop-shadow">{vibe.super_vibes || 0}</span>
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
                        className="flex flex-col items-center gap-1"
                      >
                        <Share2 className="w-7 h-7 text-white drop-shadow-lg" />
                      </button>

                      {/* Mute toggle (video only) */}
                      {isVideo && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleMute(vibe.id); }}
                          className="flex flex-col items-center gap-1"
                        >
                          {isMuted ? (
                            <VolumeX className="w-6 h-6 text-white/70 drop-shadow-lg" />
                          ) : (
                            <Volume2 className="w-6 h-6 text-white drop-shadow-lg" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-6 left-4 right-16 z-10">
                      {/* User info */}
                      <div className="flex items-center gap-2 mb-2">
                        {vibe.profile?.avatar_url ? (
                          <img src={vibe.profile.avatar_url} alt="" className="w-10 h-10 rounded-full border-2 border-white/30 object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{getName(vibe)[0]}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-white drop-shadow flex items-center gap-1.5">
                            {getName(vibe)}
                            {vibe.profile?.is_vip && <Crown className="w-3.5 h-3.5 text-gold" />}
                            {vibe.is_official && (
                              <span className="text-[9px] bg-gold/30 text-gold px-1.5 py-0.5 rounded font-bold">PRO</span>
                            )}
                          </p>
                          <p className="text-[10px] text-white/60 drop-shadow">{timeAgo(vibe.created_at)}</p>
                        </div>
                      </div>

                      {/* Caption */}
                      {vibe.caption && (
                        <p className="text-sm text-white/90 drop-shadow mb-2 line-clamp-2">{vibe.caption}</p>
                      )}

                      {/* Location + mood */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {vibe.location && (
                          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                            <MapPin className="w-3 h-3 text-gold" />
                            <span className="text-xs font-medium text-white">{vibe.location}</span>
                          </div>
                        )}
                        {vibe.mood && MOOD_EMOJI[vibe.mood] && (
                          <div className="bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                            <span className="text-sm">{MOOD_EMOJI[vibe.mood]}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Swipe hint for first vibe */}
                    {currentIndex === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.7, 0] }}
                        transition={{ delay: 2, duration: 2, repeat: 1 }}
                        className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none"
                      >
                        ↑ Swipe pour voir plus
                      </motion.div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
