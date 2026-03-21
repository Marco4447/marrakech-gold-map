import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Send, Building2, MessageCircle, Camera, BarChart3, Gift, Shield, Zap, Check, X, Users, Eye, TrendingUp, Star, ChevronRight, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WA_NUMBER = "+33607564453"; // Pierre's WhatsApp
const WA_MSG = encodeURIComponent("Bonjour, je suis intéressé par le partenariat WeshKech pour mon établissement.");

// ── Animated counter ──
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ── Fade in on scroll ──
function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

// ── Pricing data ──
const PLANS = [
  {
    name: "Découverte", price: "Gratuit", period: "", highlight: false,
    features: ["Fiche établissement", "5 crédits vibes", "Badge Partenaire", "Statistiques de base"],
    cta: "Commencer gratuitement",
  },
  {
    name: "Business", price: "49€", period: "/mois", highlight: true, badge: "Populaire",
    features: ["Tout Découverte +", "30 crédits vibes/mois", "Offres VIP illimitées", "Analytics avancés", "Story Publisher", "Badge ⭐ Officiel", "Support prioritaire"],
    cta: "Essai gratuit 6 mois",
  },
  {
    name: "Empire", price: "99€", period: "/mois", highlight: false,
    features: ["Tout Business +", "Crédits illimités", "Carte des concurrents", "CRM intégré", "Accompagnement dédié", "Multi-établissements"],
    cta: "Nous contacter",
  },
];

const TYPES = ["Rooftop", "Restaurant", "Bar / Club", "Café", "Riad / Hôtel", "Activité", "Autre"];
const QUARTIERS = ["Médina", "Guéliz", "Hivernage", "Palmeraie", "Kasbah", "Autre"];

export default function BusinessPage() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ name: "", type: "", quartier: "", contact: "", whatsapp: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [foundersLeft, setFoundersLeft] = useState(14);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  const scrollToPricing = () => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });

  // Fetch real founder count
  useEffect(() => {
    supabase.from("partner_requests").select("id", { count: "exact", head: true }).then(({ count }) => {
      setFoundersLeft(Math.max(0, 20 - (count || 0)));
    });
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.whatsapp.trim()) { toast.error("Nom et WhatsApp requis"); return; }
    setSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { user } } = await supabase.auth.getUser();
      await fetch(`${baseUrl}/rest/v1/partner_requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey, Authorization: `Bearer ${apiKey}`, Prefer: "return=minimal" },
        body: JSON.stringify({
          business_name: form.name.trim(),
          category: form.type || "À définir",
          offer_description: `Quartier: ${form.quartier} | Contact: ${form.contact} | Email: ${form.email}`,
          whatsapp_number: form.whatsapp.trim(),
          user_id: user?.id || null,
        }),
      });
      setSubmitted(true);
      toast.success("Candidature envoyée !");
    } catch { toast.error("Erreur réseau"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-[100dvh] bg-background overflow-x-hidden">
      {/* Close button */}
      <button onClick={() => navigate("/")} className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-[rgba(248,238,224,0.07)] border border-[rgba(212,146,30,0.2)] flex items-center justify-center active:scale-90 transition-transform">
        <X className="w-5 h-5 text-[rgba(248,238,224,0.5)]" />
      </button>
      {/* ── STICKY HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-3">
          <div className="font-display text-lg font-bold">
            <span className="text-gold">Wesh</span><span className="text-foreground">Kech</span>
            <span className="text-muted-foreground text-[10px] ml-1.5 uppercase tracking-widest">Partners</span>
          </div>
          <button onClick={scrollToForm} className="px-4 py-1.5 rounded-full text-[11px] font-bold text-primary-foreground" style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
            Rejoindre
          </button>
        </div>
      </div>

      <div className="pt-14 max-w-lg mx-auto">
        {/* ════════════ HERO ════════════ */}
        <section className="px-5 pt-8 pb-10 text-center space-y-6">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-xs font-bold text-gold mb-2">
              <Zap className="w-3 h-3" /> Offre Fondateur — Places limitées
            </div>
            <h1 className="font-display text-[28px] font-bold text-foreground leading-tight">
              Vos futurs clients sont <span className="text-gold">déjà sur WeshKech</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Rejoignez les établissements qui remplissent leur terrasse grâce à la communauté la plus active de Marrakech.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex flex-col gap-3">
              <button onClick={scrollToForm} className="w-full py-3.5 rounded-2xl font-bold text-sm text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-gold/20" style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
                Devenir Partenaire Fondateur — Gratuit 6 mois <ChevronRight className="w-4 h-4" />
              </button>
              <a href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-2xl font-semibold text-sm text-green-400 border border-green-500/30 hover:bg-green-500/5 flex items-center justify-center gap-2 transition-colors">
                <MessageCircle className="w-4 h-4" /> Nous contacter sur WhatsApp
              </a>
            </div>
          </FadeIn>

          {/* KPIs */}
          <FadeIn delay={0.3}>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[
                { icon: Users, value: 2400, suffix: "+", label: "Utilisateurs" },
                { icon: Eye, value: 85, suffix: "%", label: "18-35 ans" },
                { icon: TrendingUp, value: 12000, suffix: "", label: "Vues / semaine" },
              ].map((kpi, i) => (
                <div key={i} className="text-center bg-card/80 border border-border rounded-2xl py-3 px-2">
                  <kpi.icon className="w-4 h-4 text-gold mx-auto mb-1" />
                  <p className="text-xl font-black text-gold"><Counter target={kpi.value} suffix={kpi.suffix} /></p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        {/* ════════════ COMMENT ÇA MARCHE ════════════ */}
        <section className="px-5 py-10 space-y-6">
          <FadeIn>
            <h2 className="font-display text-xl font-bold text-foreground text-center">Comment ça marche</h2>
          </FadeIn>
          {[
            { step: "1", icon: Building2, title: "Créez votre fiche", desc: "Photos, horaires, description. 2 minutes." },
            { step: "2", icon: Camera, title: "Publiez vos vibes", desc: "Postez une photo/vidéo → notification à toute la communauté." },
            { step: "3", icon: BarChart3, title: "Attirez des clients", desc: "Offres VIP, check-ins, réservations. Résultats en temps réel." },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="flex gap-4 bg-card/80 border border-border rounded-xl p-4">
                <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-gold">{s.step}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ════════════ AVANT / APRÈS ════════════ */}
        <section className="px-5 py-10 space-y-4">
          <FadeIn><h2 className="font-display text-xl font-bold text-foreground text-center">Avant / Après</h2></FadeIn>
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Sans WeshKech</p>
                {["Vous espérez que les gens passent devant", "Pas de visibilité digitale locale", "Aucune donnée sur vos clients", "Budget pub perdu sur Instagram ads"].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 bg-muted/30 border border-border rounded-lg p-2.5">
                    <X className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-tight">{t}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gold uppercase tracking-wider text-center">Avec WeshKech</p>
                {["2 400 personnes voient votre spot ce soir", "Notifications push à toute la communauté", "Analytics : vues, check-ins, profils", "0€ de pub — visibilité organique"].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 bg-gold/5 border border-gold/20 rounded-lg p-2.5">
                    <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                    <p className="text-[11px] text-foreground leading-tight">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ════════════ DASHBOARD PREVIEW ════════════ */}
        <section className="px-5 py-10 space-y-4">
          <FadeIn>
            <h2 className="font-display text-xl font-bold text-foreground text-center">Votre tableau de bord</h2>
            <p className="text-xs text-muted-foreground text-center">Marketing en temps réel, depuis votre téléphone</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="bg-card border border-gold/20 rounded-2xl p-4 space-y-3">
              {[
                { emoji: "📊", label: "Analytics", desc: "Vues, likes, check-ins en temps réel" },
                { emoji: "🎁", label: "Offres VIP", desc: "Créez des deals exclusifs pour les Insiders" },
                { emoji: "📖", label: "Stories", desc: "Publiez des stories visibles 24h sur toute l'app" },
                { emoji: "📸", label: "Vibes Officielles", desc: "Postez avec le badge ⭐ — priorité dans le feed" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                  <span className="text-lg">{f.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
              <Link to="/demo" className="block text-center text-xs text-gold font-semibold py-2 hover:underline">
                Voir le dashboard démo →
              </Link>
            </div>
          </FadeIn>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        {/* ════════════ OFFRE FONDATEUR ════════════ */}
        <section className="px-5 py-10">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl border-2 border-gold/40 p-6 space-y-4" style={{ background: "linear-gradient(135deg, rgba(191,149,63,0.08), rgba(0,0,0,0.3))" }}>
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gold/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-gold" />
                  <h2 className="font-display text-lg font-bold text-foreground">Offre Fondateur</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Les 20 premiers partenaires bénéficient de :</p>
                <div className="space-y-2.5">
                  {[
                    "🛡️ Badge Fondateur permanent sur votre fiche",
                    "🎁 6 mois gratuits (plan Business à 49€/mois offert)",
                    "📸 30 crédits vibes offerts",
                    "🤝 Accompagnement personnalisé",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                      <p className="text-sm text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-full bg-gold/15 border border-gold/30">
                    <span className="text-sm font-black text-gold">{foundersLeft}</span>
                    <span className="text-xs text-gold/70 ml-1">places restantes</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gold rounded-full" initial={{ width: 0 }} animate={{ width: `${((20 - foundersLeft) / 20) * 100}%` }} transition={{ duration: 1, delay: 0.5 }} />
                  </div>
                </div>
                <button onClick={scrollToForm} className="mt-4 w-full py-3 rounded-xl font-bold text-sm text-primary-foreground active:scale-[0.98] transition-transform" style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
                  Réserver ma place →
                </button>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ════════════ TESTIMONIALS ════════════ */}
        <section className="px-5 py-6 space-y-4">
          <FadeIn><h2 className="font-display text-xl font-bold text-foreground text-center">Ils nous font confiance</h2></FadeIn>
          {[
            { name: "Karim B.", venue: "Kabana Rooftop", quote: "Depuis WeshKech, notre rooftop affiche complet le weekend. Les clients nous disent qu'ils nous ont trouvés sur l'app.", emoji: "🍸" },
            { name: "Sarah M.", venue: "La Pearl", quote: "On a doublé nos réservations en 2 semaines. L'outil est simple et les résultats sont là.", emoji: "✨" },
            { name: "Youssef K.", venue: "Baromètre", quote: "L'app nous envoie exactement notre clientèle cible. Mieux que n'importe quel Instagram ad.", emoji: "🎵" },
          ].map((t, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="bg-card/80 border border-border rounded-2xl p-4 space-y-3">
                <p className="text-sm text-foreground/80 italic leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center text-sm">{t.emoji}</div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">Gérant · {t.venue}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ════════════ PRICING ════════════ */}
        <section id="pricing" className="px-5 py-10 space-y-6">
          <FadeIn>
            <h2 className="font-display text-xl font-bold text-foreground text-center">Tarifs simples</h2>
            <p className="text-xs text-muted-foreground text-center">Commencez gratuitement, évoluez quand vous voulez</p>
          </FadeIn>

          <div className="space-y-3">
            {PLANS.map((plan, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className={`relative rounded-2xl p-5 ${plan.highlight ? "bg-card/90 border-2 border-gold/40 shadow-[0_0_30px_hsl(43_76%_52%/0.08)]" : "bg-card border border-border"}`}>
                  {plan.badge && (
                    <div className="absolute -top-2.5 right-4 bg-gold text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">{plan.badge}</div>
                  )}
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-black text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                    <span className="text-sm font-semibold text-foreground ml-2">{plan.name}</span>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {plan.features.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-gold shrink-0" />
                        <p className="text-xs text-foreground/80">{f}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={plan.name === "Empire" ? () => window.open(`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`, "_blank") : scrollToForm}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform ${plan.highlight ? "text-primary-foreground" : "text-gold border border-gold/30 hover:bg-gold/5"}`}
                    style={plan.highlight ? { background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" } : undefined}>
                    {plan.cta}
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        {/* ════════════ FORMULAIRE ════════════ */}
        <section ref={formRef} className="px-5 py-10 space-y-5">
          <FadeIn>
            <h2 className="font-display text-xl font-bold text-foreground text-center">Activez votre espace en 2 minutes</h2>
          </FadeIn>

          {submitted ? (
            <FadeIn>
              <div className="bg-gold/10 border border-gold/20 rounded-2xl p-6 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-gold/20 flex items-center justify-center"><Check className="w-7 h-7 text-gold" /></div>
                <h3 className="font-display text-lg font-bold text-foreground">Candidature envoyée ! 🎉</h3>
                <p className="text-sm text-muted-foreground">Notre équipe vous contacte sur WhatsApp sous 24h.</p>
                <div className="flex flex-col gap-2 mt-3">
                  <Link to="/demo" className="w-full py-2.5 rounded-xl text-sm font-bold text-primary-foreground text-center" style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>Voir le dashboard démo →</Link>
                  <Link to="/" className="text-xs text-muted-foreground text-center hover:text-foreground">← Retour à l'app</Link>
                </div>
              </div>
            </FadeIn>
          ) : (
            <FadeIn delay={0.1}>
              <div className="bg-surface border border-gold/20 rounded-2xl p-5 space-y-3 shadow-lg shadow-gold/5">
                <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom de l'établissement *" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30" />
                <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30">
                  <option value="">Type d'établissement</option>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={form.quartier} onChange={(e) => setForm(f => ({ ...f, quartier: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30">
                  <option value="">Quartier</option>
                  {QUARTIERS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
                <input value={form.contact} onChange={(e) => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Votre nom" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30" />
                <input value={form.whatsapp} onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="WhatsApp *  (+212 6XX XX XX XX)" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30" />
                <input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email (optionnel)" type="email" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30" />
                <button onClick={handleSubmit} disabled={submitting} className="w-full py-3.5 rounded-xl font-bold text-sm text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform" style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
                  {submitting ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Rejoindre WeshKech</>}
                </button>
                <p className="text-[10px] text-center text-muted-foreground">Sans engagement · Activation sous 24h</p>
                <a href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-green-400 font-medium py-1 hover:underline">
                  Ou contactez-nous directement sur WhatsApp →
                </a>
              </div>
            </FadeIn>
          )}
        </section>

        {/* ════════════ FOOTER ════════════ */}
        <section className="px-5 py-8 space-y-3 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <p className="text-xs text-muted-foreground pt-2">
            Des questions ? <a href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">WhatsApp</a>
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Confidentialité</Link>
            <Link to="/terms" className="hover:text-foreground">CGU</Link>
            <a href="https://weshkech.com" className="hover:text-foreground">weshkech.com</a>
          </div>
        </section>
      </div>

      {/* ── FLOATING WHATSAPP BUTTON ── */}
      <a
        href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-4 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm px-4 py-3 rounded-full shadow-xl shadow-green-900/30 active:scale-95 transition-transform"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Discuter</span>
      </a>

      {/* ── STICKY MOBILE CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-gradient-to-t from-background via-background/95 to-transparent md:hidden">
        <button onClick={scrollToForm} className="w-full py-3.5 rounded-2xl font-bold text-sm text-primary-foreground flex items-center justify-center gap-2 shadow-lg shadow-gold/25" style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
          <Zap className="w-4 h-4" /> Devenir Partenaire Fondateur
        </button>
      </div>
    </div>
  );
}
