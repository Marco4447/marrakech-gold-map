import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Users, Image as ImageIcon, Volume2, VolumeX, Play } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { getOptimizedImageUrl } from "@/lib/imageOptimize";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"];

function isVideo(url: string): boolean {
  const lower = url.toLowerCase().split("?")[0];
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

interface Props {
  images: string[];
  placeName: string;
  isPartner: boolean;
  viewerCount: number;
  onClose: () => void;
}

function GalleryVideo({ src, isActive }: { src: string; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPaused(false); }
    else { v.pause(); setPaused(true); }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted((m) => !m);
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        autoPlay={isActive}
        loop
        muted={muted}
        playsInline
        preload="metadata"
      />
      <button onClick={togglePlay} className="absolute inset-0 z-10" aria-label="Play/Pause">
        <AnimatePresence>
          {paused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center">
                <Play className="w-6 h-6 text-foreground ml-0.5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      <button
        onClick={toggleMute}
        aria-label={muted ? "Activer le son" : "Couper le son"}
        className="absolute bottom-3 right-3 z-20 w-7 h-7 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center text-foreground"
      >
        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default function PlacePhotoGallery({ images, placeName, isPartner, viewerCount, onClose }: Props) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const { t } = useLanguage();

  if (images.length === 0) {
    return (
      <div className="h-36 bg-muted/30 flex flex-col items-center justify-center gap-2">
        <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
        <span className="text-xs text-muted-foreground/60">{placeName}</span>
      </div>
    );
  }

  const currentUrl = images[galleryIndex];
  const currentIsVideo = isVideo(currentUrl);
  const optimizedUrl = currentIsVideo ? currentUrl : getOptimizedImageUrl(currentUrl, { width: 800, quality: 85 });

  return (
    <div className="space-y-0">
      {/* Main media — 4:5 aspect like Instagram */}
      <div className="relative aspect-[4/5] max-h-[420px] overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          {currentIsVideo ? (
            <motion.div
              key={`video-${galleryIndex}`}
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <GalleryVideo src={currentUrl} isActive />
            </motion.div>
          ) : (
            <motion.img
              key={galleryIndex}
              src={optimizedUrl}
              alt={placeName}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onError={(e) => {
                const target = e.currentTarget;
                // Fallback: try original URL if optimized fails
                if (target.src !== currentUrl) {
                  target.src = currentUrl;
                } else {
                  target.style.display = "none";
                }
              }}
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button aria-label="Photo précédente" onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i - 1 + images.length) % images.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center text-foreground z-20">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button aria-label="Photo suivante" onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i + 1) % images.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center text-foreground z-20">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Close button */}
        <button aria-label="Fermer la galerie" onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-background/80 transition-colors z-30">
          <X className="w-4 h-4" />
        </button>

        {/* Partner badge */}
        {isPartner && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-gold px-3 py-1.5 rounded-full shadow-lg z-20">
            <span className="text-xs">⭐</span>
            <span className="text-2xs font-bold text-primary-foreground uppercase tracking-wider">{t("place_partner")}</span>
          </div>
        )}

        {/* Viewer count */}
        <div className="absolute bottom-2 right-3 flex items-center gap-1 bg-background/60 backdrop-blur-md px-2 py-1 rounded-full z-20">
          <Users className="w-3 h-3 text-gold" />
          <span className="text-2xs text-foreground font-medium">{viewerCount} {t("place_watching")}</span>
        </div>

        {/* Media counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-3 bg-background/60 backdrop-blur-md px-2 py-1 rounded-full z-20">
            <span className="text-2xs text-foreground font-medium">{galleryIndex + 1}/{images.length}</span>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="px-4 pt-2 pb-1">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {images.map((url, i) => {
              const thumbIsVideo = isVideo(url);
              const thumbUrl = thumbIsVideo ? url : getOptimizedImageUrl(url, { width: 100, quality: 60 });
              return (
                <button key={i} onClick={() => setGalleryIndex(i)}
                  className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === galleryIndex ? "border-gold shadow-md shadow-gold/20 scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  {thumbIsVideo ? (
                    <>
                      <video src={url} className="w-full h-full object-cover" muted preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                    </>
                  ) : (
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
