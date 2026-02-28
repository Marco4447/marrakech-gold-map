import { useState, useRef } from "react";
import { Upload, Image, MapPin, Send, ArrowLeft, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function AdminPage({ onBack }: { onBack: () => void }) {
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("vibes")
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/vibes/${fileName}`;

      const { error: insertError } = await supabase.from("vibes").insert({
        image_url: imageUrl,
        caption: caption || null,
        location: location || null,
        likes: Math.floor(Math.random() * 300) + 50,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setFile(null);
      setPreview(null);
      setCaption("");
      setLocation("");
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold">
              <span className="text-gold">Admin</span>
              <span className="text-foreground"> Panel</span>
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">Poster une nouvelle vibe</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-5">
        {/* Upload area */}
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-gold/50 bg-surface transition-colors flex flex-col items-center justify-center gap-3 overflow-hidden"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
                <Image className="w-6 h-6 text-gold" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Sélectionner une photo</p>
                <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP</p>
              </div>
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Caption */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
            <Upload className="w-3 h-3" /> Caption
          </label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Sunset vibes sur la place 🌅"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Lieu
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Jemaa el-Fna"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Publier la vibe
            </>
          )}
        </button>

        {/* Success message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-xl p-3"
            >
              <Check className="w-4 h-4 text-gold" />
              <span className="text-sm text-gold font-medium">Vibe publiée avec succès !</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
