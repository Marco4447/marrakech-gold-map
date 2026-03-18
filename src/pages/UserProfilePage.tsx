import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Crown, Heart, Image as ImageIcon, Users, MessageCircle, Grid3X3, Zap, Play } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import FollowButton from "@/components/FollowButton";
import { toast } from "sonner";

interface PublicProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_vip: boolean | null;
}

interface UserVibe {
  id: string;
  image_url: string;
  caption: string | null;
  likes: number;
  created_at: string;
  media_type: string;
}

function getTier(vibeCount: number): { emoji: string; label: string; color: string } {
  if (vibeCount >= 20) return { emoji: "👑", label: "Legend", color: "text-amber-400" };
  if (vibeCount >= 5) return { emoji: "🔥", label: "Insider", color: "text-gold" };
  if (vibeCount >= 1) return { emoji: "🧭", label: "Explorer", color: "text-emerald-400" };
  return { emoji: "🌱", label: "Nouveau", color: "text-muted-foreground" };
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFollowerCount, getFollowingCount, isFollowing } = useFollows();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [vibes, setVibes] = useState<UserVibe[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const [profileRes, vibesRes, fc, fwc] = await Promise.all([
          supabase
            .from("profiles_public" as any)
            .select("user_id, full_name, avatar_url, is_vip")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("vibes")
            .select("id, image_url, likes, caption, created_at, media_type")
            .eq("user_id", userId)
            .eq("is_official", false)
            .order("created_at", { ascending: false })
            .limit(18),
          getFollowerCount(userId),
          getFollowingCount(userId),
        ]);

        if (profileRes.data) setProfile(profileRes.data as any);
        if (vibesRes.data) setVibes(vibesRes.data as UserVibe[]);
        setFollowerCount(fc);
        setFollowingCount(fwc);
      } catch {
        toast.error("Impossible de charger ce profil");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-[100dvh] w-full bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-foreground font-semibold">Profil introuvable</p>
        <button onClick={() => navigate(-1)} className="text-sm text-gold">Retour</button>
      </div>
    );
  }

  const displayName = profile.full_name || "Utilisateur";
  const initial = displayName.charAt(0).toUpperCase();
  const tier = getTier(vibes.length);
  const isMe = user?.id === userId;

  const handleSendMessage = () => {
    if (!user) {
      toast("Connecte-toi pour envoyer un message");
      return;
    }
    window.dispatchEvent(new CustomEvent("wk:open-dm", {
      detail: {
        userId: profile.user_id,
        userName: profile.full_name,
        userAvatar: profile.avatar_url,
      }
    }));
    navigate("/");
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-card active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground font-display truncate">{displayName}</h1>
      </div>

      {/* Profile header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <Avatar className="w-20 h-20 border-2 border-border">
            <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-gold/10 text-gold text-2xl font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>

          {/* Stats */}
          <div className="flex-1 flex justify-around pt-2">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{vibes.length}</p>
              <p className="text-[10px] text-muted-foreground">Vibes</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{followerCount}</p>
              <p className="text-[10px] text-muted-foreground">Abonnés</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{followingCount}</p>
              <p className="text-[10px] text-muted-foreground">Abonnements</p>
            </div>
          </div>
        </div>

        {/* Name + tier */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">{displayName}</h2>
            {profile.is_vip && <Crown className="w-4 h-4 text-gold" />}
            <span className={`text-xs font-semibold ${tier.color}`}>
              {tier.emoji} {tier.label}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        {!isMe && (
          <div className="flex gap-2 mt-4">
            <div className="flex-1">
              <FollowButton
                targetUserId={userId!}
                size="lg"
                variant="pill"
                onFollowChange={(isNow) => {
                  setFollowerCount(prev => isNow ? prev + 1 : Math.max(0, prev - 1));
                }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-card border border-border text-sm font-semibold text-foreground active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
          </div>
        )}
      </div>

      {/* Vibes grid */}
      <div className="px-1">
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
          <Grid3X3 className="w-4 h-4 text-foreground" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Vibes
          </span>
        </div>

        {vibes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Aucune vibe pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {vibes.map((vibe, i) => (
              <Link key={vibe.id} to={`/vibe/${vibe.id}`}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="aspect-square relative overflow-hidden bg-card group"
                >
                  {vibe.media_type === "video" ? (
                    <video src={vibe.image_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    <img src={vibe.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-1 text-foreground font-bold text-sm">
                      <Heart className="w-4 h-4" />
                      {vibe.likes}
                    </div>
                  </div>
                  {vibe.media_type === "video" && (
                    <div className="absolute top-1.5 right-1.5">
                      <Play className="w-3.5 h-3.5 text-foreground drop-shadow" />
                    </div>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
