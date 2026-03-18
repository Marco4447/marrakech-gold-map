import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Crown, Heart, Image as ImageIcon, Grid3X3, Play, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import FollowButton from "@/components/FollowButton";
import { toast } from "sonner";

interface PublicProfile {
  user_id: string | null;
  full_name: string | null;
  username: string | null;
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
  username?: string | null;
  location?: string | null;
}

function getTier(vibeCount: number): { emoji: string; label: string; color: string } {
  if (vibeCount >= 20) return { emoji: "👑", label: "Legend", color: "text-amber-400" };
  if (vibeCount >= 5) return { emoji: "🔥", label: "Insider", color: "text-gold" };
  if (vibeCount >= 1) return { emoji: "🧭", label: "Explorer", color: "text-emerald-400" };
  return { emoji: "🌱", label: "Nouveau", color: "text-muted-foreground" };
}

function parseBio(raw: string | null): { text: string; link: string | null } {
  if (!raw) return { text: "", link: null };
  const match = raw.match(/\[(?:link|LINK):(.*?)\]/);
  if (match) {
    return { text: raw.replace(match[0], "").trim(), link: match[1] };
  }
  return { text: raw, link: null };
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFollowerCount, getFollowingCount } = useFollows();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [vibes, setVibes] = useState<UserVibe[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [placeInstagram, setPlaceInstagram] = useState<string | null>(null);
  const [isFollowingPlace, setIsFollowingPlace] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const decodedProfileParam = decodeURIComponent(userId || "");
  const isOfficialProfileRoute = decodedProfileParam.startsWith("official_");
  const officialProfileName = isOfficialProfileRoute
    ? decodedProfileParam.replace(/^official_/, "").trim()
    : null;

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);

      try {
        if (isOfficialProfileRoute && officialProfileName) {
          const [officialByUsernameRes, officialByLocationRes, placeRes] = await Promise.all([
            supabase
              .from("vibes")
              .select("id, image_url, likes, caption, created_at, media_type, username, location")
              .eq("is_official", true)
              .eq("username", officialProfileName)
              .order("created_at", { ascending: false })
              .limit(30),
            supabase
              .from("vibes")
              .select("id, image_url, likes, caption, created_at, media_type, username, location")
              .eq("is_official", true)
              .eq("location", officialProfileName)
              .order("created_at", { ascending: false })
              .limit(30),
            supabase
              .from("places")
              .select("id, image_url, instagram_handle")
              .eq("name", officialProfileName)
              .maybeSingle(),
          ]);

          const byUsername = (officialByUsernameRes.data || []) as UserVibe[];
          const byLocation = (officialByLocationRes.data || []) as UserVibe[];
          const mergedMap = new Map<string, UserVibe>();

          [...byUsername, ...byLocation].forEach((v) => mergedMap.set(v.id, v));

          const officialVibes = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          if (officialVibes.length === 0) {
            setProfile(null);
            setVibes([]);
            setFollowerCount(0);
            setFollowingCount(0);
            return;
          }

          const primaryName = officialProfileName || officialVibes[0]?.username || officialVibes[0]?.location || "Profil officiel";

          setProfile({
            user_id: null,
            full_name: primaryName,
            username: primaryName.toLowerCase().replace(/\s+/g, "_"),
            avatar_url: placeRes.data?.image_url || officialVibes[0]?.image_url || null,
            bio: `Compte officiel · ${primaryName}`,
            is_vip: true,
          });
          setVibes(officialVibes.slice(0, 30));
          setFollowerCount(0);
          setFollowingCount(0);

          // Store place_id and check follow status
          const fetchedPlaceId = placeRes.data?.id || null;
          setPlaceId(fetchedPlaceId);
          if (fetchedPlaceId && user) {
            const { count } = await supabase
              .from("place_follows")
              .select("id", { count: "exact", head: true })
              .eq("place_id", fetchedPlaceId)
              .eq("user_id", user.id);
            setIsFollowingPlace((count || 0) > 0);
          }
          return;
        }

        const [profileRes, vibesRes, fc, fwc] = await Promise.all([
          supabase
            .from("profiles_public" as any)
            .select("user_id, full_name, username, avatar_url, bio, is_vip")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("vibes")
            .select("id, image_url, likes, caption, created_at, media_type")
            .eq("user_id", userId)
            .eq("is_official", false)
            .order("created_at", { ascending: false })
            .limit(30),
          getFollowerCount(userId),
          getFollowingCount(userId),
        ]);

        if (profileRes.data) {
          setProfile(profileRes.data as unknown as PublicProfile);
        } else {
          setProfile(null);
        }

        if (vibesRes.data) {
          setVibes(vibesRes.data as UserVibe[]);
        } else {
          setVibes([]);
        }

        setFollowerCount(fc);
        setFollowingCount(fwc);
      } catch {
        toast.error("Impossible de charger ce profil");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [
    userId,
    isOfficialProfileRoute,
    officialProfileName,
    getFollowerCount,
    getFollowingCount,
  ]);

  const handleSendMessage = useCallback(() => {
    if (!user) {
      toast("Connecte-toi pour envoyer un message");
      return;
    }

    if (!profile || !profile.user_id) {
      toast.error("Messagerie indisponible pour ce profil");
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
  }, [user, profile, navigate]);

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
  const username = profile.username || displayName.toLowerCase().replace(/\s+/g, "");
  const initial = displayName.charAt(0).toUpperCase();
  const tier = getTier(vibes.length);
  const isMe = !!user && !!profile.user_id && user.id === profile.user_id;
  const { text: bioText, link: bioLink } = parseBio(profile.bio);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-center relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-card active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground font-display">{username}</h1>
      </div>

      {/* ── Profile section ── */}
      <div className="px-4 pt-5 pb-3">
        {/* Row: Avatar + Stats */}
        <div className="flex items-center gap-5">
          {/* Avatar with gradient ring */}
          <div className="relative flex-shrink-0">
            <div className="w-[86px] h-[86px] rounded-full p-[3px] bg-gradient-to-tr from-gold via-orange-500 to-pink-500">
              <div className="w-full h-full rounded-full bg-background p-[2px]">
                <Avatar className="w-full h-full">
                  <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
                  <AvatarFallback className="bg-muted text-foreground text-2xl font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            {profile.is_vip && (
              <div className="absolute -bottom-1 -right-1 bg-gold rounded-full p-0.5">
                <Crown className="w-3.5 h-3.5 text-background" />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around">
            <button className="text-center">
              <p className="text-lg font-bold text-foreground leading-tight">{vibes.length}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">publications</p>
            </button>
            <button className="text-center">
              <p className="text-lg font-bold text-foreground leading-tight">{followerCount}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">followers</p>
            </button>
            <button className="text-center">
              <p className="text-lg font-bold text-foreground leading-tight">{followingCount}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">suivi(e)s</p>
            </button>
          </div>
        </div>

        {/* Name + tier badge */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">{displayName}</h2>
            <span className={`text-xs font-semibold ${tier.color}`}>
              {tier.emoji} {tier.label}
            </span>
          </div>
        </div>

        {/* Bio */}
        {bioText && (
          <p className="text-sm text-foreground mt-1 whitespace-pre-line leading-snug">
            {bioText}
          </p>
        )}
        {bioLink && (
          <a
            href={bioLink.startsWith("http") ? bioLink : `https://${bioLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-gold font-medium mt-0.5 hover:underline"
          >
            <Link2 className="w-3.5 h-3.5" />
            {bioLink.replace(/^https?:\/\//, "")}
          </a>
        )}

        {/* ── Action buttons (Instagram style) ── */}
        {!isMe && (
          <div className="flex gap-2 mt-4">
            {profile.user_id ? (
              <div className="flex-1">
                <FollowButton
                  targetUserId={profile.user_id}
                  size="lg"
                  variant="pill"
                  onFollowChange={(isNow) => {
                    setFollowerCount((prev) => isNow ? prev + 1 : Math.max(0, prev - 1));
                  }}
                />
              </div>
            ) : (
              <button
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold active:scale-[0.97] transition-all ${
                  isFollowingPlace
                    ? "bg-card border border-border text-muted-foreground"
                    : "bg-foreground text-background"
                }`}
                disabled={followLoading}
                onClick={async () => {
                  if (!user) { toast("Connecte-toi pour suivre"); return; }
                  if (!placeId) { toast.error("Lieu introuvable"); return; }
                  setFollowLoading(true);
                  try {
                    if (isFollowingPlace) {
                      await supabase.from("place_follows").delete().eq("place_id", placeId).eq("user_id", user.id);
                      setIsFollowingPlace(false);
                    } else {
                      await supabase.from("place_follows").insert({ place_id: placeId, user_id: user.id });
                      setIsFollowingPlace(true);
                      toast("✅ Lieu suivi !");
                    }
                  } catch { toast.error("Erreur"); }
                  finally { setFollowLoading(false); }
                }}
              >
                {isFollowingPlace ? "Suivi ✓" : "Suivre"}
              </button>
            )}
            <button
              onClick={() => {
                if (isOfficialProfileRoute && placeId) {
                  navigate(`/place/${placeId}`);
                } else if (profile.user_id) {
                  handleSendMessage();
                } else {
                  toast.error("Contact indisponible");
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-card border border-border text-sm font-semibold text-foreground active:scale-[0.97] transition-all"
            >
              {isOfficialProfileRoute ? "Voir le lieu" : "Contacter"}
            </button>
          </div>
        )}

        {isMe && (
          <div className="mt-4">
            <button
              onClick={() => navigate("/")}
              className="w-full py-2.5 rounded-lg bg-card border border-border text-sm font-semibold text-foreground active:scale-[0.97] transition-all"
            >
              Modifier le profil
            </button>
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="border-t border-b border-border flex">
        <button className="flex-1 flex items-center justify-center py-3 border-b-2 border-foreground">
          <Grid3X3 className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* ── Vibes grid ── */}
      <div>
        {vibes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-3">
              <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-base font-bold text-foreground">Aucune publication</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les vibes apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[1px]">
            {vibes.map((vibe, i) => (
              <Link key={vibe.id} to={`/vibe/${vibe.id}`}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="aspect-square relative overflow-hidden bg-card group"
                >
                  {vibe.media_type === "video" ? (
                    <video
                      src={vibe.image_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={vibe.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5 text-foreground font-bold text-sm">
                      <Heart className="w-5 h-5 fill-foreground" />
                      {vibe.likes}
                    </div>
                  </div>
                  {vibe.media_type === "video" && (
                    <div className="absolute top-2 right-2">
                      <Play className="w-4 h-4 text-foreground drop-shadow-lg fill-foreground" />
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
