import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Camera, Gift, Crown, Zap, Flame,
  Star, Eye, Shield, QrCode, ChevronRight, Check, Users, Building2,
} from "lucide-react";

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

/* ─── PAGE ─── */

export default function PricingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"insider" | "partner">("insider");

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
              className="space-y-6"
            >
              {/* How it works */}
              <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gold" />
                  <p className="font-display text-base font-bold text-foreground">
                    Spot Certifié Weshkech
                  </p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Rejoignez le réseau d'établissements premium visibles par toute la communauté d'Insiders. 
                  Publiez des Vibes Officielles, définissez vos offres exclusives et boostez votre visibilité.
                </p>
                <div className="h-px bg-border" />
                <div className="space-y-3">
                  {PARTNER_FEATURES.map((f) => (
                    <FeatureRow key={f.text} icon={f.icon} text={f.text} />
                  ))}
                </div>
              </div>

              {/* Credit packs */}
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  Packs Vibe Credits
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
                              {pack.credits} crédit{pack.credits > 1 ? "s" : ""} · {pack.unitPrice}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-black text-foreground">{pack.price}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/shop")}
                  className="cta-shimmer relative w-full overflow-hidden py-3.5 rounded-xl text-sm font-bold text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
                >
                  Acheter des crédits
                  <ChevronRight className="w-4 h-4" />
                </button>
                <Link
                  to="/business"
                  className="block w-full py-3 rounded-xl text-sm font-medium text-center text-gold border border-gold/30 hover:bg-gold/5 transition-colors"
                >
                  Candidater comme partenaire →
                </Link>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                1 Vibe Credit = 1 publication officielle épinglée en haut du flux pendant 6h
              </p>
            </motion.div>
          )}
        </motion.div>

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
