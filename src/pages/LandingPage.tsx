import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Camera, Gift, ChevronDown, MessageCircle, Star } from "lucide-react";
import heroImage from "@/assets/marrakech-hero.jpg";

const WA_NUMBER = "+33607564453";
const WA_MSG = encodeURIComponent("Bonjour, je suis intéressé par le partenariat WeshKech.");

// Spots populaires (hardcoded pour le splash — remplacés par des vrais quand la DB se charge)
const FEATURED_SPOTS = [
  { name: "Kabana", category: "Rooftop", checkins: 24, slug: "kabana" },
  { name: "Nomad", category: "Restaurant", checkins: 18, slug: "nomad" },
  { name: "Theatro", category: "Club", checkins: 42, slug: "theatro" },
  { name: "Café Arabe", category: "Rooftop", checkins: 15, slug: "cafe-arabe" },
  { name: "Baromètre", category: "Bar", checkins: 31, slug: "barometre" },
  { name: "Le Jardin", category: "Restaurant", checkins: 12, slug: "le-jardin" },
];

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-[100dvh] bg-background overflow-x-hidden">
      {/* ════════════ HERO — FULL SCREEN ════════════ */}
      <section className="relative h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="mb-6"
          >
            <img src="/logo_72.png" alt="WeshKech" className="w-16 h-16 rounded-2xl shadow-2xl" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h1 className="font-display text-4xl font-black text-white leading-[1.1] tracking-tight">
              Découvre où ça bouge à Marrakech.
            </h1>
            <p className="text-gold font-display text-lg font-bold mt-1">En temps réel.</p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-white/60 text-sm mt-4 leading-relaxed max-w-xs"
          >
            Spots, vibes, offres VIP — tout ce que tu as besoin de savoir pour ta soirée.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex gap-3 mt-8 w-full"
          >
            <button
              onClick={onEnterApp}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg shadow-gold/30"
              style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
            >
              Explorer 🗺️
            </button>
            <Link
              to="/business"
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-white/80 border border-white/20 hover:border-white/40 flex items-center justify-center gap-2 backdrop-blur-md transition-colors"
            >
              Établissement 🏢
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="w-6 h-6 text-white/30" />
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════ COMMENT ÇA MARCHE ════════════ */}
      <section className="px-5 py-14 max-w-lg mx-auto space-y-8">
        <FadeIn>
          <h2 className="font-display text-2xl font-bold text-foreground text-center">
            Comment ça marche
          </h2>
        </FadeIn>

        {[
          {
            icon: MapPin,
            title: "Trouve les meilleurs spots",
            desc: "Carte live avec les endroits qui bougent ce soir.",
            color: "bg-blue-500/10 border-blue-500/20 text-blue-400",
          },
          {
            icon: Camera,
            title: "Partage tes vibes",
            desc: "Poste tes photos et vidéos, montre où tu es.",
            color: "bg-pink-500/10 border-pink-500/20 text-pink-400",
          },
          {
            icon: Gift,
            title: "Profite d'offres VIP",
            desc: "Cocktails offerts, entrées VIP, bons plans exclusifs.",
            color: "bg-gold/10 border-gold/20 text-gold",
          },
        ].map((card, i) => (
          <FadeIn key={i} delay={i * 0.15}>
            <div className="flex gap-4 items-start">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{card.desc}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      {/* ════════════ SPOTS DU MOMENT ════════════ */}
      <section className="py-14 space-y-6">
        <FadeIn className="px-5 max-w-lg mx-auto">
          <h2 className="font-display text-2xl font-bold text-foreground text-center">
            Les spots du moment
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Ce soir à Marrakech
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2">
            {FEATURED_SPOTS.map((spot, i) => (
              <button
                key={spot.slug}
                onClick={onEnterApp}
                className="shrink-0 w-[160px] rounded-2xl overflow-hidden bg-card border border-border hover:border-gold/30 transition-colors active:scale-[0.97] text-left"
              >
                {/* Placeholder gradient (no real images on splash) */}
                <div className="aspect-[4/3] bg-gradient-to-br from-gold/10 via-background to-gold/5 flex items-center justify-center">
                  <span className="text-3xl opacity-30">🗺️</span>
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-bold text-foreground truncate">{spot.name}</p>
                  <p className="text-[10px] text-muted-foreground">{spot.category}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-green-400 font-medium">{spot.checkins} ici</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.3} className="px-5 max-w-lg mx-auto">
          <button
            onClick={onEnterApp}
            className="w-full py-3 rounded-xl font-bold text-sm text-primary-foreground active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
          >
            Voir tous les spots →
          </button>
        </FadeIn>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ════════════ SECTION PARTENAIRES ════════════ */}
      <section className="px-5 py-14 max-w-lg mx-auto space-y-6">
        <FadeIn>
          <div className="bg-card/80 border border-gold/20 rounded-3xl p-6 text-center space-y-4">
            <span className="text-3xl">🏢</span>
            <h2 className="font-display text-lg font-bold text-foreground">
              Vous êtes un restaurant, rooftop ou club ?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Rejoignez les établissements qui remplissent leur terrasse grâce à la communauté WeshKech.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/business"
                className="w-full py-3 rounded-xl font-bold text-sm text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
              >
                En savoir plus →
              </Link>
              <a
                href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-green-400 border border-green-500/30 flex items-center justify-center gap-2 hover:bg-green-500/5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Nous contacter
              </a>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="px-5 py-8 max-w-lg mx-auto text-center space-y-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pt-2">
          <Link to="/terms" className="hover:text-foreground transition-colors">CGU</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
        </div>
        <p className="text-[10px] text-muted-foreground/50">
          Made with 🔥 in Marrakech
        </p>
      </footer>
    </div>
  );
}
