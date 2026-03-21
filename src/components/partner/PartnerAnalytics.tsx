import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Eye, Gift, TrendingUp, Download } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Props {
  userId: string;
  placeId: string | null;
}

interface DayPoint {
  label: string;
  date: string;
  views: number;
}

export default function PartnerAnalytics({ userId, placeId }: Props) {
  const [viewsToday, setViewsToday] = useState(0);
  const [viewsMonth, setViewsMonth] = useState(0);
  const [redemptions, setRedemptions] = useState(0);
  const [chartData, setChartData] = useState<DayPoint[]>([]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Views today
        const { count: todayCount } = await supabase
          .from("acquisition_events" as any)
          .select("id", { count: "exact", head: true })
          .eq("event_type", "place_view")
          .eq("source", placeId || userId)
          .gte("created_at", todayStart);
        setViewsToday(todayCount ?? 0);

        // Views this month
        const { count: monthCount } = await supabase
          .from("acquisition_events" as any)
          .select("id", { count: "exact", head: true })
          .eq("event_type", "place_view")
          .eq("source", placeId || userId)
          .gte("created_at", monthStart);
        setViewsMonth(monthCount ?? 0);

        // VIP redemptions this month
        const { count: redeemCount } = await supabase
          .from("acquisition_events" as any)
          .select("id", { count: "exact", head: true })
          .eq("event_type", "vip_offer_viewed")
          .eq("source", placeId || userId)
          .gte("created_at", monthStart);
        setRedemptions(redeemCount ?? 0);

        // Chart: last 7 days views
        const { data: events } = await supabase
          .from("acquisition_events" as any)
          .select("created_at")
          .eq("event_type", "place_view")
          .eq("source", placeId || userId)
          .gte("created_at", sevenDaysAgo);

        const byDay: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          byDay[d.toISOString().slice(0, 10)] = 0;
        }
        (events || []).forEach((e: any) => {
          const day = e.created_at?.slice(0, 10);
          if (day && byDay[day] !== undefined) byDay[day]++;
        });

        setChartData(Object.entries(byDay).map(([date, views]) => ({
          date,
          label: new Date(date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
          views,
        })));
      } catch (err) {
        console.error("Analytics load error:", err);
      }
    };
    load();
  }, [userId, placeId]);

  const conversionRate = viewsMonth > 0 ? Math.round((redemptions / viewsMonth) * 100) : 0;

  const stats = [
    { icon: Eye, label: "Vues aujourd'hui", value: viewsToday },
    { icon: TrendingUp, label: "Vues ce mois", value: viewsMonth },
    { icon: Gift, label: "Offres utilisées", value: redemptions },
    { icon: TrendingUp, label: "Taux conversion", value: `${conversionRate}%` },
  ];

  const handleExportCsv = () => {
    const header = "date,views";
    const rows = chartData.map(d => `${d.date},${d.views}`);
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weshkech-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* ── METRICS GRID ── */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4"
          >
            <s.icon className="w-4 h-4 text-[var(--ochre)] mb-2" />
            <p className="text-3xl font-black text-[var(--ochre)]">{s.value}</p>
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── CHART: 7 DERNIERS JOURS ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-semibold">Vues — 7 derniers jours</p>
          <button onClick={handleExportCsv} className="flex items-center gap-1 text-[10px] text-[var(--ochre)] font-semibold active:opacity-70">
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(212,146,30,0.1)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "rgba(248,238,224,0.45)" }}
                axisLine={{ stroke: "rgba(212,146,30,0.15)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(248,238,224,0.45)" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#281508",
                  border: "1px solid rgba(212,146,30,0.28)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#F8EEE0",
                }}
                labelStyle={{ color: "rgba(248,238,224,0.6)" }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#D4921E"
                strokeWidth={2.5}
                dot={{ fill: "#D4921E", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#D4921E", stroke: "#281508", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── INFO ── */}
      <p className="text-[10px] text-[var(--text-muted)] text-center">
        Données basées sur les interactions avec votre fiche spot.
      </p>
    </div>
  );
}
