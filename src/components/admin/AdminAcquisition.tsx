import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, Eye, UserPlus, Smartphone, Globe, Loader2, RefreshCw } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

interface AcqEvent {
  id: string;
  event_type: string;
  source: string;
  campaign: string | null;
  referrer: string | null;
  is_inapp: boolean;
  is_tiktok: boolean;
  created_at: string;
}

type Period = "7d" | "14d" | "30d";

const SOURCE_COLORS: Record<string, string> = {
  tiktok: "#00f2ea",
  instagram: "#e1306c",
  google: "#4285f4",
  direct: "#a3a3a3",
  facebook: "#1877f2",
  other: "#8b5cf6",
};

function getColor(source: string) {
  return SOURCE_COLORS[source.toLowerCase()] || SOURCE_COLORS.other;
}

export default function AdminAcquisition() {
  const [events, setEvents] = useState<AcqEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("7d");

  const fetchEvents = async () => {
    setLoading(true);
    const days = period === "7d" ? 7 : period === "14d" ? 14 : 30;
    const since = subDays(new Date(), days).toISOString();

    const { data } = await supabase
      .from("acquisition_events")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    setEvents((data as AcqEvent[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [period]);

  // --- Computed metrics ---
  const pageViews = useMemo(() => events.filter(e => e.event_type === "page_view"), [events]);
  const signups = useMemo(() => events.filter(e => e.event_type.startsWith("signup")), [events]);
  const conversionRate = pageViews.length > 0 ? ((signups.length / pageViews.length) * 100).toFixed(1) : "0";
  const tiktokViews = pageViews.filter(e => e.source === "tiktok" || e.is_tiktok).length;
  const inAppRate = pageViews.length > 0 ? ((pageViews.filter(e => e.is_inapp).length / pageViews.length) * 100).toFixed(0) : "0";

  // Daily funnel chart
  const dailyData = useMemo(() => {
    const days = period === "7d" ? 7 : period === "14d" ? 14 : 30;
    const map: Record<string, { date: string; views: number; signups: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      map[d] = { date: d, views: 0, signups: 0 };
    }
    events.forEach(e => {
      const d = format(new Date(e.created_at), "yyyy-MM-dd");
      if (!map[d]) return;
      if (e.event_type === "page_view") map[d].views++;
      else if (e.event_type.startsWith("signup")) map[d].signups++;
    });
    return Object.values(map);
  }, [events, period]);

  // Source breakdown (pie)
  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    pageViews.forEach(e => {
      const src = e.source || "direct";
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [pageViews]);

  // Campaign performance
  const campaignData = useMemo(() => {
    const map: Record<string, { views: number; signups: number }> = {};
    events.forEach(e => {
      const key = e.campaign || "unknown";
      if (!map[key]) map[key] = { views: 0, signups: 0 };
      if (e.event_type === "page_view") map[key].views++;
      else if (e.event_type.startsWith("signup")) map[key].signups++;
    });
    return Object.entries(map)
      .map(([campaign, d]) => ({
        campaign,
        views: d.views,
        signups: d.signups,
        rate: d.views > 0 ? ((d.signups / d.views) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [events]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">📊 Acquisition</h2>
        <div className="flex items-center gap-2">
          {(["7d", "14d", "30d"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${period === p ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground"}`}>
              {p}
            </button>
          ))}
          <button onClick={fetchEvents} disabled={loading} className="text-muted-foreground hover:text-gold transition-colors ml-1">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-gold animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3">
            <KPI icon={Eye} label="Visites /go" value={pageViews.length} />
            <KPI icon={UserPlus} label="Inscriptions" value={signups.length} />
            <KPI icon={TrendingUp} label="Taux conversion" value={`${conversionRate}%`} />
            <KPI icon={Smartphone} label="In-app browser" value={`${inAppRate}%`} sub="(bloqués)" />
          </div>

          {/* TikTok specific */}
          {tiktokViews > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#00f2ea]/10 border border-[#00f2ea]/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🎵</span>
                <span className="text-xs font-semibold text-foreground">TikTok Ads</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">{tiktokViews}</p>
                  <p className="text-2xs text-muted-foreground">Visites</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{signups.filter(e => e.source === "tiktok" || e.is_tiktok).length}</p>
                  <p className="text-2xs text-muted-foreground">Inscriptions</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {tiktokViews > 0 ? ((signups.filter(e => e.source === "tiktok" || e.is_tiktok).length / tiktokViews) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-2xs text-muted-foreground">Conversion</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Daily funnel chart */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-3">Funnel quotidien</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={v => format(new Date(v), "dd/MM")} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelFormatter={v => format(new Date(v), "d MMMM", { locale: fr })} />
                  <Bar dataKey="views" name="Visites" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="signups" name="Inscriptions" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Source breakdown */}
          {sourceBreakdown.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-3">Sources de trafic</h3>
              <div className="flex items-center gap-4">
                <div className="w-[120px] h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={30} outerRadius={55} strokeWidth={0}>
                        {sourceBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={getColor(entry.name)} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {sourceBreakdown.map(s => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: getColor(s.name) }} />
                        <span className="text-foreground capitalize">{s.name}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Campaign table */}
          {campaignData.length > 0 && campaignData[0].campaign !== "unknown" && (
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-3">Performance par campagne</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left pb-2 font-medium">Campagne</th>
                      <th className="text-right pb-2 font-medium">Visites</th>
                      <th className="text-right pb-2 font-medium">Signups</th>
                      <th className="text-right pb-2 font-medium">Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignData.map(c => (
                      <tr key={c.campaign} className="border-b border-border/50">
                        <td className="py-2 text-foreground font-medium truncate max-w-[140px]">{c.campaign}</td>
                        <td className="py-2 text-right text-muted-foreground tabular-nums">{c.views}</td>
                        <td className="py-2 text-right text-foreground font-medium tabular-nums">{c.signups}</td>
                        <td className="py-2 text-right text-gold font-semibold tabular-nums">{c.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {events.length === 0 && (
            <div className="text-center py-12">
              <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucun événement d'acquisition sur cette période.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Les données apparaîtront dès que des visiteurs arriveront sur /go</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-gold" />
        <span className="text-2xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-2xs text-muted-foreground mt-0.5">{sub}</p>}
    </motion.div>
  );
}
