import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Heart, Image as ImageIcon, Users } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface PublicProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
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
  const { isFollowing, toggleFollow } = useFollows();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [vibes, setVibes] = useState<UserVibe[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        // Fetch profile
        const { data: p } = await supabase
          .from("profiles_public")
          .select("user_id, full_name, avatar_url, is_vip")
          .eq("user_id", userId)
          .maybeSingle();

        if (!p) {
          navigate("/", { replace: true });
          return;
        }
        setProfile(p);

        // Fetch vibes
        const { data: v } = await supabase
          .from("vibes")
          .select("id, image_url, caption, likes, created_at, media_type")
          .eq("user_id", userId)
          .eq("is_official", false)
          .order("created_at", { ascending: false })
          .limit(12);

        if (v) {
          setVibes(v);
          setTotalLikes(v.reduce((s, vb) => s + (vb.likes || 0), 0));
        }

        // Followers count
        const { count } = await supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("following_id", userId);
        setFollowersCount(count ?? 0);
      } catch (err) {
        console.error("Profile load error:", err);
        toast.error("Erreur chargement profil");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, navigate]);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const displayName = profile.full_name || "Anonyme";
  const tier = getTier(vibes.length);
  const isMe = user?.id === userId;

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground font-display truncate">{displayName}</h1>
      </div>

      {/* Profile info */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-5">
          <Avatar className="w-20 h-20 border-2 border-border">
            <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-gold/10 text-gold text-2xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground truncate">{displayName}</h2>
              {profile.is_vip && <Crown className="w-4 h-4 text-gold shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm">{tier.emoji}</span>
              <span className={`text-xs font-semibold ${tier.color}`}>{tier.label}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-5">
          {[
            { value: vibes.length, label: "Vibes", icon: ImageIcon },
            { value: totalLikes, label: "Likes", icon: Heart },
            { value: followersCount, label: "Followers", icon: Users },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Follow button */}
        {!isMe && user && userId && (
          <button
            onClick={() => toggleFollow(userId)}
            className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
              isFollowing(userId)
                ? "bg-card border border-border text-foreground"
                : "text-primary-foreground"
            }`}
            style={!isFollowing(userId) ? { background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light)))" } : undefined}
          >
            {isFollowing(userId) ? "Suivi ✓" : "Suivre"}
          </button>
        )}
      </div>

      {/* Vibes grid */}
      <div className="px-1">
        {vibes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Aucun vibe pour l'instant</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {vibes.map((v) => (
              <motion.button
                key={v.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => navigate(`/vibe/${v.id}`)}
                className="aspect-square relative overflow-hidden bg-card"
              >
                {v.media_type === "video" ? (
                  <video src={v.image_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  <img src={v.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}
                <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-background/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                  <Heart className="w-2.5 h-2.5 text-gold" />
                  <span className="text-[9px] font-bold text-foreground">{v.likes}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
