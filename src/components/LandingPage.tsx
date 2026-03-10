import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { trackEvent } from "@/lib/analytics";
import { Link } from "react-router-dom";
import MockVibesPreview from "@/components/landing/MockVibesPreview";

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage = forwardRef<HTMLDivElement, LandingPageProps>(({ onEnter }, ref) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [insiderCount, setInsiderCount] = useState<number | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => {
      setInsiderCount(count ?? 0);
    });
  }, []);

  // Listen for auth state change to auto-enter
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setTimeout(onEnter, 1200);
      }
    });
    return () => subscription.unsubscribe();
  }, [onEnter]);

  const handleGoogleSignup = async () => {
    setLoading(true);
    trackEvent("landing_google_signup_click");
    await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    setLoading(false);
  };

  const handleEmailSignup = async () => {
    setError(null);
    if (!email || !email.includes("@")) { setError("Entre ton email."); return; }
    if (!password || password.length < 6) { setError("Mot de passe : 6 caractères min."); return; }
    setLoading(true);
    trackEvent("landing_email_signup_submit");

    // Submit to Formspree (fire-and-forget)
    fetch("https://formspree.io/f/xdawajaq", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: email.split("@")[0] }, emailRedirectTo: window.location.origin },
    });

    if (signupError) {
      if (signupError.message?.includes("already registered") || signupError.message?.includes("already been registered")) {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
          setError("Email déjà utilisé ou mot de passe incorrect.");
        } else {
          setSuccess(true);
          trackEvent("landing_email_login_success");
        }
      } else {
        setError(signupError.message);
      }
    } else {
      setSuccess(true);
      trackEvent("landing_email_signup_success");
      if (signupData.session) {
        // Auto-confirmed, will trigger onAuthStateChange
      }
    }
    setLoading(false);
  };

  return (
    <motion.div
      ref={ref}
      className="fixed inset-0 z-[3000] flex flex-col items-center justify-center bg-black overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Full-screen blurred background */}
      <div className="absolute inset-0">
        <img
          src="/images/landing-bg-dark.jpg"
          alt=""
          className="w-full h-full object-cover scale-110 blur-sm brightness-[0.35]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      {/* Floating particles / ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(220,90%,50%)] opacity-[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] rounded-full bg-[hsl(25,95%,55%)] opacity-[0.05] blur-[100px] pointer-events-none" />

      {/* Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-[calc(100%-2rem)] max-w-[400px] mx-auto"
      >
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.06] backdrop-blur-2xl shadow-[0_8px_60px_-12px_rgba(0,0,0,0.7)] p-6 sm:p-8 space-y-6">
          
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] text-[11px] font-medium tracking-[0.15em] uppercase text-white/70">
              <Lock className="w-3 h-3" />
              Accès privé
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-center space-y-3"
          >
            <h1 className="text-[22px] sm:text-[26px] font-bold text-white leading-[1.2] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Le Marrakech que les touristes ne verront jamais.
            </h1>
            <p className="text-[13px] sm:text-[14px] text-white/50 leading-relaxed">
              3 rooftops secrets à Guéliz. 2 speakeasys cachés dans la Médina. Débloque la carte.
            </p>
          </motion.div>

          {/* Form or Success */}
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="space-y-3"
              >
                {/* Google CTA */}
                <button
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-white text-black font-semibold text-[14px] transition-all active:scale-[0.98] disabled:opacity-60 hover:bg-white/90"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Débloquer l'accès
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/[0.08]" />
                  <span className="text-[11px] text-white/30">ou par email</span>
                  <div className="flex-1 h-px bg-white/[0.08]" />
                </div>

                {/* Email input */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Entrez votre email..."
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-[14px] placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                {/* Password */}
                <input
                  type="password"
                  placeholder="Mot de passe (6+ car.)"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSignup()}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-[14px] placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
                />

                {/* Email submit */}
                <button
                  onClick={handleEmailSignup}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-white/[0.08] border border-white/[0.1] text-white/70 font-medium text-[13px] transition-all active:scale-[0.98] disabled:opacity-60 hover:bg-white/[0.12] hover:text-white"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "S'inscrire par email"}
                </button>

                {error && (
                  <p className="text-[12px] text-red-400 text-center">{error}</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-3 py-2"
              >
                <div className="text-3xl">🎉</div>
                <p className="text-[15px] font-semibold text-white">Vous êtes sur la liste.</p>
                <p className="text-[12px] text-white/40">Redirection en cours...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex items-center justify-center gap-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[11px] text-white/40">
              Rejoignez <span className="text-white/60 font-medium">+{insiderCount !== null ? insiderCount : "…"}</span> Insiders déjà présents
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Mock vibes preview */}
      <MockVibesPreview />

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-6 left-0 right-0 text-center space-y-1.5 z-10"
      >
        <p className="text-[10px] text-white/20">
          Weshkech © 2026 — Invitation Only.
        </p>
        <p className="text-[9px] text-white/15">
          <Link to="/terms" className="underline hover:text-white/30">Conditions</Link>
          {" · "}
          <Link to="/privacy" className="underline hover:text-white/30">Confidentialité</Link>
        </p>
      </motion.div>

      {/* Hidden SEO */}
      <div className="sr-only">
        <h1>WeshKech – Discover the Best Spots in Marrakech</h1>
        <h2>Marrakech Nightlife Guide — Bars, Clubs & Night Spots</h2>
        <h2>Best Rooftops in Marrakech — Sunset Views & Cocktails</h2>
        <p>Discover where to go in Marrakech tonight. WeshKech is the local guide that shows you the best bars, rooftops, restaurants and clubs in Marrakech in real time.</p>
      </div>
    </motion.div>
  );
});

LandingPage.displayName = "LandingPage";
export default LandingPage;
