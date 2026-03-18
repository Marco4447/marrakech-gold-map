import { useEffect, useState, useCallback, useRef } from "react";
import { Settings, Heart, MapPin, LogOut, Trash2, AlertTriangle, Pencil, Check, X as XIcon, Star, ShoppingBag, Sparkles, Gift, Camera, ChevronLeft, BadgeCheck, Building2, Crown, Eye, TrendingUp, BarChart3, Bell, Users, Grid3X3, Bookmark, Navigation, Archive, Link2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import BadgesSection from "@/components/BadgesSection";
import CommunityLeaderboard from "@/components/CommunityLeaderboard";
import { timeAgo } from "@/lib/timeAgo";
import { getDeviceId } from "@/lib/deviceId";
import { useNotifications } from "@/hooks/useNotifications";
import { useFollows } from "@/hooks/useFollows";
import { useBookmarks } from "@/hooks/useBookmarks";
import { getUserMayorTerritories } from "@/lib/mayorSystem";

interface ProfilPageProps {
  onOpenAdmin?: () => void;
  onClose?: () => void;
}

interface Vibe {
  id: string;
  image_url: string;
  caption: string | null;
  location: string | null;
  likes: number;
  username: string | null;
  created_at: string;
}

// timeAgo and getDeviceId imported from shared libs

function parseBioWithLink(rawBio: string | null): { bio: string; link: string } {
  if (!rawBio) return { bio: "", link: "" };
  const match = rawBio.match(/^\[LINK:(.*?)\]\n?([\s\S]*)$/);
  if (match) return { bio: match[2].trim(), link: match[1].trim() };
  return { bio: rawBio, link: "" };
}

function serializeBioWithLink(bio: string, link: string): string {
  if (!link) return bio;
  const cleanLink = link.startsWith("http") ? link : `https://${link}`;
  return `[LINK:${cleanLink}]\n${bio}`;
}

function getTierProgress(vibeCount: number) {
  if (vibeCount >= 20) return { currentTier: "Legend", currentEmoji: "👑", nextTier: null, nextEmoji: null, progress: 100, current: vibeCount, target: 20 };
  if (vibeCount >= 5) return { currentTier: "Insider", currentEmoji: "🔥", nextTier: "Legend", nextEmoji: "👑", progress: Math.round(((vibeCount - 5) / 15) * 100), current: vibeCount, target: 20 };
  if (vibeCount >= 1) return { currentTier: "Explorer", currentEmoji: "🧭", nextTier: "Insider", nextEmoji: "🔥", progress: Math.round(((vibeCount - 1) / 4) * 100), current: vibeCount, target: 5 };
  return { currentTier: "Nouveau", currentEmoji: "🌱", nextTier: "Explorer", nextEmoji: "🧭", progress: 0, current: 0, target: 1 };
}

function ProfileCard({
  user,
  profile,
  displayName,
  displayEmail,
  signingOut,
  onSignOut,
  onAvatarChanged,
  onProfileUpdated,
}: {
  user: any;
  profile: any;
  displayName: string;
  displayEmail: string;
  signingOut: boolean;
  onSignOut: () => void;
  onAvatarChanged: () => void;
  onProfileUpdated: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [newBio, setNewBio] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = profile?.avatar_url || (user?.user_metadata?.avatar_url as string | undefined) || undefined;

  useEffect(() => {
    setNewName(displayName);
  }, [displayName]);

  const handleSave = async () => {
    if (!user || !newName.trim()) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          full_name: newName.trim(),
          email: profile?.email ?? user?.email ?? null,
          avatar_url: profile?.avatar_url ?? null,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;

      await onProfileUpdated();
      setEditing(false);
      toast.success("Nom enregistré");
    } catch (e) {
      console.error("Profile save error:", e);
      toast.error("Impossible d'enregistrer le nom", {
        description: "Ta session a peut-être expiré. Réessaie après reconnexion.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde", { description: "Maximum 5MB." });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache-buster
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: finalUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      await onProfileUpdated();
      toast.success("Photo de profil mise à jour !");
      onAvatarChanged();
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error("Échec de l'upload", { description: "Réessaie." });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-6 pt-8 pb-4">
      {/* Avatar with edit overlay */}
      <div className="relative mb-3">
        <Avatar className="w-20 h-20 border-2 border-gold/30">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-gold/10 text-gold font-display text-xl">
            {displayName.charAt(0)?.toUpperCase() || "W"}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => avatarInputRef.current?.click()}
          disabled={uploadingAvatar}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold flex items-center justify-center border-2 border-background shadow-md hover:bg-gold-light transition-colors"
        >
          {uploadingAvatar ? (
            <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5 text-primary-foreground" />
          )}
        </button>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
      </div>

      {editing ? (
        <div className="flex items-center gap-2 mb-0.5">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-surface border border-gold/30 rounded-lg px-3 py-1.5 text-sm font-display text-foreground focus:outline-none focus:border-gold w-40 text-center"
            autoFocus
          />
          <button onClick={handleSave} disabled={saving} className="text-green-400 hover:text-green-300">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setEditing(false); setNewName(displayName); }} className="text-muted-foreground hover:text-foreground">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setNewName(displayName); setEditing(true); }}
          className="flex items-center gap-1.5 group mb-0.5"
        >
          <h2 className="font-display text-lg font-semibold text-foreground">
            {displayName}
          </h2>
          <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {/* Username */}
      {(profile as any)?.username && (
        <p className="text-xs text-muted-foreground mt-0.5">@{(profile as any).username}</p>
      )}

      {/* Bio */}
      {editingBio ? (
        <div className="flex flex-col gap-2 mt-1.5 w-full max-w-xs">
          <textarea
            value={newBio}
            onChange={(e) => setNewBio(e.target.value)}
            placeholder="Ajoute une bio…"
            maxLength={120}
            rows={2}
            className="bg-surface border border-gold/30 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-gold w-full text-center resize-none"
            autoFocus
          />
          <input
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="ton-site.com ou @instagram"
            maxLength={100}
            className="bg-surface border border-gold/30 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-gold w-full text-center"
          />
          <input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 20))}
            placeholder="username"
            maxLength={20}
            className="bg-surface border border-gold/30 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-gold w-full text-center"
          />
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={async () => {
                if (!user) return;
                setSaving(true);
                try {
                  const finalBio = serializeBioWithLink(newBio.trim(), newLink.trim());
                  await supabase.from("profiles").update({ bio: finalBio || null, username: newUsername.trim() || null } as any).eq("user_id", user.id);
                  await onProfileUpdated();
                  setEditingBio(false);
                  toast.success("Profil enregistré");
                } catch { toast.error("Erreur"); }
                finally { setSaving(false); }
              }}
              disabled={saving}
              className="text-green-400 hover:text-green-300"
            >
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setEditingBio(false)} className="text-muted-foreground hover:text-foreground">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            const parsed = parseBioWithLink(profile?.bio || null);
            setNewBio(parsed.bio);
            setNewLink(parsed.link);
            setNewUsername((profile as any)?.username || "");
            setEditingBio(true);
          }}
          className="mt-1 group"
        >
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            {parseBioWithLink(profile?.bio || null).bio || "Ajoute une bio…"}
            <Pencil className="w-3 h-3 text-muted-foreground/50 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </button>
      )}

      {/* Bio link */}
      {(() => {
        const { link } = parseBioWithLink(profile?.bio || null);
        if (!link) return null;
        return (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gold font-semibold mt-1.5 hover:underline"
          >
            <Link2 className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[200px]">
              {link.replace(/^https?:\/\//, "").split("/")[0]}
            </span>
          </a>
        );
      })()}

      <p className="text-muted-foreground text-xs text-center max-w-xs mt-1">
        {displayEmail}
      </p>

      <button
        onClick={onSignOut}
        disabled={signingOut}
        className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors bg-surface border border-border rounded-xl px-4 py-2 disabled:opacity-70"
      >
        <LogOut className="w-3.5 h-3.5" />
        {signingOut ? "Déconnexion..." : "Se déconnecter"}
      </button>
    </div>
  );
}

function VipStatsSection({ user, deviceId }: { user: any; deviceId: string }) {
  const [stats, setStats] = useState({ likesReceived: 0, vibesPosted: 0, spotsDiscovered: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      // Count vibes posted by this user
      const { count: vibesCount } = await supabase
        .from("vibes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Count total likes received on user's vibes
      const { data: userVibes } = await supabase
        .from("vibes")
        .select("likes")
        .eq("user_id", user.id);
      const totalLikes = userVibes?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0;

      // Count unique spots discovered (liked vibes with locations)
      const { data: likedVibeIds } = await supabase
        .from("vibe_likes")
        .select("vibe_id")
        .eq("device_id", deviceId);
      
      let spotsCount = 0;
      if (likedVibeIds && likedVibeIds.length > 0) {
        const { data: likedVibes } = await supabase
          .from("vibes")
          .select("location")
          .in("id", likedVibeIds.map(l => l.vibe_id))
          .not("location", "is", null);
        const uniqueLocations = new Set(likedVibes?.map(v => v.location).filter(Boolean));
        spotsCount = uniqueLocations.size;
      }

      setStats({ likesReceived: totalLikes, vibesPosted: vibesCount || 0, spotsDiscovered: spotsCount });
      setLoading(false);
    };
    fetchStats();
  }, [user, deviceId]);

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4 text-gold" />
        <h3 className="font-display text-sm font-semibold text-foreground">Mes Stats VIP</h3>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface border border-gold/15 rounded-xl p-3 text-center">
          <Heart className="w-4 h-4 text-gold mx-auto mb-1" />
          <p className="font-display text-lg font-bold text-gold">{stats.likesReceived}</p>
          <p className="text-[9px] text-muted-foreground">Likes reçus</p>
        </div>
        <div className="bg-surface border border-gold/15 rounded-xl p-3 text-center">
          <TrendingUp className="w-4 h-4 text-gold mx-auto mb-1" />
          <p className="font-display text-lg font-bold text-gold">{stats.vibesPosted}</p>
          <p className="text-[9px] text-muted-foreground">Vibes postées</p>
        </div>
        <div className="bg-surface border border-gold/15 rounded-xl p-3 text-center">
          <MapPin className="w-4 h-4 text-gold mx-auto mb-1" />
          <p className="font-display text-lg font-bold text-gold">{stats.spotsDiscovered}</p>
          <p className="text-[9px] text-muted-foreground">Spots découverts</p>
        </div>
      </div>

      <div className="h-px bg-border mt-4" />
    </motion.div>
  );
}

export default function ProfilPage({ onOpenAdmin, onClose }: ProfilPageProps) {
  const [favorites, setFavorites] = useState<Vibe[]>([]);
  const [myVibes, setMyVibes] = useState<Vibe[]>([]);
  const [savedVibes, setSavedVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileTab, setProfileTab] = useState<"vibes" | "likes" | "saved" | "visited">("vibes");
  const [visitedPlaces, setVisitedPlaces] = useState<{ name: string; image_url: string | null; slug: string | null }[]>([]);
  const [territories, setTerritories] = useState<{ placeName: string; vibeCount: number }[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [credits, setCredits] = useState(0);
  const [officialVibesCount, setOfficialVibesCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const deviceId = getDeviceId();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifList, setNotifList] = useState<any[]>([]);
  const [showFollowList, setShowFollowList] = useState<"followers" | "following" | null>(null);
  const [followListData, setFollowListData] = useState<Array<{ user_id: string; full_name: string | null; avatar_url: string | null }>>([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const { followerCount, followingCount } = useFollows();
  const { bookmarkedIds } = useBookmarks();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Explorateur";
  const displayEmail = profile?.email || user?.email || "Tes coups de cœur sont sauvegardés ici.";

  const fetchFollowList = async (type: "followers" | "following") => {
    if (!user) return;
    setFollowListLoading(true);
    try {
      let userIds: string[] = [];
      if (type === "followers") {
        const { data } = await supabase.from("follows" as any).select("follower_id").eq("following_id", user.id);
        userIds = (data || []).map((r: any) => r.follower_id);
      } else {
        const { data } = await supabase.from("follows" as any).select("following_id").eq("follower_id", user.id);
        userIds = (data || []).map((r: any) => r.following_id);
      }
      if (userIds.length === 0) { setFollowListData([]); setFollowListLoading(false); return; }
      const { data: profiles } = await supabase.from("profiles_public" as any).select("user_id, full_name, avatar_url").in("user_id", userIds);
      setFollowListData((profiles || []) as any[]);
    } catch { toast.error("Impossible de charger la liste"); }
    finally { setFollowListLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        await signOut();
      } else {
        console.error("Delete failed");
        setDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch (e) {
      console.error(e);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      console.error("Logout failed:", e);
    } finally {
      setSigningOut(false);
    }
  };

  const fetchFavorites = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Fetch user's own vibes
    const { data: userVibes } = await supabase
      .from("vibes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (userVibes) setMyVibes(userVibes);

    // Fetch liked vibes
    const { data: likes } = await supabase
      .from("vibe_likes")
      .select("vibe_id")
      .eq("device_id", deviceId);

    if (likes && likes.length > 0) {
      const ids = likes.map((l: any) => l.vibe_id);
      const { data: vibes } = await supabase
        .from("vibes")
        .select("*")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (vibes) setFavorites(vibes);
    }

    // Fetch saved/bookmarked vibes
    const { data: bookmarks } = await supabase
      .from("bookmarks")
      .select("vibe_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (bookmarks && bookmarks.length > 0) {
      const bIds = bookmarks.map((b: any) => b.vibe_id);
      const { data: savedData } = await supabase
        .from("vibes")
        .select("*")
        .in("id", bIds)
        .order("created_at", { ascending: false });
      if (savedData) setSavedVibes(savedData);
    }

    // Fetch visited places (unique locations from user's vibes + checkins)
    const uniqueLocations = new Set<string>();
    if (userVibes) {
      userVibes.forEach((v: any) => { if (v.location) uniqueLocations.add(v.location); });
    }
    // Also from checkins
    const { data: checkins } = await supabase
      .from("checkins")
      .select("place_id")
      .eq("user_id", user.id);
    
    const checkinPlaceIds = checkins?.map((c: any) => c.place_id) || [];
    
    // Fetch places matching locations or checkin IDs
    if (uniqueLocations.size > 0 || checkinPlaceIds.length > 0) {
      const placeResults: typeof visitedPlaces = [];

      if (uniqueLocations.size > 0) {
        const { data: byName } = await supabase
          .from("places")
          .select("name, image_url, slug")
          .in("name", Array.from(uniqueLocations))
          .limit(50);
        if (byName) placeResults.push(...byName);
      }

      if (checkinPlaceIds.length > 0) {
        const { data: byId } = await supabase
          .from("places")
          .select("name, image_url, slug")
          .in("id", checkinPlaceIds)
          .limit(50);
        if (byId) {
          const existingNames = new Set(placeResults.map(p => p.name));
          placeResults.push(...byId.filter(p => !existingNames.has(p.name)));
        }
      }

      setVisitedPlaces(placeResults);
    }

    setLoading(false);
  }, [deviceId, user]);

  // Fetch partner data
  useEffect(() => {
    if (!user) return;
    const fetchPartnerData = async () => {
      // Check VIP status
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_vip, vip_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileData?.is_vip && (!profileData.vip_expires_at || new Date(profileData.vip_expires_at) > new Date())) {
        setIsVip(true);
      }

      // Check if user has partner role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "partner");
      
      if (roles && roles.length > 0) {
        setIsPartner(true);
        // Fetch credits
        const { data: creditData } = await supabase
          .from("partner_credits")
          .select("credits")
          .eq("user_id", user.id)
          .maybeSingle();
        if (creditData) setCredits(creditData.credits);

        // Count official vibes
        const { count } = await supabase
          .from("vibes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_official", true);
        setOfficialVibesCount(count || 0);
      }

      // Check admin role + pending requests
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (adminRole) {
        setIsAdmin(true);
        const { count: pendingCount } = await supabase
          .from("partner_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        setPendingRequests(pendingCount || 0);
      }
    };
    fetchPartnerData();
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Fetch territories
  useEffect(() => {
    if (!user) return;
    getUserMayorTerritories(user.id).then(setTerritories).catch(() => {});
  }, [user]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-5 pt-12 md:pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground font-display">Profil</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Profile card */}
      <ProfileCard
        user={user}
        profile={profile}
        displayName={displayName}
        displayEmail={displayEmail}
        signingOut={signingOut}
        onSignOut={handleSignOut}
        onAvatarChanged={() => window.location.reload()}
        onProfileUpdated={refreshProfile}
      />

      {/* Follow Stats */}
      <div className="flex items-center justify-center gap-8 px-5 py-3">
        <button onClick={() => { setShowFollowList("followers"); fetchFollowList("followers"); }} className="text-center active:opacity-70 transition-opacity">
          <p className="text-lg font-bold text-foreground">{followerCount}</p>
          <p className="text-[11px] text-muted-foreground">Abonnés</p>
        </button>
        <div className="w-px h-8 bg-border" />
        <button onClick={() => { setShowFollowList("following"); fetchFollowList("following"); }} className="text-center active:opacity-70 transition-opacity">
          <p className="text-lg font-bold text-foreground">{followingCount}</p>
          <p className="text-[11px] text-muted-foreground">Abonnements</p>
        </button>
      </div>

      {/* Tier Progress Bar */}
      {(() => {
        const vibesPosted = myVibes.length;
        const tp = getTierProgress(vibesPosted);
        return (
          <div className="mx-4 px-4 py-3 rounded-2xl bg-card border border-border/50 space-y-2 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {tp.currentEmoji} {tp.currentTier}
              </span>
              {tp.nextTier ? (
                <span className="text-[10px] text-muted-foreground">
                  {tp.current}/{tp.target} vibes → {tp.nextEmoji} {tp.nextTier}
                </span>
              ) : (
                <span className="text-[10px] text-gold font-bold">Niveau max ✨</span>
              )}
            </div>
            <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #BF953F, #FCF6BA, #B38728)" }}
                initial={{ width: 0 }}
                animate={{ width: `${tp.progress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
        );
      })()}

      {/* VIP CTA — hidden: B2C is free for now */}

      {/* Referral CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-3"
      >
        <Link
          to="/referral"
          className="flex items-center gap-3 bg-card border border-border hover:border-gold/30 rounded-xl px-4 py-3 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors">
              Invite tes amis 🎁
            </p>
            <p className="text-[10px] text-muted-foreground">
              3 amis inscrits = 7 jours VIP gratuits
            </p>
          </div>
          <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 group-hover:text-gold transition-colors" />
        </Link>
      </motion.div>

      {/* Notifications Panel */}
      {user && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-4">
          <button
            onClick={async () => {
              if (!showNotifications && notifList.length === 0) {
                const { data } = await supabase
                  .from("notifications")
                  .select("*")
                  .eq("user_id", user.id)
                  .order("created_at", { ascending: false })
                  .limit(30);
                if (data) setNotifList(data);
                // Mark all as read
                await supabase
                  .from("notifications")
                  .update({ is_read: true })
                  .eq("user_id", user.id)
                  .eq("is_read", false);
              }
              setShowNotifications(!showNotifications);
            }}
            className="w-full flex items-center gap-3 bg-card border border-border hover:border-gold/30 rounded-xl px-4 py-3 transition-colors group text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Notifications
              </p>
              <p className="text-[10px] text-muted-foreground">
                Likes, commentaires, challenges
              </p>
            </div>
            <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${showNotifications ? "rotate-90" : "rotate-180"}`} />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                  {notifList.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Aucune notification pour le moment</p>
                  ) : (
                    notifList.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                          n.is_read ? "bg-card border-border" : "bg-primary/5 border-primary/20"
                        }`}
                      >
                        <div className="text-base mt-0.5">
                          {n.type === "like" ? "❤️" : n.type === "comment" ? "💬" : n.type === "challenge_win" ? "🏆" : "🔔"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{n.title}</p>
                          {n.body && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-[9px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Badges / Gamification */}
      {user && <BadgesSection userId={user.id} />}

      {/* Territories (Mayor system) */}
      {user && territories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 pt-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-gold" />
            <h3 className="font-display text-sm font-semibold text-foreground">Tes territoires</h3>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {territories.map((t) => (
              <div
                key={t.placeName}
                className="flex items-center gap-1.5 bg-gold/10 border border-gold/20 rounded-full px-3 py-1.5"
              >
                <span className="text-xs">👑</span>
                <span className="text-[11px] font-semibold text-gold">{t.placeName}</span>
                <span className="text-[9px] text-muted-foreground">{t.vibeCount} vibes</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-border mt-4" />
        </motion.div>
      )}

      {/* Community Leaderboard */}
      {user && <CommunityLeaderboard currentUserId={user.id} />}

      {/* Partner Dashboard */}
      {isPartner && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 pt-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-gold fill-gold" />
            <h3 className="font-display text-sm font-semibold text-foreground">Espace Partenaire</h3>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Credits balance */}
            <div className="bg-surface border border-gold/20 rounded-xl p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <p className="font-display text-2xl font-bold text-gold">{credits}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Crédits restants</p>
            </div>

            {/* Official vibes count */}
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-2">
                <Star className="w-5 h-5 text-gold" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{officialVibesCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Vibes Officielles</p>
            </div>
          </div>

          {/* Partner Studio CTA */}
          <Link
            to="/partner-dashboard"
            className="flex items-center justify-center gap-2 w-full font-bold text-sm py-3 rounded-xl text-primary-foreground transition-transform active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
          >
            <Camera className="w-4 h-4" />
            Ouvrir le Partner Studio
          </Link>

          {/* Buy credits CTA */}
          <Link
            to="/shop"
            className="flex items-center justify-center gap-2 w-full bg-gold/10 hover:bg-gold/20 border border-gold/20 text-gold font-semibold text-sm py-3 rounded-xl transition-colors mt-2"
          >
            <ShoppingBag className="w-4 h-4" />
            {credits === 0 ? "Acheter des crédits" : "Recharger mes crédits"}
          </Link>

          <div className="h-px bg-border mt-4" />
        </motion.div>
      )}

      {/* VIP Stats Section */}
      {isVip && (
        <VipStatsSection user={user} deviceId={deviceId} />
      )}

      {/* Profile Tabs: Vibes / Likes / Saved */}
      <div className="px-5 pt-4">
        <div className="flex border-b border-border">
          {([
            { key: "vibes" as const, icon: Grid3X3, count: myVibes.length },
            { key: "likes" as const, icon: Heart, count: favorites.length },
            { key: "saved" as const, icon: Bookmark, count: savedVibes.length },
            { key: "visited" as const, icon: MapPin, count: visitedPlaces.length },
          ]).map(({ key, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setProfileTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors ${
                profileTab === key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {count}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-0.5 pt-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-surface animate-pulse" />
            ))}
          </div>
        ) : profileTab === "visited" ? (
          visitedPlaces.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-gold/50" />
              </div>
              <p className="text-sm text-muted-foreground">Explore des lieux pour les retrouver ici !</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-3">
              {visitedPlaces.map((place, i) => (
                <Link
                  key={place.slug || place.name}
                  to={place.slug ? `/spot/${place.slug}` : "/"}
                  className="relative rounded-xl overflow-hidden aspect-[4/3] bg-card border border-border group"
                >
                  {place.image_url ? (
                    <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gold/5 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-gold/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-xs font-semibold text-foreground truncate">{place.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : profileTab === "vibes" ? (
          (() => {
            const SIX_H = 6 * 60 * 60 * 1000;
            const activeVibes = myVibes.filter(v => Date.now() - new Date(v.created_at).getTime() < SIX_H);
            const archivedVibes = myVibes.filter(v => Date.now() - new Date(v.created_at).getTime() >= SIX_H);

            return (
              <div>
                {/* Archive toggle */}
                {myVibes.length > 0 && (
                  <div className="flex items-center justify-between pt-3 pb-2">
                    <p className="text-[11px] text-muted-foreground">
                      {activeVibes.length} publique{activeVibes.length !== 1 ? "s" : ""} · {archivedVibes.length} archivée{archivedVibes.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {myVibes.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                      <Grid3X3 className="w-6 h-6 text-gold/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">Partage ta première vibe !</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-0.5 md:gap-1">
                      {myVibes.map((vibe, i) => {
                        const isExpired = Date.now() - new Date(vibe.created_at).getTime() >= SIX_H;
                        return (
                          <motion.div
                            key={vibe.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="relative aspect-square overflow-hidden bg-card group"
                          >
                            <img
                              src={vibe.image_url}
                              alt={vibe.caption || "Vibe"}
                              className={`w-full h-full object-cover ${isExpired ? "opacity-50" : ""}`}
                              loading="lazy"
                            />
                            {isExpired && (
                              <div className="absolute top-1 right-1 bg-background/70 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                                <span className="text-[8px] font-bold text-muted-foreground">🗄️</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                              <span className="flex items-center gap-1 text-foreground font-semibold text-sm">
                                <Heart className="w-5 h-5 fill-foreground" />{vibe.likes}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    {archivedVibes.length > 0 && (
                      <p className="text-[10px] text-muted-foreground text-center mt-3 px-4">
                        👻 Tes vibes expirent publiquement après 6h mais restent dans ton archive privée.
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })()
        ) : (
          (() => {
            const items = profileTab === "likes" ? favorites : savedVibes;
            const emptyMsg = profileTab === "likes"
              ? "Like des vibes pour les retrouver ici !"
              : "Sauvegarde des vibes avec le bouton 🔖";

            if (items.length === 0) {
              return (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                    {profileTab === "likes" ? <Heart className="w-6 h-6 text-gold/50" /> :
                     <Bookmark className="w-6 h-6 text-gold/50" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{emptyMsg}</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-3 gap-0.5 md:gap-1 pt-0.5">
                {items.map((vibe, i) => (
                  <motion.div
                    key={vibe.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="relative aspect-square overflow-hidden bg-card group"
                  >
                    <img
                      src={vibe.image_url}
                      alt={vibe.caption || "Vibe"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <span className="flex items-center gap-1 text-foreground font-semibold text-sm">
                        <Heart className="w-5 h-5 fill-foreground" />{vibe.likes}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })()
        )}
      </div>

      {/* RGPD Section */}
      <div className="px-5 pt-6 pb-4 space-y-3">
        <div className="h-px bg-border" />
        
        {/* Delete account */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 text-xs text-destructive hover:text-destructive/80 transition-colors bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Supprimer mes données
        </button>

        {/* Business link */}
        <Link
          to="/business"
          className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground hover:text-gold transition-colors pt-2"
        >
          <Building2 className="w-3.5 h-3.5" />
          Vous êtes un établissement ?
        </Link>

        {/* Legal links */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link to="/privacy" className="text-[10px] text-muted-foreground hover:text-gold transition-colors">
            Politique de Confidentialité
          </Link>
          <span className="text-border">·</span>
          <Link to="/terms" className="text-[10px] text-muted-foreground hover:text-gold transition-colors">
            Conditions Générales
          </Link>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              className="fixed inset-0 bg-background/70 backdrop-blur-md z-[3000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleting && setShowDeleteConfirm(false)}
            />
            <motion.div
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[3001] bg-card border border-border rounded-2xl p-6 max-w-sm mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground">Supprimer mon compte</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Cette action est <strong className="text-foreground">irréversible</strong>. Toutes vos données (profil, favoris) seront définitivement supprimées conformément au RGPD.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 bg-surface hover:bg-surface-elevated text-foreground font-medium py-3 rounded-xl transition-colors border border-border text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Follow list bottom sheet */}
      <AnimatePresence>
        {showFollowList !== null && (
          <div className="fixed inset-0 z-[3000] flex flex-col justify-end" onClick={() => setShowFollowList(null)}>
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-card border-t border-border rounded-t-3xl max-h-[70vh] flex flex-col"
            >
              <div className="w-10 h-1 bg-muted/50 rounded-full mx-auto mt-3 mb-2" />
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                <h3 className="text-sm font-bold text-foreground">
                  {showFollowList === "followers" ? "Abonnés" : "Abonnements"}
                </h3>
                <button onClick={() => setShowFollowList(null)} className="text-muted-foreground">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {followListLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gold" />
                  </div>
                ) : followListData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                    <Users className="w-8 h-8 opacity-30" />
                    <p className="text-sm">Aucun {showFollowList === "followers" ? "abonné" : "abonnement"}</p>
                  </div>
                ) : (
                  followListData.map(person => (
                    <div key={person.user_id} className="flex items-center gap-3 px-4 py-3 border-b border-border/20">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={person.avatar_url || undefined} />
                        <AvatarFallback className="bg-gold/10 text-gold text-xs font-bold">
                          {(person.full_name || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {person.full_name || "Anonyme"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
