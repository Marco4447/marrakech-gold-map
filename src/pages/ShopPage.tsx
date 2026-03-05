import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Flame, Check, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import LanguageToggle from "@/components/LanguageToggle";

import { Crown } from "lucide-react";

const CREDIT_PACKS = [
  {
    id: "price_1T6lm6J8RyilXHbfYe1I2cPh",
    priceId: "price_1T6lm6J8RyilXHbfYe1I2cPh",
    name: "Pulse Pack",
    credits: 1,
    price: "9,90 €",
    unitPrice: "9,90 €/crédit",
    icon: Zap,
    popular: false,
    badge: null,
  },
  {
    id: "price_1T6lmfJ8RyilXHbf7enV2Cxn",
    priceId: "price_1T6lmfJ8RyilXHbf7enV2Cxn",
    name: "Resonance Pack",
    credits: 5,
    price: "39,90 €",
    unitPrice: "7,98 €/crédit",
    icon: Flame,
    popular: true,
    badge: "Best Value",
  },
  {
    id: "price_1T7jDDJ8RyilXHbfdeswNi24",
    priceId: "price_1T7jDDJ8RyilXHbfdeswNi24",
    name: "Empire Pack",
    credits: 20,
    price: "129 €",
    unitPrice: "6,45 €/crédit",
    icon: Crown,
    popular: false,
    badge: "Volume Pro",
  },
];

export default function ShopPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const success = searchParams.get("success") === "true";
  const creditsAdded = searchParams.get("credits");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchCredits = async () => {
      const { data } = await supabase
        .from("partner_credits")
        .select("credits")
        .eq("user_id", user.id)
        .maybeSingle();
      setCredits(data?.credits ?? 0);
      setLoading(false);
    };
    fetchCredits();
  }, [user]);

  useEffect(() => {
    if (success && creditsAdded) {
      toast.success(`${creditsAdded} crédit${Number(creditsAdded) > 1 ? "s" : ""} ajouté${Number(creditsAdded) > 1 ? "s" : ""} !`);
      if (user) {
        supabase
          .from("partner_credits")
          .select("credits")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data }) => setCredits(data?.credits ?? 0));
      }
    }
  }, [success, creditsAdded, user]);

  const handlePurchase = async (pack: typeof CREDIT_PACKS[0]) => {
    if (!user) {
      toast.error("Connecte-toi pour acheter des crédits");
      return;
    }
    setLoadingPack(pack.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId: pack.priceId,
          productType: "b2b_credits",
          creditAmount: pack.credits,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Erreur lors de la création du paiement");
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold">
              <span className="text-gold">Vibe</span>
              <span className="text-foreground"> Credits</span>
            </h1>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Publie des Vibes Officielles sur la map ⚡
            </p>
          </div>
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Success banner */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gold/10 border border-gold/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Paiement réussi !</p>
              <p className="text-xs text-muted-foreground">{creditsAdded} crédit{Number(creditsAdded) > 1 ? "s" : ""} ajouté{Number(creditsAdded) > 1 ? "s" : ""}.</p>
            </div>
          </motion.div>
        )}

        {/* Balance card */}
        <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-card/80 backdrop-blur-xl p-5">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gold/10 blur-2xl" />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Solde actuel</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gold" />
              ) : (
                <>
                  <span className="text-4xl font-display font-black text-gold tabular-nums">{credits}</span>
                  <Zap className="w-5 h-5 text-gold" />
                  <span className="text-sm text-muted-foreground ml-1">crédits</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Packs */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
            Choisir un pack
          </p>
          <div className="space-y-3">
            {CREDIT_PACKS.map((pack, i) => {
              const Icon = pack.icon;
              const isLoading = loadingPack === pack.id;
              return (
                <motion.button
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePurchase(pack)}
                  disabled={!!loadingPack}
                  className={`w-full relative rounded-2xl p-5 text-left transition-all ${
                    pack.popular
                      ? "bg-card/90 backdrop-blur-xl border-2 border-gold/40 shadow-[0_0_30px_hsl(var(--gold)/0.08)]"
                      : "bg-card border border-border hover:border-gold/30"
                  }`}
                >
                  {pack.badge && (
                    <div className="absolute -top-2.5 right-4 bg-gold text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      {pack.badge}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        pack.popular ? "bg-gold/15" : "bg-surface"
                      }`}>
                        <Icon className={`w-6 h-6 ${pack.popular ? "text-gold" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">{pack.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {pack.credits} crédit{pack.credits > 1 ? "s" : ""} · {pack.unitPrice}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gold" />
                      ) : (
                        <span className="text-lg font-black text-foreground">{pack.price}</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <p className="text-xs font-semibold text-foreground">Comment ça marche ?</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Chaque <strong className="text-foreground">Vibe Officielle</strong> est épinglée en haut du flux Live avec le badge ⭐, visible par toute la communauté. 1 publication = 1 crédit déduit automatiquement.
          </p>
        </div>

        {/* Partner Studio link */}
        {user && credits !== null && credits > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate("/partner-dashboard")}
            className="w-full py-3 rounded-xl text-sm font-bold text-primary-foreground active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
          >
            Ouvrir le Partner Studio →
          </motion.button>
        )}
      </div>
    </div>
  );
}
