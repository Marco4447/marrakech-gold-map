import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Camera, Gift, Crown, Zap, Flame,
  Star, Eye, Shield, QrCode, ChevronRight, Check, Users, Building2, HelpCircle, ChevronDown,
  Clock, TrendingUp, MousePointerClick,
} from "lucide-react";

/* ─── COUNT-UP HOOK ─── */
function useCountUp(target: number | null, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (target === null || target === 0) { setValue(target ?? 0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

function AnimatedStat({ target, prefix = "", suffix = "", label, icon: Icon, delay = 0 }: {
  target: number | null; prefix?: string; suffix?: string; label: string; icon: any; delay?: number;
}) {
  const count = useCountUp(target, 1200);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="flex flex-col items-center text-center bg-gold/5 border border-gold/15 rounded-xl py-3 px-2"
    >
      <Icon className="w-4 h-4 text-gold mb-1" />
      <span className="text-lg font-black text-gold leading-none">
        {target === null ? "…" : `${prefix}${count}${suffix}`}
      </span>
      <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</span>
    </motion.div>
  );
}

/* ─── DATA ─── */

const WHAT_IS = [
  { emoji: "🗺️", title: "Carte Live", desc: "Les 30 meilleurs spots de Marrakech, mis à jour en temps réel." },
  { emoji: "📸", title: "Vibes éphémères", desc: "Un flux photo & vidéo qui disparaît après 6 h — toujours frais." },
  { emoji: "🎁", title: "Deals exclusifs", desc: "Des avantages réservés aux Insiders chez nos partenaires certifiés." },
];

const INSIDER_BENEFITS = [
  { icon: Crown, text: "Badge VIP doré sur ton profil" },
  { icon: QrCode, text: "QR Code unique vérifié par les partenaires" },
  { icon: Gift, text: "Réductions & surprises chez tous les Spots Certifiés" },
  { icon: Shield, text: "Accès prioritaire aux événements exclusifs" },
  { icon: Eye, text: "Vibes officielles visibles en premier" },
];

const PARTNER_FEATURES = [
  { icon: Star, text: "Badge ⭐ OFFICIEL sur chaque publication" },
  { icon: Eye, text: "Priorité dans le radar et le flux Live" },
  { icon: Gift, text: "Définissez votre offre VIP exclusive" },
  { icon: Camera, text: "Publiez des Vibes épinglées sur la map" },
  { icon: Users, text: "Touchez la communauté d'Insiders Marrakech" },
];

const CREDIT_PACKS = [
  {
    name: "Pulse Pack",
    credits: 1,
    price: "9,90 €",
    unitPrice: "9,90 €/crédit",
    icon: Zap,
    popular: false,
  },
  {
    name: "Resonance Pack",
    credits: 5,
    price: "39,90 €",
    unitPrice: "7,98 €/crédit",
    icon: Flame,
    popular: true,
    badge: "Meilleur rapport",
  },
];

/* ─── COMPONENTS ─── */

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`font-display text-2xl font-bold text-foreground leading-tight ${className}`}>
      {children}
    </h2>
  );
}

function FeatureRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <p className="text-sm text-foreground/80">{text}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left bg-card/80 backdrop-blur-xl border border-border rounded-xl p-4 transition-colors hover:border-gold/20"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{question}</p>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="text-xs text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border"
        >
          {answer}
        </motion.p>
      )}
    </button>
  );
}

/* ─── PAGE ─── */

export default function PricingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"insider" | "partner">("insider");
  const [insiderCount, setInsiderCount] = useState<number | null>(null);
  const [avgLikes, setAvgLikes] = useState<number | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => {
      setInsiderCount(count ?? 0);
    });
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    supabase.from("vibes").select("likes").gte("created_at", weekAgo).then(({ data }) => {
      if (data && data.length > 0) {
        const avg = Math.round(data.reduce((s, v) => s + (v.likes || 0), 0) / data.length);
        setAvgLikes(avg);
      } else {
        setAvgLikes(0);
      }
    });
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold">
              <span className="text-gold">Weshkech</span>
            </h1>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Marrakech en temps réel
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-10">
        {/* ───── WHAT IS WESHKECH ───── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          <SectionTitle>
            La première app de{" "}
            <span className="text-gold">découverte live</span>{" "}
            à Marrakech
          </SectionTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Weshkech connecte les explorateurs aux meilleurs spots de la ville rouge. 
            Une carte interactive, des vibes éphémères et des deals exclusifs — le tout en temps réel.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {WHAT_IS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-3 text-center space-y-2"
              >
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ───── DIVIDER ───── */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        {/* ───── TAB SWITCHER ───── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <SectionTitle>Nos formules</SectionTitle>

          <div className="flex bg-surface border border-border rounded-xl p-1 gap-1">
            {(["insider", "partner"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-gold text-primary-foreground shadow-lg shadow-gold/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "insider" ? "🎁 Insider Pass" : "🏢 Partenaire"}
              </button>
            ))}
          </div>

          {/* ───── INSIDER TAB ───── */}
          {activeTab === "insider" && (
            <motion.div
              key="insider"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Pricing card */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-gold/40 bg-card/80 backdrop-blur-xl">
                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gold/10 blur-3xl" />
                <div className="relative p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, rgba(191,149,63,0.25), rgba(252,246,186,0.1))" }}
                    >
                      <Crown className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-foreground">Insider Pass</p>
                      <p className="text-xs text-muted-foreground">Votre sésame pour Marrakech</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-black text-gold">14,90</span>
                    <span className="text-lg text-gold">€</span>
                    <span className="text-sm text-muted-foreground ml-1">/ mois</span>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="space-y-3">
                    {INSIDER_BENEFITS.map((b) => (
                      <div key={b.text} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-gold" />
                        </div>
                        <p className="text-sm text-foreground/80">{b.text}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate("/vip-pass")}
                    className="cta-shimmer relative w-full overflow-hidden py-3.5 rounded-xl text-sm font-bold text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mt-2"
                    style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
                  >
                    Devenir Insider
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Sans engagement · Résiliation en 1 clic via le portail client
              </p>
            </motion.div>
          )}

          {/* ───── PARTNER TAB ───── */}
          {activeTab === "partner" && (
            <motion.div
              key="partner"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* ── PROBLEM → SOLUTION ── */}
              <div className="space-y-3">
                <p className="font-display text-lg font-bold text-foreground leading-snug">
                  Votre établissement mérite d'être vu par{" "}
                  <span className="text-gold">toute la communauté</span>
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Les voyageurs à Marrakech cherchent des recommandations fiables en temps réel. 
                  Avec Weshkech, vous publiez du contenu qui apparaît directement sur la carte et en haut du flux — là où les Insiders regardent.
                </p>
              </div>

              {/* ── SOCIAL PROOF ── */}
              <div className="grid grid-cols-3 gap-2">
                <AnimatedStat target={insiderCount} suffix="+" label="Insiders actifs" icon={Users} delay={0.2} />
                <AnimatedStat target={avgLikes} prefix="~" label="❤️ moy. / Vibe" icon={Eye} delay={0.28} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.36 }}
                  className="flex flex-col items-center text-center bg-gold/5 border border-gold/15 rounded-xl py-3 px-2"
                >
                  <Clock className="w-4 h-4 text-gold mb-1" />
                  <span className="text-lg font-black text-gold leading-none">6h</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Visibilité garantie</span>
                </motion.div>
              </div>

              {/* ── TESTIMONIAL ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card/80 backdrop-blur-xl border border-gold/15 rounded-2xl p-4 space-y-3"
              >
                <p className="text-sm text-foreground/80 italic leading-relaxed">
                  "Depuis qu'on publie des Vibes Officielles, on a vu une vraie différence. Les clients nous disent qu'ils nous ont trouvés sur Weshkech. C'est devenu notre canal n°1 pour toucher les voyageurs."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center text-sm">☕</div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Karim B.</p>
                    <p className="text-[10px] text-muted-foreground">Gérant · Café Nomad, Gueliz</p>
                  </div>
                </div>
              </motion.div>

              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  Comment ça marche
                </p>
                <div className="space-y-3">
                  {[
                    {
                      step: "1",
                      icon: MousePointerClick,
                      title: "Achetez un pack de crédits",
                      desc: "Choisissez le pack adapté à vos besoins. Un crédit = une publication.",
                    },
                    {
                      step: "2",
                      icon: Camera,
                      title: "Publiez une Vibe Officielle",
                      desc: "Photo ou vidéo de votre établissement, menu, ambiance ou événement. Elle apparaît avec le badge ⭐ OFFICIEL.",
                    },
                    {
                      step: "3",
                      icon: TrendingUp,
                      title: "Soyez vu par tous les Insiders",
                      desc: "Votre Vibe est épinglée en haut du flux Live et visible sur la carte pendant 6 heures.",
                    },
                  ].map((s, i) => (
                    <motion.div
                      key={s.step}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-3 bg-card/80 backdrop-blur-xl border border-border rounded-xl p-4"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gold/15 border border-gold/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-black text-gold">{s.step}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── LIVE MOCKUP ── */}
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  Aperçu dans le flux Live
                </p>
                <div className="relative bg-card/90 backdrop-blur-xl border-2 border-gold/30 rounded-2xl overflow-hidden shadow-[0_0_40px_hsl(var(--gold)/0.08)]">
                  {/* Simulated phone status bar */}
                  <div className="bg-background/60 px-4 py-1.5 flex items-center justify-between text-[9px] text-muted-foreground border-b border-border/50">
                    <span>Live Vibes</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> En direct</span>
                  </div>
                  {/* Mock vibe card */}
                  <div className="p-3 space-y-2.5">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-[10px]">🏪</div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground">Votre établissement</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-primary-foreground" style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>⭐ OFFICIEL</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">📍 Gueliz, Marrakech</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-[9px] font-bold">5:42:18</span>
                      </div>
                    </div>
                    {/* Mock image placeholder */}
                    <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-gold/5 via-surface to-gold/10 border border-border flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-30" />
                      <div className="relative text-center space-y-1">
                        <Camera className="w-8 h-8 text-gold/60 mx-auto" />
                        <p className="text-[10px] text-muted-foreground">Votre photo / vidéo ici</p>
                      </div>
                      {/* Pinned badge */}
                      <div className="absolute top-2 left-2 bg-gold/90 text-primary-foreground text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> ÉPINGLÉ EN HAUT
                      </div>
                    </div>
                    {/* Caption */}
                    <p className="text-xs text-foreground/70 italic">"Venez découvrir notre nouvelle carte ! 🍽️"</p>
                    {/* Engagement row */}
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">❤️ 24</span>
                      <span className="flex items-center gap-1">🔥 8 super vibes</span>
                      <span className="flex items-center gap-1">💬 5</span>
                    </div>
                  </div>
                  {/* Arrow annotation */}
                  <div className="bg-gold/10 border-t border-gold/20 px-4 py-2.5 text-center">
                    <p className="text-[10px] text-gold font-semibold">
                      👆 Voici ce que tous les Insiders verront pendant 6 heures
                    </p>
                  </div>
                </div>
              </div>

              {/* ── WHAT YOU GET ── */}
              <div className="bg-card/80 backdrop-blur-xl border border-gold/20 rounded-2xl p-5 space-y-4">
                <p className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold fill-gold" />
                  Ce que chaque crédit vous offre
                </p>
                <div className="space-y-3">
                  {[
                    { icon: Star, text: "Badge ⭐ OFFICIEL sur votre publication" },
                    { icon: Eye, text: "Épinglé en haut du flux Live — pas noyé dans le feed" },
                    { icon: MapPin, text: "Visible sur la carte interactive de Marrakech" },
                    { icon: Clock, text: "6 heures de visibilité garantie auprès de la communauté" },
                    { icon: Gift, text: "Possibilité d'associer une offre VIP à votre spot" },
                  ].map((f) => (
                    <div key={f.text} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-gold" />
                      </div>
                      <p className="text-sm text-foreground/80">{f.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── CREDIT PACKS ── */}
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  Choisissez votre pack
                </p>

                {CREDIT_PACKS.map((pack, i) => {
                  const Icon = pack.icon;
                  return (
                    <motion.div
                      key={pack.name}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`relative rounded-2xl p-5 ${
                        pack.popular
                          ? "bg-card/90 backdrop-blur-xl border-2 border-gold/40 shadow-[0_0_30px_hsl(var(--gold)/0.08)]"
                          : "bg-card border border-border"
                      }`}
                    >
                      {pack.badge && (
                        <div className="absolute -top-2.5 right-4 bg-gold text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                          {pack.badge}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            pack.popular ? "bg-gold/15" : "bg-surface"
                          }`}>
                            <Icon className={`w-6 h-6 ${pack.popular ? "text-gold" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <p className="text-base font-bold text-foreground">{pack.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {pack.credits} publication{pack.credits > 1 ? "s" : ""} officielle{pack.credits > 1 ? "s" : ""} · {pack.unitPrice}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-black text-foreground">{pack.price}</span>
                      </div>
                    </motion.div>
                  );
                })}

                <p className="text-[10px] text-muted-foreground text-center">
                  Les crédits n'expirent jamais · Paiement sécurisé par Stripe
                </p>
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/shop")}
                  className="cta-shimmer relative w-full overflow-hidden py-3.5 rounded-xl text-sm font-bold text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
                >
                  Acheter mes crédits
                  <ChevronRight className="w-4 h-4" />
                </button>
                <Link
                  to="/business"
                  className="block w-full py-3 rounded-xl text-sm font-medium text-center text-gold border border-gold/30 hover:bg-gold/5 transition-colors"
                >
                  Pas encore partenaire ? Candidater →
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ───── FAQ ───── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-gold" />
            <SectionTitle>Questions fréquentes</SectionTitle>
          </div>

          <div className="space-y-2">
            {[
              {
                q: "Comment fonctionne l'Insider Pass ?",
                a: "C'est un abonnement mensuel à 14,90 €/mois. Dès l'activation, tu reçois un QR Code unique à présenter chez nos partenaires pour profiter d'avantages exclusifs (réductions, accès prioritaire, surprises). Tu peux résilier à tout moment depuis ton espace client.",
              },
              {
                q: "Qu'est-ce qu'un Vibe Credit ?",
                a: "Un Vibe Credit te permet de publier une Vibe Officielle — un post photo ou vidéo épinglé en haut du flux Live avec le badge ⭐ OFFICIEL, visible par toute la communauté pendant 6 heures. 1 publication = 1 crédit.",
              },
              {
                q: "Puis-je résilier mon abonnement à tout moment ?",
                a: "Oui, sans engagement ! Tu peux gérer ou résilier ton Insider Pass en un clic depuis le portail client accessible dans ton profil. La résiliation prend effet à la fin de la période en cours.",
              },
              {
                q: "Comment devenir partenaire Weshkech ?",
                a: "Remplis le formulaire de candidature sur la page Partenaire. Notre équipe te contacte sous 24h pour valider ton inscription. Une fois approuvé, tu accèdes au Partner Studio pour publier des Vibes Officielles et définir tes offres VIP.",
              },
              {
                q: "Les crédits expirent-ils ?",
                a: "Non ! Tes Vibe Credits restent disponibles sur ton compte sans limite de durée. Utilise-les quand tu veux pour publier des Vibes Officielles.",
              },
              {
                q: "Quels moyens de paiement sont acceptés ?",
                a: "Nous acceptons les cartes bancaires (Visa, Mastercard, Amex) via Stripe, notre plateforme de paiement sécurisée. Apple Pay et Google Pay sont également disponibles.",
              },
            ].map((faq) => (
              <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </motion.section>

        {/* ───── FOOTER ───── */}
        <div className="text-center space-y-2 pt-4">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <p className="text-xs text-muted-foreground pt-2">
            Des questions ? Contactez-nous sur{" "}
            <a href="https://wa.me/" className="text-gold hover:underline">WhatsApp</a>
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">CGU</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
