import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Flame, Check, Loader2, Sparkles, Crown, Star, Eye, MapPin, Clock, TrendingUp, Users, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import LanguageToggle from "@/components/LanguageToggle";

const CREDIT_PACKS = [
  {
    id: "price_1T6lm6J8RyilXHbfYe1I2cPh",
    priceId: "price_1T6lm6J8RyilXHbfYe1I2cPh",
    name: "Starter",
    subtitle: "Testez l'impact",
    credits: 1,
    price: "9,90 €",
    unitPrice: "9,90 €",
    icon: Zap,
    popular: false,
    badge: null,
    benefit: "Idéal pour une soirée spéciale ou un premier test",
  },
  {
    id: "price_1T6lmfJ8RyilXHbf7enV2Cxn",
    priceId: "price_1T6lmfJ8RyilXHbf7enV2Cxn",
    name: "Business",
    subtitle: "1 pub/semaine pendant 1 mois",
    credits: 5,
    price: "39,90 €",
    unitPrice: "7,98 €",
    icon: Flame,
    popular: true,
    badge: "Recommandé",
    saving: "-20%",
    benefit: "Le rythme parfait pour rester visible chaque semaine",
  },
  {
    id: "price_1T7jDDJ8RyilXHbfdeswNi24",
    priceId: "price_1T7jDDJ8RyilXHbfdeswNi24",
    name: "Empire",
    subtitle: "Dominez votre quartier",
    credits: 20,
    price: "129 €",
    unitPrice: "6,45 €",
    icon: Crown,
    popular: false,
    badge: "-35%",
    benefit: "Pour les établissements qui veulent être incontournables",
  },
];

const WHAT_YOU_GET = [
  { icon: Star, text: "Badge ⭐ Officiel sur votre publication", highlight: true },
  { icon: TrendingUp, text: "Épinglé en haut du feed pendant 6h" },
  { icon: MapPin, text: "Visible sur la carte interactive par tous les utilisateurs" },
  { icon: Eye, text: "En moyenne 150+ vues par publication" },
  { icon: Users, text: "Touchez touristes et locaux en temps réel" },
  { icon: Clock, text: "Publication en 30 secondes depuis votre dashboard" },
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
            <h1 className="font-display text-xl font-bold text-foreground">
              Boostez votre visibilité
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Attirez plus de clients ce soir ⚡
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

        {/* Hero value prop */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/8 via-card to-card p-5"
        >
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative space-y-3">
            <h2 className="text-base font-bold text-foreground leading-snug">
              1 crédit = 1 publication visible par <span className="text-gold">toute la communauté</span>
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Publiez une photo ou vidéo de votre établissement. Elle apparaît en <strong className="text-foreground">priorité dans le feed</strong> et sur <strong className="text-foreground">la carte interactive</strong>, avec le badge officiel ⭐ pendant 6 heures.
            </p>
          </div>
        </motion.div>

        {/* What 1 credit gives you */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gold font-semibold mb-3">
            Ce que vous obtenez par publication
          </p>
          <div className="grid grid-cols-1 gap-2">
            {WHAT_YOU_GET.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${
                    item.highlight
                      ? "border-gold/30 bg-gold/5"
                      : "border-border/50 bg-card/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.highlight ? "text-gold" : "text-muted-foreground"}`} />
                  <p className={`text-xs ${item.highlight ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                    {item.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Balance card */}
        {user && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" />
              <span className="text-xs text-muted-foreground">Votre solde</span>
            </div>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gold" />
            ) : (
              <span className="text-sm font-bold text-gold tabular-nums">{credits} crédit{(credits ?? 0) > 1 ? "s" : ""}</span>
            )}
          </div>
        )}

        {/* Packs */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
            Choisissez votre formule
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
                  transition={{ delay: i * 0.08 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePurchase(pack)}
                  disabled={!!loadingPack}
                  className={`w-full relative rounded-2xl text-left transition-all ${
                    pack.popular
                      ? "bg-card/90 backdrop-blur-xl border-2 border-gold/40 shadow-[0_0_30px_hsl(var(--gold)/0.08)] p-5"
                      : "bg-card border border-border hover:border-gold/30 p-5"
                  }`}
                >
                  {pack.badge && (
                    <div className={`absolute -top-2.5 right-4 text-2xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                      pack.popular
                        ? "bg-gold text-primary-foreground"
                        : "bg-accent/80 text-accent-foreground"
                    }`}>
                      {pack.badge}
                    </div>
                  )}

                  <div className="flex items-start gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      pack.popular ? "bg-gold/15" : "bg-surface"
                    }`}>
                      <Icon className={`w-5 h-5 ${pack.popular ? "text-gold" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <p className="text-base font-bold text-foreground">{pack.name}</p>
                        <div className="text-right">
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gold" />
                          ) : (
                            <span className="text-lg font-black text-foreground">{pack.price}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gold font-medium mt-0.5">{pack.subtitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pack.credits} publication{pack.credits > 1 ? "s" : ""} · {pack.unitPrice}/pub
                      </p>
                      <p className="text-2xs text-muted-foreground/70 mt-1.5 italic">
                        {pack.benefit}
                      </p>
                    </div>
                  </div>

                  {pack.popular && (
                    <div className="mt-3 pt-3 border-t border-gold/10 flex items-center justify-center gap-1.5 text-gold">
                      <span className="text-xs font-semibold">Acheter maintenant</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 rounded-xl bg-card/50 border border-border/50 px-4 py-3"
        >
          <div className="flex -space-x-2">
            {["🏨", "🍸", "🎵"].map((e, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-gold/10 border-2 border-background flex items-center justify-center text-xs">
                {e}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">+15 établissements</strong> utilisent les Vibes pour attirer des clients
          </p>
        </motion.div>

        {/* FAQ */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Questions fréquentes
          </p>
          {[
            { q: "Combien de temps ma publication est-elle visible ?", a: "6 heures avec le badge officiel ⭐, puis elle reste dans le feed normal." },
            { q: "Mes crédits expirent-ils ?", a: "Non, vos crédits n'expirent jamais. Utilisez-les quand vous voulez." },
            { q: "Comment publier ?", a: "Depuis votre Partner Studio, cliquez sur « Publier une Vibe » et choisissez une photo ou vidéo." },
          ].map((faq, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card/30 p-3.5">
              <p className="text-xs font-semibold text-foreground">{faq.q}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{faq.a}</p>
            </div>
          ))}
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
            Publier depuis le Partner Studio →
          </motion.button>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
