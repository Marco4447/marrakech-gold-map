import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Eye, 
  Users, 
  QrCode, 
  Plus, 
  Zap, 
  TrendingUp,
  Crown,
  ArrowUpRight,
  Clock
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

// Mock data for visibility spike
const VISIBILITY_DATA = [
  { time: "18:00", views: 45 },
  { time: "19:00", views: 78 },
  { time: "20:00", views: 156 },
  { time: "21:00", views: 289 },
  { time: "22:00", views: 342 },
  { time: "23:00", views: 298 },
  { time: "00:00", views: 245 },
];

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  delay: number;
}

function MetricCard({ icon, label, value, change, isPositive, delay }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-surface/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-gold/10 rounded-xl">
          {icon}
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-medium ${
          isPositive ? "text-emerald-400" : "text-destructive"
        }`}>
          <TrendingUp className="w-3 h-3" />
          {change}
        </div>
      </div>
      <p className="text-2xl font-display font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

function CreditCounter({ credits }: { credits: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-between bg-gradient-to-r from-gold/20 to-accent-warm/10 border border-gold/30 rounded-2xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gold/20 rounded-xl">
          <Zap className="w-5 h-5 text-gold" />
        </div>
        <div>
          <p className="text-lg font-display font-semibold text-foreground">{credits} Crédits</p>
          <p className="text-xs text-muted-foreground">Restants ce mois</p>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="px-4 py-2 bg-gold text-background text-sm font-semibold rounded-xl hover:bg-gold-light transition-colors"
      >
        Top-up
      </motion.button>
    </motion.div>
  );
}

function VisibilityGraph() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-surface/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-foreground">Pic de visibilité</h3>
          <p className="text-xs text-muted-foreground">Après votre dernière publication</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-accent-warm/10 rounded-lg">
          <ArrowUpRight className="w-3.5 h-3.5 text-accent-warm" />
          <span className="text-xs font-medium text-accent-warm">+312%</span>
        </div>
      </div>

      <div className="h-40 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={VISIBILITY_DATA}>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(0 0% 45%)", fontSize: 10 }}
              interval={1}
            />
            <YAxis 
              hide 
              domain={[0, "dataMax + 50"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0 0% 8%)",
                border: "1px solid hsl(0 0% 15%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(40 20% 85%)" }}
              itemStyle={{ color: "hsl(43 76% 52%)" }}
              formatter={(value: number) => [`${value} vues`, ""]}
            />
            <Line
              type="monotone"
              dataKey="views"
              stroke="hsl(43 76% 52%)"
              strokeWidth={2.5}
              dot={{ fill: "hsl(43 76% 52%)", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "hsl(43 76% 52%)", stroke: "hsl(0 0% 8%)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default function PartnerDashboardScreen() {
  const [credits, setCredits] = useState(12);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const handlePublish = () => {
    if (credits > 0) {
      setCredits(credits - 1);
      setShowPublishModal(true);
      setTimeout(() => setShowPublishModal(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-surface to-background">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-2xl font-semibold text-foreground">Tableau de bord</h1>
              <span className="px-2 py-0.5 bg-gold/20 text-gold text-[10px] font-medium rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />
                EMPIRE
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Mazel Café</p>
          </div>
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-gold/30">
            <img
              src="/images/mazel-1.jpg"
              alt="Mazel"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            icon={<Eye className="w-4 h-4 text-gold" />}
            label="Vues en direct"
            value="2.4k"
            change="+18%"
            isPositive={true}
            delay={0}
          />
          <MetricCard
            icon={<Users className="w-4 h-4 text-gold" />}
            label="Check-ins"
            value="47"
            change="+24%"
            isPositive={true}
            delay={0.1}
          />
          <MetricCard
            icon={<QrCode className="w-4 h-4 text-gold" />}
            label="Scans QR"
            value="23"
            change="+12%"
            isPositive={true}
            delay={0.2}
          />
        </div>

        {/* The Magic Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handlePublish}
          disabled={credits === 0}
          className={`relative w-full py-5 rounded-2xl font-semibold text-base tracking-wide overflow-hidden transition-all ${
            credits > 0
              ? "bg-gradient-to-r from-gold to-accent-warm text-background shadow-lg shadow-gold/25"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {/* Shimmer Effect */}
          {credits > 0 && (
            <span className="absolute inset-0 overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
            </span>
          )}

          <div className="relative flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            <span>PUBLIER UN VIBE OFFICIEL</span>
          </div>
        </motion.button>

        {/* Credit Counter */}
        <CreditCounter credits={credits} />

        {/* Visibility Graph */}
        <VisibilityGraph />

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4"
        >
          <h3 className="font-display font-semibold text-foreground mb-3">Activité récente</h3>
          <div className="space-y-3">
            {[
              { action: "Nouveau follower", target: "@sarah_casablanca", time: "2 min", icon: Users },
              { action: "Check-in validé", target: "Table 12", time: "5 min", icon: MapPin },
              { action: "Vibe likée", target: "+23 likes", time: "12 min", icon: Eye },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gold/10 rounded-lg">
                    <item.icon className="w-3.5 h-3.5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.target}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Success Modal */}
      {showPublishModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-surface border border-gold/30 rounded-3xl p-8 text-center max-w-xs mx-4"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-gold" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Vibe publiée !
            </h3>
            <p className="text-sm text-muted-foreground">
              Notification envoyée à tous vos followers
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* Add shimmer animation to CSS */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
