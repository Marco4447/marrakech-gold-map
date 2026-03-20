import { useState } from "react";
import { Gift, ChevronRight, Loader2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import FomoCountdown from "@/components/FomoCountdown";

interface VipOffer {
  id: string;
  title: string;
  description: string;
  perk_type: string;
  end_time: string | null;
}

interface Props {
  isPartner: boolean;
  hasOffer: boolean;
  vipOffers: VipOffer[];
  placeName: string;
}

export default function PlaceVipSection({ isPartner, hasOffer, vipOffers, placeName }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleClaim = async () => {
    if (!user) {
      toast("Crée ton compte pour profiter de l'offre 🎁", {
        action: { label: "S'inscrire", onClick: () => window.dispatchEvent(new CustomEvent("wk:goto-auth")) },
      });
      return;
    }

    // Check if already VIP
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_vip")
      .eq("user_id", user.id)
      .single();

    if (profile?.is_vip) {
      // Already active — go to pass page
      navigate("/vip-pass");
      return;
    }

    // Activate pass for free
    setActivating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_vip: true } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      setActivated(true);
      toast.success("Pass Insider activé ! 🥂 Montre ton QR aux partenaires.");
      try { navigator.vibrate?.([15, 30, 15]); } catch {}
      // Navigate to pass after a moment
      setTimeout(() => navigate("/vip-pass"), 1500);
    } catch {
      toast.error("Erreur d'activation");
    } finally {
      setActivating(false);
    }
  };

  if (!isPartner) return null;

  if (vipOffers.length > 0) {
    return (
      <div className="space-y-2">
        {vipOffers.map((vip) => {
          const perkEmoji = vip.perk_type === "drink" ? "🍸" : vip.perk_type === "food" ? "🍽️" : vip.perk_type === "entry" ? "🎫" : vip.perk_type === "discount" ? "💰" : "🎁";
          return (
            <div key={vip.id} className="bg-gold/10 border border-gold/25 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{perkEmoji}</span>
                <span className="text-sm font-bold text-gold flex-1">{vip.title}</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{vip.description}</p>
              {vip.end_time && <FomoCountdown endTime={vip.end_time} />}
              <button
                onClick={handleClaim}
                disabled={activating || activated}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-primary-foreground active:scale-[0.97] transition-transform disabled:opacity-60"
                style={{ background: activated ? undefined : "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
              >
                {activated ? (
                  <><Check className="w-4 h-4 text-gold" /> <span className="text-gold">Pass activé !</span></>
                ) : activating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Gift className="w-4 h-4" /> Récupérer l'offre (gratuit) <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  if (hasOffer) {
    return (
      <div className="bg-gold/10 border border-gold/25 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-gold" />
          <span className="text-sm font-semibold text-gold">{t("place_insiderOffer")}</span>
        </div>
        <p className="text-xs text-foreground/80">{t("place_insiderOfferDesc")} {placeName}.</p>
        <button
          onClick={handleClaim}
          disabled={activating || activated}
          className="w-full py-2 rounded-xl text-xs font-semibold text-gold border border-gold/30 hover:bg-gold/5 transition-colors active:scale-[0.97] disabled:opacity-60"
        >
          {activated ? "✅ Pass activé !" : activating ? "Activation..." : "Activer mon pass gratuit →"}
        </button>
      </div>
    );
  }

  return null;
}
