import { useEffect, useState, useCallback, useRef } from "react";
import { Settings, Heart, MapPin, LogOut, Trash2, AlertTriangle, Pencil, Check, X as XIcon, Star, ShoppingBag, Sparkles, Gift, Camera, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
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
  const [newName, setNewName] = useState(displayName);
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

      <p className="text-muted-foreground text-xs text-center max-w-xs">
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

export default function ProfilPage({ onOpenAdmin, onClose }: ProfilPageProps) {
  const [favorites, setFavorites] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [credits, setCredits] = useState(0);
  const [officialVibesCount, setOfficialVibesCount] = useState(0);
  const deviceId = getDeviceId();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Explorateur";
  const displayEmail = profile?.email || user?.email || "Tes coups de cœur sont sauvegardés ici.";

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
    setLoading(false);
  }, [deviceId]);

  // Fetch partner data
  useEffect(() => {
    if (!user) return;
    const fetchPartnerData = async () => {
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
    };
    fetchPartnerData();
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">
          <span className="text-gold">Mon</span>
          <span className="text-foreground"> Profil</span>
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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

      {/* Pass Invité Teaser */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-gold" />
          <h3 className="font-display text-sm font-semibold text-foreground">Pass Invité</h3>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="bg-surface border border-gold/20 rounded-2xl p-4 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            En tant qu'Insider, profitez d'avantages exclusifs chez nos partenaires à Marrakech.
          </p>
          <div className="space-y-2.5">
            {[
              { emoji: "🍽️", label: "Restaurants", perk: "-10% dans les restos sélectionnés" },
              { emoji: "🌅", label: "Rooftops", perk: "Accès prioritaire + cocktail offert" },
              { emoji: "🏨", label: "Hôtels & Riads", perk: "Surclassement selon disponibilité" },
              { emoji: "🎶", label: "Clubs & Bars", perk: "Entrée gratuite avant minuit" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">{item.emoji}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.perk}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gold/70 text-center pt-1">
            Présentez l'app au comptoir pour activer votre avantage ✨
          </p>
        </div>
      </motion.div>

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

          {/* Buy credits CTA */}
          <Link
            to="/shop"
            className="flex items-center justify-center gap-2 w-full bg-gold/10 hover:bg-gold/20 border border-gold/20 text-gold font-semibold text-sm py-3 rounded-xl transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {credits === 0 ? "Acheter des crédits" : "Recharger mes crédits"}
          </Link>

          <div className="h-px bg-border mt-4" />
        </motion.div>
      )}

      {/* Mes Favoris */}
      <div className="px-5 pt-4">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-4 h-4 text-gold fill-gold" />
          <h3 className="font-display text-sm font-semibold text-foreground">Mes Favoris</h3>
          <span className="text-xs text-muted-foreground">({favorites.length})</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-surface animate-pulse rounded-xl" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-gold/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              Aucun favori pour le moment.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Like des stories dans l'onglet Live pour les retrouver ici !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((vibe, i) => (
              <motion.div
                key={vibe.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-card border border-border"
              >
                <img
                  src={vibe.image_url}
                  alt={vibe.caption || "Favori"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

                <div className="absolute bottom-0 inset-x-0 p-2.5">
                  <p className="text-[11px] font-semibold text-foreground truncate">
                    {vibe.username || "Anonyme"}
                  </p>
                  {vibe.location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-gold" />
                      <span className="text-[10px] text-foreground/70 truncate">{vibe.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-gold text-gold" />
                      <span className="text-[10px] font-bold text-gold">{vibe.likes}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground">{timeAgo(vibe.created_at)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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

      {/* Hidden admin button */}
      <button
        onClick={onOpenAdmin}
        className="fixed bottom-24 right-5 w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold/30 transition-colors z-[1500]"
        title="Admin"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}
