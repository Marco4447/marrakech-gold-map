import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, MapPin, Share2, Bookmark, Zap, Clock, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";
import { toast } from "sonner";
import { timeAgo } from "@/lib/timeAgo";
import { getDeviceId } from "@/lib/deviceId";
import { getShareUrl } from "@/lib/shareUrl";
import { usePageMeta } from "@/hooks/usePageMeta";
import VibeComments from "@/components/VibeComments";
import VibeExpiryBar from "@/components/VibeExpiryBar";
import DoubleTapHeart from "@/components/DoubleTapHeart";

interface VibeDetail {
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
  media_type: string;
  mood: string | null;
  is_official: boolean;
}

interface VibeProfile {
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  is_vip: boolean | null;
}

export default function VibePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const [vibe, setVibe] = useState<VibeDetail | null>(null);

  usePageMeta({
    title: vibe ? `${vibe.location || "Vibe"} par ${vibe.username || "Anonyme"}` : "Vibe",
    description: vibe?.caption || vibe?.insider_tip || "Découvre cette vibe sur Weshkech — Marrakech en temps réel.",
    image: vibe?.image_url || undefined,
    url: vibe ? `https://weshkech.com/vibe/${vibe.id}` : undefined,
  });
  const [profile, setProfile] = useState<VibeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [doubleTapShow, setDoubleTapShow] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [moreVibes, setMoreVibes] = useState<VibeDetail[]>([]);

  useEffect(() => {
    if (!id) { navigate("/"); return; }

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("vibes")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!data) {
          toast.error("Publication introuvable");
          navigate(-1);
          return;
        }

        setVibe(data as VibeDetail);
        setLikeCount(data.likes || 0);

        // Check if liked
        const deviceId = getDeviceId();
        const { count: likeExists } = await supabase
          .from("vibe_likes")
          .select("id", { count: "exact", head: true })
          .eq("vibe_id", id)
          .eq("device_id", deviceId);
        setLiked((likeExists || 0) > 0);

        // Comment count
        const { count: cc } = await supabase
          .from("vibe_comments")
          .select("id", { count: "exact", head: true })
          .eq("vibe_id", id);
        setCommentCount(cc || 0);

        // Fetch author profile
        if (data.user_id) {
          const { data: prof } = await supabase
            .from("profiles_public" as any)
            .select("full_name, avatar_url, username, is_vip")
            .eq("user_id", data.user_id)
            .maybeSingle();
          if (prof) setProfile(prof as unknown as VibeProfile);
        }

        // More vibes from same author or location
        const moreQuery = data.is_official && data.location
          ? supabase.from("vibes").select("*").eq("location", data.location).neq("id", id).order("created_at", { ascending: false }).limit(6)
          : data.user_id
            ? supabase.from("vibes").select("*").eq("user_id", data.user_id).neq("id", id).order("created_at", { ascending: false }).limit(6)
            : null;

        if (moreQuery) {
          const { data: moreData } = await moreQuery;
          if (moreData) setMoreVibes(moreData as VibeDetail[]);
        }
      } catch {
        toast.error("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  const handleLike = useCallback(async () => {
    if (!vibe) return;
    const deviceId = getDeviceId();

    if (liked) {
      setLiked(false);
      setLikeCount(c => c - 1);
      await supabase.from("vibe_likes").delete().eq("vibe_id", vibe.id).eq("device_id", deviceId);
      await supabase.rpc("increment_vibe_likes", { p_vibe_id: vibe.id, p_delta: -1 });
    } else {
      setLiked(true);
      setLikeCount(c => c + 1);
      await supabase.from("vibe_likes").insert({ vibe_id: vibe.id, device_id: deviceId, user_id: user?.id || null });
      await supabase.rpc("increment_vibe_likes", { p_vibe_id: vibe.id, p_delta: 1 });
    }
  }, [vibe, liked, user]);

  const handleDoubleTap = useCallback(() => {
    if (!liked) handleLike();
    setDoubleTapShow(true);
    setTimeout(() => setDoubleTapShow(false), 800);
  }, [liked, handleLike]);

  const handleShare = useCallback(async () => {
    if (!vibe) return;
    const url = getShareUrl("vibe", vibe.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: vibe.caption || "Vibe Marrakech", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien copié !");
      }
    } catch {}
  }, [vibe]);

  const handleSeeOnMap = useCallback(() => {
    if (!vibe?.latitude || !vibe?.longitude) return;
    sessionStorage.setItem("wk_flyto", JSON.stringify({
      lat: vibe.latitude,
      lng: vibe.longitude,
      placeId: null,
    }));
    navigate("/");
  }, [vibe, navigate]);

  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (vibe?.username) return vibe.username;
    if (vibe?.is_official && vibe.location) return vibe.location;
    return "Anonyme";
  };

  const getAvatarUrl = () => profile?.avatar_url || null;

  const getAuthorLink = () => {
    if (!vibe) return "#";
    if (vibe.is_official) return `/u/official_${encodeURIComponent(getDisplayName())}`;
    if (vibe.user_id) return `/u/${vibe.user_id}`;
    return "#";
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vibe) return null;

  const SIX_HOURS = 6 * 60 * 60 * 1000;
  const age = Date.now() - new Date(vibe.created_at).getTime();
  const isExpired = !vibe.is_official && age > SIX_HOURS;

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-center relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-card active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-sm font-bold text-foreground font-display">Publication</h1>
        <button
          onClick={handleShare}
          className="absolute right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-card active:scale-90 transition-all"
        >
          <Share2 className="w-4.5 h-4.5 text-foreground" />
        </button>
      </div>

      {/* Author header */}
      <Link to={getAuthorLink()} className="flex items-center gap-3 px-3 py-2.5">
        {getAvatarUrl() ? (
          <img src={getAvatarUrl()!} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-foreground">{getDisplayName().charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">{getDisplayName()}</p>
          {vibe.location && (
            <p className="text-xs text-muted-foreground truncate leading-tight flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {vibe.location}
            </p>
          )}
        </div>
        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-0.5">
          <Clock className="w-3 h-3" />
          {timeAgo(vibe.created_at)}
        </span>
      </Link>

      {/* Media */}
      <div className="relative aspect-[4/5] bg-black" onClick={handleDoubleTap}>
        {vibe.media_type === "video" ? (
          <video
            src={vibe.image_url}
            className="w-full h-full object-cover"
            controls
            playsInline
            autoPlay
            muted
            loop
          />
        ) : (
          <img src={vibe.image_url} alt={vibe.caption || ""} className="w-full h-full object-cover" />
        )}
        <DoubleTapHeart show={doubleTapShow} />
        {isExpired && (
          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md rounded-full px-2.5 py-1 text-2xs font-bold text-muted-foreground">
            Expiré
          </div>
        )}
      </div>

      {/* Expiry bar */}
      {!vibe.is_official && !isExpired && (
        <VibeExpiryBar createdAt={vibe.created_at} />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="active:scale-90 transition-transform">
            <Heart className={`w-6 h-6 ${liked ? "fill-red-500 text-red-500" : "text-foreground"}`} />
          </button>
          <button onClick={() => setShowComments(!showComments)} className="active:scale-90 transition-transform">
            <MessageCircle className="w-6 h-6 text-foreground" />
          </button>
          <button onClick={handleShare} className="active:scale-90 transition-transform">
            <Share2 className="w-5.5 h-5.5 text-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {vibe.latitude && vibe.longitude && (
            <button
              onClick={handleSeeOnMap}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs font-bold text-foreground active:scale-95 transition-transform"
            >
              <Navigation className="w-3.5 h-3.5 text-gold" />
              Voir sur la carte
            </button>
          )}
          {user && (
            <button
              onClick={() => toggleBookmark(vibe.id)}
              className="active:scale-90 transition-transform"
            >
              <Bookmark className={`w-6 h-6 ${isBookmarked(vibe.id) ? "fill-foreground text-foreground" : "text-foreground"}`} />
            </button>
          )}
        </div>
      </div>

      {/* Likes & caption */}
      <div className="px-3 pb-2">
        <p className="text-sm font-bold text-foreground">{likeCount} J'aime{likeCount !== 1 ? "s" : ""}</p>
        {vibe.caption && (
          <p className="text-sm text-foreground mt-1">
            <Link to={getAuthorLink()} className="font-semibold mr-1">{getDisplayName()}</Link>
            {vibe.caption}
          </p>
        )}
        {vibe.insider_tip && (
          <div className="mt-2 bg-gold/10 border border-gold/20 rounded-xl px-3 py-2">
            <p className="text-xs font-bold text-gold mb-0.5">💡 Insider Tip</p>
            <p className="text-[12px] text-foreground">{vibe.insider_tip}</p>
          </div>
        )}
        {vibe.mood && (
          <p className="text-xs text-muted-foreground mt-1">Mood: {vibe.mood}</p>
        )}
      </div>

      {/* Location card */}
      {vibe.location && (
        <div className="mx-3 mb-3 bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{vibe.location}</p>
                <p className="text-xs text-muted-foreground">Marrakech</p>
              </div>
            </div>
            {vibe.latitude && vibe.longitude && (
              <button
                onClick={handleSeeOnMap}
                className="text-xs font-bold text-gold active:scale-95 transition-transform"
              >
                Ouvrir ↗
              </button>
            )}
          </div>
        </div>
      )}

      {/* Comments */}
      {commentCount > 0 && !showComments && (
        <button
          onClick={() => setShowComments(true)}
          className="px-3 pb-2 text-sm text-muted-foreground"
        >
          Voir les {commentCount} commentaire{commentCount !== 1 ? "s" : ""}
        </button>
      )}
      {showComments && (
        <div className="px-3 pb-3">
          <VibeComments vibeId={vibe.id} open={showComments} onOpenChange={setShowComments} />
        </div>
      )}

      {/* More from this author */}
      {moreVibes.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="px-3 text-sm font-bold text-muted-foreground mb-3">
            Plus de {getDisplayName()}
          </p>
          <div className="grid grid-cols-3 gap-[1px]">
            {moreVibes.map((v) => (
              <Link key={v.id} to={`/vibe/${v.id}`}>
                <div className="aspect-square relative overflow-hidden bg-card group">
                  {v.media_type === "video" ? (
                    <video src={v.image_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    <img src={v.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-1.5 text-foreground font-bold text-sm">
                      <Heart className="w-5 h-5 fill-foreground" />
                      {v.likes}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
