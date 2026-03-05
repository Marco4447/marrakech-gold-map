import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Zap, Crown, ArrowRight, Sparkles } from "lucide-react";
import GoldConfetti from "@/components/GoldConfetti";
import { ttqTrack } from "@/lib/ttq";
import LanguageToggle from "@/components/LanguageToggle";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showContent, setShowContent] = useState(false);

  const type = searchParams.get("type"); // "credits" or "vip"
  const credits = searchParams.get("credits");
  const isVip = type === "vip";

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 600);
    ttqTrack("CompletePayment", {
      content_name: isVip ? "insider_pass" : "credits_pack",
      value: isVip ? 4.90 : undefined,
      currency: "EUR",
    });
    // TikTok: Subscribe for VIP, PlaceAnOrder for B2B credits
    if (isVip) {
      ttqTrack("Subscribe", { content_name: "insider_pass", value: 4.90, currency: "EUR" });
    } else {
      ttqTrack("PlaceAnOrder", {
        content_name: "credits_pack",
        value: Number(credits) === 1 ? 9.90 : 39.90,
        currency: "EUR",
      });
    }
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>
      {/* Gold confetti */}
      <GoldConfetti duration={5000} />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold/8 blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-gold/5 to-transparent" />
      </div>

      {/* Success ring animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative mb-8"
      >
        {/* Outer pulse */}
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border-2 border-gold/30"
          style={{ width: 96, height: 96 }}
        />
        {/* Inner ring */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #BF953F 0%, #FCF6BA 50%, #B38728 100%)",
            boxShadow: "0 0 60px rgba(191, 149, 63, 0.4), 0 0 120px rgba(191, 149, 63, 0.15)",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          >
            <Check className="w-10 h-10 text-zinc-900" strokeWidth={3} />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3 relative z-10"
      >
        <h1 className="font-display text-3xl font-black text-foreground">
          {isVip ? "Bienvenue dans le cercle" : "Paiement confirmé"}
        </h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
          {isVip
            ? "Ton Insider Pass est activé. Profite de tes avantages VIP exclusifs dès maintenant."
            : `${credits || ""} Vibe Credit${Number(credits) > 1 ? "s" : ""} ${Number(credits) > 1 ? "ajoutés" : "ajouté"} à ton compte. Prêt à briller sur la map.`}
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 w-full max-w-sm"
      >
        <div className="rounded-2xl border border-gold/20 bg-card/80 backdrop-blur-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(191,149,63,0.2), rgba(252,246,186,0.1))" }}
            >
              {isVip ? (
                <Crown className="w-5 h-5 text-gold" />
              ) : (
                <Zap className="w-5 h-5 text-gold" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {isVip ? "Marrakech Gold · Insider Pass" : `Marrakech Gold · ${Number(credits) === 1 ? "Pulse" : "Resonance"} Pack`}
              </p>
              <p className="text-xs text-muted-foreground">
                {isVip ? "Abonnement mensuel activé" : `${credits} crédit${Number(credits) > 1 ? "s" : ""} disponible${Number(credits) > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-gold flex-shrink-0" />
            <span>
              {isVip
                ? "QR Code VIP, avantages exclusifs et accès prioritaire"
                : "Publie des Vibes Officielles épinglées en haut du flux"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={showContent ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="mt-8 w-full max-w-sm space-y-3"
      >
        <button
          onClick={() => navigate(isVip ? "/vip-pass" : "/partner-dashboard")}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
        >
          {isVip ? "Voir mon Pass VIP" : "Ouvrir le Partner Studio"}
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Retour à la map
        </button>
      </motion.div>
    </div>
  );
}
