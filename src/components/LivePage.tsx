import { useEffect, useState, useRef, useCallback } from "react";
import { Camera, MapPin, Clock, X, Loader2, Send, ImageIcon, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const THIRTY_MIN = 30 * 60 * 1000;

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
  return `il y a ${hours}h`;
}

function isNew(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < THIRTY_MIN;
}

export default function LivePage() {
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadLocation, setUploadLocation] = useState("");
  const [uploadUsername, setUploadUsername] = useState("");
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
    if (!error && data) setVibes(data);
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

  useEffect(() => {
    fetchVibes();
    fetchMyLikes();

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
                return updated.sort((a, b) => b.likes - a.likes);
              });
            }
          } else if (payload.eventType === "DELETE") {
            setVibes((prev) => prev.filter((v) => v.id !== (payload.old as any).id));
          } else if (payload.eventType === "UPDATE") {
            setVibes((prev) => {
              const updated = prev.map((v) =>
                v.id === (payload.new as Vibe).id ? (payload.new as Vibe) : v
              );
              return updated.sort((a, b) => b.likes - a.likes);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVibes, fetchMyLikes]);

  const handleLike = async (vibeId: string) => {
    const alreadyLiked = likedIds.has(vibeId);

    // Optimistic UI
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
          .sort((a, b) => b.likes - a.likes)
      );

      await supabase.from("vibe_likes").delete().eq("vibe_id", vibeId).eq("device_id", deviceId);
      await supabase.from("vibes").update({ likes: Math.max(0, (vibes.find(v => v.id === vibeId)?.likes ?? 1) - 1) }).eq("id", vibeId);
    } else {
      setLikedIds((prev) => new Set(prev).add(vibeId));
      setVibes((prev) =>
        prev.map((v) => (v.id === vibeId ? { ...v, likes: v.likes + 1 } : v))
          .sort((a, b) => b.likes - a.likes)
      );

      await supabase.from("vibe_likes").insert({ vibe_id: vibeId, device_id: deviceId });
      await supabase.from("vibes").update({ likes: (vibes.find(v => v.id === vibeId)?.likes ?? 0) + 1 }).eq("id", vibeId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from("vibes")
        .upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      setUploadProgress(70);
      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/vibes/${fileName}`;

      const { error: insertError } = await supabase.from("vibes").insert({
        image_url: imageUrl,
        location: uploadLocation || null,
        username: uploadUsername || null,
        caption: null,
        likes: 0,
      });
      if (insertError) throw insertError;

      setUploadProgress(100);
      setTimeout(() => {
        setShowUpload(false);
        setFile(null);
        setPreview(null);
        setUploadLocation("");
        setUploadUsername("");
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error("Upload error:", err);
      setUploading(false);
      setUploadProgress(0);
    }
  };

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
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">Aucune story live</h2>
          <p className="text-sm text-muted-foreground">
            Sois le premier à partager l'ambiance ! Les photos disparaissent après 6 heures.
          </p>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {vibes.map((vibe, i) => {
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
                {/* Image */}
                <div className="aspect-[3/4] relative">
                  <img
                    src={vibe.image_url}
                    alt={vibe.caption || "Story"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/90 to-transparent" />

                  {isNew(vibe.created_at) && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-destructive px-2.5 py-1 rounded-lg shadow-lg">
                      <div className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" />
                      <span className="text-[10px] font-bold text-destructive-foreground uppercase tracking-wider">
                        Nouveau
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
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {vibe.username || "Anonyme"}
                        </p>
                        {vibe.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-gold" />
                            <span className="text-xs text-foreground/70">{vibe.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Like button */}
                      <button
                        onClick={() => handleLike(vibe.id)}
                        className="flex flex-col items-center gap-0.5 group"
                      >
                        <motion.div
                          animate={isAnimating ? {
                            scale: [1, 1.4, 0.9, 1.15, 1],
                          } : {}}
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
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-24 right-5 z-[1500] w-14 h-14 bg-gold hover:bg-gold-light rounded-full shadow-xl shadow-gold/30 flex items-center justify-center transition-all active:scale-95"
      >
        <Camera className="w-6 h-6 text-primary-foreground" />
      </button>

      {/* Upload modal */}
      <AnimatePresence>
        {showUpload && (
          <>
            <motion.div
              className="fixed inset-0 bg-background/70 backdrop-blur-md z-[2000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !uploading && setShowUpload(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[2001] max-h-[90vh] overflow-y-auto"
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
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display text-lg font-semibold text-foreground">
                      Partager une story 📸
                    </h2>
                    <button
                      onClick={() => !uploading && setShowUpload(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-gold/50 bg-surface transition-colors flex flex-col items-center justify-center gap-3 overflow-hidden mb-4"
                  >
                    {preview ? (
                      <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gold" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">Photo ou Galerie</p>
                          <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP</p>
                        </div>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className="space-y-2 mb-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Votre nom (optionnel)
                    </label>
                    <input
                      value={uploadUsername}
                      onChange={(e) => setUploadUsername(e.target.value)}
                      placeholder="Anonyme"
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                    />
                  </div>

                  <div className="space-y-2 mb-5">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Lieu (optionnel)
                    </label>
                    <input
                      value={uploadLocation}
                      onChange={(e) => setUploadLocation(e.target.value)}
                      placeholder="Ex: Jemaa el-Fna"
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                    />
                  </div>

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

                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
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
                        Publier ma story
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-muted-foreground text-center mt-3">
                    Votre photo sera visible pendant 6 heures
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
