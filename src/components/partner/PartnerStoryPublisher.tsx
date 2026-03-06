import { useState, useRef } from "react";
import { Camera, Video, Upload, Loader2, X, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [caption, setCaption] = useState("");
  const [badge, setBadge] = useState("ROOFTOP");
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePublish = async () => {
    if (!file || !placeId) { toast.error("Fichier et lieu requis"); return; }
    setPublishing(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `stories/${Date.now()}-${userId.slice(0, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("vibes_media").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("vibes_media").getPublicUrl(path);

      const mediaType = file.type.startsWith("video") ? "video" : "photo";

      await supabase.from("stories" as any).insert({
        source_type: "partner",
        user_id: userId,
        place_id: placeId,
        media_url: urlData.publicUrl,
        media_type: mediaType,
        badge,
        caption: caption || null,
      } as any);

      toast.success("Story publiée ! Visible 24h");
      setFile(null);
      setCaption("");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    }
    setPublishing(false);
  };

  return (
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
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-gold/40 transition-colors flex items-center justify-center gap-2"
      >
        {file ? (
          <>
            {file.type.startsWith("video") ? <Video className="w-4 h-4" /> : <Image className="w-4 h-4" />}
            {file.name.slice(0, 25)}
            <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-1">
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          "📸 Photo ou vidéo (max 10s)"
        )}
      </button>

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
  );
}
