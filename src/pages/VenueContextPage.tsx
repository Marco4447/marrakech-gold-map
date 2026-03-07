import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Clock, Gift, CheckCircle2, Loader2, ArrowLeft, Sparkles, LogIn, Star } from "lucide-react";
import { toast } from "sonner";

interface VenuePlace {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  image_url: string | null;
  neighborhood: string | null;
  address: string | null;
  opening_hours: string | null;
  price_range: string | null;
  music_style: string | null;
  dress_code: string | null;
  is_partner: boolean;
  has_active_offer: boolean;
}

interface VipOffer {
  id: string;
  title: string;
  description: string;
  perk_type: string;
  start_time: string | null;
  end_time: string | null;
  max_redemptions: number | null;
  limit_per_user: number;
}

const PERK_EMOJIS: Record<string, string> = {
  drink: "🍸",
  food: "🍽️",
  entry: "🎫",
  discount: "💰",
  experience: "✨",
};

type PendingAction = { type: "checkin" } | { type: "claim"; offerId: string };

export default function VenueContextPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [place, setPlace] = useState<VenuePlace | null>(null);
  const [offers, setOffers] = useState<VipOffer[]>([]);
  const [checkinCount, setCheckinCount] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const pendingActionRef = useRef<PendingAction | null>(null);

  // Persist pending action across auth redirects
  useEffect(() => {
    const stored = sessionStorage.getItem("wk_venue_pending");
    if (stored) {
      try {
        pendingActionRef.current = JSON.parse(stored);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!slug) { navigate("/"); return; }
    const load = async () => {
      const { data: p } = await (supabase
        .from("places") as any)
        .select("id, name, category, description, image_url, neighborhood, address, opening_hours, price_range, music_style, dress_code, is_partner, has_active_offer")
        .eq("slug", slug)
        .maybeSingle();

      if (!p) { navigate("/"); return; }
      setPlace(p as any);

      // Record QR scan
      await (supabase.from("qr_scans" as any) as any).insert({ place_id: p.id, user_id: user?.id || null });

      // Fetch active offers
      const { data: offersData } = await (supabase
        .from("vip_offers" as any) as any)
        .select("id, title, description, perk_type, start_time, end_time, max_redemptions, limit_per_user")
        .eq("place_id", p.id)
        .eq("is_active", true);
      
      const activeOffers = (offersData || []).filter((o: any) => {
        if (o.end_time && new Date(o.end_time) < new Date()) return false;
        if (o.start_time && new Date(o.start_time) > new Date()) return false;
        return true;
      });
      setOffers(activeOffers as VipOffer[]);

      // Check-in count (last 3h)
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const { count } = await (supabase
        .from("checkins" as any) as any)
        .select("id", { count: "exact", head: true })
        .eq("place_id", p.id)
        .gte("created_at", threeHoursAgo);
      setCheckinCount(count ?? 0);

      // Check if user is checked in
      if (user) {
        const now = new Date().toISOString();
        const { data: existing } = await (supabase
          .from("checkins" as any) as any)
          .select("id")
          .eq("place_id", p.id)
          .eq("user_id", user.id)
          .gte("expires_at", now)
          .limit(1);
        setIsCheckedIn((existing?.length ?? 0) > 0);
      }

      setLoading(false);
    };
    load();
  }, [slug, user]);

  // Auto-complete pending action after user logs in
  useEffect(() => {
    if (!user || !place || authLoading) return;
    const pending = pendingActionRef.current;
    if (!pending) return;

    pendingActionRef.current = null;
    sessionStorage.removeItem("wk_venue_pending");
    setShowAuthPrompt(false);

    if (pending.type === "checkin") {
      doCheckin();
    } else if (pending.type === "claim") {
      const offer = offers.find((o) => o.id === pending.offerId);
      if (offer) doClaim(offer);
    }
  }, [user, place, authLoading, offers]);

  const requireAuth = (action: PendingAction) => {
    if (user) return false;
    pendingActionRef.current = action;
    sessionStorage.setItem("wk_venue_pending", JSON.stringify(action));
    setShowAuthPrompt(true);
    return true;
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(true);
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.href,
    });
    if (error) {
      console.error("OAuth error:", error);
      toast.error("Erreur de connexion");
      setOauthLoading(false);
    }
    // If redirected, page will reload with auth
  };

  const doCheckin = async () => {
    if (!user || !place) return;
    const { error } = await (supabase.from("checkins" as any) as any).insert({ user_id: user.id, place_id: place.id });
    if (error) { toast.error("Erreur"); console.error(error); return; }
    setIsCheckedIn(true);
    setCheckinCount((c) => c + 1);
    toast.success("Check-in réussi ! 🎉");
  };

  const handleCheckin = async () => {
    if (requireAuth({ type: "checkin" })) return;
    await doCheckin();
  };

  const doClaim = async (offer: VipOffer) => {
    if (!user || !place) return;
    setClaiming(offer.id);

    const { count: existingCount } = await (supabase
      .from("vip_passes" as any) as any)
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("offer_id", offer.id);

    if ((existingCount ?? 0) >= offer.limit_per_user) {
      toast.error("Tu as déjà réclamé cette offre");
      setClaiming(null);
      return;
    }

    const expiresAt = offer.end_time || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const { data: pass, error } = await (supabase
      .from("vip_passes" as any) as any)
      .insert({ user_id: user.id, offer_id: offer.id, expires_at: expiresAt })
      .select("id")
      .single();

    if (error || !pass) {
      toast.error("Erreur lors de la génération du pass");
      console.error(error);
      setClaiming(null);
      return;
    }

    setClaiming(null);
    navigate(`/pass/${(pass as any).id}`);
  };

  const handleClaim = async (offer: VipOffer) => {
    if (requireAuth({ type: "claim", offerId: offer.id })) return;
    await doClaim(offer);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!place) return null;

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        {place.image_url ? (
          <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/20 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <button onClick={() => navigate("/")}
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="absolute bottom-4 left-5 right-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs text-gold font-semibold uppercase tracking-wider mb-1">📍 Tu es à</p>
            <h1 className="font-display text-2xl font-black text-foreground">{place.name}</h1>
            {place.neighborhood && (
              <p className="text-sm text-muted-foreground mt-0.5">{place.neighborhood}</p>
            )}
          </motion.div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Live stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex gap-3">
          <div className="flex-1 bg-card/80 border border-border rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-gold mx-auto mb-1" />
            <p className="text-lg font-black text-foreground">{checkinCount}</p>
            <p className="text-[10px] text-muted-foreground">Ici maintenant</p>
          </div>
          <div className="flex-1 bg-card/80 border border-border rounded-xl p-3 text-center">
            <Gift className="w-4 h-4 text-gold mx-auto mb-1" />
            <p className="text-lg font-black text-foreground">{offers.length}</p>
            <p className="text-[10px] text-muted-foreground">Offres actives</p>
          </div>
          {place.category && (
            <div className="flex-1 bg-card/80 border border-border rounded-xl p-3 text-center">
              <Sparkles className="w-4 h-4 text-gold mx-auto mb-1" />
              <p className="text-sm font-bold text-foreground capitalize">{place.category}</p>
              <p className="text-[10px] text-muted-foreground">Catégorie</p>
            </div>
          )}
        </motion.div>

        {/* Check-in button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="space-y-2">
          <button
            onClick={handleCheckin}
            disabled={isCheckedIn}
            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isCheckedIn
                ? "bg-green-500/15 border border-green-500/30 text-green-400"
                : "bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25"
            }`}
          >
            {isCheckedIn ? (
              <><CheckCircle2 className="w-4 h-4" /> Tu es ici · {checkinCount} {checkinCount > 1 ? "personnes" : "personne"} présente{checkinCount > 1 ? "s" : ""}</>
            ) : (
              <><MapPin className="w-4 h-4" /> Check-in ici</>
            )}
          </button>
          {!isCheckedIn && (
            <p className="text-[11px] text-muted-foreground text-center">
              🔓 Check-in pour débloquer les offres VIP de ce lieu
            </p>
          )}
        </motion.div>

        {/* Inline Auth Prompt */}
        <AnimatePresence>
          {showAuthPrompt && !user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card/90 border border-gold/30 rounded-2xl p-5 space-y-4">
                <div className="text-center">
                  <LogIn className="w-8 h-8 text-gold mx-auto mb-2" />
                  <h3 className="font-display text-base font-bold text-foreground">
                    Connecte-toi pour continuer
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Crée ton compte en 2 secondes pour profiter de {place.name}
                  </p>
                </div>

                {/* Google OAuth */}
                <button
                  onClick={() => handleOAuth("google")}
                  disabled={oauthLoading}
                  className="w-full flex items-center justify-center gap-3 bg-gold hover:bg-gold-light text-primary-foreground font-semibold py-3.5 rounded-2xl transition-all shadow-[0_0_20px_hsl(43,76%,52%,0.2)] disabled:opacity-70 text-sm"
                >
                  {oauthLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continuer avec Google
                    </>
                  )}
                </button>

                {/* Apple OAuth */}
                <button
                  onClick={() => handleOAuth("apple")}
                  disabled={oauthLoading}
                  className="w-full flex items-center justify-center gap-3 bg-foreground text-background font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-70 text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Continuer avec Apple
                </button>

                <button
                  onClick={() => setShowAuthPrompt(false)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Description */}
        {place.description && (
          <p className="text-sm text-muted-foreground">{place.description}</p>
        )}

        {/* Venue details */}
        {(place.opening_hours || place.price_range || place.music_style || place.dress_code) && (
          <div className="grid grid-cols-2 gap-2">
            {place.opening_hours && (
              <div className="bg-card/60 border border-border rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground">Horaires</p>
                <p className="text-xs font-semibold text-foreground">{place.opening_hours}</p>
              </div>
            )}
            {place.price_range && (
              <div className="bg-card/60 border border-border rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground">Prix</p>
                <p className="text-xs font-semibold text-foreground">{place.price_range}</p>
              </div>
            )}
            {place.music_style && (
              <div className="bg-card/60 border border-border rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground">Musique</p>
                <p className="text-xs font-semibold text-foreground">{place.music_style}</p>
              </div>
            )}
            {place.dress_code && (
              <div className="bg-card/60 border border-border rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground">Dress code</p>
                <p className="text-xs font-semibold text-foreground">{place.dress_code}</p>
              </div>
            )}
          </div>
        )}

        {/* VIP Offers */}
        {offers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="space-y-3">
            <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Gift className="w-4 h-4 text-gold" /> Offres VIP ce soir
            </h2>
            {offers.map((offer) => (
              <div key={offer.id} className="bg-card/80 border border-gold/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{PERK_EMOJIS[offer.perk_type] || "🎁"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-bold text-foreground">{offer.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{offer.description}</p>
                    {offer.end_time && (
                      <p className="text-[10px] text-gold mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Valide jusqu'à {new Date(offer.end_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleClaim(offer)}
                  disabled={claiming === offer.id}
                  className="w-full py-3 rounded-xl text-sm font-bold text-primary-foreground active:scale-[0.98] transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
                >
                  {claiming === offer.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "🎟️ Réclamer mon pass VIP"
                  )}
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {offers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Pas d'offres VIP pour le moment</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Reviens ce soir !</p>
          </div>
        )}
      </div>
    </div>
  );
}
