import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Upload, Star, Clock, Loader2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface OfficialVibe {
  id: string;
  image_url: string;
  location: string | null;
  created_at: string;
  mood: string | null;
}

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [credits, setCredits] = useState(0);
  const [vibes, setVibes] = useState<OfficialVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);
  const [posting, setPosting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const MOODS = [
    { key: "hot", emoji: "🔥", label: "Hot" },
    { key: "chill", emoji: "🍸", label: "Chill" },
    { key: "secret", emoji: "✨", label: "Secret" },
    { key: "foodie", emoji: "🥗", label: "Foodie" },
  ];

  useEffect(() => {
    if (authLoading || !user) return;
    const load = async () => {
      // Check partner role
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

      // Fetch credits
      const { data: creditData } = await supabase
        .from("partner_credits")
        .select("credits")
        .eq("user_id", user.id)
        .single();
      setCredits(creditData?.credits ?? 0);

      // Fetch official vibes
      const { data: vibeData } = await supabase
        .from("vibes")
        .select("id, image_url, location, created_at, mood")
        .eq("user_id", user.id)
        .eq("is_official", true)
        .order("created_at", { ascending: false })
        .limit(20);
      setVibes((vibeData as OfficialVibe[]) || []);
      setLoading(false);
    };
    load();
  }, [user, authLoading]);

  const handlePost = async () => {
    if (!file || !user || credits <= 0) return;
    if (!mood) { toast.error("Choisis un mood"); return; }
    if (!location.trim()) { toast.error("Indique un lieu"); return; }

    setPosting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token || SUPABASE_PUBLISHABLE_KEY;
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `official-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Upload
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/vibes/${fileName}`, {
        method: "POST",
        headers: {
          "content-type": file.type || "image/jpeg",
          "x-upsert": "false",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/vibes/${fileName}`;

      // Insert vibe
      const { error: insertErr } = await supabase.from("vibes").insert({
        image_url: publicUrl,
        location: location.trim(),
        mood,
        is_official: true,
        user_id: user.id,
        username: user.user_metadata?.full_name || user.email?.split("@")[0] || null,
        media_type: file.type.startsWith("video/") ? "video" : "photo",
      });
      if (insertErr) throw insertErr;

      // Deduct credit
      await supabase
        .from("partner_credits")
        .update({ credits: credits - 1 })
        .eq("user_id", user.id);

      setCredits((c) => c - 1);
      toast.success("Vibe Officielle publiée !");
      setFile(null);
      setPreview(null);
      setLocation("");
      setMood(null);

      // Refresh vibes
      const { data: vibeData } = await supabase
        .from("vibes")
        .select("id, image_url, location, created_at, mood")
        .eq("user_id", user.id)
        .eq("is_official", true)
        .order("created_at", { ascending: false })
        .limit(20);
      setVibes((vibeData as OfficialVibe[]) || []);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la publication");
    } finally {
      setPosting(false);
    }
  };

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
        <p className="text-muted-foreground">Connecte-toi pour accéder au dashboard.</p>
        <button onClick={() => navigate("/")} className="text-gold underline text-sm">Retour</button>
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Star className="w-12 h-12 text-gold/40" />
        <h2 className="font-display text-lg font-bold text-foreground">Accès réservé aux Partenaires</h2>
        <p className="text-sm text-muted-foreground">Achète des crédits pour devenir partenaire.</p>
        <button onClick={() => navigate("/shop")} className="px-6 py-2 rounded-xl bg-gold text-primary-foreground font-semibold text-sm">
          Acheter des Crédits
        </button>
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xs underline mt-2">Retour</button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Dashboard Partenaire</h1>
            <p className="text-xs text-muted-foreground">Gère tes Vibes Officielles</p>
          </div>
        </div>
      </div>

      {/* Credits Card */}
      <div className="px-5 pt-5">
        <div className="bg-card border border-gold/30 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Crédits disponibles</p>
            <p className="text-3xl font-display font-bold text-gold mt-1">{credits}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate("/shop")}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-primary-foreground"
              style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
            >
              Recharger
            </button>
          </div>
        </div>
      </div>

      {/* Post Form */}
      <div className="px-5 pt-5">
        <h2 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-gold" />
          Poster une Vibe Officielle
        </h2>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <input
            type="file"
            ref={fileRef}
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
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
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-gold/30 flex flex-col items-center justify-center gap-2 hover:border-gold/60 transition-colors"
            >
              <ImageIcon className="w-8 h-8 text-gold/50" />
              <span className="text-xs text-muted-foreground">Ajouter une photo ou vidéo</span>
            </button>
          )}

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="📍 Lieu (ex: Le Comptoir Darna)"
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
          />

          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMood(m.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  mood === m.key
                    ? "bg-gold/20 border border-gold/50 text-gold"
                    : "bg-surface border border-border text-muted-foreground"
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={handlePost}
            disabled={!file || credits <= 0 || posting}
            className="w-full py-3 rounded-xl text-sm font-bold text-primary-foreground disabled:opacity-50 transition-opacity"
            style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
          >
            {posting ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : credits <= 0 ? (
              "Aucun crédit restant"
            ) : (
              `Publier (−1 crédit)`
            )}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="px-5 pt-6">
        <h2 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gold" />
          Historique ({vibes.length})
        </h2>
        {vibes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Aucune vibe officielle publiée.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {vibes.map((v) => (
              <div key={v.id} className="relative rounded-xl overflow-hidden aspect-square bg-surface border border-border">
                <img src={v.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2">
                  <p className="text-[10px] text-foreground font-medium truncate">{v.location || "—"}</p>
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
        )}
      </div>
    </div>
  );
}
