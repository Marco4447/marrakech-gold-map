import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Eye, Heart, MapPin, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  userId: string;
  placeId: string | null;
}

interface DailyData {
  date: string;
  views: number;
  likes: number;
}

export default function PartnerAnalytics({ userId, placeId }: Props) {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [totals, setTotals] = useState({ views: 0, likes: 0, clicks: 0 });

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      // Last 14 days of vibe performance
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const { data: vibes } = await supabase
        .from("vibes")
        .select("created_at, likes")
        .eq("user_id", userId)
        .eq("is_official", true)
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      // Group by day
      const byDay: Record<string, { views: number; likes: number }> = {};
      for (let i = 0; i < 14; i++) {
        const d = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000);
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
        views: d.views,
        likes: d.likes,
      }));
      setDailyData(chart);

      const totalViews = (vibes || []).length;
      const totalLikes = (vibes || []).reduce((s, v) => s + (v.likes || 0), 0);

      let clicks = 0;
      if (placeId) {
        const { count } = await supabase
          .from("venue_analytics")
          .select("id", { count: "exact", head: true })
          .eq("place_id", placeId)
          .gte("created_at", since);
        clicks = count ?? 0;
      }

      setTotals({ views: totalViews, likes: totalLikes, clicks });
    };
    load();
  }, [userId, placeId]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Eye, label: "Vibes", value: totals.views },
          { icon: Heart, label: "Likes", value: totals.likes },
          { icon: MapPin, label: "Clics", value: totals.clicks },
        ].map((s, i) => (
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
          </motion.div>
        ))}
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
      </div>
    </div>
  );
}
