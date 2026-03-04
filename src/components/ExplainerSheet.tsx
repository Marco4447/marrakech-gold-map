import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Camera, Gift, Star, Zap, TrendingUp, Users, BarChart3, Megaphone, ChevronRight, Crown, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";

interface ExplainerSheetProps {
  open: boolean;
  onClose: () => void;
  initialTab?: "insider" | "partner";
  showAuthCta?: boolean;
  onEnter?: () => void;
}

const insiderPerks = [
  { icon: "🗺️", title: "Carte interactive", desc: "Les 30 meilleurs spots de Marrakech géolocalisés, mis à jour en temps réel." },
  { icon: "📸", title: "Vibes éphémères", desc: "Un flux photo/vidéo live — les posts disparaissent après 6h, que du frais." },
  { icon: "🎁", title: "Pass Invité", desc: "Des réductions et avantages exclusifs chez nos établissements partenaires." },
  { icon: "⚡", title: "Alertes live", desc: "Soyez les premiers informés des événements et soirées du moment." },
  { icon: "👑", title: "Insider Pass VIP", desc: "Badge doré, stats perso et accès prioritaire pour 4,90€/mois." },
];

const partnerPerks = [
  { icon: "📍", title: "Fiche établissement", desc: "Votre lieu sur la carte avec description, photos et itinéraire Google Maps intégré." },
  { icon: "📸", title: "Publications officielles", desc: "Publiez des vibes avec le badge ✓ officiel pour attirer plus de visiteurs." },
  { icon: "📊", title: "Analytics & visibilité", desc: "Suivez les vues, clics et engagement sur votre fiche en temps réel." },
  { icon: "🎁", title: "Offres exclusives", desc: "Proposez des deals Pass Invité pour attirer de nouveaux clients qualifiés." },
  { icon: "🚀", title: "Mise en avant", desc: "Apparaissez en priorité dans le classement et les suggestions de la carte." },
];

export default function ExplainerSheet({ open, onClose, initialTab = "insider", showAuthCta = false, onEnter }: ExplainerSheetProps) {
  const [tab, setTab] = useState<"insider" | "partner">(initialTab);

  if (!open) return null;

  const perks = tab === "insider" ? insiderPerks : partnerPerks;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[5000] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-md bg-card border-t border-border rounded-t-3xl max-h-[85dvh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Close */}
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="px-6 pb-8 pt-2">
              {/* Tab switcher */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTab("insider")}
                  className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    tab === "insider"
                      ? "bg-gold text-primary-foreground shadow-[0_4px_20px_hsl(43,76%,52%,0.3)]"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  Insider
                </button>
                <button
                  onClick={() => setTab("partner")}
                  className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    tab === "partner"
                      ? "bg-gold text-primary-foreground shadow-[0_4px_20px_hsl(43,76%,52%,0.3)]"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <BadgeCheck className="w-4 h-4" />
                  Partenaire
                </button>
              </div>

              {/* Header */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: tab === "insider" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: tab === "insider" ? 20 : -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                    {tab === "insider" ? "Devenez Insider" : "Devenez Partenaire"}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                    {tab === "insider"
                      ? "Rejoignez la communauté qui vit Marrakech en temps réel. Gratuit, instantané."
                      : "Boostez votre visibilité auprès d'une audience qualifiée de voyageurs et résidents."}
                  </p>

                  {/* Perks list */}
                  <div className="space-y-3">
                    {perks.map((perk, i) => (
                      <motion.div
                        key={perk.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/50 border border-border"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-base">{perk.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{perk.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{perk.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="mt-6 space-y-3">
                    {tab === "insider" ? (
                      <>
                        {showAuthCta ? (
                          <button
                            onClick={onEnter}
                            className="w-full py-3.5 rounded-2xl bg-gold hover:bg-gold-light text-primary-foreground font-bold text-sm transition-all shadow-[0_6px_24px_hsl(43,76%,52%,0.3)] flex items-center justify-center gap-2"
                          >
                            S'inscrire gratuitement
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <Link
                            to="/pricing"
                            className="w-full py-3.5 rounded-2xl bg-gold hover:bg-gold-light text-primary-foreground font-bold text-sm transition-all shadow-[0_6px_24px_hsl(43,76%,52%,0.3)] flex items-center justify-center gap-2"
                          >
                            <Star className="w-4 h-4" />
                            Découvrir l'Insider Pass
                          </Link>
                        )}
                      </>
                    ) : (
                      <Link
                        to="/business"
                        className="w-full py-3.5 rounded-2xl bg-gold hover:bg-gold-light text-primary-foreground font-bold text-sm transition-all shadow-[0_6px_24px_hsl(43,76%,52%,0.3)] flex items-center justify-center gap-2"
                      >
                        Inscrire mon établissement
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>

                  {/* Trust line */}
                  <p className="text-center text-[10px] text-muted-foreground mt-4">
                    {tab === "insider"
                      ? "✨ 100% gratuit · Inscription en 10 secondes · Aucune carte requise"
                      : "🤝 Inscription gratuite · Activation sous 24h · Support dédié"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
