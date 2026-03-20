import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Sparkles, Wine, Bell, Shield, Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import LanguageToggle from "@/components/LanguageToggle";

const BENEFITS = [
  { icon: Crown, label: "Badge Insider 👑", desc: "Ton nom brille avec une couronne dorée sur tout le feed" },
  { icon: Sparkles, label: "Vibes en lumière", desc: "Tes publications sont mises en avant avec un contour gold" },
  { icon: Bell, label: "Stats perso", desc: "Accède à tes statistiques : likes reçus, vibes postées, spots" },
  { icon: Wine, label: "Perks Partenaires", desc: "Drinks offerts et accès prioritaire chez les établissements partenaires" },
];

export default function VipPass() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isVip, setIsVip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (authLoading || !user) { setLoading(false); return; }
    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_vip")
        .eq("user_id", user.id)
        .single();
      if (data) setIsVip(!!data.is_vip);
      setLoading(false);
    };
    check();
  }, [user, authLoading]);

  const handleActivate = async () => {
    if (!user) {
      toast.error("Connecte-toi d'abord");
      window.dispatchEvent(new CustomEvent("wk:goto-auth"));
      return;
    }
    setActivating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_vip: true } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      setIsVip(true);
      toast.success("Bienvenue dans le club Insider ! 🥂");
      try { navigator.vibrate?.([15, 30, 15]); } catch {}
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'activation");
    } finally {
      setActivating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Insider Pass</h1>
            <p className="text-[11px] text-muted-foreground">100% gratuit · Avantages exclusifs</p>
          </div>
          <div className="ml-auto"><LanguageToggle /></div>
        </div>
      </div>

      {isVip ? (
        /* ===== ACTIVE INSIDER VIEW ===== */
        <div className="px-5 pt-6 space-y-6">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative rounded-3xl border-2 border-gold/40 bg-card/80 backdrop-blur-xl p-6 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/10" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-gold/20 px-4 py-1.5 rounded-full mb-4">
                <Shield className="w-4 h-4 text-gold" />
                <span className="text-sm font-bold text-gold tracking-wide">INSIDER ACTIF</span>
              </div>

              <div className="bg-white rounded-2xl p-4 inline-block mb-4">
                <QRCodeSVG
                  value={`https://weshkech.com/verify?user_id=${user?.id}`}
                  size={180}
                  level="H"
                  fgColor="#1a1a1a"
                  bgColor="#ffffff"
                />
              </div>

              <p className="text-sm text-foreground font-semibold">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
              </p>
              <p className="text-[10px] text-muted-foreground mt-3">
                Présente ce QR code à l'entrée des établissements partenaires
              </p>
            </div>
          </motion.div>

          <div className="space-y-3">
            <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <Check className="w-4 h-4 text-gold" /> Tes avantages actifs
            </h2>
            {BENEFITS.map((b, i) => (
              <motion.div key={i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 bg-card border border-gold/10 rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{b.label}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* ===== ACTIVATION VIEW (FREE) ===== */
        <div className="px-5 pt-6 space-y-6">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
            <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4 relative">
              <Crown className="w-10 h-10 text-gold" />
              <div className="absolute inset-0 rounded-full bg-gold/5 animate-ping" style={{ animationDuration: "2s" }} />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">Deviens Insider</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              Active ton pass gratuit et profite d'avantages exclusifs chez tous nos partenaires à Marrakech.
            </p>
          </motion.div>

          <div className="space-y-3">
            {BENEFITS.map((b, i) => (
              <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.1 }}
                className="flex items-center gap-3 bg-card/80 backdrop-blur-xl border border-border rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{b.label}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
            className="relative overflow-hidden rounded-3xl border-2 border-gold/30 bg-card/80 backdrop-blur-xl p-6 text-center">
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gold/5 blur-3xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-gold/15 px-3 py-1 rounded-full mb-3">
                <Crown className="w-3.5 h-3.5 text-gold" />
                <span className="text-[10px] font-bold text-gold uppercase tracking-wider">Insider Pass</span>
              </div>

              <div className="flex items-baseline justify-center gap-1 mt-2">
                <span className="text-4xl font-display font-black text-gold">Gratuit</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pour toujours · Sans engagement</p>

              <button
                onClick={handleActivate}
                disabled={activating || !user}
                className="mt-5 w-full py-3.5 rounded-xl text-sm font-bold text-primary-foreground disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
              >
                {activating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Activation…
                  </span>
                ) : (
                  "Activer mon Pass Insider 👑"
                )}
              </button>

              {!user && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  Connecte-toi pour activer ton pass
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
