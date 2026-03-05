import { motion } from "framer-motion";
import { Lock, Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PremiumLockProps {
  placeName?: string;
}

export default function PremiumLock({ placeName }: PremiumLockProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-10 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4 relative">
        <Lock className="w-8 h-8 text-gold" />
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
          <Crown className="w-3.5 h-3.5 text-gold" />
        </div>
      </div>

      <h3 className="font-display text-lg font-bold text-foreground mb-2">
        Spot réservé aux Insiders
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        {placeName
          ? `Débloque ${placeName} et tous les spots cachés de Marrakech avec l'Insider Pass.`
          : "Débloque les spots cachés de Marrakech avec l'Insider Pass."}
      </p>

      <button
        onClick={() => navigate("/vip-pass")}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-primary-foreground transition-all active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
      >
        <Sparkles className="w-4 h-4" />
        Devenir Insider
      </button>
    </motion.div>
  );
}
