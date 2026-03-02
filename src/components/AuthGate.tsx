import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { lovable } from "@/integrations/lovable/index";
import heroImage from "@/assets/marrakech-hero.jpg";

export default function AuthGate() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      console.error("OAuth error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Marrakech"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center px-8 text-center max-w-sm"
      >
        {/* Logo / Icon */}
        <div className="w-20 h-20 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mb-6">
          <MapPin className="w-9 h-9 text-gold" />
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-1">
          <span className="text-foreground">Weshkech</span>
        </h1>
        <h2 className="font-body text-lg font-light text-gold tracking-wide mb-2">
          Marrakech Live Vibes
        </h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-[280px]">
          L'énergie de Marrakech, sans filtre et en temps réel. Découvrez les spots les plus chauds du moment et profitez de vos avantages Pass Invité.
        </p>

        {/* Pillars */}
        <div className="flex gap-4 mb-10">
          {[
            { icon: "🗺️", label: "Map" },
            { icon: "⚡", label: "Live" },
            { icon: "🎁", label: "Pass" },
          ].map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-lg">
                {p.icon}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{p.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Google CTA */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-gold hover:bg-gold-light text-primary-foreground font-semibold py-4 rounded-2xl transition-all shadow-[0_0_30px_hsl(43,76%,52%,0.3)] disabled:opacity-70 text-base"
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
              Continuer avec Google
            </>
          )}
        </motion.button>

        <p className="text-[10px] text-muted-foreground mt-5 leading-relaxed max-w-[280px]">
          En continuant, vous acceptez nos{" "}
          <Link to="/terms" className="text-gold hover:underline">Conditions Générales</Link>
          {" "}et notre{" "}
          <Link to="/privacy" className="text-gold hover:underline">Politique de Confidentialité</Link>.
        </p>

        <div className="flex items-center gap-1.5 mt-3">
          <Sparkles className="w-3 h-3 text-gold/50" />
          <span className="text-[10px] text-muted-foreground">100% gratuit · Accès instantané</span>
        </div>
      </motion.div>
    </div>
  );
}
