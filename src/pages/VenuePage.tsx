import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Star, MapPin, Tag, Gift, Navigation, Share2, Users,
  ChevronLeft, ChevronRight, Clock, Music, DollarSign, Shirt,
  Zap, Building2, ChevronRight as ChevronR, QrCode
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { getShareUrl } from "@/lib/shareUrl";
import DealTunnel from "@/components/DealTunnel";
import PremiumLock from "@/components/PremiumLock";
import PartnerOfferCard from "@/components/PartnerOfferCard";

interface PlaceData {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  address: string | null;
  neighborhood: string | null;
  rating: number | null;
  is_partner: boolean;
  has_active_offer: boolean;
  is_premium: boolean;
  opening_hours: string | null;
  price_range: string | null;
  music_style: string | null;
  dress_code: string | null;
  listing_tier: string | null;
  vip_perk_description: string | null;
}

function useVenueGallery(placeName: string | undefined) {
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    if (!placeName) return;
    supabase.from("vibes").select("image_url").ilike("location", placeName).order("created_at", { ascending: false }).limit(8)
      .then(({ data }) => { if (data) setImages(data.map(v => v.image_url)); });
  }, [placeName]);
  return images;
}

function useUserVibes(placeName: string | undefined) {
  const [vibes, setVibes] = useState<any[]>([]);
  useEffect(() => {
    if (!placeName) return;
    supabase.from("vibes").select("id, image_url, caption, username, created_at, likes, media_type, mood")
      .ilike("location", placeName).eq("is_official", false).order("created_at", { ascending: false }).limit(12)
      .then(({ data }) => { if (data) setVibes(data); });
  }, [placeName]);
  return vibes;
}

function useViewerCount(placeId: string | undefined) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!placeId) return;
    let hash = 0;
    for (let i = 0; i < placeId.length; i++) hash = ((hash << 5) - hash) + placeId.charCodeAt(i);
    setCount(Math.abs(hash % 12) + 2);
    const interval = setInterval(() => setCount(c => c + (Math.random() > 0.5 ? 1 : -1)), 8000);
    return () => clearInterval(interval);
  }, [placeId]);
  return Math.max(1, count);
}

export default function VenuePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const [place, setPlace] = useState<PlaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isVip, setIsVip] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [vipOffers, setVipOffers] = useState<any[]>([]);
  const [dealOpen, setDealOpen] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const vibeImages = useVenueGallery(place?.name);
  const userVibes = useUserVibes(place?.name);
  const viewerCount = useViewerCount(place?.id);

  // Detect if image_url is a logo (small local file or contains "logo")
  const isLogoOnly = place?.image_url ? (place.image_url.includes("logo") || place.image_url.startsWith("/images/")) : false;

  // Load place
  useEffect(() => {
    if (!slug) return;
    supabase.from("places").select("*").eq("slug", slug).maybeSingle()
      .then(({ data, error }) => {
        if (data) setPlace(data as any);
        else navigate("/", { replace: true });
        setLoading(false);
      });
  }, [slug]);

  // Track view
  useEffect(() => {
    if (!place) return;
    supabase.from("venue_analytics").insert({ place_id: place.id, event_type: "page_view", user_id: user?.id || null } as any).then(() => {});
  }, [place?.id]);

  // VIP status
  useEffect(() => {
    if (!user || !place) return;
    supabase.from("profiles").select("is_vip, vip_expires_at").eq("user_id", user.id).single()
      .then(({ data }) => { setIsVip(!!(data?.is_vip && data?.vip_expires_at && new Date(data.vip_expires_at) > new Date())); });
  }, [user, place]);

  // Offers
  useEffect(() => {
    if (!place?.id) return;
    supabase.from("partner_offers").select("*").eq("place_id", place.id).eq("is_active", true)
      .then(({ data }) => { if (data) setOffers(data.filter((o: any) => !o.expiration_date || new Date(o.expiration_date) > new Date())); });
    const now = new Date().toISOString();
    (supabase.from("vip_offers") as any).select("id, title, description, perk_type, start_time, end_time")
      .eq("place_id", place.id).eq("is_active", true).or(`end_time.is.null,end_time.gte.${now}`)
      .then(({ data }: any) => { if (data) setVipOffers(data); });
  }, [place?.id]);

  // Check-in status
  useEffect(() => {
    if (!user || !place) return;
    supabase.from("checkins").select("id").eq("user_id", user.id).eq("place_id", place.id).gte("expires_at", new Date().toISOString()).limit(1)
      .then(({ data }) => { if (data && data.length > 0) setCheckedIn(true); });
  }, [user, place]);

  const handleCheckin = async () => {
    if (!user || !place) { toast.error("Connecte-toi d'abord"); return; }
    setCheckingIn(true);
    const { error } = await supabase.from("checkins").insert({ user_id: user.id, place_id: place.id });
    if (error) toast.error("Erreur check-in");
    else { setCheckedIn(true); toast.success("Check-in réussi ! 📍"); }
    setCheckingIn(false);
  };

  const handleShare = async () => {
    if (!place) return;
    const url = `${window.location.origin}/venue/${place.slug || place.id}`;
    const text = `${place.name} sur Weshkech 🔥`;
    if (navigator.share) {
      try { await navigator.share({ title: place.name, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!place) return null;

  const isPartner = place.is_partner;
  const hasOffer = place.has_active_offer;
  // For gallery: use vibe images as hero if place only has a logo, exclude logo from gallery
  const heroImages = isLogoOnly
    ? vibeImages.slice(0, 8)
    : [...(place.image_url ? [place.image_url] : []), ...vibeImages.filter(img => img !== place.image_url)].slice(0, 8);
  const allImages = heroImages;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      {/* Hero */}
      <div className="relative h-80 overflow-hidden">
        {allImages.length > 0 ? (
          <>
            <AnimatePresence mode="wait">
              <motion.img key={galleryIndex} src={allImages[galleryIndex]} alt={place.name}
                className="w-full h-full object-cover" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-black/20" />
            {allImages.length > 1 && (
              <>
                <button onClick={() => setGalleryIndex(i => (i - 1 + allImages.length) % allImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/40 backdrop-blur-xl flex items-center justify-center text-foreground hover:bg-background/60 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setGalleryIndex(i => (i + 1) % allImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/40 backdrop-blur-xl flex items-center justify-center text-foreground hover:bg-background/60 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <button key={i} onClick={() => setGalleryIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === galleryIndex ? "w-6 bg-gold" : "w-1.5 bg-foreground/40"}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/20 via-background to-background flex flex-col items-center justify-center gap-3">
            {isLogoOnly && place.image_url ? (
              <img src={place.image_url} alt={place.name} className="w-24 h-24 object-contain rounded-2xl" />
            ) : (
              <Building2 className="w-16 h-16 text-muted-foreground/20" />
            )}
          </div>
        )}

        {/* Logo overlay if we have hero images AND a logo */}
        {isLogoOnly && place.image_url && allImages.length > 0 && (
          <div className="absolute bottom-20 left-5 w-16 h-16 rounded-2xl bg-card border-2 border-border shadow-xl overflow-hidden">
            <img src={place.image_url} alt="" className="w-full h-full object-contain p-1.5" />
          </div>
        )}

        {/* Nav */}
        <div className="absolute top-12 left-4 right-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-background/40 backdrop-blur-xl flex items-center justify-center hover:bg-background/60 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <button onClick={handleShare} className="w-10 h-10 rounded-full bg-background/40 backdrop-blur-xl flex items-center justify-center hover:bg-background/60 transition-colors">
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute bottom-20 right-4 flex flex-col items-end gap-1.5">
          {isPartner && (
            <div className="flex items-center gap-1.5 bg-gold/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <span className="text-xs">⭐</span>
              <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-wider">Partenaire</span>
            </div>
          )}
          {hasOffer && (
            <div className="flex items-center gap-1.5 bg-destructive/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              <span className="text-xs">🔥</span>
              <span className="text-[10px] font-bold text-destructive-foreground uppercase tracking-wider">Offre ce soir</span>
            </div>
          )}
        </div>

        {/* Viewer count */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-background/40 backdrop-blur-xl px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] text-foreground font-medium">{viewerCount} en ligne</span>
        </div>
      </div>

      {/* Main content */}
      <div className="px-5 -mt-10 relative z-10 space-y-4">
        {/* Title card */}
        <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border p-5 shadow-2xl shadow-background/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-bold text-foreground leading-tight">{place.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {place.category && (
                  <span className="inline-flex items-center gap-1 bg-gold/10 px-2.5 py-0.5 rounded-full">
                    <Tag className="w-3 h-3 text-gold" />
                    <span className="text-[11px] text-gold font-semibold uppercase tracking-wider">{place.category}</span>
                  </span>
                )}
                {place.neighborhood && <span className="text-[11px] text-muted-foreground">📍 {place.neighborhood}</span>}
              </div>
            </div>
            {place.rating && (
              <div className="flex items-center gap-1 bg-gold/15 px-3 py-2 rounded-xl shrink-0">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="text-base font-bold text-gold">{place.rating}</span>
              </div>
            )}
          </div>

          {place.description && <p className="text-sm text-muted-foreground leading-relaxed mt-3">{place.description}</p>}

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-gold/20 text-primary-foreground"
              style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light)))" }}>
              <Navigation className="w-4 h-4" /> J'y vais
            </a>
            <button onClick={handleCheckin} disabled={checkedIn || checkingIn}
              className={`px-5 flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] border ${
                checkedIn ? "bg-accent border-accent text-accent-foreground" : "bg-card border-border text-foreground hover:border-gold/40"
              }`}>
              <MapPin className="w-4 h-4" />
              {checkedIn ? "✓ Ici" : "Check-in"}
            </button>
          </div>
        </div>

        {/* VIP Offers */}
        {isPartner && vipOffers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <Gift className="w-4 h-4 text-gold" /> Offres VIP du moment
            </h2>
            {vipOffers.map((vip: any) => {
              const perkEmoji = vip.perk_type === "drink" ? "🍸" : vip.perk_type === "food" ? "🍽️" : vip.perk_type === "entry" ? "🎫" : "🎁";
              return (
                <div key={vip.id} className="bg-gold/10 border border-gold/25 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{perkEmoji}</span>
                    <span className="text-sm font-bold text-gold">{vip.title}</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{vip.description}</p>
                  {vip.end_time && (
                    <p className="text-[10px] text-muted-foreground">
                      Valable jusqu'à {new Date(vip.end_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                  {isVip && (
                    <Link to={`/go/${place.slug}`}
                      className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold mt-1">
                      <QrCode className="w-3.5 h-3.5" /> Obtenir mon pass
                    </Link>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Partner offers */}
        {offers.length > 0 && (
          <div className="space-y-2">
            {offers.map(offer => <PartnerOfferCard key={offer.id} offer={offer} isVip={isVip} />)}
          </div>
        )}

        {/* Use pass button */}
        {isPartner && hasOffer && (
          <button onClick={() => setDealOpen(true)}
            className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-2xl transition-colors border bg-gold hover:bg-gold-light text-primary-foreground border-gold/30 shadow-lg shadow-gold/20">
            <Zap className="w-4 h-4" /> Utiliser mon pass
          </button>
        )}

        {/* Info section */}
        {(place.opening_hours || place.price_range || place.music_style || place.dress_code) && (
          <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border p-5 space-y-3">
            <h2 className="font-display text-sm font-semibold text-foreground">Infos pratiques</h2>
            <div className="grid grid-cols-2 gap-4">
              {place.opening_hours && (
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Horaires</span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{place.opening_hours}</p>
                </div>
              )}
              {place.price_range && (
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-gold" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Prix</span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{place.price_range}</p>
                </div>
              )}
              {place.music_style && (
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-gold" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Musique</span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{place.music_style}</p>
                </div>
              )}
              {place.dress_code && (
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5 text-gold" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Dress code</span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{place.dress_code}</p>
                </div>
              )}
            </div>
            {place.address && (
              <div className="flex items-center gap-2 text-muted-foreground pt-2 border-t border-border">
                <MapPin className="w-3.5 h-3.5 text-gold/60 shrink-0" />
                <span className="text-xs">{place.address}</span>
              </div>
            )}
          </div>
        )}

        {/* Mini map CTA */}
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 bg-card/95 backdrop-blur-xl rounded-2xl border border-border p-4 hover:border-gold/30 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors">Itinéraire</p>
            <p className="text-[11px] text-muted-foreground">Ouvrir dans Google Maps</p>
          </div>
          <ChevronR className="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors" />
        </a>

        {/* User vibes */}
        {userVibes.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" /> Vibes récentes ({userVibes.length})
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {userVibes.map((v: any) => (
                <Link key={v.id} to={`/vibe/${v.id}`} className="relative aspect-square rounded-xl overflow-hidden bg-surface">
                  {v.media_type === "video" ? (
                    <video src={v.image_url} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={v.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-1.5">
                    <p className="text-[9px] text-foreground font-medium truncate">{v.username || v.caption || ""}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA for non-partners */}
        {!isPartner && (
          <Link to="/business" className="flex items-center gap-2.5 bg-card border border-border hover:border-gold/30 rounded-xl px-4 py-3 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors">Tu gères cet établissement ?</p>
              <p className="text-[10px] text-muted-foreground">Rejoins Weshkech Partners</p>
            </div>
            <ChevronR className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
          </Link>
        )}
      </div>

      <DealTunnel open={dealOpen} onOpenChange={setDealOpen} placeName={place.name} />
    </div>
  );
}
