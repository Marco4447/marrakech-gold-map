import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Check, Loader2, ExternalLink, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PARTNER_PLANS, type PlanType, type PartnerPlan } from "@/lib/partnerPlans";

interface Props {
  userId: string;
  currentPlan: PlanType | null;
}

export default function PartnerBilling({ userId, currentPlan }: Props) {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleSubscribe = async (plan: PartnerPlan) => {
    setLoadingPlan(plan.type);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId: plan.priceId,
          productType: "partner_subscription",
          planType: plan.type,
        },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err?.message || "Erreur");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err?.message || "Erreur");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Current plan */}
      {currentPlan && (
        <div className="rounded-2xl border border-gold/20 bg-card/80 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-gold" />
              <div>
                <p className="text-sm font-semibold text-foreground">Plan {currentPlan}</p>
                <p className="text-[11px] text-muted-foreground">Abonnement actif</p>
              </div>
            </div>
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-surface border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
              Gérer
            </button>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="space-y-3">
        {PARTNER_PLANS.map((plan, i) => {
          const isCurrent = currentPlan === plan.type;
          return (
            <motion.div
              key={plan.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border p-5 space-y-3 ${
                plan.highlight
                  ? "border-gold/40 bg-card/80 backdrop-blur-xl"
                  : "border-border bg-card/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-base font-bold text-foreground">{plan.name}</p>
                  <p className="text-gold font-display font-black text-xl">{plan.price}</p>
                </div>
                {isCurrent && (
                  <span className="px-3 py-1 rounded-full bg-gold/15 text-gold text-[10px] font-bold">
                    ACTIF
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                    <span className="text-xs text-foreground/80">{f}</span>
                  </div>
                ))}
              </div>

              {!isCurrent && (
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={!!loadingPlan}
                  className="w-full py-3 rounded-xl text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
                >
                  {loadingPlan === plan.type ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "S'abonner"
                  )}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Credits CTA */}
      <button
        onClick={() => navigate("/shop")}
        className="w-full py-3 rounded-xl text-sm font-semibold bg-surface border border-border text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
      >
        <CreditCard className="w-4 h-4 text-gold" />
        Acheter des Vibe Credits
      </button>
    </div>
  );
}
