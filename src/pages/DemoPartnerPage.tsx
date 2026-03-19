import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Eye, Heart, MapPin, Calendar, TrendingUp, Users, QrCode,
  BarChart3, Crown, Zap, Star, ArrowRight, Check, Sparkles
} from "lucide-react";

const DEMO_STATS = {
  vibes: 24, likes: 1847, mapClicks: 312, bookings: 47,
  followers: 186, qrScans: 93, visibilityScore: 78,
};

const DEMO_VIBES = [
  { id: "1", image: "/images/kabana-photo-1.jpg", caption: "Sunset session 🌅", likes: 342, time: "2h" },
  { id: "2", image: "/images/kabana-photo-2.jpg", caption: "Friday vibes ✨", likes: 218, time: "5h" },
  { id: "3", image: "/images/kabana-photo-3.jpg", caption: "Best cocktails in town", likes: 156, time: "1j" },
  { id: "4", image: "/images/theatro-marrakech.jpg", caption: "Opening night 🎭", likes: 489, time: "2j" },
];

const DEMO_OFFERS = [
  { title: "Cocktail offert", desc: "Pour les 20 premiers check-ins de la semaine", claims: 14 },
  { title: "-20% sur la table", desc: "Réservation via WeshKech uniquement", claims: 31 },
];

const WEEKLY_DATA = [
  { day: "Lun", views: 32 }, { day: "Mar", views: 45 }, { day: "Mer", views: 28 },
  { day: "Jeu", views: 67 }, { day: "Ven", views: 124 }, { day: "Sam", views: 156 }, { day: "Dim", views: 89 },
];

function DemoStatCard({ icon: Icon, label, value, delay = 0 }: { icon: any; label: string; value: string | number; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-3.5 space-y-1"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5 text-gold" />
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-display font-black text-foreground">{value}</p>
    </motion.div>
  );
}

function MiniBar({ data }: { data: { day: string; views: number }[] }) {
  const max = Math.max(...data.map((d) => d.views));
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.views / max) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="w-full rounded-t bg-gold/60 min-h-[2px]"
          />
          <span className="text-[8px] text-muted-foreground">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

export default function DemoPartnerPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "vibes" | "offers">("overview");

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
              <Crown className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Kabana Rooftop</p>
              <p className="text-[10px] text-muted-foreground">Partner Dashboard · Démo</p>
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold/15 text-gold font-bold uppercase">
            Mode démo
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-5 space-y-5">
        {/* Demo banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 border border-gold/30"
          style={{ background: "linear-gradient(135deg, hsl(43 76% 52% / 0.08), hsl(43 70% 62% / 0.03))" }}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">Voici votre futur dashboard</p>
              <p className="text-xs text-muted-foreground">
                Données simulées pour illustrer ce que vous obtiendrez. Les vrais chiffres arrivent dès votre inscription.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border">
          {(["overview", "vibes", "offers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t ? "bg-gold/15 text-gold" : "text-muted-foreground"
              }`}
            >
              {t === "overview" ? "Aperçu" : t === "vibes" ? "Mes Vibes" : "Offres VIP"}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* Plan card */}
            <div className="rounded-2xl border border-gold/20 bg-card/80 backdrop-blur-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Plan actif</p>
                  <p className="text-lg font-display font-bold text-gold">Business</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Crédits</p>
                  <p className="text-lg font-display font-bold text-foreground">38</p>
                </div>
              </div>
            </div>

            {/* Visibility Score */}
            <div className="rounded-2xl border border-border bg-card/80 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Visibility Score</span>
                <span className="text-2xl font-display font-black text-gold">{DEMO_STATS.visibilityScore}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${DEMO_STATS.visibilityScore}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">Top 15% des établissements à Guéliz</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <DemoStatCard icon={Eye} label="Vibes publiées" value={DEMO_STATS.vibes} delay={0} />
              <DemoStatCard icon={Heart} label="Total likes" value={DEMO_STATS.likes} delay={0.05} />
              <DemoStatCard icon={MapPin} label="Clics carte" value={DEMO_STATS.mapClicks} delay={0.1} />
              <DemoStatCard icon={Users} label="Followers" value={DEMO_STATS.followers} delay={0.15} />
              <DemoStatCard icon={QrCode} label="Scans QR" value={DEMO_STATS.qrScans} delay={0.2} />
              <DemoStatCard icon={Calendar} label="Réservations" value={DEMO_STATS.bookings} delay={0.25} />
            </div>

            {/* Weekly chart */}
            <div className="rounded-2xl border border-border bg-card/80 p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Vues cette semaine</p>
              <MiniBar data={WEEKLY_DATA} />
            </div>
          </div>
        )}

        {/* Vibes tab */}
        {tab === "vibes" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {DEMO_VIBES.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative rounded-xl overflow-hidden aspect-[4/5] bg-surface border border-border"
                >
                  <img src={v.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-2.5">
                    <p className="text-[10px] text-white/90 font-medium line-clamp-1">{v.caption}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-white/70 flex items-center gap-0.5">
                        <Heart className="w-2.5 h-2.5" /> {v.likes}
                      </span>
                      <span className="text-[9px] text-white/50">{v.time}</span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-gold/90 text-primary-foreground font-bold">
                      Officiel
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-[10px] text-center text-muted-foreground">
              Vos vibes officielles apparaissent en priorité dans le flux de tous les utilisateurs
            </p>
          </div>
        )}

        {/* Offers tab */}
        {tab === "offers" && (
          <div className="space-y-3">
            {DEMO_OFFERS.map((o, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card/80 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">{o.title}</p>
                    <p className="text-xs text-muted-foreground">{o.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-display font-black text-gold">{o.claims}</p>
                    <p className="text-[9px] text-muted-foreground">utilisations</p>
                  </div>
                </div>
              </motion.div>
            ))}
            <div className="rounded-xl border border-gold/20 bg-gold/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">
                Les offres VIP attirent en moyenne <span className="text-gold font-bold">+35%</span> de nouveaux clients
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-5 text-center space-y-3"
          style={{ background: "linear-gradient(135deg, hsl(43 76% 52% / 0.1), hsl(43 70% 62% / 0.05))" }}
        >
          <p className="text-sm font-bold text-foreground">Prêt à rejoindre WeshKech ?</p>
          <p className="text-xs text-muted-foreground">15 crédits offerts · Aucun engagement</p>
          <button
            onClick={() => navigate("/business")}
            className="w-full py-3 rounded-xl text-sm font-bold text-primary-foreground shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
          >
            Candidater maintenant <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/pricing")}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-gold border border-gold/30 hover:bg-gold/5 transition-colors"
          >
            Voir les tarifs →
          </button>
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-gold" /> 15 crédits offerts</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-gold" /> Setup en 2 min</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
