import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Star, Crown, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CREDIT_PACKS = [
  {
    id: "price_1T6QadJ8RyilXHbfjF49QgrT",
    name: "Starter",
    credits: 5,
    price: "9,90 €",
    icon: Zap,
    color: "hsl(200,60%,50%)",
    popular: false,
  },
  {
    id: "price_1T6QbfJ8RyilXHbfwFp0DNVJ",
    name: "Pro",
    credits: 15,
    price: "19,90 €",
    icon: Star,
    color: "hsl(43,76%,52%)",
    popular: true,
  },
  {
    id: "price_1T6QdDJ8RyilXHbfcrJHkLtG",
    name: "Business",
    credits: 40,
    price: "39,90 €",
    icon: Crown,
    color: "hsl(280,60%,55%)",
    popular: false,
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
    if (!user) return;
    const fetchCredits = async () => {
      const { data } = await supabase
        .from("partner_credits")
        .select("credits")
        .eq("user_id", user.id)
        .single();
      setCredits(data?.credits ?? 0);
      setLoading(false);
    };
    fetchCredits();
  }, [user]);

  // Handle success redirect - add credits locally
  useEffect(() => {
    if (success && creditsAdded) {
      toast.success(`${creditsAdded} crédits ajoutés à votre compte !`);
      // Refetch credits
      if (user) {
        supabase
          .from("partner_credits")
          .select("credits")
          .eq("user_id", user.id)
          .single()
          .then(({ data }) => setCredits(data?.credits ?? 0));
      }
    }
  }, [success, creditsAdded, user]);

  const handlePurchase = async (priceId: string) => {
    if (!user) {
      toast.error("Connectez-vous pour acheter des crédits");
      return;
    }
    setLoadingPack(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { priceId },
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
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold">
              <span className="text-gold">Crédits</span>
              <span className="text-foreground"> Vibe</span>
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Promouvez vos vibes en tant que Vibe Officielle ⭐
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Success banner */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-6 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Paiement réussi !</p>
              <p className="text-xs text-muted-foreground">{creditsAdded} crédits ajoutés à votre compte.</p>
            </div>
          </motion.div>
        )}

        {/* Current balance */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Votre solde</p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gold" />
            ) : (
              <>
                <span className="text-4xl font-display font-bold text-gold">{credits}</span>
                <span className="text-sm text-muted-foreground">crédits disponibles</span>
              </>
            )}
          </div>
        </div>

        {/* Packs */}
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">
          Choisir un pack
        </p>
        <div className="space-y-3">
          {CREDIT_PACKS.map((pack, i) => {
            const Icon = pack.icon;
            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={!!loadingPack}
                  className={`w-full relative bg-card border rounded-2xl p-5 text-left transition-all active:scale-[0.98] ${
                    pack.popular
                      ? "border-gold/50 shadow-lg shadow-gold/10"
                      : "border-border hover:border-gold/30"
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-2.5 right-4 bg-gold text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Populaire
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `${pack.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: pack.color }} />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground">{pack.name}</p>
                        <p className="text-sm text-muted-foreground">{pack.credits} crédits vibe</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {loadingPack === pack.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gold" />
                      ) : (
                        <span className="text-lg font-bold text-foreground">{pack.price}</span>
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-6 bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            ⭐ Les <strong>Vibes Officielles</strong> sont épinglées en haut du flux Live, visibles sur toute la ville, et ne sont pas soumises à la limite de 6h. 1 vibe officielle = 1 crédit.
          </p>
        </div>
      </div>
    </div>
  );
}
