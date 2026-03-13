import { useState, useRef } from "react";
import { Upload, Send, Loader2, Check, Plus, X, Image } from "lucide-react";
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
  file: File;
  preview: string;
  caption: string;
  mood: string;
  spotId: string;
}

export default function AdminQuickSeed({ places }: { places: { id: string; name: string; category: string | null; neighborhood: string | null }[] }) {
  const [queue, setQueue] = useState<QueuedVibe[]>([]);
  const [selectedSpot, setSelectedSpot] = useState("");
  const [globalMood, setGlobalMood] = useState("hot");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

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
        const ext = item.file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("vibes").upload(fileName, item.file, { contentType: item.file.type });
        if (uploadError) throw uploadError;

        const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/vibes/${fileName}`;
        const spot = places.find((p) => p.id === (item.spotId || selectedSpot));

        await supabase.from("vibes").insert({
          image_url: imageUrl,
          caption: item.caption || null,
          location: spot?.name || null,
          username: spot?.name || null,
          mood: item.mood || globalMood,
          is_official: true,
          likes: Math.floor(Math.random() * 200) + 30,
          media_type: item.file.type.startsWith("video") ? "video" : "photo",
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

      {/* Drop zone */}
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full py-8 rounded-2xl border-2 border-dashed border-border hover:border-gold/50 bg-surface transition-colors flex flex-col items-center justify-center gap-2"
      >
        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
          <Plus className="w-5 h-5 text-gold" />
        </div>
        <p className="text-sm font-medium text-foreground">Ajouter des photos / vidéos</p>
        <p className="text-[10px] text-muted-foreground">Sélection multiple autorisée</p>
      </button>
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />

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
