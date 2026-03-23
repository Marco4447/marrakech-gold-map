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
import { usePageMeta } from "@/hooks/usePageMeta";
import DealTunnel from "@/components/DealTunnel";
import PremiumLock from "@/components/PremiumLock";
import PartnerOfferCard from "@/components/PartnerOfferCard";
import FomoCountdown from "@/components/FomoCountdown";
import ShareOfferCTA from "@/components/ShareOfferCTA";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getMayorOfPlace, type MayorInfo } from "@/lib/mayorSystem";
import PlaceEnergyScore from "@/components/place/PlaceEnergyScore";
import PlaceHourlyPattern from "@/components/place/PlaceHourlyPattern";
import PartyGroups from "@/components/PartyGroups";

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
  is_founder: boolean;
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
    const fetchCount = async () => {
      try {
        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: c } = await supabase
          .from("venue_analytics")
          .select("id", { count: "exact", head: true })
          .eq("place_id", placeId)
          .gte("created_at", since);
        setCount(c ?? 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [placeId]);
  return count;
}

export default function VenuePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const [place, setPlace] = useState<PlaceData | null>(null);
  const [loading, setLoading] = useState(true);

  usePageMeta({
    title: place ? `${place.name} — ${place.category || "Venue"}` : "Venue",
    description: place ? `${place.name} à ${place.neighborhood || "Marrakech"}. ${place.description?.slice(0, 120) || "Découvre ce lieu sur Weshkech."}` : undefined,
    image: place?.image_url || undefined,
    url: slug ? `https://weshkech.com/venue/${slug}` : undefined,
  });
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isVip, setIsVip] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [vipOffers, setVipOffers] = useState<any[]>([]);
  const [dealOpen, setDealOpen] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [mayor, setMayor] = useState<MayorInfo | null>(null);

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

  // Fetch Mayor
  useEffect(() => {
    if (!place) return;
    getMayorOfPlace(place.name).then(setMayor).catch(() => {});
  }, [place?.name]);

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
          {(place as any).is_founder && (
            <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-gold/40">
              <span className="text-xs">🛡️</span>
              <span className="text-2xs font-bold text-gold uppercase tracking-wider">Fondateur</span>
            </div>
          )}
          {isPartner && (
            <div className="flex items-center gap-1.5 bg-gold/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <span className="text-xs">⭐</span>
              <span className="text-2xs font-bold text-primary-foreground uppercase tracking-wider">Partenaire</span>
            </div>
          )}
          {place.listing_tier === "featured" && (
            <div className="flex items-center gap-1.5 bg-accent/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <span className="text-xs">⚡</span>
              <span className="text-2xs font-bold text-accent-foreground uppercase tracking-wider">Featured</span>
            </div>
          )}
          {hasOffer && (
            <div className="flex items-center gap-1.5 bg-destructive/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              <span className="text-xs">🔥</span>
              <span className="text-2xs font-bold text-destructive-foreground uppercase tracking-wider">Offre ce soir</span>
            </div>
          )}
        </div>

        {/* Viewer count — only show if > 0 */}
        {viewerCount > 0 && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-background/40 backdrop-blur-xl px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs text-foreground font-medium">{viewerCount} en ligne</span>
          </div>
        )}
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
                    <span className="text-xs text-gold font-semibold uppercase tracking-wider">{place.category}</span>
                  </span>
                )}
                {place.neighborhood && <span className="text-xs text-muted-foreground">📍 {place.neighborhood}</span>}
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

        {/* Mayor of the spot */}
        {mayor && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
              user?.id === mayor.userId
                ? "bg-gold/10 border-gold/30 shadow-sm shadow-gold/10"
                : "bg-card/95 border-border"
            }`}
          >
            <span className="text-base">👑</span>
            <div className="flex-1 min-w-0">
              <p className="text-2xs text-gold font-bold uppercase tracking-wider">Mayor du spot</p>
              <p className="text-xs text-foreground truncate">
                {user?.id === mayor.userId
                  ? "Tu es le Mayor de ce spot !"
                  : `${mayor.fullName || "Anonyme"} · ${mayor.vibeCount} vibes ce mois`}
              </p>
            </div>
            <Avatar className="w-7 h-7 border border-gold/30 shrink-0">
              <AvatarImage src={mayor.avatarUrl || undefined} />
              <AvatarFallback className="text-2xs bg-gold/10 text-gold">
                {(mayor.fullName || "?")[0]}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        )}

        {/* Energy Score + Hourly Pattern */}
        <PlaceEnergyScore placeName={place.name} placeId={place.id} />
        <PlaceHourlyPattern placeName={place.name} />

        {/* Party Groups */}
        <PartyGroups placeId={place.id} placeName={place.name} />

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
                    <FomoCountdown endTime={vip.end_time} className="mt-1" />
                  )}
                  {/* B2C free: pass CTA disabled */}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Share CTA */}
        {isPartner && vipOffers.length > 0 && (
          <ShareOfferCTA
            placeName={place.name}
            slug={place.slug || null}
            offerTitle={vipOffers[0]?.title}
          />
        )}

        {/* Partner offers */}
        {offers.length > 0 && (
          <div className="space-y-2">
            {offers.map(offer => <PartnerOfferCard key={offer.id} offer={offer} isVip={isVip} />)}
          </div>
        )}

        {/* B2C free: pass button disabled */}

        {/* Info section */}
        {(place.opening_hours || place.price_range || place.music_style || place.dress_code) && (
          <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border p-5 space-y-3">
            <h2 className="font-display text-sm font-semibold text-foreground">Infos pratiques</h2>
            <div className="grid grid-cols-2 gap-4">
              {place.opening_hours && (
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    <span className="text-2xs text-muted-foreground uppercase tracking-wider font-medium">Horaires</span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{place.opening_hours}</p>
                </div>
              )}
              {place.price_range && (
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-gold" />
                    <span className="text-2xs text-muted-foreground uppercase tracking-wider font-medium">Prix</span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{place.price_range}</p>
                </div>
              )}
              {place.music_style && (
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-gold" />
                    <span className="text-2xs text-muted-foreground uppercase tracking-wider font-medium">Musique</span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{place.music_style}</p>
                </div>
              )}
              {place.dress_code && (
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5 text-gold" />
                    <span className="text-2xs text-muted-foreground uppercase tracking-wider font-medium">Dress code</span>
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
            {/* Menu links */}
            {((place as any).menu_url || (place as any).drinks_menu_url) && (
              <div className="space-y-2 pt-2 border-t border-border">
                {(place as any).menu_url && (
                  <a href={(place as any).menu_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:bg-muted/50 rounded-xl px-2 py-2 transition-colors group">
                    <span className="text-base">🍽️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors">Carte / Menu</p>
                      <p className="text-2xs text-muted-foreground">Plats & tarifs</p>
                    </div>
                    <ChevronR className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                  </a>
                )}
                {(place as any).drinks_menu_url && (
                  <a href={(place as any).drinks_menu_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:bg-muted/50 rounded-xl px-2 py-2 transition-colors group">
                    <span className="text-base">🍸</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors">Carte des boissons</p>
                      <p className="text-2xs text-muted-foreground">Cocktails, vins, softs</p>
                    </div>
                    <ChevronR className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                  </a>
                )}
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
            <p className="text-xs text-muted-foreground">Ouvrir dans Google Maps</p>
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
                    <p className="text-2xs text-foreground font-medium truncate">{v.username || v.caption || ""}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA for non-partners */}
        {!isPartner && (
          <Link to="/business" className="flex items-center gap-3 rounded-2xl px-5 py-4 transition-all group border-2 border-gold/30 hover:border-gold/60 shadow-lg shadow-gold/10 hover:shadow-gold/20"
            style={{ background: "linear-gradient(135deg, hsl(var(--gold) / 0.08), hsl(var(--gold) / 0.18))" }}>
            <div className="w-11 h-11 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gold">Tu gères cet établissement ?</p>
              <p className="text-xs text-foreground/70">Rejoins Weshkech Partners · Boostez votre visibilité</p>
            </div>
            <ChevronR className="w-5 h-5 text-gold" />
          </Link>
        )}
      </div>

      <DealTunnel open={dealOpen} onOpenChange={setDealOpen} placeName={place.name} />
    </div>
  );
}
