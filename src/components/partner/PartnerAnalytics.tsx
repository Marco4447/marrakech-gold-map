import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Eye, Gift, TrendingUp, Download } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Props {
  userId: string;
  placeId: string | null;
  placeName?: string;
}

interface DayPoint {
  label: string;
  date: string;
  views: number;
}

export default function PartnerAnalytics({ userId, placeId, placeName }: Props) {
  const [viewsToday, setViewsToday] = useState(0);
  const [viewsMonth, setViewsMonth] = useState(0);
  const [redemptions, setRedemptions] = useState(0);
  const [chartData, setChartData] = useState<DayPoint[]>([]);
  const [generating, setGenerating] = useState(false);

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

      {/* ── RAPPORT PDF ── */}
      <button
        onClick={() => {
          setGenerating(true);
          const now = new Date();
          const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
          const spotName = placeName || "Mon spot";
          const slug = spotName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

          const html = `<!DOCTYPE html><html><head>
            <title>weshkech-rapport-${slug}-${now.toISOString().slice(0, 7)}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #1a1a1a; padding: 40px; max-width: 600px; margin: 0 auto; }
              .header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #D4921E; }
              .logo { width: 40px; height: 40px; background: #D4921E; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 18px; }
              .title { font-size: 22px; font-weight: 900; }
              .subtitle { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }
              .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0; }
              .metric { border: 1px solid #eee; border-radius: 12px; padding: 16px; }
              .metric-value { font-size: 28px; font-weight: 900; color: #D4921E; }
              .metric-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }
              .table { width: 100%; border-collapse: collapse; margin: 24px 0; }
              .table th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; padding: 8px 0; border-bottom: 1px solid #eee; }
              .table td { padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
              .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #aaa; }
              @media print { body { padding: 20px; } }
            </style>
          </head><body>
            <div class="header">
              <div class="logo">W</div>
              <div>
                <div class="title">${spotName}</div>
                <div class="subtitle">Rapport mensuel — ${monthName}</div>
              </div>
            </div>
            <div class="metrics">
              <div class="metric"><div class="metric-value">${viewsToday}</div><div class="metric-label">Vues aujourd'hui</div></div>
              <div class="metric"><div class="metric-value">${viewsMonth}</div><div class="metric-label">Vues ce mois</div></div>
              <div class="metric"><div class="metric-value">${redemptions}</div><div class="metric-label">Offres utilisées</div></div>
              <div class="metric"><div class="metric-value">${conversionRate}%</div><div class="metric-label">Taux conversion</div></div>
            </div>
            <h3 style="font-size:14px;font-weight:700;margin:24px 0 12px">Vues — 7 derniers jours</h3>
            <table class="table">
              <tr><th>Jour</th><th style="text-align:right">Vues</th></tr>
              ${chartData.map(d => `<tr><td>${d.label}</td><td style="text-align:right;font-weight:600">${d.views}</td></tr>`).join("")}
            </table>
            <div class="footer">Généré par WeshKech · weshkech.com · ${now.toLocaleDateString("fr-FR")}</div>
          </body></html>`;

          const iframe = document.createElement("iframe");
          iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:700px;height:900px";
          document.body.appendChild(iframe);
          iframe.contentDocument?.open();
          iframe.contentDocument?.write(html);
          iframe.contentDocument?.close();
          setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => { document.body.removeChild(iframe); setGenerating(false); }, 1000);
          }, 300);
        }}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 bg-[var(--ochre)] text-[#0E0904] font-black uppercase text-sm rounded-xl px-6 py-3 active:scale-[0.97] transition-transform disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {generating ? "Génération..." : `Rapport PDF — ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`}
      </button>

      {/* ── INFO ── */}
      <p className="text-[10px] text-[var(--text-muted)] text-center">
        Données basées sur les interactions avec votre fiche spot.
      </p>
    </div>
  );
}
