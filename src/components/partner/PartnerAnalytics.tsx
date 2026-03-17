import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Eye, Heart, MapPin, TrendingUp, Target, Download } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Props {
  userId: string;
  placeId: string | null;
}

interface DailyData {
  date: string;
  rawDate: string;
  views: number;
  likes: number;
}

function pctChange(current: number, previous: number): { label: string; color: string } {
  if (previous === 0 && current === 0) return { label: "→", color: "text-muted-foreground" };
  if (previous === 0) return { label: "▲ +∞%", color: "text-emerald-400" };
  const pct = Math.round(((current - previous) / Math.max(1, previous)) * 100);
  if (pct > 0) return { label: `▲ +${pct}%`, color: "text-emerald-400" };
  if (pct < 0) return { label: `▼ ${pct}%`, color: "text-destructive" };
  return { label: "→", color: "text-muted-foreground" };
}

export default function PartnerAnalytics({ userId, placeId }: Props) {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [totals, setTotals] = useState({ views: 0, likes: 0, clicks: 0 });
  const [prevTotals, setPrevTotals] = useState({ views: 0, likes: 0, clicks: 0 });

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const now = Date.now();
        const since14 = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
        const since28 = new Date(now - 28 * 24 * 60 * 60 * 1000).toISOString();

        // Current 14 days
        const { data: vibes } = await supabase
          .from("vibes")
          .select("created_at, likes")
          .eq("user_id", userId)
          .eq("is_official", true)
          .gte("created_at", since14)
          .order("created_at", { ascending: true });

        // Previous 14 days (days 28 to 15 ago)
        const { data: prevVibes } = await supabase
          .from("vibes")
          .select("created_at, likes")
          .eq("user_id", userId)
          .eq("is_official", true)
          .gte("created_at", since28)
          .lt("created_at", since14);

        // Group by day
        const byDay: Record<string, { views: number; likes: number }> = {};
        for (let i = 0; i < 14; i++) {
          const d = new Date(now - (13 - i) * 24 * 60 * 60 * 1000);
          const key = d.toISOString().slice(0, 10);
          byDay[key] = { views: 0, likes: 0 };
        }

        (vibes || []).forEach((v) => {
          const day = v.created_at.slice(0, 10);
          if (byDay[day]) {
            byDay[day].views += 1;
            byDay[day].likes += v.likes || 0;
          }
        });

        const chart = Object.entries(byDay).map(([date, d]) => ({
          date: new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
          rawDate: date,
          views: d.views,
          likes: d.likes,
        }));
        setDailyData(chart);

        const totalViews = (vibes || []).length;
        const totalLikes = (vibes || []).reduce((s, v) => s + (v.likes || 0), 0);
        const prevViews = (prevVibes || []).length;
        const prevLikes = (prevVibes || []).reduce((s, v) => s + (v.likes || 0), 0);

        let clicks = 0;
        let prevClicks = 0;
        if (placeId) {
          const { count } = await supabase
            .from("venue_analytics")
            .select("id", { count: "exact", head: true })
            .eq("place_id", placeId)
            .gte("created_at", since14);
          clicks = count ?? 0;

          const { count: pc } = await supabase
            .from("venue_analytics")
            .select("id", { count: "exact", head: true })
            .eq("place_id", placeId)
            .gte("created_at", since28)
            .lt("created_at", since14);
          prevClicks = pc ?? 0;
        }

        setTotals({ views: totalViews, likes: totalLikes, clicks });
        setPrevTotals({ views: prevViews, likes: prevLikes, clicks: prevClicks });
      } catch (err) {
        console.error("Analytics load error:", err);
        toast.error("Erreur chargement analytics");
      }
    };
    load();
  }, [userId, placeId]);

  const conversionRate = Math.round((totals.clicks / Math.max(1, totals.views)) * 100);

  const handleExportCsv = () => {
    const header = "date,vibes,likes";
    const rows = dailyData.map(d => `${d.rawDate},${d.views},${d.likes}`);
    const csvString = [header, ...rows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weshkech-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    { icon: Eye, label: "Vibes", value: totals.views, prev: prevTotals.views },
    { icon: Heart, label: "Likes", value: totals.likes, prev: prevTotals.likes },
    { icon: MapPin, label: "Clics", value: totals.clicks, prev: prevTotals.clicks },
    { icon: Target, label: "Taux clics", value: `${conversionRate}%`, prev: null },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s, i) => {
          const change = s.prev !== null ? pctChange(typeof s.value === "number" ? s.value : 0, s.prev) : null;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gold/5 border border-gold/15 rounded-xl py-3 text-center"
            >
              <s.icon className="w-4 h-4 text-gold mx-auto mb-1" />
              <p className="text-lg font-black text-gold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label} (14j)</p>
              {change && (
                <p className={`text-[9px] font-semibold mt-0.5 ${change.color}`}>{change.label}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="bg-card/80 border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-semibold text-foreground">Performance 14 jours</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="likes" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} name="Likes" />
              <Bar dataKey="views" fill="hsl(var(--gold) / 0.4)" radius={[4, 4, 0, 0]} name="Vibes" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <button
          onClick={handleExportCsv}
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Download className="w-3 h-3" /> Exporter CSV
        </button>
      </div>
    </div>
  );
}
