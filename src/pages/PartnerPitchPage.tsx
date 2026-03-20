// B2B one-pager pitch page
// Premium dark design with gold/ochre accents
// Sections:
// 1. Hero: "Vos futurs clients sont d\u00e9j\u00e0 sur WeshKech" with animated background
// 2. KPIs animated counters: 2400+ utilisateurs, 85% 18-35 ans, 12000 vues/semaine
// 3. 3 feature cards with emojis
// 4. "Offre Fondateur" section: free 6 months for first 20, counter showing remaining
// 5. Form: nom, venue name, WhatsApp number
// 6. Footer with QR code download CTA

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, MessageCircle, Send, Check, Download, Users, Eye, TrendingUp, Gift, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current || started.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = Math.ceil(target / (duration / 16));
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setValue(target); clearInterval(timer); }
          else setValue(start);
        }, 16);
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

export default function PartnerPitchPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", venue: "", whatsapp: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [foundersLeft, setFoundersLeft] = useState(14); // Simulated scarcity

  const kpi1 = useCountUp(2400);
  const kpi2 = useCountUp(85);
  const kpi3 = useCountUp(12000);

  const handleSubmit = async () => {
    if (!form.venue.trim() || !form.whatsapp.trim()) {
      toast.error("Remplis tous les champs");
      return;
    }
    setSubmitting(true);
    try {
      // Use the REST API approach (same as B2BFinalCTA)
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await fetch(`${baseUrl}/rest/v1/partner_requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          business_name: form.venue.trim(),
          category: "Pitch Fondateur",
          offer_description: `Contact: ${form.name} | Via: partner-pitch`,
          whatsapp_number: form.whatsapp.trim(),
        }),
      });
      setSubmitted(true);
      toast.success("Candidature envoy\u00e9e !");
    } catch {
      toast.error("Erreur r\u00e9seau, r\u00e9essayez");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-gold">WeshKech</h1>
            <p className="text-[10px] text-muted-foreground">Programme Fondateurs</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-10">
        {/* -- HERO -- */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-xs font-bold text-gold">
            <Zap className="w-3 h-3" /> Offre limit\u00e9e aux fondateurs
          </div>
          <h2 className="font-display text-[28px] font-bold text-foreground leading-tight">
            Vos futurs clients sont <span className="text-gold">d\u00e9j\u00e0 sur WeshKech</span>
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Rejoignez la premi\u00e8re plateforme de d\u00e9couverte live \u00e0 Marrakech. Vos photos, votre ambiance, visible par toute la communaut\u00e9 — en temps r\u00e9el.
          </p>
        </motion.section>

        {/* -- KPIs -- */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div ref={kpi1.ref} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-center bg-card/80 border border-border rounded-2xl py-4 px-2">
            <Users className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-2xl font-black text-gold">{kpi1.value.toLocaleString()}+</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Utilisateurs beta</p>
          </motion.div>
          <motion.div ref={kpi2.ref} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-center bg-card/80 border border-border rounded-2xl py-4 px-2">
            <TrendingUp className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-2xl font-black text-gold">{kpi2.value}%</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">18-35 ans</p>
          </motion.div>
          <motion.div ref={kpi3.ref} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-center bg-card/80 border border-border rounded-2xl py-4 px-2">
            <Eye className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-2xl font-black text-gold">{kpi3.value.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Vues / semaine</p>
          </motion.div>
        </div>

        {/* -- HOW IT WORKS -- */}
        <div className="space-y-3">
          {[
            { emoji: "\uD83D\uDCF8", title: "Publiez des Vibes Officielles", desc: "Photos & vid\u00e9os avec badge \u2B50 visibles par toute la communaut\u00e9 pendant 6h." },
            { emoji: "\uD83D\uDDFA\uFE0F", title: "\u00C9pingl\u00e9 sur la carte live", desc: "Votre spot appara\u00EEt en priorit\u00e9 sur la carte interactive de Marrakech." },
            { emoji: "\uD83C\uDF81", title: "Proposez des offres VIP", desc: "Attirez les Insiders avec des deals exclusifs v\u00e9rifi\u00e9s par QR code." },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
              className="flex gap-3 bg-card/80 border border-border rounded-xl p-4">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <p className="text-sm font-bold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* -- FOUNDER OFFER -- */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
          className="relative overflow-hidden rounded-2xl border-2 border-gold/40 p-6 space-y-4"
          style={{ background: "linear-gradient(135deg, rgba(191,149,63,0.08), rgba(0,0,0,0.3))" }}>
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-gold" />
              <h3 className="font-display text-lg font-bold text-foreground">Offre Fondateur</h3>
            </div>
            <p className="text-sm text-muted-foreground">Acc\u00e8s complet gratuit pendant <span className="text-gold font-bold">6 mois</span> pour les premiers \u00e9tablissements.</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full bg-gold/15 border border-gold/30">
                <span className="text-sm font-black text-gold">{foundersLeft}</span>
                <span className="text-xs text-gold/70 ml-1">places restantes</span>
              </div>
              <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full" style={{ width: `${((20 - foundersLeft) / 20) * 100}%` }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* -- FORM -- */}
        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gold/10 border border-gold/20 rounded-2xl p-6 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-gold/20 flex items-center justify-center">
              <Check className="w-7 h-7 text-gold" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">Candidature envoy\u00e9e ! \uD83C\uDF89</h3>
            <p className="text-sm text-muted-foreground">Notre \u00e9quipe vous contacte sous 24h sur WhatsApp.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-display text-base font-bold text-foreground text-center">Rejoindre le programme</h3>
            <div className="space-y-3">
              <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Votre nom"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30" />
              <input value={form.venue} onChange={(e) => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Nom de l'\u00e9tablissement"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30" />
              <input value={form.whatsapp} onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="+212 6XX XX XX XX"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
              {submitting ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Candidater maintenant</>}
            </button>
            <p className="text-[10px] text-center text-muted-foreground">Sans engagement \u00B7 Activation sous 24h</p>
          </div>
        )}

        {/* -- FOOTER -- */}
        <div className="text-center space-y-3 pt-4">
          <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <p className="text-xs text-muted-foreground">
            Questions ? <a href="https://wa.me/+33607564453" className="text-gold hover:underline">WhatsApp</a>
          </p>
        </div>
      </div>
    </div>
  );
}
