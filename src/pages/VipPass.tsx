import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Sparkles, Wine, Bell, QrCode, Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const VIP_PRICE_ID = "price_1T6lNhJ8RyilXHbf3kHONf0H";

const BENEFITS = [
  { icon: Crown, label: "Skip the line", desc: "Accès prioritaire dans les meilleurs spots" },
  { icon: Wine, label: "Welcome Drinks", desc: "Boisson offerte à l'arrivée chez nos partenaires" },
  { icon: Bell, label: "Insider Alerts", desc: "Notifications exclusives des events privés" },
  { icon: Sparkles, label: "Badge VIP", desc: "Ton profil brille dans la communauté" },
];

export default function VipPass() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isVip, setIsVip] = useState(false);
  const [vipExpiresAt, setVipExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

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

  // Check for success return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("vip_success") === "true") {
      toast.success("Bienvenue dans le club VIP ! 🥂");
      // Clean URL
      window.history.replaceState({}, "", "/vip-pass");
      // Re-check status
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
      const { data, error } = await supabase.functions.invoke("create-vip-checkout", {
        body: { priceId: VIP_PRICE_ID },
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
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">VIP Guest Pass</h1>
            <p className="text-xs text-muted-foreground">L'expérience Marrakech exclusive</p>
          </div>
        </div>
      </div>

      {isVip ? (
        /* ===== ACTIVE VIP VIEW ===== */
        <div className="px-5 pt-6 space-y-6">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-card border-2 border-gold/40 rounded-3xl p-6 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/10" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-gold/20 px-4 py-1.5 rounded-full mb-4">
                <Crown className="w-4 h-4 text-gold" />
                <span className="text-sm font-bold text-gold">VIP ACTIF</span>
              </div>

              <div className="bg-white rounded-2xl p-4 inline-block mb-4">
                <QRCodeSVG
                  value={`weshkech-vip:${user?.id}`}
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
              <Check className="w-4 h-4 text-gold" /> Tes avantages
            </h2>
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{b.label}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ===== PURCHASE VIEW ===== */
        <div className="px-5 pt-6 space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-gold" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">Deviens VIP</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              30 jours d'accès exclusif aux meilleurs spots de Marrakech
            </p>
          </motion.div>

          <div className="space-y-3">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-3"
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

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-card border-2 border-gold/30 rounded-2xl p-6 text-center"
          >
            <p className="text-3xl font-display font-bold text-gold">19,90€</p>
            <p className="text-xs text-muted-foreground mt-1">Paiement unique · 30 jours</p>
            <button
              onClick={handlePurchase}
              disabled={purchasing || !user}
              className="mt-4 w-full py-3 rounded-xl text-sm font-bold text-primary-foreground disabled:opacity-50 transition-opacity"
              style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
            >
              {purchasing ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Obtenir le VIP Guest Pass"
              )}
            </button>
            {!user && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Connecte-toi d'abord pour acheter
              </p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
