import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Tag, Zap, Gift, Navigation, Share2, Users, ChevronLeft, ChevronRight, Building2, Clock, DollarSign, Music, Shirt } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DealTunnel from "./DealTunnel";
import { useLanguage } from "@/i18n/LanguageContext";
import { getShareUrl } from "@/lib/shareUrl";
import { useAuth } from "@/hooks/useAuth";
import PremiumLock from "./PremiumLock";
import PartnerOfferCard from "./PartnerOfferCard";

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
  is_premium?: boolean;
}

interface PlaceSheetProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function usePlaceGallery(placeName: string | undefined) {
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    if (!placeName) return;
    supabase.from("vibes").select("image_url").ilike("location", placeName).order("created_at", { ascending: false }).limit(5).then(({ data }) => {
      if (data) setImages(data.map((v) => v.image_url));
    });
  }, [placeName]);
  return images;
}

function useViewerCount(placeId: string | undefined) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!placeId) return;
    let hash = 0;
    for (let i = 0; i < placeId.length; i++) hash = ((hash << 5) - hash) + placeId.charCodeAt(i);
    const base = Math.abs(hash % 12) + 2;
    setCount(base);
    const interval = setInterval(() => setCount((c) => c + (Math.random() > 0.5 ? 1 : -1)), 8000);
    return () => clearInterval(interval);
  }, [placeId]);
  return Math.max(1, count);
}

export default function PlaceSheet({ place, open, onOpenChange }: PlaceSheetProps) {
  const [dealOpen, setDealOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const vibeImages = usePlaceGallery(place?.name);
  const viewerCount = useViewerCount(place?.id);
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [isVip, setIsVip] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [vipOffers, setVipOffers] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !open) return;
    supabase.from("profiles").select("is_vip, vip_expires_at").eq("user_id", user.id).single().then(({ data }) => {
      setIsVip(!!(data?.is_vip && data?.vip_expires_at && new Date(data.vip_expires_at) > new Date()));
    });
  }, [user, open]);

  useEffect(() => {
    if (!place?.id || !open) return;
    supabase.from("partner_offers").select("*").eq("place_id", place.id).eq("is_active", true).then(({ data }) => {
      if (data) setOffers(data.filter((o: any) => !o.expiration_date || new Date(o.expiration_date) > new Date()));
    });
    // Fetch active VIP offers for this place
    const now = new Date().toISOString();
    (supabase.from("vip_offers") as any)
      .select("id, title, description, perk_type, start_time, end_time")
      .eq("place_id", place.id)
      .eq("is_active", true)
      .or(`end_time.is.null,end_time.gte.${now}`)
      .then(({ data }: any) => {
        if (data) setVipOffers(data);
      });
  }, [place?.id, open]);

  useEffect(() => { setGalleryIndex(0); }, [place?.id]);

  useEffect(() => {
    if (open && place) {
      import("@/lib/ttq").then(({ ttqTrack }) => {
        ttqTrack("ViewContent", { content_type: "place", content_id: place.id, content_name: place.name });
      });
    }
  }, [open, place?.id]);

  if (!place) return null;

  const isPartner = place.is_partner ?? false;
  const hasOffer = place.has_active_offer ?? false;
  const allImages = [...(place.image_url ? [place.image_url] : []), ...vibeImages.filter((img) => img !== place.image_url)].slice(0, 5);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  const handleShare = async () => {
    const deepLinkUrl = getShareUrl("place", place.id);
    const text = `${place.name} ${lang === "fr" ? "sur" : "on"} Weshkech 🔥`;
    if (navigator.share) {
      try { await navigator.share({ title: place.name, text, url: deepLinkUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(deepLinkUrl);
      toast.success(lang === "fr" ? "Lien copié !" : "Link copied!");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-[1001]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onOpenChange(false)} />
          <motion.div className="absolute bottom-0 left-0 right-0 z-[1002] px-4 pb-20 max-h-[85vh] flex flex-col" initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.3} onDragEnd={(_, info) => { if (info.offset.y > 100 || info.velocity.y > 300) onOpenChange(false); }}>
            <div className={`bg-card rounded-2xl overflow-hidden border shadow-2xl flex flex-col max-h-full ${isPartner ? "border-gold/40 shadow-gold/10" : "border-border shadow-gold/5"}`}>
              <div className="flex items-center justify-center pt-3 pb-1 flex-shrink-0">
                <button onClick={() => onOpenChange(false)} className="w-10 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
              </div>
              <div className="overflow-y-auto no-scrollbar flex-1">
                {allImages.length > 0 && (
                  <div className="relative h-48 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img key={galleryIndex} src={allImages[galleryIndex]} alt={place.name} className="w-full h-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    {allImages.length > 1 && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i - 1 + allImages.length) % allImages.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center text-foreground"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i + 1) % allImages.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center text-foreground"><ChevronRight className="w-4 h-4" /></button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {allImages.map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all ${i === galleryIndex ? "w-4 bg-gold" : "w-1.5 bg-foreground/30"}`} />))}
                        </div>
                      </>
                    )}
                    <button onClick={() => onOpenChange(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"><X className="w-4 h-4" /></button>
                    {isPartner && (
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-gold px-3 py-1.5 rounded-full shadow-lg">
                        <span className="text-xs">⭐</span>
                        <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-wider">{t("place_partner")}</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-3 flex items-center gap-1 bg-background/60 backdrop-blur-md px-2 py-1 rounded-full">
                      <Users className="w-3 h-3 text-gold" />
                      <span className="text-[10px] text-foreground font-medium">{viewerCount} {t("place_watching")}</span>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/venue/${(place as any).slug || place.id}`} onClick={() => onOpenChange(false)}
                        className="font-display text-xl font-semibold text-foreground hover:text-gold transition-colors">
                        {place.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {place.category && (<div className="flex items-center gap-1"><Tag className="w-3 h-3 text-gold" /><span className="text-xs text-gold font-medium uppercase tracking-wider">{place.category}</span></div>)}
                        {(place as any).neighborhood && (<span className="text-[10px] text-muted-foreground">· {(place as any).neighborhood}</span>)}
                      </div>
                    </div>
                    {place.rating && (
                      <div className="flex items-center gap-1 bg-gold/10 px-2.5 py-1 rounded-full shrink-0"><Star className="w-3.5 h-3.5 text-gold fill-gold" /><span className="text-sm font-semibold text-gold">{place.rating}</span></div>
                    )}
                  </div>

                  {(place as any).is_premium && !isVip ? (
                    <PremiumLock placeName={place.name} />
                  ) : (
                    <>
                      {place.description && <p className="text-sm text-muted-foreground leading-relaxed">{place.description}</p>}

                      {isPartner && vipOffers.length > 0 && (
                        <div className="space-y-2">
                          {vipOffers.map((vip) => {
                            const perkEmoji = vip.perk_type === "drink" ? "🍸" : vip.perk_type === "food" ? "🍽️" : vip.perk_type === "entry" ? "🎫" : "🎁";
                            return (
                              <div key={vip.id} className="bg-gold/10 border border-gold/25 rounded-xl p-4 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{perkEmoji}</span>
                                  <span className="text-sm font-bold text-gold">{vip.title}</span>
                                </div>
                                <p className="text-xs text-foreground/80 leading-relaxed">{vip.description}</p>
                                {vip.end_time && (
                                  <p className="text-[10px] text-muted-foreground">
                                    Jusqu'à {new Date(vip.end_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {isPartner && hasOffer && vipOffers.length === 0 && (
                        <div className="bg-gold/10 border border-gold/25 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2"><Gift className="w-4 h-4 text-gold" /><span className="text-sm font-semibold text-gold">{t("place_insiderOffer")}</span></div>
                          <p className="text-xs text-foreground/80">{t("place_insiderOfferDesc")} {place.name}.</p>
                        </div>
                      )}

                      {offers.length > 0 && (
                        <div className="space-y-2">
                          {offers.map((offer) => (
                            <PartnerOfferCard key={offer.id} offer={offer} isVip={isVip} />
                          ))}
                        </div>
                      )}

                  {place.address && (
                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5 text-gold/60 shrink-0" /><span className="text-xs">{place.address}</span></div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-primary-foreground font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-gold/20">
                      <Navigation className="w-4 h-4" /> {t("place_goThere")}
                    </a>
                    <button onClick={handleShare} className="w-12 flex items-center justify-center bg-card border border-border hover:border-gold/40 rounded-xl transition-colors"><Share2 className="w-4 h-4 text-foreground" /></button>
                  </div>

                  {isPartner && hasOffer && (
                    <button onClick={() => setDealOpen(true)} className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-2xl transition-colors border bg-gold hover:bg-gold-light text-primary-foreground border-gold/30 shadow-lg shadow-gold/20">
                      <Zap className="w-4 h-4" /> {t("place_usePass")}
                    </button>
                  )}

                  {!isPartner && (
                    <Link to="/business" className="flex items-center gap-2.5 bg-card border border-border hover:border-gold/30 rounded-xl px-4 py-3 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Building2 className="w-4 h-4 text-gold" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors">{t("place_areYouManager")}</p>
                        <p className="text-[10px] text-muted-foreground">{t("place_joinWeshkech")}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                    </Link>
                  )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
          <DealTunnel open={dealOpen} onOpenChange={setDealOpen} placeName={place.name} />
        </>
      )}
    </AnimatePresence>
  );
}
