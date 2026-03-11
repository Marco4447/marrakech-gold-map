import { useState, useRef } from "react";
import { Camera, Video, Loader2, X, Image, Instagram, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { processMediaForUpload, validateMediaFile } from "@/lib/mediaProcessor";

const BADGES = [
  { value: "ROOFTOP", emoji: "🌅", label: "Rooftop" },
  { value: "CLUB", emoji: "🎵", label: "Club" },
  { value: "RESTAURANT", emoji: "🍽️", label: "Restaurant" },
  { value: "EVENT", emoji: "🎉", label: "Événement" },
];

interface PartnerStoryPublisherProps {
  userId: string;
  placeId: string | null;
}

export default function PartnerStoryPublisher({ userId, placeId }: PartnerStoryPublisherProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [badge, setBadge] = useState("ROOFTOP");
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const instaRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (f: File | null) => {
    if (!f) { setFile(null); setPreview(null); return; }
    const check = validateMediaFile(f, "story");
    if (!check.valid) { toast.error(check.error!); return; }
    setFile(f);
    if (f.type.startsWith("image") || f.type.startsWith("video")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handlePublish = async () => {
    if (!file || !placeId) { toast.error("Fichier et lieu requis"); return; }
    setPublishing(true);
    try {
      // Process with Instagram-like constraints (story context = 15s max video)
      const processed = await processMediaForUpload(file, "story");
      const uploadFile = processed.file;

      const ext = uploadFile.name.split(".").pop();
      const path = `stories/${Date.now()}-${userId.slice(0, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("vibes_media").upload(path, uploadFile, { contentType: uploadFile.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("vibes_media").getPublicUrl(path);

      const mediaType = processed.mediaType === "video" ? "video" : "photo";

      await supabase.from("stories" as any).insert({
        source_type: "partner",
        user_id: userId,
        place_id: placeId,
        media_url: urlData.publicUrl,
        media_type: mediaType,
        badge,
        caption: caption || null,
      } as any);

      toast.success("Story publiée ! Visible 24h 🔥");
      clearFile();
      setCaption("");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    }
    setPublishing(false);
  };

  return (
    <div className="space-y-3">
      {/* Cross-post CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border-2 border-[#E4405F]/30 bg-gradient-to-r from-[#E4405F]/5 via-[#C13584]/5 to-[#833AB4]/5 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F77737] via-[#E4405F] to-[#833AB4] flex items-center justify-center flex-shrink-0">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Republier depuis Insta</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Story Insta → WeshKech en 1 tap. Touchez une audience locale qui ne vous suit pas encore.
            </p>
          </div>
        </div>

        <input
          ref={instaRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
        />
        <button
          onClick={() => instaRef.current?.click()}
          className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #F77737, #E4405F, #833AB4)" }}
        >
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Importer depuis ma galerie
          </span>
        </button>
      </motion.div>

      {/* Standard publisher */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Camera className="w-4 h-4 text-gold" /> Publier une Story (24h)
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Partagez l'ambiance de votre lieu en story — visible par tous les utilisateurs pendant 24h.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
        />

        {/* Preview */}
        <AnimatePresence>
          {file && preview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative rounded-xl overflow-hidden"
            >
              {file.type.startsWith("video") ? (
                <video src={preview} className="w-full max-h-48 object-cover rounded-xl" controls muted />
              ) : (
                <img src={preview} alt="Aperçu" className="w-full max-h-48 object-cover rounded-xl" />
              )}
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!file && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-gold/40 transition-colors flex items-center justify-center gap-2"
          >
            📸 Photo ou vidéo (max 10s)
          </button>
        )}

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 60))}
          placeholder="Légende courte (optionnel)"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
        />

        <div className="flex gap-1.5 flex-wrap">
          {BADGES.map((b) => (
            <button
              key={b.value}
              onClick={() => setBadge(b.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                badge === b.value
                  ? "bg-gold/20 text-gold border border-gold/40"
                  : "bg-muted text-muted-foreground border border-transparent"
              }`}
            >
              {b.emoji} {b.label}
            </button>
          ))}
        </div>

        <button
          onClick={handlePublish}
          disabled={publishing || !file || !placeId}
          className="w-full py-2.5 rounded-xl font-bold text-sm text-primary-foreground disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
        >
          {publishing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Publication…
            </span>
          ) : (
            "Publier la story"
          )}
        </button>
      </div>
    </div>
  );
}
