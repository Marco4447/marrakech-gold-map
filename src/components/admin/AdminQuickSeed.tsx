import { useState, useRef } from "react";
import { Upload, Send, Loader2, Check, Plus, X, Image, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const MOODS = [
  { key: "hot", emoji: "🔥", label: "Hot" },
  { key: "chill", emoji: "🍸", label: "Chill" },
  { key: "secret", emoji: "✨", label: "Secret" },
  { key: "foodie", emoji: "🥗", label: "Foodie" },
] as const;

interface QueuedVibe {
  id: string;
  file: File | null;
  preview: string;
  caption: string;
  mood: string;
  spotId: string;
  isUrl?: boolean;
}

export default function AdminQuickSeed({ places }: { places: { id: string; name: string; category: string | null; neighborhood: string | null }[] }) {
  const [queue, setQueue] = useState<QueuedVibe[]>([]);
  const [selectedSpot, setSelectedSpot] = useState("");
  const [globalMood, setGlobalMood] = useState("hot");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAddUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\/.+\..+/.test(url)) {
      toast.error("URL invalide");
      return;
    }

    // Detect Instagram post URLs — can't extract images server-side, guide user
    const igPostMatch = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    if (igPostMatch) {
      toast.error(
        "📸 Instagram bloque l'extraction automatique. Fais comme ça :\n\n" +
        "1. Ouvre le post dans ton navigateur\n" +
        "2. Appuie longtemps sur la photo → Enregistrer\n" +
        "3. Uploade-la ici avec le bouton Fichiers",
        { duration: 8000 }
      );
      // Open the link in a new tab for convenience
      window.open(url, '_blank');
      return;
    }

    const newItem: QueuedVibe = {
      id: Math.random().toString(36).slice(2),
      file: null,
      preview: url,
      caption: "",
      mood: globalMood,
      spotId: selectedSpot,
      isUrl: true,
    };
    setQueue((prev) => [...prev, newItem]);
    setUrlInput("");
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newItems: QueuedVibe[] = files.map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      preview: URL.createObjectURL(f),
      caption: "",
      mood: globalMood,
      spotId: selectedSpot,
    }));
    setQueue((prev) => [...prev, ...newItems]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((q) => q.id !== id);
    });
  };

  const updateItem = (id: string, updates: Partial<QueuedVibe>) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const publishAll = async () => {
    if (queue.length === 0) return;
    setPublishing(true);
    setPublished(0);
    let successCount = 0;

    for (const item of queue) {
      try {
        let imageUrl: string;

        if (item.isUrl || !item.file) {
          // Direct URL — use as-is
          imageUrl = item.preview;
        } else {
          const ext = item.file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("vibes").upload(fileName, item.file, { contentType: item.file.type });
          if (uploadError) throw uploadError;
          imageUrl = `${SUPABASE_URL}/storage/v1/object/public/vibes/${fileName}`;
        }

        const spot = places.find((p) => p.id === (item.spotId || selectedSpot));

        await supabase.from("vibes").insert({
          image_url: imageUrl,
          caption: item.caption || null,
          location: spot?.name || null,
          username: spot?.name || null,
          mood: item.mood || globalMood,
          is_official: true,
          likes: Math.floor(Math.random() * 200) + 30,
          media_type: item.file?.type?.startsWith("video") ? "video" : "photo",
        } as any);

        successCount++;
        setPublished(successCount);
      } catch (err) {
        console.error("Seed error:", err);
      }
    }

    toast.success(`${successCount}/${queue.length} vibes publiées !`);
    queue.forEach((q) => URL.revokeObjectURL(q.preview));
    setQueue([]);
    setPublishing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          ⚡ Quick Seed — Publication en masse
        </h3>
        {queue.length > 0 && (
          <span className="text-[10px] bg-gold/15 text-gold px-2 py-0.5 rounded-full font-bold">
            {queue.length} en file
          </span>
        )}
      </div>

      {/* Spot + Mood global */}
      <div className="space-y-2">
        <select
          value={selectedSpot}
          onChange={(e) => setSelectedSpot(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
        >
          <option value="">— Choisir un spot —</option>
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.category ? `· ${p.category}` : ""} {p.neighborhood ? `(${p.neighborhood})` : ""}
            </option>
          ))}
        </select>

        <div className="flex gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setGlobalMood(m.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                globalMood === m.key
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "bg-surface text-muted-foreground border border-border hover:border-gold/20"
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone + URL input */}
      <div className="flex gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 py-6 rounded-2xl border-2 border-dashed border-border hover:border-gold/50 bg-surface transition-colors flex flex-col items-center justify-center gap-1.5"
        >
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <Plus className="w-4 h-4 text-gold" />
          </div>
          <p className="text-xs font-medium text-foreground">Fichiers</p>
          <p className="text-[10px] text-muted-foreground">Photos / vidéos</p>
        </button>
        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className={`flex-1 py-6 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-1.5 ${
            showUrlInput ? "border-gold/50 bg-gold/5" : "border-border hover:border-gold/50 bg-surface"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-gold" />
          </div>
          <p className="text-xs font-medium text-foreground">URL / Instagram</p>
          <p className="text-[10px] text-muted-foreground">Lien image ou post IG</p>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />

      {/* URL input field */}
      <AnimatePresence>
        {showUrlInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                placeholder="Lien Instagram ou URL directe d'image"
                className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <button
                onClick={handleAddUrl}
                disabled={!urlInput.trim()}
                className="px-4 py-2.5 bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold rounded-xl text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              💡 Colle un lien instagram.com/p/... ou un lien direct d'image — la caption sera extraite automatiquement
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue preview */}
      {queue.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {queue.map((item) => (
            <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square bg-surface border border-border">
              <img src={item.preview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeFromQueue(item.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-foreground" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                <input
                  value={item.caption}
                  onChange={(e) => updateItem(item.id, { caption: e.target.value })}
                  placeholder="Caption…"
                  className="w-full bg-transparent text-[10px] text-white placeholder:text-white/50 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish button */}
      {queue.length > 0 && (
        <button
          onClick={publishAll}
          disabled={publishing || !selectedSpot}
          className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
        >
          {publishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {published}/{queue.length} publiées…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Publier {queue.length} vibe{queue.length > 1 ? "s" : ""} pour {places.find((p) => p.id === selectedSpot)?.name || "…"}
            </>
          )}
        </button>
      )}

      {!selectedSpot && queue.length > 0 && (
        <p className="text-[10px] text-destructive text-center">⚠️ Sélectionne un spot avant de publier</p>
      )}
    </div>
  );
}
