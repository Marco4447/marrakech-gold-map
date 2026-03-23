import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getOptimizedImageUrl } from "@/lib/imageOptimize";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"];
function isVideo(url: string): boolean {
  const lower = url.toLowerCase().split("?")[0];
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

interface Props {
  mediaUrl: string;
  placeName: string;
  category?: string | null;
  neighborhood?: string | null;
  isPartner?: boolean;
}

export default function PlaceHero({ mediaUrl, placeName, category, neighborhood, isPartner }: Props) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const video = isVideo(mediaUrl);

  const optimizedUrl = video ? mediaUrl : getOptimizedImageUrl(mediaUrl, { width: 800, quality: 85 });

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPaused(false); }
    else { v.pause(); setPaused(true); }
  };

  return (
    <div className="relative w-full aspect-[16/10] md:aspect-[21/9] max-h-[520px] overflow-hidden bg-black">
      {/* Media */}
      {video ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          className="w-full h-full object-cover"
          autoPlay loop muted={muted} playsInline preload="auto"
        />
      ) : (
        <img src={optimizedUrl} alt={placeName} className="w-full h-full object-cover" />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:bg-black/60 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Video controls */}
      {video && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90"
          >
            {paused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Title overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 z-10">
        {isPartner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 bg-gold/90 px-3 py-1 rounded-full mb-3"
          >
            <span className="text-xs">⭐</span>
            <span className="text-2xs font-bold text-primary-foreground uppercase tracking-widest">Partenaire vérifié</span>
          </motion.div>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight"
        >
          {placeName}
        </motion.h1>
        {(category || neighborhood) && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-sm md:text-base text-white/70 font-body"
          >
            {[category, neighborhood].filter(Boolean).join(" · ")}
          </motion.p>
        )}
      </div>
    </div>
  );
}
