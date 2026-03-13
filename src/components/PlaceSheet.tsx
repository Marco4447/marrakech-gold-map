import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Tag, Zap, Gift, Navigation, Share2, Users, ChevronLeft, ChevronRight, Building2, Clock, DollarSign, Music, Shirt, UtensilsCrossed, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DealTunnel from "./DealTunnel";
import { useLanguage } from "@/i18n/LanguageContext";
import { getShareUrl } from "@/lib/shareUrl";
import { useAuth } from "@/hooks/useAuth";
import PremiumLock from "./PremiumLock";
import PartnerOfferCard from "./PartnerOfferCard";
import PostUnlockBanner from "./PostUnlockBanner";
import PlacePhotoGallery from "./place/PlacePhotoGallery";
import PlaceInfoCards from "./place/PlaceInfoCards";
import PlaceVipSection from "./place/PlaceVipSection";
import PlaceVibesSection from "./place/PlaceVibesSection";

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
  const viewerCount = useViewerCount(place?.id);
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [isVip, setIsVip] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [vipOffers, setVipOffers] = useState<any[]>([]);
  const [placeDetails, setPlaceDetails] = useState<{ opening_hours?: string; price_range?: string; music_style?: string; dress_code?: string; menu_url?: string; drinks_menu_url?: string } | null>(null);
  const [placePhotos, setPlacePhotos] = useState<{ id: string; photo_url: string; caption: string | null }[]>([]);

  useEffect(() => {
    if (!place?.id || !open) return;
    supabase.from("places").select("opening_hours, price_range, music_style, dress_code, menu_url, drinks_menu_url").eq("id", place.id).single().then(({ data }) => {
      if (data) setPlaceDetails(data as any);
    });
    // Fetch place photos
    (supabase.from("place_photos") as any).select("id, photo_url, caption").eq("place_id", place.id).order("sort_order", { ascending: true }).then(({ data }: any) => {
      if (data) setPlacePhotos(data);
    });
  }, [place?.id, open]);

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
  // Build gallery: place_photos first, fallback to place.image_url
  const allImages = placePhotos.length > 0
    ? placePhotos.map(p => p.photo_url)
    : (place.image_url ? [place.image_url] : []);
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
              {/* Drag handle + close button */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
                <div className="w-8" />
                <button onClick={() => onOpenChange(false)} className="w-10 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
                <button onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="overflow-y-auto no-scrollbar flex-1">
                {/* Photo Gallery */}
                <PlacePhotoGallery images={allImages} placeName={place.name} isPartner={isPartner} viewerCount={viewerCount} onClose={() => onOpenChange(false)} />

                <div className="p-5 space-y-3">
                  {/* Header: Name + Rating */}
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

                  {false /* B2C free: PremiumLock disabled */ ? (
                    <PremiumLock placeName={place.name} />
                  ) : (
                    <>
                       {/* Description */}
                       {place.description && <p className="text-sm text-muted-foreground leading-relaxed">{place.description}</p>}

                       {/* Recent Vibes from this place */}
                       <PlaceVibesSection placeName={place.name} />

                       {/* Info Cards (horaires, prix, musique, dress code) */}
                      <PlaceInfoCards details={placeDetails} />

                      {/* Menu / Carte link */}
                      {placeDetails?.menu_url && (
                        <a href={placeDetails.menu_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-muted/50 hover:bg-muted rounded-xl px-4 py-3 transition-colors group">
                          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                            <UtensilsCrossed className="w-4 h-4 text-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors">
                              {lang === "fr" ? "Voir la carte / menu" : "View menu"}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{lang === "fr" ? "Plats & tarifs" : "Food & prices"}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                        </a>
                      )}

                      {/* Drinks menu link */}
                      {(placeDetails as any)?.drinks_menu_url && (
                        <a href={(placeDetails as any).drinks_menu_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-muted/50 hover:bg-muted rounded-xl px-4 py-3 transition-colors group">
                          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                            <span className="text-sm">🍸</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors">
                              {lang === "fr" ? "Carte des boissons" : "Drinks menu"}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{lang === "fr" ? "Cocktails, vins, softs" : "Cocktails, wines, softs"}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                        </a>
                      )}

                      {/* VIP Offers */}
                      <PlaceVipSection isPartner={isPartner} hasOffer={hasOffer} vipOffers={vipOffers} placeName={place.name} />

                      {/* Partner Offers */}
                      {offers.length > 0 && (
                        <div className="space-y-2">
                          {offers.map((offer) => (
                            <PartnerOfferCard key={offer.id} offer={offer} isVip={isVip} />
                          ))}
                        </div>
                      )}

                      {/* Address */}
                      {place.address && (
                        <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5 text-gold/60 shrink-0" /><span className="text-xs">{place.address}</span></div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1">
                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-primary-foreground font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-gold/20">
                          <Navigation className="w-4 h-4" /> {t("place_goThere")}
                        </a>
                        <button onClick={handleShare} className="w-12 flex items-center justify-center bg-card border border-border hover:border-gold/40 rounded-xl transition-colors"><Share2 className="w-4 h-4 text-foreground" /></button>
                      </div>

                      {/* B2C free: pass button disabled */}

                      {!isPartner && (
                        <Link to="/business" className="flex items-center gap-3 rounded-xl px-4 py-4 transition-all group border-2 border-gold/30 hover:border-gold/60 shadow-md shadow-gold/10 hover:shadow-gold/20"
                          style={{ background: "linear-gradient(135deg, hsl(var(--gold) / 0.08), hsl(var(--gold) / 0.15))" }}>
                          <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gold">{t("place_areYouManager")}</p>
                            <p className="text-[11px] text-foreground/70">{t("place_joinWeshkech")}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gold" />
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
