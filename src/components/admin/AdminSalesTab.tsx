import { useState } from "react";
import { TrendingUp, CheckCircle, Crown } from "lucide-react";

type StripePayment = { id: string; amount: number; currency: string; email: string; description: string; created: string; app?: string };
type AdminStats = {
  stripe: { total_revenue_30d: number; currency: string; successful_charges_30d: number; active_subscriptions: number; recent_payments: StripePayment[] } | null;
  users: any;
  partners: any[];
};

function StatCard({ icon: Icon, label, value, sub, color = "text-gold" }: { icon: any; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-2xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}j`;
}

export default function AdminSalesTab({ stats }: { stats: AdminStats }) {
  const [salesFilter, setSalesFilter] = useState<"all" | "Weshkech" | "Autre">("all");

  if (!stats?.stripe) {
    return <p className="text-sm text-muted-foreground">Stripe non configuré.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={TrendingUp} label="Revenu 30j" value={`${stats.stripe.total_revenue_30d.toFixed(0)}€`} />
        <StatCard icon={CheckCircle} label="Paiements" value={stats.stripe.successful_charges_30d} />
        <StatCard icon={Crown} label="Abonnés actifs" value={stats.stripe.active_subscriptions} />
      </div>

      {/* Filter buttons */}
      <div className="flex gap-1.5 mt-4">
        {(["all", "Weshkech", "Autre"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setSalesFilter(f)}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
              salesFilter === f
                ? "bg-gold/15 text-gold border border-gold/20"
                : "text-muted-foreground hover:text-foreground bg-surface border border-border"
            }`}
          >
            {f === "all" ? "Tous" : f}
          </button>
        ))}
      </div>

      {/* Recent payments */}
      {(() => {
        const payments = salesFilter === "all"
          ? stats.stripe!.recent_payments
          : stats.stripe!.recent_payments.filter((p) =>
              salesFilter === "Weshkech" ? p.app === "Weshkech" : p.app !== "Weshkech"
            );

        return (
          <div className="space-y-2 mt-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Paiements récents ({payments.length})
            </h3>
            {payments.map((p) => (
              <div key={p.id} className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-foreground truncate">{p.email}</p>
                    {p.app && (
                      <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                        p.app === "Weshkech" ? "bg-gold/15 text-gold" 
                        : "bg-muted text-muted-foreground"
                      }`}>
                        {p.app}
                      </span>
                    )}
                  </div>
                  <p className="text-2xs text-muted-foreground">{p.description} · {timeAgo(p.created)}</p>
                </div>
                <span className="text-sm font-bold text-gold whitespace-nowrap ml-2">{p.amount.toFixed(2)}€</span>
              </div>
            ))}
          </div>
        );
      })()}
    </>
  );
}
