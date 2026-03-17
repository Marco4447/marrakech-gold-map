import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Camera, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

export default function UserStoryUpload({ open, onClose, userId, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file || !userId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("vibes_media").upload(path, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("vibes_media").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: insertErr } = await supabase.from("stories").insert({
        user_id: userId,
        media_url: publicUrl,
        caption: caption.trim() || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        media_type: file.type.startsWith("video") ? "video" : "photo",
        source_type: "user",
      });
      if (insertErr) throw insertErr;

      toast.success("Story publiée ! Elle disparaît dans 24h 👻");
      setFile(null);
      setPreview(null);
      setCaption("");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Story upload error:", err);
      toast.error("Erreur lors de la publication");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
        <SheetHeader>
          <SheetTitle className="text-foreground font-display">Publier une story</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-4">
          {/* File picker */}
          {!preview ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-muted/30 hover:border-gold/40 transition-colors"
            >
              <Camera className="w-8 h-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Photo ou vidéo</span>
            </button>
          ) : (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-background">
              {file?.type.startsWith("video") ? (
                <video src={preview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
              ) : (
                <img src={preview} alt="" className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />

          {/* Caption */}
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 80))}
            placeholder="Ajouter une légende… (80 car. max)"
            className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/40"
          />
          <p className="text-[10px] text-muted-foreground text-right">{caption.length}/80</p>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!file || uploading}
            className="w-full py-3 rounded-xl text-sm font-bold text-primary-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light)))" }}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {uploading ? "Publication…" : "Publier"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
