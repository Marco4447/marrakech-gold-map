import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { X, ArrowRight, ShieldQuestion } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";

export default function PaymentCanceled() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type"); // "credits" or "vip"
  const isVip = type === "vip";

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-muted/10 blur-[120px]" />
      </div>

      {/* Cancel icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-muted/20 border-2 border-border flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          >
            <X className="w-10 h-10 text-muted-foreground" strokeWidth={2.5} />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-center space-y-3 relative z-10"
      >
        <h1 className="font-display text-3xl font-black text-foreground">
          Paiement annulé
        </h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
          {isVip
            ? "Pas de souci ! Ton Insider Pass t'attend quand tu seras prêt."
            : "Aucun montant n'a été débité. Tu peux réessayer à tout moment."}
        </p>
      </motion.div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-8 w-full max-w-sm"
      >
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center flex-shrink-0">
            <ShieldQuestion className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Un problème ? Contacte-nous sur WhatsApp et on t'aide en quelques minutes.
          </p>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 w-full max-w-sm space-y-3"
      >
        <button
          onClick={() => navigate(isVip ? "/vip-pass" : "/shop")}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
        >
          {isVip ? "Revoir l'Insider Pass" : "Retour à la boutique"}
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
