import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Sparkles, Wine, Bell, Shield, Loader2, Check, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const VIP_PRICE_ID = "price_1T6lnGJ8RyilXHbfsZBKku0a";

const BENEFITS = [
  { icon: Crown, label: "Badge VIP 👑", desc: "Ton nom brille avec une couronne dorée sur tout le feed" },
  { icon: Sparkles, label: "Vibes en lumière", desc: "Tes publications sont mises en avant avec un contour gold" },
  { icon: Bell, label: "Stats perso", desc: "Accède à tes statistiques : likes reçus, vibes postées, spots" },
  { icon: Wine, label: "Perks Partenaires", desc: "Drinks offerts et accès prioritaire chez nos futurs partenaires" },
];

export default function VipPass() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isVip, setIsVip] = useState(false);
  const [vipExpiresAt, setVipExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    if (authLoading || !user) { setLoading(false); return; }
    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_vip, vip_expires_at")
        .eq("user_id", user.id)
        .single();
      if (data) {
        const active = data.is_vip && data.vip_expires_at && new Date(data.vip_expires_at) > new Date();
        setIsVip(!!active);
        setVipExpiresAt(data.vip_expires_at);
      }
      setLoading(false);
    };
    check();
  }, [user, authLoading]);

  // Success return handler
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("vip_success") === "true") {
      toast.success("Bienvenue dans le club VIP ! 🥂");
      window.history.replaceState({}, "", "/vip-pass");
      if (user) {
        supabase
          .from("profiles")
          .select("is_vip, vip_expires_at")
          .eq("user_id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              const active = data.is_vip && data.vip_expires_at && new Date(data.vip_expires_at) > new Date();
              setIsVip(!!active);
              setVipExpiresAt(data.vip_expires_at);
            }
          });
      }
    }
  }, [user]);

  const handlePurchase = async () => {
    if (!user) { toast.error("Connecte-toi d'abord"); return; }
    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId: VIP_PRICE_ID,
          productType: "b2c_vip",
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur de paiement");
    } finally {
      setPurchasing(false);
    }
  };

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'ouvrir la gestion d'abonnement");
    } finally {
      setOpeningPortal(false);
    }
  };

  const daysLeft = vipExpiresAt
    ? Math.max(0, Math.ceil((new Date(vipExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

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
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Insider Pass</h1>
            <p className="text-[11px] text-muted-foreground">L'expérience VIP Marrakech</p>
          </div>
        </div>
      </div>

      {isVip ? (
        /* ===== ACTIVE VIP VIEW ===== */
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
                <span className="text-sm font-bold text-gold tracking-wide">VIP ACTIF</span>
              </div>

              <div className="bg-white rounded-2xl p-4 inline-block mb-4">
                 <QRCodeSVG
                  value={`https://marrakech-gold-map.lovable.app/verify?user_id=${user?.id}`}
                  size={180}
                  level="H"
                  fgColor="#1a1a1a"
                  bgColor="#ffffff"
                />
              </div>

              <p className="text-sm text-foreground font-semibold">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Expire dans <span className="text-gold font-bold">{daysLeft} jour{daysLeft !== 1 ? "s" : ""}</span>
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
              <motion.div
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 bg-card border border-gold/10 rounded-xl p-3"
              >
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

          {/* Manage Subscription */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={handleManageSubscription}
            disabled={openingPortal}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-surface text-sm font-medium text-muted-foreground hover:text-foreground hover:border-gold/30 transition-all active:scale-[0.98]"
          >
            {openingPortal ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            Gérer mon abonnement
          </motion.button>
        </div>
      ) : (
        /* ===== PURCHASE VIEW ===== */
        <div className="px-5 pt-6 space-y-6">
          {/* Hero */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4 relative">
              <Crown className="w-10 h-10 text-gold" />
              <div className="absolute inset-0 rounded-full bg-gold/5 animate-ping" style={{ animationDuration: "2s" }} />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">Deviens Insider</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              Accès exclusif aux meilleurs spots de Marrakech, chaque mois renouvelé.
            </p>
          </motion.div>

          {/* Benefits */}
          <div className="space-y-3">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="flex items-center gap-3 bg-card/80 backdrop-blur-xl border border-border rounded-xl p-3"
              >
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

          {/* Pricing Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative overflow-hidden rounded-3xl border-2 border-gold/30 bg-card/80 backdrop-blur-xl p-6 text-center"
          >
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gold/5 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-gold/5 blur-2xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-gold/15 px-3 py-1 rounded-full mb-3">
                <Crown className="w-3.5 h-3.5 text-gold" />
                <span className="text-[10px] font-bold text-gold uppercase tracking-wider">Insider Pass</span>
              </div>

              <div className="flex items-baseline justify-center gap-1 mt-2">
                <span className="text-4xl font-display font-black text-gold">14,90€</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Résiliable à tout moment</p>

              <button
                onClick={handlePurchase}
                disabled={purchasing || !user}
                className="mt-5 w-full py-3.5 rounded-xl text-sm font-bold text-primary-foreground disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
              >
                {purchasing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirection…
                  </span>
                ) : (
                  "Devenir VIP Insider 👑"
                )}
              </button>

              {!user && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  Connecte-toi pour t'abonner
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
