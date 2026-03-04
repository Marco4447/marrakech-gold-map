import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Tag, Zap, Gift, Navigation, Share2, Users, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DealTunnel from "./DealTunnel";

interface Place {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  address: string | null;
  rating: number | null;
  is_partner?: boolean;
  has_active_offer?: boolean;
  neighborhood?: string | null;
}

interface PlaceSheetProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fetch vibe images for this place to create a gallery
function usePlaceGallery(placeName: string | undefined) {
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    if (!placeName) return;
    supabase
      .from("vibes")
      .select("image_url")
      .ilike("location", placeName)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setImages(data.map((v) => v.image_url));
      });
  }, [placeName]);
  return images;
}

// Fake "viewers" count based on place id hash for social proof
function useViewerCount(placeId: string | undefined) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!placeId) return;
    // Generate a semi-random but consistent viewer count
    let hash = 0;
    for (let i = 0; i < placeId.length; i++) hash = ((hash << 5) - hash) + placeId.charCodeAt(i);
    const base = Math.abs(hash % 12) + 2;
    setCount(base);
    // Simulate slight fluctuation
    const interval = setInterval(() => {
      setCount((c) => c + (Math.random() > 0.5 ? 1 : -1));
    }, 8000);
    return () => clearInterval(interval);
  }, [placeId]);
  return Math.max(1, count);
}

export default function PlaceSheet({ place, open, onOpenChange }: PlaceSheetProps) {
  const [dealOpen, setDealOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const vibeImages = usePlaceGallery(place?.name);
  const viewerCount = useViewerCount(place?.id);

  // Reset gallery index when place changes
  useEffect(() => { setGalleryIndex(0); }, [place?.id]);

  if (!place) return null;

  const isPartner = place.is_partner ?? false;
  const hasOffer = place.has_active_offer ?? false;

  // Build gallery: place image + vibe images
  const allImages = [
    ...(place.image_url ? [place.image_url] : []),
    ...vibeImages.filter((img) => img !== place.image_url),
  ].slice(0, 5);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  const handleShare = async () => {
    const ogUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-place?id=${place.id}`;
    const text = `${place.name} sur Weshkech 🔥`;
    if (navigator.share) {
      try { await navigator.share({ title: place.name, text, url: ogUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(ogUrl);
    }
  };

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
            className="absolute bottom-0 left-0 right-0 z-[1002] px-4 pb-20 max-h-[85vh] flex flex-col"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.3}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) {
                onOpenChange(false);
              }
            }}
          >
            <div className={`bg-card rounded-2xl overflow-hidden border shadow-2xl flex flex-col max-h-full ${isPartner ? "border-gold/40 shadow-gold/10" : "border-border shadow-gold/5"}`}>
              {/* Drag handle */}
              <div className="flex items-center justify-center pt-3 pb-1 flex-shrink-0">
                <button onClick={() => onOpenChange(false)} className="w-10 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
              </div>

              <div className="overflow-y-auto no-scrollbar flex-1">
                {/* ===== SWIPEABLE GALLERY ===== */}
                {allImages.length > 0 && (
                  <div className="relative h-48 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={galleryIndex}
                        src={allImages[galleryIndex]}
                        alt={place.name}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

                    {/* Gallery nav */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i - 1 + allImages.length) % allImages.length); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center text-foreground"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i + 1) % allImages.length); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center text-foreground"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {/* Dots */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {allImages.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all ${i === galleryIndex ? "w-4 bg-gold" : "w-1.5 bg-foreground/30"}`} />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Close */}
                    <button
                      onClick={() => onOpenChange(false)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Partner badge */}
                    {isPartner && (
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-gold px-3 py-1.5 rounded-full shadow-lg">
                        <span className="text-xs">⭐</span>
                        <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-wider">Partenaire</span>
                      </div>
                    )}

                    {/* Viewer count — social proof */}
                    <div className="absolute bottom-2 right-3 flex items-center gap-1 bg-background/60 backdrop-blur-md px-2 py-1 rounded-full">
                      <Users className="w-3 h-3 text-gold" />
                      <span className="text-[10px] text-foreground font-medium">{viewerCount} regardent</span>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-3">
                  {/* Title + category + rating */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-foreground">{place.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        {place.category && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-gold" />
                            <span className="text-xs text-gold font-medium uppercase tracking-wider">{place.category}</span>
                          </div>
                        )}
                        {(place as any).neighborhood && (
                          <span className="text-[10px] text-muted-foreground">· {(place as any).neighborhood}</span>
                        )}
                      </div>
                    </div>
                    {place.rating && (
                      <div className="flex items-center gap-1 bg-gold/10 px-2.5 py-1 rounded-full shrink-0">
                        <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                        <span className="text-sm font-semibold text-gold">{place.rating}</span>
                      </div>
                    )}
                  </div>

                  {place.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{place.description}</p>
                  )}

                  {/* Partner offer highlight */}
                  {isPartner && hasOffer && (
                    <div className="bg-gold/10 border border-gold/25 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-gold" />
                        <span className="text-sm font-semibold text-gold">Offre Insider exclusive</span>
                      </div>
                      <p className="text-xs text-foreground/80">
                        Présentez votre Pass Insider pour bénéficier d'un avantage exclusif chez {place.name}.
                      </p>
                    </div>
                  )}

                  {/* Address */}
                  {place.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-gold/60 shrink-0" />
                      <span className="text-xs">{place.address}</span>
                    </div>
                  )}

                  {/* ===== ACTION BUTTONS ===== */}
                  <div className="flex gap-2 pt-1">
                    {/* J'y vais — Google Maps */}
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-primary-foreground font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-gold/20"
                    >
                      <Navigation className="w-4 h-4" />
                      J'y vais
                    </a>
                    {/* Share */}
                    <button
                      onClick={handleShare}
                      className="w-12 flex items-center justify-center bg-card border border-border hover:border-gold/40 rounded-xl transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-foreground" />
                    </button>
                  </div>

                  {/* Pass CTA — only for partners with active offer */}
                  {isPartner && hasOffer && (
                    <button
                      onClick={() => setDealOpen(true)}
                      className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-2xl transition-colors border bg-gold hover:bg-gold-light text-primary-foreground border-gold/30 shadow-lg shadow-gold/20"
                    >
                      <Zap className="w-4 h-4" />
                      Utiliser mon Pass Insider 🎁
                    </button>
                  )}

                  {/* ===== CTA GÉRANT — NON-PARTENAIRE ===== */}
                  {!isPartner && (
                    <Link
                      to="/business"
                      className="flex items-center gap-2.5 bg-card border border-border hover:border-gold/30 rounded-xl px-4 py-3 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors">
                          Vous êtes le gérant ?
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Rejoignez Weshkech et boostez votre visibilité
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                    </Link>
                  )}
                </div>
              </div>{/* end overflow scroll */}
            </div>
          </motion.div>

          <DealTunnel
            open={dealOpen}
            onOpenChange={setDealOpen}
            placeName={place.name}
          />
        </>
      )}
    </AnimatePresence>
  );
}
