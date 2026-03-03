import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Camera, Crown, Zap, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const FEATURES = [
  { icon: MapPin, label: "30+ spots secrets", emoji: "📍" },
  { icon: Camera, label: "Vibes live éphémères", emoji: "📸" },
  { icon: Crown, label: "Pass VIP Insider", emoji: "👑" },
  { icon: Zap, label: "100% gratuit", emoji: "⚡" },
];

export default function GoPage() {
  const navigate = useNavigate();
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);

  useEffect(() => {
    // Fetch live vibes count
    supabase
      .from("vibes")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setLiveCount(count || 0));

    // Fetch users count
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setUsersCount(count || 0));
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden flex flex-col">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gold/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full">
        
        {/* Logo / Brand */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 px-4 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-[11px] font-bold text-gold uppercase tracking-wider">Vu sur TikTok</span>
          </div>
          
          <h1 className="font-display text-4xl font-black tracking-tight">
            <span className="text-gold">Wesh</span>
            <span className="text-foreground">kech</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            La carte live de Marrakech.<br />
            <span className="text-foreground font-medium">Trouve le vibe en temps réel.</span>
          </p>
        </motion.div>

        {/* Social proof */}
        {(liveCount !== null || usersCount !== null) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mb-8"
          >
            {liveCount !== null && (
              <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-xs font-semibold text-foreground">{liveCount} vibes live</span>
              </div>
            )}
            {usersCount !== null && (
              <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5">
                <span className="text-xs font-semibold text-foreground">{usersCount}+ explorateurs</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 w-full mb-8"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4 text-center"
            >
              <span className="text-2xl block mb-1.5">{f.emoji}</span>
              <p className="text-xs font-semibold text-foreground">{f.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => navigate("/")}
          className="w-full py-4 rounded-2xl text-base font-bold text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-xl shadow-gold/20"
          style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
        >
          Découvrir Weshkech
          <ChevronRight className="w-5 h-5" />
        </motion.button>

        <p className="text-[10px] text-muted-foreground mt-3 text-center">
          Gratuit · Pas d'app à télécharger · Fonctionne sur mobile
        </p>

        {/* Mini preview of what awaits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 w-full"
        >
          <div className="relative rounded-2xl border border-gold/20 bg-card/50 backdrop-blur-sm p-4 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/3 pointer-events-none" />
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs font-bold text-gold">Pass VIP Insider</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Badge doré 👑 · Stats perso · Perks exclusifs chez nos partenaires
                </p>
                <button
                  onClick={() => navigate("/vip-pass")}
                  className="mt-2 text-[10px] font-bold text-gold hover:text-gold-light transition-colors flex items-center gap-1"
                >
                  En savoir plus <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-6 px-6">
        <p className="text-[10px] text-muted-foreground">
          🇲🇦 Made in Marrakech
        </p>
      </div>
    </div>
  );
}
