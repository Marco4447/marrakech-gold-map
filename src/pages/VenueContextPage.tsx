import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Clock, Gift, CheckCircle2, Loader2, ArrowLeft, Sparkles } from "lucide-react";
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

export default function VenueContextPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [place, setPlace] = useState<VenuePlace | null>(null);
  const [offers, setOffers] = useState<VipOffer[]>([]);
  const [checkinCount, setCheckinCount] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { navigate("/"); return; }
    const load = async () => {
      const { data: p } = await supabase
        .from("places")
        .select("id, name, category, description, image_url, neighborhood, address, opening_hours, price_range, music_style, dress_code, is_partner, has_active_offer")
        .eq("slug" as any, slug)
        .maybeSingle();

      if (!p) { navigate("/"); return; }
      setPlace(p as any);

      // Record QR scan
      await supabase.from("qr_scans" as any).insert({ place_id: p.id, user_id: user?.id || null });

      // Fetch active offers
      const now = new Date().toISOString();
      const { data: offersData } = await supabase
        .from("vip_offers" as any)
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
      const { count } = await supabase
        .from("checkins" as any)
        .select("id", { count: "exact", head: true })
        .eq("place_id", p.id)
        .gte("created_at", threeHoursAgo);
      setCheckinCount(count ?? 0);

      // Check if user is checked in
      if (user) {
        const { data: existing } = await supabase
          .from("checkins" as any)
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

  const handleCheckin = async () => {
    if (!user) { toast.error("Connecte-toi pour faire un check-in"); return; }
    if (!place) return;
    const { error } = await supabase.from("checkins" as any).insert({ user_id: user.id, place_id: place.id });
    if (error) { toast.error("Erreur"); console.error(error); return; }
    setIsCheckedIn(true);
    setCheckinCount((c) => c + 1);
    toast.success("Check-in réussi ! 🎉");
  };

  const handleClaim = async (offer: VipOffer) => {
    if (!user) { toast.error("Connecte-toi pour réclamer cette offre"); return; }
    if (!place) return;
    setClaiming(offer.id);

    // Check limit per user
    const { count: existingCount } = await supabase
      .from("vip_passes" as any)
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("offer_id", offer.id);

    if ((existingCount ?? 0) >= offer.limit_per_user) {
      toast.error("Tu as déjà réclamé cette offre");
      setClaiming(null);
      return;
    }

    // Generate pass
    const expiresAt = offer.end_time || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const { data: pass, error } = await supabase
      .from("vip_passes" as any)
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
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onClick={handleCheckin}
          disabled={isCheckedIn}
          className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            isCheckedIn
              ? "bg-green-500/15 border border-green-500/30 text-green-400"
              : "bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25"
          }`}
        >
          {isCheckedIn ? (
            <><CheckCircle2 className="w-4 h-4" /> Checked-in ✓</>
          ) : (
            <><MapPin className="w-4 h-4" /> Check-in ici</>
          )}
        </motion.button>

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
