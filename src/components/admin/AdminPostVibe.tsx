import { useState, useRef } from "react";
import { Upload, Send, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminQuickSeed from "./AdminQuickSeed";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Props {
  allPlaces: { id: string; name: string; category: string | null; neighborhood: string | null }[];
}

export default function AdminPostVibe({ allPlaces }: Props) {
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState("");
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
      const { error: uploadError } = await supabase.storage.from("vibes").upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/vibes/${fileName}`;

      const selectedPlace = allPlaces.find((p) => p.id === selectedSpotId);
      const vibeData: any = {
        image_url: imageUrl,
        caption: caption || null,
        location: selectedPlace?.name || location || null,
        username: selectedPlace?.name || null,
        likes: Math.floor(Math.random() * 300) + 50,
      };

      const { error: insertError } = await supabase.from("vibes").insert(vibeData);
      if (insertError) throw insertError;
      setSuccess(true);
      setFile(null);
      setPreview(null);
      setCaption("");
      setLocation("");
      setSelectedSpotId("");
      toast.success(selectedPlace ? `Vibe postée au nom de ${selectedPlace.name} !` : "Vibe publiée !");
    } catch (err) {
     
      toast.error("Erreur lors de la publication");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Quick Seed - Batch publishing */}
      <AdminQuickSeed places={allPlaces} />

      <div className="border-t border-border my-4 pt-4" />

      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ghost Poster — Vibe unique</h3>

      {/* Spot selector */}
      <select
        value={selectedSpotId}
        onChange={(e) => setSelectedSpotId(e.target.value)}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
      >
        <option value="">— Poster sans spot (vibe libre) —</option>
        {allPlaces.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} {p.category ? `· ${p.category}` : ""} {p.neighborhood ? `(${p.neighborhood})` : ""}
          </option>
        ))}
      </select>

      {selectedSpotId && (
        <p className="text-2xs text-gold/80 -mt-2">
          ⚡ La vibe sera postée au nom de « {allPlaces.find((p) => p.id === selectedSpotId)?.name} »
        </p>
      )}

      <button
        onClick={() => fileRef.current?.click()}
        className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-gold/50 bg-surface transition-colors flex flex-col items-center justify-center gap-3 overflow-hidden"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-gold" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Sélectionner une photo / vidéo</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP, MP4</p>
            </div>
          </>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
      <div className="space-y-3 mt-4">
        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Texte promo / caption…" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
        {!selectedSpotId && (
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lieu (si pas de spot sélectionné)…" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
        )}
        <button onClick={handleSubmit} disabled={!file || uploading} className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2">
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Upload…</> : <><Send className="w-4 h-4" /> {selectedSpotId ? "Poster au nom du Spot" : "Publier"}</>}
        </button>
      </div>
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-xl p-3 mt-3">
            <Check className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold font-medium">Vibe publiée !</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
