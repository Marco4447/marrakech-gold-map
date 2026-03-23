import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, Zap, Eye, TrendingUp, Crown, Calendar, MapPin, Loader2 } from "lucide-react";
import { seedSpots } from "@/lib/seedSpots";
import { toast } from "sonner";

type PassStat = { place_name: string; count: number };
type RevenueDay = { date: string; amount: number };
type RevenuePeriod = "day" | "week" | "month";
type AdminStats = {
  stripe: { total_revenue_30d: number; currency: string; successful_charges_30d: number; active_subscriptions: number; recent_payments: any[]; revenue_by_day?: RevenueDay[] } | null;
  users: { total: number; total_vibes: number; vibes_24h: number };
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

export default function AdminOverview({ stats, passStats }: { stats: AdminStats; passStats: PassStat[] }) {
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("day");
  const [seeding, setSeeding] = useState(false);

  const chartData = useMemo(() => {
    const raw = stats?.stripe?.revenue_by_day;
    if (!raw || raw.length === 0) return [];

    if (revenuePeriod === "day") {
      return raw.map((d) => ({ label: d.date.slice(5), amount: Math.round(d.amount * 100) / 100 }));
    }

    const grouped: Record<string, number> = {};
    for (const d of raw) {
      const dt = new Date(d.date);
      let key: string;
      if (revenuePeriod === "week") {
        const weekStart = new Date(dt);
        weekStart.setDate(dt.getDate() - dt.getDay() + 1);
        key = `S${weekStart.toISOString().slice(5, 10)}`;
      } else {
        key = dt.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      }
      grouped[key] = (grouped[key] || 0) + d.amount;
    }
    return Object.entries(grouped).map(([label, amount]) => ({ label, amount: Math.round(amount * 100) / 100 }));
  }, [stats?.stripe?.revenue_by_day, revenuePeriod]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Utilisateurs" value={stats.users.total} />
        <StatCard icon={Zap} label="Vibes (total)" value={stats.users.total_vibes} />
        <StatCard icon={Eye} label="Vibes 24h" value={stats.users.vibes_24h} />
        <StatCard icon={Users} label="Partenaires" value={stats.partners.length} />
        {stats.stripe && (
          <>
            <StatCard icon={TrendingUp} label="Revenu 30j" value={`${stats.stripe.total_revenue_30d.toFixed(0)}€`} sub={`${stats.stripe.successful_charges_30d} paiements`} />
            <StatCard icon={Crown} label="Abonnés VIP" value={stats.stripe.active_subscriptions} />
          </>
        )}
      </div>

      {/* Seed Spots Button */}
      <button
        onClick={async () => {
          setSeeding(true);
          try {
            await seedSpots();
            toast.success("🎉 100 spots insérés avec succès !");
          } catch (err: any) {
            toast.error("Erreur seed: " + (err.message || "échec"));
          } finally {
            setSeeding(false);
          }
        }}
        disabled={seeding}
        className="w-full py-3 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/20 text-gold text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        {seeding ? "Seeding en cours..." : "🌱 Seed 100 Spots"}
      </button>

      {/* Revenue chart */}
      {chartData.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Revenus
            </h3>
            <div className="flex gap-1">
              {(["day", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setRevenuePeriod(p)}
                  className={`text-2xs font-medium px-2 py-1 rounded-md transition-all ${
                    revenuePeriod === p
                      ? "bg-gold/15 text-gold border border-gold/20"
                      : "text-muted-foreground bg-surface border border-border hover:text-foreground"
                  }`}
                >
                  {p === "day" ? "Jour" : p === "week" ? "Sem." : "Mois"}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={35} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`${value.toFixed(2)}€`, "Revenu"]}
                />
                <Bar dataKey="amount" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TikTok Pixel Events Reference */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          🎵 TikTok Pixel Events
        </h3>
        <div className="bg-surface border border-border rounded-xl p-4 space-y-2.5">
          {[
            { event: "PageView", trigger: "Chaque page vue", location: "index.html (auto)" },
            { event: "CompleteRegistration", trigger: "Inscription Google OAuth", location: "useAuth.tsx" },
            { event: "ViewContent", trigger: "Ouverture d'une vibe", location: "VibeSheet.tsx" },
            { event: "InitiateCheckout", trigger: "Clic Acheter Pass VIP", location: "VipPass.tsx" },
            { event: "CompletePayment", trigger: "Page payment-success", location: "PaymentSuccess.tsx" },
          ].map((ev) => (
            <div key={ev.event} className="flex items-start gap-3">
              <span className="text-2xs font-mono font-bold text-gold bg-gold/10 px-2 py-0.5 rounded shrink-0">{ev.event}</span>
              <div className="min-w-0">
                <p className="text-xs text-foreground">{ev.trigger}</p>
                <p className="text-2xs text-muted-foreground">{ev.location}</p>
              </div>
            </div>
          ))}
          <p className="text-2xs text-muted-foreground pt-1 border-t border-border">
            Pixel ID : D6K52QJC77U9T6VFJO7G · Vérifier sur TikTok Events Manager
          </p>
        </div>
      </div>

      {passStats.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Bookings</h3>
          <div className="space-y-1.5">
            {passStats.slice(0, 5).map((s) => (
              <div key={s.place_name} className="flex items-center justify-between bg-surface border border-border rounded-lg px-3 py-2">
                <span className="text-xs text-foreground truncate mr-2">{s.place_name}</span>
                <span className="text-xs font-bold text-gold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
