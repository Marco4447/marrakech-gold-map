import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Clock } from "lucide-react";

interface VibePin {
  id: string;
  image_url: string;
  mood: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  location: string | null;
  media_type?: string;
  is_official?: boolean;
}

const MOOD_LABELS: Record<string, string> = {
  hot: "🔥 Hot",
  chill: "🍸 Chill",
  secret: "✨ Secret",
  deal: "🎁 Foodie",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  return `Il y a ${hrs}h`;
}

interface VibeSheetProps {
  vibe: VibePin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VibeSheet({ vibe, open, onOpenChange }: VibeSheetProps) {
  if (!vibe) return null;

  const isVideo = vibe.media_type === "video";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 bg-background/40 backdrop-blur-sm z-[1001]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-[1002] px-4 pb-4"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.3}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) onOpenChange(false);
            }}
          >
            <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-2xl">
              {/* Drag handle */}
              <div className="flex items-center justify-center pt-3 pb-1">
                <button onClick={() => onOpenChange(false)} className="w-10 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
              </div>

              {/* Media */}
              <div className="relative h-52 overflow-hidden">
                {isVideo ? (
                  <video
                    src={vibe.image_url}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img src={vibe.image_url} alt="Vibe" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                <button
                  onClick={() => onOpenChange(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {vibe.mood && (
                  <div className="absolute top-3 left-3 bg-background/70 backdrop-blur-md px-3 py-1 rounded-full">
                    <span className="text-xs font-semibold">{MOOD_LABELS[vibe.mood] || vibe.mood}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                {vibe.location && (
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-gold shrink-0" />
                    <span className="text-sm font-medium">{vibe.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs">{timeAgo(vibe.created_at)}</span>
                  {vibe.is_official && <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded-full font-semibold">OFFICIEL</span>}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
