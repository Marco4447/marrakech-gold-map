import { useState, useRef, useCallback } from "react";
import { Camera, X, Loader2, Send, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const MAX_POSTS_PER_WINDOW = 3;
const GLOBAL_TIMEOUT_MS = 30000;

const MOODS = [
  { key: "hot", emoji: "🔥", label: "Hot Now", color: "hsl(15,80%,50%)" },
  { key: "chill", emoji: "🍸", label: "Chill", color: "hsl(200,60%,50%)" },
  { key: "secret", emoji: "✨", label: "Secret", color: "hsl(280,60%,55%)" },
  { key: "deal", emoji: "🎁", label: "Deal", color: "hsl(43,76%,52%)" },
] as const;

interface FlashPostProps {
  open: boolean;
  onClose: () => void;
  onPosted?: () => void;
}

export default function FlashPost({ open, onClose, onPosted }: FlashPostProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postLimitReached, setPostLimitReached] = useState(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoName, setGeoName] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Check post limit on open
  const checkPostLimit = useCallback(() => {
    const localPosts = JSON.parse(localStorage.getItem("wk_post_timestamps") || "[]") as number[];
    const recentPosts = localPosts.filter((t) => Date.now() - t < SIX_HOURS);
    setPostLimitReached(recentPosts.length >= MAX_POSTS_PER_WINDOW);
  }, []);

  // Auto-get geolocation
  const getGeo = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const doFetch = async (url: string, options: RequestInit, token: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers as Record<string, string>,
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`HTTP_${res.status}: ${msg}`);
      }
      return res;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Image trop lourde", { description: "Maximum 10MB par photo." });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    checkPostLimit();
    getGeo();
  };

  const handleUpload = async () => {
    const manualLocation = geoName.trim();
    const resolvedLocation = manualLocation || (geoLocation ? `${geoLocation.lat.toFixed(5)}, ${geoLocation.lng.toFixed(5)}` : "");

    if (!file || !selectedMood || postLimitReached) return;
    if (!resolvedLocation) {
      toast.error("Lieu requis", {
        description: "Active la géolocalisation ou saisis un lieu avant d'envoyer la photo.",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(12);

    // Global timeout: force-reset UI after GLOBAL_TIMEOUT_MS
    const globalTimeout = setTimeout(() => {
      console.error("Upload global timeout reached");
      toast.error("Envoi trop long", { description: "Réessaie avec une meilleure connexion." });
      setUploading(false);
      setUploadProgress(0);
    }, GLOBAL_TIMEOUT_MS);

    try {
      // 1. Get auth token once (with 5s timeout)
      let token = SUPABASE_PUBLISHABLE_KEY;
      try {
        const sessionPromise = supabase.auth.getSession();
        const sessionResult = await Promise.race([
          sessionPromise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("SESSION_TIMEOUT")), 5000)),
        ]);
        if (sessionResult.data?.session?.access_token) {
          token = sessionResult.data.session.access_token;
        }
      } catch {
        console.warn("Session fetch failed, using anon key");
      }

      // 2. Upload image
      const ext = file.name.split(".").pop() || "jpg";
      let fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setUploadProgress(30);

      const uploadImage = async (name: string) => {
        await doFetch(`${SUPABASE_URL}/storage/v1/object/vibes/${name}`, {
          method: "POST",
          headers: { "content-type": file.type || "image/jpeg", "x-upsert": "false" },
          body: file,
        }, token);
      };

      try {
        await uploadImage(fileName);
      } catch (firstError) {
        const msg = String(firstError);
        if (msg.includes("409") || msg.toLowerCase().includes("already exists")) {
          fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-r.${ext}`;
          await uploadImage(fileName);
        } else {
          throw firstError;
        }
      }

      // 3. Insert vibe record
      setUploadProgress(75);
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/vibes/${fileName}`;

      await doFetch(`${SUPABASE_URL}/rest/v1/vibes`, {
        method: "POST",
        headers: { "content-type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          image_url: publicUrl,
          location: resolvedLocation,
          username: user?.user_metadata?.full_name || user?.email?.split("@")[0] || null,
          user_id: user?.id || null,
          caption: null,
          likes: 0,
          mood: selectedMood,
          latitude: geoLocation?.lat || null,
          longitude: geoLocation?.lng || null,
        }),
      }, token);

      // 4. Success
      const timestamps = JSON.parse(localStorage.getItem("wk_post_timestamps") || "[]") as number[];
      timestamps.push(Date.now());
      localStorage.setItem("wk_post_timestamps", JSON.stringify(timestamps.filter((t) => Date.now() - t < SIX_HOURS)));

      setUploadProgress(100);
      clearTimeout(globalTimeout);
      setTimeout(() => {
        resetState();
        onPosted?.();
        onClose();
      }, 450);
    } catch (err) {
      clearTimeout(globalTimeout);
      console.error("Upload error:", err);
      toast.error("Envoi du vibe échoué", {
        description: "Le réseau a interrompu l'envoi. Réessaie avec 4G/Wi‑Fi stable.",
      });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setSelectedMood(null);
    setUploading(false);
    setUploadProgress(0);
    setGeoLocation(null);
    setGeoName("");
  };

  const handleClose = () => {
    if (uploading) return;
    resetState();
    onClose();
  };

  const missingLocation = !geoLocation && !geoName.trim();

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/70 backdrop-blur-md z-[2500]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[2501] max-h-[92vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="bg-card rounded-t-3xl border-t border-border shadow-2xl">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="px-6 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Flash Post ⚡
                  </h2>
                  <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Incitation message */}
                <div className="bg-gold/10 border border-gold/20 rounded-xl px-4 py-2.5 mb-4">
                  <p className="text-xs text-gold-light font-medium text-center leading-relaxed">
                    📸 Partagez l'instant présent. Les vibes de la galerie sont tolérées mais l'authenticité prime !
                  </p>
                </div>

                {postLimitReached && file ? (
                  <div className="flex flex-col items-center text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                      <span className="text-2xl">🌟</span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-foreground mb-2">
                      Assez de vibes pour le moment !
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Limite : {MAX_POSTS_PER_WINDOW} vibes par période de 6h
                    </p>
                    <button onClick={handleClose} className="mt-5 w-full bg-surface hover:bg-surface-elevated text-foreground font-medium py-3 rounded-xl transition-colors border border-border">
                      Compris !
                    </button>
                  </div>
                ) : !preview ? (
                  /* Step 1: Photo capture */
                  <>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-gold/50 bg-surface transition-colors flex flex-col items-center justify-center gap-3"
                    >
                      <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                        <Camera className="w-7 h-7 text-gold" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Prendre une photo</p>
                        <p className="text-xs text-muted-foreground mt-0.5">ou choisir depuis la galerie</p>
                      </div>
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      Disparaît après 6 heures
                    </p>
                  </>
                ) : (
                  /* Step 2: Mood selection + publish */
                  <>
                    {/* Photo preview */}
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => { setFile(null); setPreview(null); setSelectedMood(null); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-foreground" />
                      </button>
                      {/* Geo badge */}
                      {geoLocation && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/70 backdrop-blur-md px-2 py-1 rounded-lg">
                          <MapPin className="w-3 h-3 text-gold" />
                          <span className="text-[10px] text-foreground">📍 Localisé</span>
                        </div>
                      )}
                      {geoLoading && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/70 backdrop-blur-md px-2 py-1 rounded-lg">
                          <Loader2 className="w-3 h-3 text-gold animate-spin" />
                          <span className="text-[10px] text-foreground">Localisation...</span>
                        </div>
                      )}
                    </div>

                    {/* Mood selector */}
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
                      Choisis ton mood
                    </p>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {MOODS.map((mood) => (
                        <button
                          key={mood.key}
                          onClick={() => setSelectedMood(mood.key)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                            selectedMood === mood.key
                              ? "border-gold bg-gold/15 scale-105"
                              : "border-border bg-surface hover:border-gold/30"
                          }`}
                        >
                          <span className="text-2xl">{mood.emoji}</span>
                          <span className={`text-[10px] font-semibold ${selectedMood === mood.key ? "text-gold" : "text-muted-foreground"}`}>
                            {mood.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Required location */}
                    <div className="mb-4">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3 h-3" /> Lieu (obligatoire)
                      </label>
                      <input
                        value={geoName}
                        onChange={(e) => setGeoName(e.target.value)}
                        placeholder="Ex: Jemaa el-Fna"
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                      />
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Active la géolocalisation ou renseigne le lieu manuellement avant publication.
                      </p>
                    </div>

                    {/* Progress bar */}
                    {uploading && (
                      <div className="mb-4">
                        <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gold rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          {uploadProgress < 70 ? "Envoi en cours…" : uploadProgress < 100 ? "Presque terminé…" : "Publié !"}
                        </p>
                      </div>
                    )}

                    {/* Publish button */}
                    <button
                      onClick={handleUpload}
                      disabled={!selectedMood || uploading || missingLocation}
                      className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Publier mon vibe
                        </>
                      )}
                    </button>
                    {missingLocation && (
                      <p className="text-[11px] text-destructive text-center mt-2">
                        Lieu requis avant l'envoi.
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      Visible pendant 6 heures uniquement
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
