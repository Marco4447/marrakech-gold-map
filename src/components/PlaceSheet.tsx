import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Tag, Gift, Navigation, Share2, Heart, ChevronRight, Building2, Clock, DollarSign, Music, Phone, UtensilsCrossed, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DealTunnel from "./DealTunnel";
import { useLanguage } from "@/i18n/LanguageContext";
import { getShareUrl } from "@/lib/shareUrl";
import { useAuth } from "@/hooks/useAuth";
import PremiumLock from "./PremiumLock";
import PartnerOfferCard from "./PartnerOfferCard";
import PlacePhotoGallery from "./place/PlacePhotoGallery";
import PlaceVipSection from "./place/PlaceVipSection";
import PlaceVibesSection from "./place/PlaceVibesSection";
import VibeCheck from "./VibeCheck";
import PlaceCheckin from "./place/PlaceCheckin";
import EphemeralReviews from "./EphemeralReviews";
import { useBookmarks } from "@/hooks/useBookmarks";

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
  slug?: string | null;
}

interface PlaceSheetProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecenter?: () => void;
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

// ── Separator ──
const Sep = () => <div className="h-px bg-[rgba(200,130,30,0.1)] my-3" />;

export default function PlaceSheet({ place, open, onOpenChange, onRecenter }: PlaceSheetProps) {
  const [dealOpen, setDealOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const viewerCount = useViewerCount(place?.id);
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [isVip, setIsVip] = useState(false);
  const [offers, setOffers] = useState<Array<{ id: string; title: string; description: string; expiration_date: string | null; vip_only: boolean }>>([]);
  const [vipOffers, setVipOffers] = useState<Array<{ id: string; title: string; description: string; perk_type: string; start_time: string | null; end_time: string | null }>>([]);
  const [placeDetails, setPlaceDetails] = useState<{ opening_hours?: string; price_range?: string; music_style?: string; dress_code?: string; menu_url?: string; drinks_menu_url?: string; is_founder?: boolean; listing_tier?: string; phone?: string } | null>(null);
  const [placePhotos, setPlacePhotos] = useState<{ id: string; photo_url: string; caption: string | null }[]>([]);
  const [saved, setSaved] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (!place?.id || !open) return;
    setDescExpanded(false);
    supabase.from("places").select("opening_hours, price_range, music_style, dress_code, menu_url, drinks_menu_url, is_founder, listing_tier, phone").eq("id", place.id).single().then(({ data }) => {
      if (data) setPlaceDetails(data as any);
    });
    supabase.from("place_photos").select("id, photo_url, caption").eq("place_id", place.id).order("sort_order", { ascending: true }).then(({ data }) => {
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
      if (data) setOffers(data.filter((o) => !o.expiration_date || new Date(o.expiration_date) > new Date()));
    });
    const now = new Date().toISOString();
    supabase.from("vip_offers")
      .select("id, title, description, perk_type, start_time, end_time")
      .eq("place_id", place.id)
      .eq("is_active", true)
      .or(`end_time.is.null,end_time.gte.${now}`)
      .then(({ data }) => { if (data) setVipOffers(data); });
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
  const allImages = placePhotos.length > 0
    ? placePhotos.map(p => p.photo_url)
    : (place.image_url ? [place.image_url] : []);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  const handleShare = async () => {
    const url = getShareUrl("place", place.id);
    const text = `${place.name} sur Weshkech 🔥`;
    if (navigator.share) { try { await navigator.share({ title: place.name, text, url }); } catch {} }
    else { await navigator.clipboard.writeText(url); toast.success("Lien copié !"); }
  };

  const handleCopyAddress = async () => {
    if (!place.address) return;
    await navigator.clipboard.writeText(place.address);
    toast.success("Adresse copiée !");
    try { navigator.vibrate?.(5); } catch {}
  };

  const handleSave = () => {
    setSaved(!saved);
    try { navigator.vibrate?.(5); } catch {}
    toast.success(saved ? "Retiré des favoris" : "Sauvegardé !");
  };

  // Tags from category + neighborhood
  const tags = [place.category, place.neighborhood, placeDetails?.dress_code].filter(Boolean) as string[];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[1001]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onOpenChange(false)} />
          <motion.div className="absolute bottom-0 left-0 right-0 z-[1002] px-3 pb-16 max-h-[88vh] flex flex-col" initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.3} onDragEnd={(_, info) => { if (info.offset.y > 100 || info.velocity.y > 300) onOpenChange(false); }}>
            <div className={`bg-[#1A0E06] rounded-2xl overflow-hidden border shadow-2xl shadow-black/50 flex flex-col max-h-full ${isPartner ? "border-[rgba(200,130,30,0.35)]" : "border-[rgba(200,130,30,0.2)]"}`}>
              {/* Drag handle */}
              <div className="flex items-center justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-[3px] rounded-full bg-[#C8821E]/30" />
              </div>

              {/* ═══════════ SCROLLABLE CONTENT ═══════════ */}
              <div className="overflow-y-auto no-scrollbar flex-1 pb-4">

                {/* ── ZONE 1: PHOTOS ── */}
                <div className="relative">
                  <PlacePhotoGallery images={allImages} placeName={place.name} isPartner={isPartner} viewerCount={viewerCount} onClose={() => onOpenChange(false)} />
                  {/* Partner badge */}
                  {isPartner && (
                    <div className="absolute top-3 left-3 bg-[#C44A2A] px-2 py-1 rounded z-10 flex items-center gap-1">
                      <span className="text-[9px] font-bold text-[#F5EDD8] uppercase tracking-wide">★ Partenaire</span>
                    </div>
                  )}
                  {/* Photo counter */}
                  {allImages.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md z-10">
                      <span className="text-[11px] font-semibold text-[#F5EDD8]">1/{allImages.length}</span>
                    </div>
                  )}
                  {/* Bottom overlay: category + score */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#1A0E06] via-[#1A0E06]/70 to-transparent h-16 z-10" />
                  {place.category && (
                    <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#C8821E] uppercase tracking-[0.15em]">{place.category}</span>
                      {place.rating && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#E8C86E]">
                          <Star className="w-3 h-3 fill-[#E8C86E] text-[#E8C86E]" /> {place.rating}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-5 pt-4">

                  {/* ── ZONE 2: IDENTITÉ ── */}
                  <div>
                    {place.category && (
                      <p className="text-xs text-[#C8821E] font-semibold uppercase tracking-[0.15em] mb-1">{place.category}</p>
                    )}
                    <div className="flex items-center flex-wrap gap-y-1">
                      <Link to={`/venue/${place.id}`} onClick={() => onOpenChange(false)}
                        className="font-display text-2xl font-black tracking-tight text-[#F5EDD8] hover:text-[#C8821E] transition-colors">
                        {place.name}
                      </Link>
                      {isPartner && (
                        <span className="inline-flex items-center bg-[rgba(196,74,42,0.15)] border border-[rgba(196,74,42,0.4)] text-[#C44A2A] text-[9px] font-bold px-2 py-0.5 rounded ml-2">
                          Partenaire
                        </span>
                      )}
                    </div>
                    {/* Chips */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {placeDetails?.opening_hours && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md border border-[rgba(200,130,30,0.25)] text-xs text-[rgba(245,237,216,0.5)]">
                          <Clock className="w-3 h-3 text-[#C8821E]" /> {placeDetails.opening_hours.split(",")[0]}
                        </span>
                      )}
                      {placeDetails?.price_range && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md border border-[rgba(200,130,30,0.25)] text-xs text-[rgba(245,237,216,0.5)]">
                          {placeDetails.price_range}
                        </span>
                      )}
                      {place.neighborhood && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md border border-[rgba(200,130,30,0.25)] text-xs text-[rgba(245,237,216,0.5)]">
                          <MapPin className="w-3 h-3 text-[#C8821E]" /> {place.neighborhood}
                        </span>
                      )}
                    </div>
                  </div>

                  <Sep />

                  {/* ── ZONE 3: OFFRE VIP ── */}
                  {isPartner && (
                    <>
                      <div className="bg-[rgba(196,74,42,0.12)] border border-[rgba(196,74,42,0.25)] rounded-xl p-4 space-y-3">
                        {/* Offer details */}
                        {vipOffers.length > 0 ? (
                          vipOffers.map((vip) => {
                            const perkEmoji = vip.perk_type === "drink" ? "🍸" : vip.perk_type === "food" ? "🍽️" : vip.perk_type === "entry" ? "🎫" : vip.perk_type === "discount" ? "💰" : "🎁";
                            return (
                              <div key={vip.id}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-base">{perkEmoji}</span>
                                  <span className="text-sm font-bold text-[#F5EDD8]">{vip.title}</span>
                                </div>
                                <p className="text-xs text-[rgba(245,237,216,0.5)] leading-relaxed">{vip.description}</p>
                              </div>
                            );
                          })
                        ) : hasOffer ? (
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-[#C44A2A]" />
                            <span className="text-sm font-semibold text-[#F5EDD8]">Offre exclusive disponible</span>
                          </div>
                        ) : null}

                        {/* CTA button */}
                        {user ? (
                          <button
                            onClick={() => {
                              setShowQrModal(true);
                              try { navigator.vibrate?.(10); } catch {}
                            }}
                            className="w-full py-2.5 rounded-xl bg-[#C44A2A] text-[#F5EDD8] text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                          >
                            <Gift className="w-4 h-4" /> Récupérer l'offre
                          </button>
                        ) : (
                          <p className="text-xs text-[rgba(245,237,216,0.35)] text-center py-1">
                            Connecte-toi pour accéder aux offres partenaires
                          </p>
                        )}
                      </div>

                      {offers.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {offers.map((offer) => (
                            <PartnerOfferCard key={offer.id} offer={offer} isVip={isVip} />
                          ))}
                        </div>
                      )}
                      <Sep />
                    </>
                  )}

                  {/* ── ZONE 4: DESCRIPTION + TAGS ── */}
                  {place.description && (
                    <>
                      <div>
                        <p className={`text-sm text-[rgba(245,237,216,0.55)] leading-relaxed ${!descExpanded ? "line-clamp-3" : ""}`}>
                          {place.description}
                        </p>
                        {place.description.length > 150 && !descExpanded && (
                          <button onClick={() => setDescExpanded(true)} className="text-xs text-[#C8821E] font-semibold mt-1 active:opacity-70">
                            Lire plus
                          </button>
                        )}
                        {/* Tags */}
                        {tags.length > 0 && (
                          <div className="flex gap-1.5 mt-3 flex-wrap">
                            {tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 rounded-md border border-[rgba(200,130,30,0.18)] text-xs text-[rgba(245,237,216,0.35)]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Sep />
                    </>
                  )}

                  {/* ── ZONE 5: INFOS PRATIQUES ── */}
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-[rgba(245,237,216,0.3)] font-semibold mb-2">Infos pratiques</p>
                    <div className="grid grid-cols-2 gap-2">
                      {placeDetails?.opening_hours && (
                        <div className="bg-[#1A0E06] border border-[rgba(200,130,30,0.15)] rounded-lg p-2.5">
                          <p className="text-[9px] uppercase tracking-wide text-[rgba(245,237,216,0.3)] mb-0.5">Horaires</p>
                          <p className="text-xs font-semibold text-[#F5EDD8]">{placeDetails.opening_hours.split(",")[0]}</p>
                        </div>
                      )}
                      {placeDetails?.price_range && (
                        <div className="bg-[#1A0E06] border border-[rgba(200,130,30,0.15)] rounded-lg p-2.5">
                          <p className="text-[9px] uppercase tracking-wide text-[rgba(245,237,216,0.3)] mb-0.5">Prix moyen</p>
                          <p className="text-xs font-semibold text-[#F5EDD8]">{placeDetails.price_range}</p>
                        </div>
                      )}
                      {(placeDetails as any)?.phone && (
                        <div className="bg-[#1A0E06] border border-[rgba(200,130,30,0.15)] rounded-lg p-2.5">
                          <p className="text-[9px] uppercase tracking-wide text-[rgba(245,237,216,0.3)] mb-0.5">Téléphone</p>
                          <a href={`tel:${(placeDetails as any).phone}`} className="text-xs font-semibold text-[#C8821E]">{(placeDetails as any).phone}</a>
                        </div>
                      )}
                      {placeDetails?.music_style && (
                        <div className="bg-[#1A0E06] border border-[rgba(200,130,30,0.15)] rounded-lg p-2.5">
                          <p className="text-[9px] uppercase tracking-wide text-[rgba(245,237,216,0.3)] mb-0.5">Ambiance</p>
                          <p className="text-xs font-semibold text-[#F5EDD8]">{placeDetails.music_style}</p>
                        </div>
                      )}
                    </div>
                    {/* Menu links */}
                    {(placeDetails?.menu_url || placeDetails?.drinks_menu_url) && (
                      <div className="flex gap-2 mt-2">
                        {placeDetails.menu_url && (
                          <a href={placeDetails.menu_url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[rgba(200,130,30,0.15)] text-xs font-semibold text-[#C8821E] hover:bg-[#C8821E]/10 transition-colors">
                            <UtensilsCrossed className="w-3 h-3" /> Menu
                          </a>
                        )}
                        {placeDetails.drinks_menu_url && (
                          <a href={placeDetails.drinks_menu_url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[rgba(200,130,30,0.15)] text-xs font-semibold text-[#C8821E] hover:bg-[#C8821E]/10 transition-colors">
                            🍸 Boissons
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <Sep />

                  {/* ── ZONE 6: AMBIANCE LIVE ── */}
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-[rgba(245,237,216,0.3)] font-semibold mb-2">Ambiance live</p>
                    <div className="bg-[#1A0E06] border border-[rgba(200,130,30,0.15)] rounded-xl p-3 space-y-3">
                      <PlaceCheckin placeId={place.id} placeName={place.name} />
                      <VibeCheck placeId={place.id} placeName={place.name} />
                    </div>
                  </div>

                  <Sep />

                  {/* ── ZONE 7: AVIS LOCAUX ── */}
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-[rgba(245,237,216,0.3)] font-semibold mb-2">Avis locaux</p>
                    <div className="bg-[#1A0E06] border border-[rgba(200,130,30,0.12)] rounded-xl p-3">
                      <EphemeralReviews placeId={place.id} />
                    </div>
                  </div>

                  {/* Recent vibes */}
                  <PlaceVibesSection placeName={place.name} />

                  <Sep />

                  {/* ── ZONE 8: ADRESSE ── */}
                  {place.address && (
                    <div className="bg-[#1A0E06] border border-[rgba(200,130,30,0.15)] rounded-xl p-3 mb-4">
                      <p className="text-[9px] uppercase tracking-wide text-[rgba(245,237,216,0.3)] font-semibold mb-1.5">Adresse</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#C8821E]/60 shrink-0" />
                        <span className="text-xs text-[rgba(245,237,216,0.5)] flex-1">{place.address}</span>
                        <button onClick={handleCopyAddress}
                          className="px-2.5 py-1 rounded-md bg-[rgba(200,130,30,0.1)] border border-[rgba(200,130,30,0.25)] text-[#C8821E] text-xs font-semibold active:scale-90 transition-all flex items-center gap-1">
                          <Copy className="w-3 h-3" /> Copier
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manager CTA */}
                  {!isPartner && (
                    <Link to="/business" className="flex items-center gap-3 rounded-xl px-4 py-3 bg-[#1A0E06] border border-[rgba(200,130,30,0.2)] hover:border-[#C8821E]/50 transition-all mb-4">
                      <Building2 className="w-5 h-5 text-[#C8821E]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#C8821E]">Vous êtes le gérant ?</p>
                        <p className="text-[10px] text-[rgba(245,237,216,0.3)]">Rejoignez WeshKech</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C8821E]" />
                    </Link>
                  )}
                </div>
              </div>

              {/* ═══════════ STICKY BOTTOM BAR ═══════════ */}
              <div className="flex-shrink-0 border-t border-[rgba(200,130,30,0.15)] bg-[#0E0904] px-4 py-3 flex items-center gap-2">
                {/* Save */}
                <button onClick={handleSave}
                  className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all active:scale-90 ${saved ? "bg-[#C8821E]/15 border-[#C8821E]/40" : "bg-[rgba(245,237,216,0.05)] border-[rgba(200,130,30,0.25)]"}`}>
                  <Heart className={`w-5 h-5 ${saved ? "fill-[#C8821E] text-[#C8821E]" : "text-[rgba(245,237,216,0.4)]"}`} />
                </button>
                {/* Share */}
                <button onClick={handleShare}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-[rgba(245,237,216,0.05)] border border-[rgba(200,130,30,0.25)] transition-all active:scale-90">
                  <Share2 className="w-5 h-5 text-[rgba(245,237,216,0.4)]" />
                </button>
                {/* Y aller */}
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#C8821E] text-[#0E0904] font-black uppercase tracking-wide text-sm rounded-xl shadow-lg shadow-[#C8821E]/20 active:scale-[0.97] transition-transform">
                  <Navigation className="w-4 h-4" /> Y aller
                </a>
              </div>
            </div>
          </motion.div>
          <DealTunnel open={dealOpen} onOpenChange={setDealOpen} placeName={place.name} />

          {/* ═══════════ QR OFFER MODAL ═══════════ */}
          <AnimatePresence>
            {showQrModal && user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[3000] bg-[#0E0904] flex flex-col items-center justify-center px-8"
                onClick={() => setShowQrModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="flex flex-col items-center text-center max-w-sm w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Logo */}
                  <img src="/logo_72.png" alt="WeshKech" className="w-12 h-12 rounded-xl mb-6 opacity-80" />

                  {/* QR Code */}
                  <div className="border-2 border-[#C8821E] rounded-xl p-4 bg-white mb-6">
                    <QRCodeSVG
                      value={JSON.stringify({
                        userId: user.id,
                        placeId: place.id,
                        date: new Date().toISOString().split("T")[0],
                        offer: vipOffers[0]?.title || "Offre VIP",
                      })}
                      size={260}
                      level="M"
                      fgColor="#1A0E06"
                      bgColor="#ffffff"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-black text-[#F5EDD8] mb-2">Montre ce QR au staff</h3>

                  {/* Spot + offer */}
                  <p className="text-sm text-[rgba(245,237,216,0.5)] mb-4">
                    {place.name} {vipOffers[0]?.title ? `· ${vipOffers[0].title}` : ""}
                  </p>

                  {/* Date badge */}
                  <div className="bg-[rgba(200,130,30,0.15)] border border-[rgba(200,130,30,0.3)] text-[#C8821E] text-xs font-semibold rounded-md px-3 py-1 mb-8">
                    Valable aujourd'hui · {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setShowQrModal(false)}
                    className="w-full h-11 bg-[rgba(245,237,216,0.07)] border border-[rgba(200,130,30,0.2)] text-[#F5EDD8] font-semibold rounded-xl active:scale-[0.97] transition-transform"
                  >
                    Fermer
                  </button>
                </motion.div>

                {/* Track event on mount */}
                <QrModalTracker userId={user.id} placeId={place.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

// Tracks vip_offer_viewed event once when QR modal opens
function QrModalTracker({ userId, placeId }: { userId: string; placeId: string }) {
  useEffect(() => {
    supabase.from("acquisition_events").insert({
      event_type: "vip_offer_viewed",
      user_id: userId,
      source: placeId,
      campaign: new Date().toISOString().split("T")[0],
    } as any).then(() => {});
  }, []);
  return null;
}
