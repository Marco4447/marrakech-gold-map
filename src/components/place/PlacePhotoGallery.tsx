import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Users, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  images: string[];
  placeName: string;
  isPartner: boolean;
  viewerCount: number;
  onClose: () => void;
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

  return (
    <div className="space-y-0">
      {/* Main image */}
      <div className="relative h-48 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={galleryIndex}
            src={images[galleryIndex]}
            alt={placeName}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i - 1 + images.length) % images.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center text-foreground">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i + 1) % images.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center text-foreground">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-background/80 transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Partner badge */}
        {isPartner && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-gold px-3 py-1.5 rounded-full shadow-lg">
            <span className="text-xs">⭐</span>
            <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-wider">{t("place_partner")}</span>
          </div>
        )}

        {/* Viewer count */}
        <div className="absolute bottom-2 right-3 flex items-center gap-1 bg-background/60 backdrop-blur-md px-2 py-1 rounded-full">
          <Users className="w-3 h-3 text-gold" />
          <span className="text-[10px] text-foreground font-medium">{viewerCount} {t("place_watching")}</span>
        </div>

        {/* Photo counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-3 bg-background/60 backdrop-blur-md px-2 py-1 rounded-full">
            <span className="text-[10px] text-foreground font-medium">{galleryIndex + 1}/{images.length}</span>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="px-4 pt-2 pb-1">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <button key={i} onClick={() => setGalleryIndex(i)}
                className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === galleryIndex ? "border-gold shadow-md shadow-gold/20 scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
