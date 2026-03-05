import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Camera, Crown, ChevronRight, Sparkles, Zap, Users, BadgeCheck, Loader2, Star, TrendingUp } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import heroImage from "@/assets/marrakech-hero.jpg";
import { ttqTrack } from "@/lib/ttq";

// ---- Social proof testimonials ----
const TESTIMONIALS = [
  { name: "Sophia", text: "J'ai trouvé le meilleur rooftop en 2 min 🔥", flag: "🇫🇷" },
  { name: "Youssef", text: "Les deals VIP sont incroyables", flag: "🇲🇦" },
  { name: "Emma", text: "Indispensable pour sortir à Kech", flag: "🇬🇧" },
];

export default function GoPage() {
  const navigate = useNavigate();
  const [liveVibes, setLiveVibes] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    // Track TikTok ViewContent
    ttqTrack("ViewContent", { content_name: "go_landing" });

    // Fetch counts
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    supabase
      .from("vibes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sixHoursAgo)
      .then(({ count }) => setLiveVibes(count || 0));

    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setUsersCount(count || 0));
  }, []);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    ttqTrack("CompleteRegistration", { content_name: "go_landing_signup" });
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      console.error("OAuth error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden flex flex-col">
      {/* Hero background — static image, fast load */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Marrakech"
          className="w-full h-full object-cover opacity-25"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/50" />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-5 pt-10 pb-28 max-w-md mx-auto w-full">
        
        {/* ===== BADGE "VU SUR TIKTOK" ===== */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 px-4 py-1.5 rounded-full mb-5"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span className="text-[11px] font-bold text-gold uppercase tracking-wider">Vu sur TikTok</span>
        </motion.div>

        {/* ===== HEADLINE ===== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-5"
        >
          <h1 className="font-display text-[2.5rem] font-black leading-[1.1] tracking-tight">
            <span className="text-gold">Les meilleurs spots</span>
            <br />
            <span className="text-foreground">de Marrakech</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed max-w-[300px] mx-auto">
            Carte live · Photos éphémères · Deals exclusifs
          </p>
        </motion.div>

        {/* ===== LIVE COUNTERS (urgency) ===== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-3 mb-6"
        >
          {liveVibes !== null && (
            <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 rounded-full px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
              <span className="text-xs font-bold text-destructive-foreground">{liveVibes} vibes live</span>
            </div>
          )}
          {usersCount !== null && (
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5">
              <Users className="w-3 h-3 text-gold" />
              <span className="text-xs font-semibold text-foreground">{usersCount}+ insiders</span>
            </div>
          )}
        </motion.div>

        {/* ===== MAIN CTA — above fold ===== */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          onClick={handleGoogleLogin}
          disabled={loading}
          className="cta-shimmer relative w-full overflow-hidden bg-gold hover:bg-gold-light active:scale-[0.97] text-primary-foreground font-bold py-4 rounded-2xl transition-all shadow-[0_8px_30px_-6px_hsl(43_76%_52%/0.4)] text-base tracking-wide flex items-center justify-center gap-2.5 disabled:opacity-70 mb-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connexion...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Rejoindre gratuitement
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
        <p className="text-[10px] text-muted-foreground text-center mb-7">
          Gratuit · 10 sec · Pas d'app à installer
        </p>

        {/* ===== 3 VALUE PROPS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full space-y-2.5 mb-7"
        >
          {[
            { emoji: "🗺️", title: "Carte des 30 meilleurs spots", desc: "Rooftops, restos, clubs — le vrai Marrakech", icon: MapPin },
            { emoji: "📸", title: "Vibes en temps réel", desc: "Photos live qui disparaissent après 6h", icon: Camera },
            { emoji: "🎁", title: "Deals exclusifs", desc: "Réductions et accès VIP chez nos partenaires", icon: Crown },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-start gap-3 bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">{f.emoji}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ===== SOCIAL PROOF CAROUSEL ===== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full mb-7"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3 h-3 text-gold" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ce que disent nos insiders</span>
          </div>
          <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-4 min-h-[60px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-3"
              >
                <span className="text-lg">{TESTIMONIALS[testimonialIdx].flag}</span>
                <div>
                  <p className="text-xs text-foreground font-medium">{TESTIMONIALS[testimonialIdx].text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">— {TESTIMONIALS[testimonialIdx].name}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ===== B2B CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="w-full"
        >
          <div className="relative rounded-2xl border border-gold/15 bg-card/40 backdrop-blur-sm p-4 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <BadgeCheck className="w-5 h-5 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Vous êtes un établissement ?
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Boostez votre visibilité auprès de {usersCount || "500"}+ visiteurs actifs.
                </p>
                <Link
                  to="/business"
                  className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-gold hover:text-gold-light transition-colors"
                >
                  Devenir partenaire <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Legal */}
        <p className="text-[9px] text-muted-foreground mt-6 text-center leading-relaxed max-w-[280px]">
          En continuant, vous acceptez nos{" "}
          <Link to="/terms" className="text-gold hover:underline">CGU</Link>
          {" "}et notre{" "}
          <Link to="/privacy" className="text-gold hover:underline">Politique de confidentialité</Link>.
        </p>

        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          🇲🇦 Made in Marrakech
        </p>
      </div>

      {/* ===== STICKY CTA — always visible ===== */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="cta-shimmer relative w-full overflow-hidden bg-gold hover:bg-gold-light active:scale-[0.97] text-primary-foreground font-bold py-3.5 rounded-2xl transition-all shadow-[0_8px_30px_-6px_hsl(43_76%_52%/0.4)] text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Rejoindre — C'est gratuit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
