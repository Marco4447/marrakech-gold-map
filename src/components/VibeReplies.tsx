import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Send, Loader2, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { timeAgo } from "@/lib/timeAgo";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface Reply {
  id: string;
  user_id: string;
  image_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  profile?: { full_name: string | null; avatar_url: string | null } | null;
}

interface Props {
  vibeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VibeReplies({ vibeId, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("vibe_replies" as any)
        .select("*")
        .eq("vibe_id", vibeId)
        .order("created_at", { ascending: true });

      if (data) {
        // Fetch profiles
        const userIds = [...new Set((data as any[]).map((r: any) => r.user_id).filter(Boolean))];
        let profileMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles_public")
            .select("user_id, full_name, avatar_url")
            .in("user_id", userIds);
          profiles?.forEach(p => { if (p.user_id) profileMap[p.user_id] = p; });
        }
        setReplies((data as any[]).map((r: any) => ({ ...r, profile: profileMap[r.user_id] || null })));
      }
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`vibe-replies-${vibeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "vibe_replies", filter: `vibe_id=eq.${vibeId}` },
        (payload) => { setReplies(prev => [...prev, payload.new as any]); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, vibeId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error("Max 10 Mo"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!user || !file) { toast.error("Connecte-toi et choisis une photo"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `replies/${vibeId}/${user.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("vibes_media").upload(path, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("vibes_media").getPublicUrl(path);
      const imageUrl = urlData.publicUrl;
      const mediaType = file.type.startsWith("video/") ? "video" : "photo";

      const { error } = await supabase.from("vibe_replies" as any).insert({
        vibe_id: vibeId,
        user_id: user.id,
        image_url: imageUrl,
        media_type: mediaType,
        caption: caption.trim() || null,
      } as any);

      if (error) throw error;
      setFile(null);
      setPreview(null);
      setCaption("");
      toast.success("Reply envoyé ! 📸");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
    setUploading(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-display text-sm font-bold text-foreground">Vibe Replies 📸</h3>
          <button aria-label="Fermer" onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Replies list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune reply encore</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Sois le premier à répondre avec une photo !</p>
            </div>
          ) : (
            replies.map((reply) => (
              <motion.div
                key={reply.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                {reply.media_type === "video" ? (
                  <video src={reply.image_url} className="w-full aspect-square object-cover" controls playsInline />
                ) : (
                  <img src={reply.image_url} alt="" className="w-full aspect-square object-cover" />
                )}
                <div className="px-3 py-2 flex items-center gap-2">
                  <Link to={`/u/${reply.user_id}`}>
                    <Avatar className="w-6 h-6 border border-border">
                      <AvatarImage src={reply.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-2xs bg-gold/10 text-gold">
                        {(reply.profile?.full_name || "?")[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground">
                      {reply.profile?.full_name || "Anonyme"}
                    </span>
                    {reply.caption && (
                      <span className="text-xs text-muted-foreground ml-1.5">{reply.caption}</span>
                    )}
                  </div>
                  <span className="text-2xs text-muted-foreground shrink-0">{timeAgo(reply.created_at)}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Compose area */}
        {user && (
          <div className="border-t border-border px-4 py-3 space-y-2 bg-card">
            {preview && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <Image className="w-5 h-5 text-gold" />
              </button>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 120))}
                placeholder="Légende (optionnel)..."
                className="flex-1 text-sm bg-muted/50 rounded-full px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!file || uploading}
                className="w-10 h-10 rounded-full bg-gold flex items-center justify-center disabled:opacity-40"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" /> : <Send className="w-4 h-4 text-primary-foreground" />}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
