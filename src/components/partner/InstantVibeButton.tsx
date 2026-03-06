import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Loader2, Check, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
  credits: number;
  onPublished: () => void;
}

export default function InstantVibeButton({ userId, credits, onPublished }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [posting, setPosting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFile(null); setPreview(null); setCaption(""); setLocation(""); setPosting(false); setOpen(false); setDone(false);
  }, []);

  const handlePost = async () => {
    if (!file || credits <= 0) { toast.error("Pas assez de crédits"); return; }
    setPosting(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("vibes_media").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("vibes_media").getPublicUrl(path);
      const mediaType = file.type.startsWith("video/") ? "video" : "photo";
      const { error: rpcErr } = await supabase.rpc("publish_vibe_use_credit", {
        p_image_url: urlData.publicUrl,
        p_caption: caption.trim() || null,
        p_location: location.trim() || null,
        p_mood: "hot",
        p_media_type: mediaType,
      });
      if (rpcErr) throw rpcErr;
      setDone(true);
      onPublished();
      setTimeout(reset, 2500);
    } catch (err: any) {
      toast.error(err?.message || "Erreur publication");
      setPosting(false);
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => credits > 0 ? setOpen(true) : toast.error("Achète des crédits d'abord !")}
        className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-primary-foreground shadow-xl shadow-gold/20"
        style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
      >
        <Zap className="w-5 h-5" />
        Créer une vibe pour ce soir
        <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-[10px]">{credits} crédits</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/60 backdrop-blur-sm"
            onClick={() => !posting && reset()}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-lg bg-card border-t border-border rounded-t-2xl p-5 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              {done ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-gold" />
                  </motion.div>
                  <p className="font-display text-base font-bold text-foreground">Ta vibe est live ! 🔥</p>
                  <p className="text-xs text-muted-foreground text-center">Visible sur la carte et le feed pendant 6h.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                      <Camera className="w-4 h-4 text-gold" /> Vibe express
                    </h3>
                    <button onClick={reset} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <input type="file" ref={fileRef} accept="image/*,video/mp4,video/quicktime" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} />

                  {preview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-surface">
                      {file?.type.startsWith("video/") ? (
                        <video src={preview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      ) : (
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                      )}
                      <button onClick={() => { setFile(null); setPreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-foreground" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-gold/25 flex flex-col items-center justify-center gap-2 hover:border-gold/50 transition-colors">
                      <Camera className="w-6 h-6 text-gold/60" />
                      <span className="text-xs text-muted-foreground">Photo ou vidéo</span>
                    </button>
                  )}

                  <input type="text" value={caption} onChange={e => setCaption(e.target.value.slice(0, 60))}
                    placeholder="✍️ Accroche promo (ex: Tables VIP dispo !)" maxLength={60}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50" />

                  <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="📍 Nom du lieu (ex: Kabana Rooftop)"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50" />

                  <button onClick={handlePost} disabled={!file || posting}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-primary-foreground disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
                    {posting ? <><Loader2 className="w-4 h-4 animate-spin" /> Publication…</> : `Publier (−1 crédit)`}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
