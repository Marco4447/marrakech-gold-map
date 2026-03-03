import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Camera, Video, Upload, Clock, Loader2, Image as ImageIcon, X, Check, Sparkles, Gift, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function VipOfferSettings({ userId }: { userId: string }) {
  const [perk, setPerk] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [placeName, setPlaceName] = useState<string | null>(null);

  useEffect(() => {
    // Find the partner's place by checking their vibes for a location match
    const load = async () => {
      const { data: vibes } = await supabase
        .from("vibes")
        .select("location")
        .eq("user_id", userId)
        .eq("is_official", true)
        .not("location", "is", null)
        .limit(1);

      if (vibes && vibes.length > 0 && vibes[0].location) {
        const loc = vibes[0].location;
        setPlaceName(loc);
        const { data: place } = await supabase
          .from("places")
          .select("vip_perk_description")
          .ilike("name", `%${loc}%`)
          .limit(1);
        if (place && place.length > 0) {
          setPerk((place[0] as any).vip_perk_description || "");
        }
      }
      setLoaded(true);
    };
    load();
  }, [userId]);

  const handleSave = async () => {
    if (!placeName || !perk.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("places")
      .update({ vip_perk_description: perk.trim() } as any)
      .ilike("name", `%${placeName}%`);
    if (error) {
      toast.error("Erreur de sauvegarde");
    } else {
      toast.success("Offre VIP mise à jour !");
    }
    setSaving(false);
  };

  if (!loaded) return null;

  return (
    <div className="rounded-2xl border border-gold/20 bg-card/80 backdrop-blur-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-gold" />
        <h3 className="text-sm font-display font-semibold text-foreground">Mon Offre VIP</h3>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Décris l'avantage exclusif pour les membres Insider Pass (ex: "Boisson offerte + coupe-file").
      </p>
      <input
        type="text"
        value={perk}
        onChange={(e) => setPerk(e.target.value.slice(0, 120))}
        placeholder="Ex: Free welcome drink & Skip the line"
        maxLength={120}
        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
      />
      <button
        onClick={handleSave}
        disabled={saving || !perk.trim()}
        className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Sauvegarder
      </button>
    </div>
  );
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ---------- Sub-components ----------

function CreditCard({ credits, onBuy }: { credits: number; onBuy: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-card/80 backdrop-blur-xl p-5">
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gold/10 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Vibe Credits</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-4xl font-display font-black text-gold tabular-nums">{credits}</span>
            <Zap className="w-5 h-5 text-gold" />
          </div>
        </div>
        <button
          onClick={onBuy}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-primary-foreground transition-transform active:scale-95"
          style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
        >
          Recharger
        </button>
      </div>
    </div>
  );
}

function MoodPicker({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  const MOODS = [
    { key: "hot", emoji: "🔥", label: "Hot" },
    { key: "chill", emoji: "🍸", label: "Chill" },
    { key: "secret", emoji: "✨", label: "Secret" },
    { key: "foodie", emoji: "🥗", label: "Foodie" },
  ];
  return (
    <div className="flex gap-2">
      {MOODS.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => onChange(m.key)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
            value === m.key
              ? "bg-gold/20 border border-gold/50 text-gold shadow-[0_0_12px_hsl(var(--gold)/0.15)]"
              : "bg-surface border border-border text-muted-foreground"
          }`}
        >
          {m.emoji} {m.label}
        </button>
      ))}
    </div>
  );
}

function SuccessOverlay({ show, onDone }: { show: boolean; onDone: () => void }) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onDone, 2200);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mb-4"
          >
            <Check className="w-10 h-10 text-gold" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-lg font-bold text-foreground"
          >
            Vibe publiée ! 🎉
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground mt-1"
          >
            Visible 6h sur la map
          </motion.div>
          {/* Radar pulse */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0.6 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
            className="absolute w-20 h-20 rounded-full border-2 border-gold/40"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VibeHistory({ vibes }: { vibes: HistoryVibe[] }) {
  if (vibes.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-10">Aucune vibe publiée.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {vibes.map((v) => (
        <div key={v.id} className="relative rounded-xl overflow-hidden aspect-square bg-surface border border-border">
          {v.media_type === "video" ? (
            <video src={v.image_url} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <img src={v.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2">
            <p className="text-[10px] text-foreground font-medium truncate">{v.location || v.caption || "—"}</p>
            <p className="text-[9px] text-muted-foreground">
              {new Date(v.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </p>
          </div>
          <div className="absolute top-1.5 left-1.5 bg-gold px-1.5 py-0.5 rounded text-[8px] font-bold text-primary-foreground">
            ⭐ OFFICIEL
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Types ----------
interface HistoryVibe {
  id: string;
  image_url: string;
  location: string | null;
  caption: string | null;
  created_at: string;
  media_type: string;
}

// ---------- Main ----------
export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [credits, setCredits] = useState(0);
  const [vibes, setVibes] = useState<HistoryVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);

  // Post form state
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
    if (authLoading || !user) return;
    const load = async () => {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "partner")
        .single();

      if (!roleData) {
        setIsPartner(false);
        setLoading(false);
        return;
      }
      setIsPartner(true);

      const { data: creditData } = await supabase
        .from("partner_credits")
        .select("credits")
        .eq("user_id", user.id)
        .single();
      setCredits(creditData?.credits ?? 0);

      const { data: vibeData } = await supabase
        .from("vibes")
        .select("id, image_url, location, caption, created_at, media_type")
        .eq("user_id", user.id)
        .eq("is_official", true)
        .order("created_at", { ascending: false })
        .limit(20);
      setVibes((vibeData as HistoryVibe[]) || []);
      setLoading(false);
    };
    load();
  }, [user, authLoading]);

  const resetForm = useCallback(() => {
    setFile(null);
    setPreview(null);
    setCaption("");
    setLocation("");
    setMood(null);
    setUploadProgress(0);
    setShowForm(false);
  }, []);

  const handlePost = async () => {
    if (!file || !user || credits <= 0) return;
    if (!mood) { toast.error("Choisis un mood"); return; }

    setPosting(true);
    setUploadProgress(10);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      setUploadProgress(30);

      // Upload to vibes_media bucket
      const { error: uploadErr } = await supabase.storage
        .from("vibes_media")
        .upload(fileName, file, { contentType: file.type, upsert: false });

      if (uploadErr) throw new Error("Upload failed: " + uploadErr.message);

      setUploadProgress(70);

      const { data: urlData } = supabase.storage
        .from("vibes_media")
        .getPublicUrl(fileName);

      const mediaType = file.type.startsWith("video/") ? "video" : "photo";

      // Call atomic RPC
      const { error: rpcErr } = await supabase.rpc("publish_vibe_use_credit", {
        p_image_url: urlData.publicUrl,
        p_caption: caption.trim() || null,
        p_location: location.trim() || null,
        p_mood: mood,
        p_media_type: mediaType,
      });

      if (rpcErr) throw new Error(rpcErr.message);

      setUploadProgress(100);

      // Optimistic credit update
      setCredits((c) => c - 1);

      // Refresh vibes list
      const { data: vibeData } = await supabase
        .from("vibes")
        .select("id, image_url, location, caption, created_at, media_type")
        .eq("user_id", user.id)
        .eq("is_official", true)
        .order("created_at", { ascending: false })
        .limit(20);
      setVibes((vibeData as HistoryVibe[]) || []);

      resetForm();
      setShowSuccess(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erreur lors de la publication");
    } finally {
      setPosting(false);
    }
  };

  // ---------- Render guards ----------
  if (authLoading || loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted-foreground">Connecte-toi pour accéder au studio.</p>
        <button onClick={() => navigate("/")} className="text-gold underline text-sm">Retour</button>
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Sparkles className="w-12 h-12 text-gold/40" />
        <h2 className="font-display text-lg font-bold text-foreground">Accès réservé aux Partenaires</h2>
        <p className="text-sm text-muted-foreground max-w-xs">Achète un pack de crédits pour débloquer le Partner Studio.</p>
        <button
          onClick={() => navigate("/shop")}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-primary-foreground active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
        >
          Acheter des Crédits
        </button>
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xs underline mt-2">Retour</button>
      </div>
    );
  }

  // ---------- Main dashboard ----------
  return (
    <div className="min-h-[100dvh] bg-background pb-8">
      <SuccessOverlay show={showSuccess} onDone={() => setShowSuccess(false)} />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Partner Studio</h1>
            <p className="text-[11px] text-muted-foreground">Publie des Vibes Officielles</p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-5 pt-5">
        {/* VIP Offer Settings */}
        <VipOfferSettings userId={user.id} />

        {/* Credits */}
        <CreditCard credits={credits} onBuy={() => navigate("/shop")} />

        {/* Post CTA */}
        {!showForm && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => credits > 0 ? setShowForm(true) : toast.error("Achète des crédits d'abord !")}
            disabled={credits <= 0}
            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              credits > 0
                ? "bg-gold/15 border border-gold/30 text-gold hover:bg-gold/20"
                : "bg-surface border border-border text-muted-foreground opacity-60"
            }`}
          >
            <Camera className="w-4 h-4" />
            Poster une Vibe Officielle
          </motion.button>
        )}

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card border border-border rounded-2xl p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                  <Upload className="w-4 h-4 text-gold" />
                  Nouvelle Vibe
                </h2>
                <button onClick={resetForm} className="w-7 h-7 rounded-full bg-surface flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* File picker */}
              <input
                type="file"
                ref={fileRef}
                accept="image/*,video/mp4,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 50 * 1024 * 1024) { toast.error("Fichier trop lourd (max 50 MB)"); return; }
                  setFile(f);
                  setPreview(URL.createObjectURL(f));
                }}
              />

              {preview ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-surface">
                  {file?.type.startsWith("video/") ? (
                    <video src={preview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                  ) : (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <X className="w-3.5 h-3.5 text-foreground" />
                  </button>
                  {file?.type.startsWith("video/") && (
                    <div className="absolute top-2 left-2 bg-background/60 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Video className="w-3 h-3 text-gold" />
                      <span className="text-[9px] text-foreground font-medium">Vidéo</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-gold/25 flex flex-col items-center justify-center gap-2 hover:border-gold/50 transition-colors active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-gold/60" />
                  </div>
                  <span className="text-xs text-muted-foreground">Photo ou vidéo</span>
                </button>
              )}

              {/* Caption */}
              <div className="relative">
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 60))}
                  placeholder="✍️ Hook promo (ex: Tables VIP dispo !)"
                  maxLength={60}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                  {caption.length}/60
                </span>
              </div>

              {/* Location */}
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="📍 Lieu (ex: Le Comptoir Darna)"
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
              />

              {/* Mood */}
              <MoodPicker value={mood} onChange={setMood} />

              {/* Upload progress */}
              {posting && (
                <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gold"
                    initial={{ width: "0%" }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handlePost}
                disabled={!file || posting}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-primary-foreground disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
              >
                {posting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publication…
                  </span>
                ) : (
                  `Publier (−1 crédit)`
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold" />
            Historique ({vibes.length})
          </h2>
          <VibeHistory vibes={vibes} />
        </div>
      </div>
    </div>
  );
}
