import { useEffect, useState, useRef, useCallback } from "react";
import { Camera, MapPin, Clock, X, Loader2, Send, ImageIcon, Heart, TrendingUp, AlertCircle, MessageCircle, Zap, ThumbsUp, ThumbsDown, Trash2, Video, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import VibeComments, { useCommentCounts } from "./VibeComments";
import SuperVibeParticles from "./SuperVibeParticles";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const THIRTY_MIN = 30 * 60 * 1000;
const MAX_POSTS_PER_WINDOW = 3;

interface VibeProfile {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface Vibe {
  id: string;
  image_url: string;
  caption: string | null;
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

function VibeMedia({ vibe, className }: { vibe: Vibe; className?: string }) {
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = vibe.media_type === "video";

  if (!isVideo) {
    return <img src={vibe.image_url} alt={vibe.caption || "Vibe"} className={className} loading="lazy" />;
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
  return v.likes + (v.super_vibes || 0) * 5;
}

function getDeviceId(): string {
  let id = localStorage.getItem("wk_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wk_device_id", id);
  }
  return id;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  return `il y a ${hours}h`;
}

function isNew(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < THIRTY_MIN;
}

function CommunityValidation({ vibeId, deviceId }: { vibeId: string; deviceId: string }) {
  const [vote, setVote] = useState<"up" | "down" | null>(() => {
    const stored = localStorage.getItem(`wk_vote_${vibeId}`);
    return stored === "up" || stored === "down" ? stored : null;
  });

  const handleVote = (type: "up" | "down") => {
    if (vote === type) return;
    setVote(type);
    localStorage.setItem(`wk_vote_${vibeId}`, type);
  };

  return (
    <div className="flex items-center justify-center gap-3 py-2.5 px-4 border-t border-border bg-surface/50">
      <span className="text-[11px] text-muted-foreground font-medium">Toujours d'actualité ?</span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleVote("up")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            vote === "up"
              ? "bg-green-500/15 text-green-400 border border-green-500/30"
              : "bg-surface border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          👍
        </button>
        <button
          onClick={() => handleVote("down")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            vote === "down"
              ? "bg-red-500/15 text-red-400 border border-red-500/30"
              : "bg-surface border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          👎
        </button>
      </div>
    </div>
  );
}

export default function LivePage({ refreshSignal = 0, onGoToMap }: { refreshSignal?: number; onGoToMap?: (lat: number, lng: number) => void }) {
  const { user } = useAuth();
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [postLimitReached, setPostLimitReached] = useState(false);
  const [commentVibeId, setCommentVibeId] = useState<string | null>(null);
  const [superVibeIds, setSuperVibeIds] = useState<Set<string>>(new Set());
  const [superVibeAnimId, setSuperVibeAnimId] = useState<string | null>(null);
  const [canSuperVibe, setCanSuperVibe] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem("weshkech_vibez_tutorial_seen");
  });
  const commentCounts = useCommentCounts(vibes.map((v) => v.id));

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
    const sixHoursAgo = new Date(Date.now() - SIX_HOURS).toISOString();
    const { data, error } = await supabase
      .from("vibes")
      .select("*")
      .gte("created_at", sixHoursAgo)
      .order("likes", { ascending: false });
    if (!error && data) {
      // Fetch profiles for vibes that have user_id
      const userIds = [...new Set((data as any[]).filter(v => v.user_id).map(v => v.user_id))];
      let profilesMap: Record<string, VibeProfile> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles_public" as any)
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        if (profiles) {
          profilesMap = Object.fromEntries(profiles.map((p: any) => [p.user_id, p]));
        }
      }
      const vibesWithProfiles = (data as any[]).map(v => ({
        ...v,
        profile: v.user_id ? profilesMap[v.user_id] || null : null,
      }));
      setVibes(vibesWithProfiles.sort((a, b) => getScore(b) - getScore(a)));
    }
    setLoading(false);
  }, []);

  const fetchMyLikes = useCallback(async () => {
    const { data } = await supabase
      .from("vibe_likes")
      .select("vibe_id")
      .eq("device_id", deviceId);
    if (data) {
      setLikedIds(new Set(data.map((l: any) => l.vibe_id)));
    }
  }, [deviceId]);

  const fetchMySuperVibes = useCallback(async () => {
    const { data } = await supabase
      .from("vibe_super_vibes")
      .select("vibe_id, created_at")
      .eq("device_id", deviceId);
    if (data) {
      setSuperVibeIds(new Set(data.map((s: any) => s.vibe_id)));
      const recent = (data as any[]).some((s) => Date.now() - new Date(s.created_at).getTime() < SIX_HOURS);
      setCanSuperVibe(!recent);
    }
  }, [deviceId]);

  const checkPostLimit = useCallback(async () => {
    const sixHoursAgo = new Date(Date.now() - SIX_HOURS).toISOString();
    const { data } = await supabase
      .from("vibes")
      .select("id")
      .eq("username", localStorage.getItem("wk_last_username") || deviceId)
      .gte("created_at", sixHoursAgo);
    
    const localPosts = JSON.parse(localStorage.getItem("wk_post_timestamps") || "[]") as number[];
    const recentPosts = localPosts.filter((t) => Date.now() - t < SIX_HOURS);
    setPostLimitReached(recentPosts.length >= MAX_POSTS_PER_WINDOW);
  }, [deviceId]);

  useEffect(() => {
    fetchVibes();
    fetchMyLikes();
    fetchMySuperVibes();
    checkPostLimit();

    const channel = supabase
      .channel("vibes-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vibes" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newVibe = payload.new as Vibe;
            const age = Date.now() - new Date(newVibe.created_at).getTime();
            if (age < SIX_HOURS) {
              setVibes((prev) => {
                const updated = [newVibe, ...prev];
                return updated.sort((a, b) => getScore(b) - getScore(a));
              });
            }
          } else if (payload.eventType === "DELETE") {
            setVibes((prev) => prev.filter((v) => v.id !== (payload.old as any).id));
          } else if (payload.eventType === "UPDATE") {
            setVibes((prev) => {
              const updated = prev.map((v) =>
                v.id === (payload.new as Vibe).id ? (payload.new as Vibe) : v
              );
              return updated.sort((a, b) => getScore(b) - getScore(a));
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVibes, fetchMyLikes, fetchMySuperVibes, checkPostLimit, refreshSignal]);

  const handleLike = async (vibeId: string) => {
    const alreadyLiked = likedIds.has(vibeId);
    setAnimatingId(vibeId);
    setTimeout(() => setAnimatingId(null), 400);

    if (alreadyLiked) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.delete(vibeId);
        return next;
      });
      setVibes((prev) =>
        prev.map((v) => (v.id === vibeId ? { ...v, likes: Math.max(0, v.likes - 1) } : v))
          .sort((a, b) => getScore(b) - getScore(a))
      );
      await supabase.from("vibe_likes").delete().eq("vibe_id", vibeId).eq("device_id", deviceId);
      await supabase.from("vibes").update({ likes: Math.max(0, (vibes.find(v => v.id === vibeId)?.likes ?? 1) - 1) }).eq("id", vibeId);
    } else {
      setLikedIds((prev) => new Set(prev).add(vibeId));
      setVibes((prev) =>
        prev.map((v) => (v.id === vibeId ? { ...v, likes: v.likes + 1 } : v))
          .sort((a, b) => getScore(b) - getScore(a))
      );
      await supabase.from("vibe_likes").insert({ vibe_id: vibeId, device_id: deviceId });
      await supabase.from("vibes").update({ likes: (vibes.find(v => v.id === vibeId)?.likes ?? 0) + 1 }).eq("id", vibeId);
    }
  };

  const handleSuperVibe = async (vibeId: string) => {
    if (!canSuperVibe || superVibeIds.has(vibeId)) return;
    setSuperVibeAnimId(vibeId);
    setTimeout(() => setSuperVibeAnimId(null), 700);

    setSuperVibeIds((prev) => new Set(prev).add(vibeId));
    setCanSuperVibe(false);
    setVibes((prev) =>
      prev.map((v) => (v.id === vibeId ? { ...v, super_vibes: (v.super_vibes || 0) + 1 } : v))
        .sort((a, b) => getScore(b) - getScore(a))
    );

    await supabase.from("vibe_super_vibes").insert({ vibe_id: vibeId, device_id: deviceId });
    await supabase.from("vibes").update({ super_vibes: (vibes.find(v => v.id === vibeId)?.super_vibes ?? 0) + 1 }).eq("id", vibeId);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Validate file type and size (max 10MB)
    if (!f.type.startsWith("image/")) return;
    if (f.size > 10 * 1024 * 1024) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleOpenUpload = () => {
    if (postLimitReached) {
      setShowUpload(true);
      return;
    }
    setShowUpload(true);
  };

  const handleUpload = async () => {
    if (!file || postLimitReached) return;
    setUploading(true);
    setUploadProgress(10);

    const uploadTimeout = setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      console.error("Upload timeout after 30s");
    }, 30000);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from("vibes")
        .upload(fileName, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      setUploadProgress(70);
      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/vibes/${fileName}`;

      const { error: insertError } = await supabase.from("vibes").insert({
        image_url: imageUrl,
        location: uploadLocation || null,
        username: user?.user_metadata?.full_name || user?.email?.split("@")[0] || null,
        user_id: user?.id || null,
        caption: null,
        likes: 0,
      });
      if (insertError) throw insertError;

      // Track post timestamp locally
      const timestamps = JSON.parse(localStorage.getItem("wk_post_timestamps") || "[]") as number[];
      timestamps.push(Date.now());
      localStorage.setItem("wk_post_timestamps", JSON.stringify(timestamps.filter((t) => Date.now() - t < SIX_HOURS)));

      setUploadProgress(100);
      checkPostLimit();

      clearTimeout(uploadTimeout);
      setTimeout(() => {
        setShowUpload(false);
        setFile(null);
        setPreview(null);
        setUploadLocation("");
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      clearTimeout(uploadTimeout);
      console.error("Upload error:", err);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Official vibes pinned first, then top 5 by score for carousel
  const officialVibes = vibes.filter((v) => v.is_official);
  const regularVibes = vibes.filter((v) => !v.is_official);
  const topVibes = [...regularVibes].sort((a, b) => getScore(b) - getScore(a)).slice(0, 5);
  const restVibes = [...officialVibes, ...regularVibes];

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 relative">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">
              <span className="text-gold">Live</span>
              <span className="text-foreground"> Stories</span>
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Éphémère · Disparaît après 6h
            </p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{vibes.length} live</span>
          </div>
        </div>
      </div>

      {/* Mini Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-gold/30 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h2 className="font-display text-lg font-bold text-gold text-center mb-5">Comment ça marche ?</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Like</p>
                    <p className="text-xs text-muted-foreground">Montre ton soutien en likant les vibes qui te parlent.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Super Vibe ⚡</p>
                    <p className="text-xs text-muted-foreground">Booste un post pour le faire monter dans le Top 5. Limité à 1 par jour !</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Commentaires</p>
                    <p className="text-xs text-muted-foreground">Clique sur un post pour laisser un commentaire et échanger.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem("weshkech_vibez_tutorial_seen", "1");
                  setShowTutorial(false);
                }}
                className="mt-6 w-full py-2.5 rounded-xl text-sm font-bold text-primary-foreground"
                style={{ background: "linear-gradient(to bottom right, #BF953F, #FCF6BA, #B38728)" }}
              >
                C'est compris ! 🔥
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-4 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-surface animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : vibes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-gold" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">Aucun vibe live</h2>
          <p className="text-sm text-muted-foreground">
            Sois le premier à partager ton vibe ! Les photos disparaissent après 6 heures.
          </p>
        </div>
      ) : (
        <>
          {/* ===== TOP VIBES CAROUSEL ===== */}
          {topVibes.length > 0 && (
            <div className="pt-4 pb-2 px-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-gold" />
                <h2 className="font-display text-sm font-semibold text-foreground">Top 5 Vibes du Moment</h2>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {topVibes.map((vibe, i) => (
                  <motion.div
                    key={`top-${vibe.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setCommentVibeId(vibe.id)}
                    className="relative flex-shrink-0 w-[45vw] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-gold/30 cursor-pointer active:scale-95 transition-transform"
                  >
                    <VibeMedia vibe={vibe} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

                    {/* Rank badge with shine */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-gold px-2.5 py-1 rounded-lg shadow-lg overflow-hidden">
                      <span className="text-[10px] font-black text-primary-foreground uppercase tracking-wider">
                        TOP {i + 1}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" style={{ transform: "skewX(-20deg)" }} />
                    </div>

                    {/* Score badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/70 backdrop-blur-md px-2 py-1 rounded-lg group/score cursor-help">
                      <Zap className="w-3 h-3 text-gold" />
                      <span className="text-[10px] font-bold text-gold">{getScore(vibe)}</span>
                      <div className="absolute top-full right-0 mt-1 hidden group-hover/score:block z-50">
                        <div className="bg-background/95 backdrop-blur-md border border-gold/30 rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                          <p className="text-[10px] font-semibold text-gold">⚡ Super Vibes</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Score de popularité du post</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 inset-x-0 p-3">
                      <div className="flex items-center gap-1.5">
                        {getAvatarUrl(vibe) && (
                          <img src={getAvatarUrl(vibe)!} alt="" className="w-5 h-5 rounded-full border border-gold/30 object-cover" />
                        )}
                        <p className="text-xs font-semibold text-foreground truncate">
                          {getDisplayName(vibe)}
                        </p>
                      </div>
                      {vibe.location && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-gold" />
                          <span className="text-[10px] text-foreground/70 truncate">{vibe.location}</span>
                          {vibe.latitude && vibe.longitude && onGoToMap && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onGoToMap(vibe.latitude!, vibe.longitude!); }}
                              className="ml-0.5 text-[9px] text-gold font-semibold underline underline-offset-2 flex-shrink-0"
                            >
                              Map
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-gold text-gold" />
                          <span className="text-[10px] font-bold text-gold">{vibe.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-foreground/60" />
                          <span className="text-[10px] font-medium text-foreground/60">{commentCounts[vibe.id] || 0}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ===== MAIN FEED ===== */}
          <div className="space-y-4 p-4">
            {restVibes.map((vibe, i) => {
              const liked = likedIds.has(vibe.id);
              const isAnimating = animatingId === vibe.id;

              return (
                <motion.div
                  key={vibe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative rounded-2xl overflow-hidden bg-card border border-border"
                >
                  <div className="aspect-[3/4] relative">
                    <VibeMedia vibe={vibe} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/90 to-transparent" />

                    {vibe.is_official && (
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-gold px-2.5 py-1 rounded-lg shadow-lg shadow-gold/30">
                        <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-wider">
                          ⭐ Officiel
                        </span>
                      </div>
                    )}
                    {!vibe.is_official && isNew(vibe.created_at) && (
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-lg shadow-lg shadow-red-600/30 live-badge-blink">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          LIVE
                        </span>
                      </div>
                    )}

                    <div className="absolute top-3 right-3 bg-background/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                      <span className="text-[10px] text-foreground font-medium">
                        {timeAgo(vibe.created_at)}
                      </span>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <div className="flex items-end justify-between">
                        <div className="flex items-center gap-2">
                          {getAvatarUrl(vibe) ? (
                            <img src={getAvatarUrl(vibe)!} alt="" className="w-8 h-8 rounded-full border-2 border-gold/30 object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gold/20 border-2 border-gold/30 flex items-center justify-center">
                              <span className="text-xs font-bold text-gold">{getDisplayName(vibe).charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {getDisplayName(vibe)}
                            </p>
                            {vibe.location && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-gold" />
                                <span className="text-xs text-foreground/70">{vibe.location}</span>
                                {vibe.latitude && vibe.longitude && onGoToMap && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onGoToMap(vibe.latitude!, vibe.longitude!); }}
                                    className="ml-1 text-[10px] text-gold font-semibold underline underline-offset-2"
                                  >
                                    Voir sur la map
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Comment button */}
                          <button
                            onClick={() => setCommentVibeId(vibe.id)}
                            className="flex flex-col items-center gap-0.5 group"
                          >
                            <MessageCircle className="w-6 h-6 text-foreground/70 group-hover:text-gold/70 transition-colors" />
                            <span className="text-xs font-semibold text-foreground/70">
                              {commentCounts[vibe.id] || 0}
                            </span>
                          </button>

                          {/* Like button */}
                          <button
                            onClick={() => handleLike(vibe.id)}
                            className="flex flex-col items-center gap-0.5 group"
                          >
                            <motion.div
                              animate={isAnimating ? { scale: [1, 1.4, 0.9, 1.15, 1] } : {}}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                              <Heart
                                className={`w-7 h-7 transition-colors duration-200 ${
                                  liked
                                    ? "fill-gold text-gold drop-shadow-[0_0_6px_hsl(43,56%,52%,0.5)]"
                                    : "text-foreground/70 group-hover:text-gold/70"
                                }`}
                              />
                            </motion.div>
                            <span className={`text-xs font-semibold ${liked ? "text-gold" : "text-foreground/70"}`}>
                              {vibe.likes}
                            </span>
                          </button>

                          {/* Super Vibe button */}
                          <button
                            onClick={() => handleSuperVibe(vibe.id)}
                            disabled={!canSuperVibe || superVibeIds.has(vibe.id)}
                            className="flex flex-col items-center gap-0.5 group relative"
                            title="Super Vibe — Booste ce post dans le classement !"
                          >
                            <motion.div
                              animate={superVibeAnimId === vibe.id ? { scale: [1, 1.6, 0.8, 1.2, 1], rotate: [0, -10, 10, -5, 0] } : {}}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            >
                              <Zap
                                className={`w-6 h-6 transition-colors duration-200 ${
                                  superVibeIds.has(vibe.id)
                                    ? "fill-gold text-gold drop-shadow-[0_0_8px_hsl(43,56%,52%,0.6)]"
                                    : !canSuperVibe
                                    ? "text-foreground/30"
                                    : "text-foreground/70 group-hover:text-gold/70"
                                }`}
                              />
                            </motion.div>
                            <span className={`text-[10px] font-semibold ${superVibeIds.has(vibe.id) ? "text-gold" : "text-foreground/70"}`}>
                              {(vibe as any).super_vibes || 0}
                            </span>
                            <SuperVibeParticles active={superVibeAnimId === vibe.id} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete own vibe + Community validation */}
                  <div className="flex items-center justify-between border-t border-border">
                    {user && vibe.user_id === user.id ? (
                      <button
                        onClick={() => handleDeleteVibe(vibe.id)}
                        disabled={deletingId === vibe.id}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        {deletingId === vibe.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px] font-medium">Supprimer ma Vibe</span>
                      </button>
                    ) : <div />}
                    <CommunityValidation vibeId={vibe.id} deviceId={deviceId} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Upload moved to FlashPost component via BottomNav */}

      {/* Comments sheet */}
      <VibeComments
        vibeId={commentVibeId || ""}
        open={!!commentVibeId}
        onOpenChange={(open) => !open && setCommentVibeId(null)}
      />
    </div>
  );
}
