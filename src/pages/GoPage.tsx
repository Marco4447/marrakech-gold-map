import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Users, Star, Mail, Lock, User, Loader2, ExternalLink, Copy, Check, ArrowLeft } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import heroImage from "@/assets/marrakech-hero.jpg";
import { ttqTrack } from "@/lib/ttq";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import { isTikTokInAppBrowser, isInAppBrowser, redirectToExternalBrowser } from "@/lib/openInExternalBrowser";

const TESTIMONIALS = [
  { name: "Sophia", text: { fr: "Meilleur rooftop trouvé en 2 min 🔥", en: "Found the best rooftop in 2 min 🔥" }, flag: "🇫🇷" },
  { name: "Youssef", text: { fr: "Les deals VIP sont incroyables", en: "The VIP deals are amazing" }, flag: "🇲🇦" },
  { name: "Emma", text: { fr: "Indispensable pour sortir à Kech", en: "Essential for going out in Kech" }, flag: "🇬🇧" },
];

export default function GoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const { lang, t } = useLanguage();

  // Redirect authenticated users to home
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Signup state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isInApp = isInAppBrowser();
  const isTikTok = isTikTokInAppBrowser();
  const utmSource = searchParams.get("utm_source") || "direct";
  const utmCampaign = searchParams.get("utm_campaign") || "unknown";
  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (refCode) try { localStorage.setItem("weshkech_ref", refCode); } catch {}
  }, [refCode]);

  // Auto-attempt redirect for TikTok WebView
  useEffect(() => {
    if (isTikTok) {
      trackEvent("tiktok_webview_auto_redirect_attempt", { source: utmSource });
      redirectToExternalBrowser();
    }
  }, [isTikTok]);

  const { data: usersCount } = useQuery({
    queryKey: ["go-users-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Analytics
  useEffect(() => {
    ttqTrack("ViewContent", { content_name: "go_landing", description: `${utmSource}/${utmCampaign}` });
    trackEvent("go_page_view", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp, is_tiktok: isTikTok, referrer: document.referrer || "direct" });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenInBrowser = () => {
    trackEvent("go_open_external_browser", { browser: isTikTok ? "tiktok" : "other" });
    redirectToExternalBrowser();
  };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); } catch {
      const input = document.createElement("input"); input.value = window.location.href;
      document.body.appendChild(input); input.select(); document.execCommand("copy"); document.body.removeChild(input);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  // ---- Auth handlers ----
  const handleGoogleSignup = async () => {
    setLoading(true);
    trackEvent("go_google_signup_click", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp });
    ttqTrack("InitiateCheckout", { content_name: "google_signup_attempt" });
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (error) {
      console.error("OAuth error:", error);
      trackEvent("go_google_signup_error", { error: String(error), source: utmSource });
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    setError(null);
    if (!email || !password) {
      const msg = lang === "fr" ? "Remplis tous les champs." : "Fill in all fields.";
      setError(msg);
      trackEvent("go_signup_validation_error", { reason: "missing_fields", source: utmSource });
      return;
    }
    if (password.length < 6) {
      const msg = lang === "fr" ? "Mot de passe : 6 caractères min." : "Password: 6 characters min.";
      setError(msg);
      trackEvent("go_signup_validation_error", { reason: "password_too_short", source: utmSource });
      return;
    }
    setLoading(true);
    trackEvent("go_email_signup_submit", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp });
    ttqTrack("InitiateCheckout", { content_name: "email_signup_attempt" });
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name || email.split("@")[0] }, emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      trackEvent("go_email_signup_error", { error: error.message, source: utmSource, campaign: utmCampaign });
    } else {
      setSuccess(lang === "fr" ? "C'est bon, tu es inscrit ! 🎉" : "You're in! 🎉");
      trackEvent("go_email_signup_success", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp });
      ttqTrack("CompleteRegistration", { content_name: "email_signup" });
    }
    setLoading(false);
  };

  return (
    <div className="h-[100dvh] bg-background relative overflow-hidden flex flex-col">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Marrakech" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-20"><LanguageToggle /></div>

      {/* In-app browser banner */}
      {isInApp && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="absolute top-14 left-4 right-4 z-30 bg-gold backdrop-blur-md rounded-2xl p-3 shadow-[0_8px_30px_hsl(43_76%_52%/0.4)]">
          <p className="text-primary-foreground text-xs font-bold mb-2">
            {lang === "fr" ? "👆 Pour Google, ouvre dans Safari. Sinon inscris-toi par email ↓" : "👆 For Google, open in Safari. Or sign up with email ↓"}
          </p>
          <div className="flex gap-2">
            <button onClick={handleOpenInBrowser}
              className="flex-1 py-2 rounded-xl bg-background text-gold text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform shadow-md">
              <ExternalLink className="w-3.5 h-3.5" />
              {lang === "fr" ? "Ouvrir Safari" : "Open Safari"}
            </button>
            <button onClick={handleCopyLink}
              className="py-2 px-3 rounded-xl bg-background/80 text-gold text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "✓" : lang === "fr" ? "Copier" : "Copy"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Content — signup form directly visible */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-6 max-w-md mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-col">

          {/* Compact value prop header */}
          <h1 className="font-display text-2xl font-black text-center leading-tight text-foreground mb-1">
            {lang === "fr" ? (<>Les spots <span className="text-gold">tendance</span> à Marrakech</>) : (<><span className="text-gold">Trending</span> spots in Marrakech</>)}
          </h1>

          <div className="flex justify-center gap-3 mb-3">
            {(lang === "fr"
              ? [["🗺️", "Carte live"], ["🔥", "Tendances"], ["🎁", "Deals"]]
              : [["🗺️", "Live map"], ["🔥", "Trending"], ["🎁", "Deals"]]
            ).map(([emoji, label]) => (
              <span key={label} className="text-[10px] text-foreground/70">{emoji} {label}</span>
            ))}
          </div>

          {/* Social proof — single line */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            <span className="text-[11px] text-foreground/80">
              <span className="text-gold font-semibold">{usersCount || "…"}</span> {lang === "fr" ? "insiders" : "insiders"}
            </span>
            <span className="text-muted-foreground">·</span>
            <AnimatePresence mode="wait">
              <motion.span key={testimonialIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] text-muted-foreground">
                {TESTIMONIALS[testimonialIdx].flag} "{TESTIMONIALS[testimonialIdx].text[lang]}"
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Google CTA — primary if not in WebView */}
          {!isInApp && (
            <>
              <button onClick={handleGoogleSignup} disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-gold hover:bg-gold-light text-primary-foreground font-semibold py-4 rounded-2xl transition-all shadow-[0_0_30px_hsl(43,76%,52%,0.3)] disabled:opacity-70 text-base mb-3">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {lang === "fr" ? "Continuer avec Google" : "Continue with Google"}
              </button>
              <div className="flex items-center gap-3 w-full mb-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground">{lang === "fr" ? "ou par email" : "or with email"}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          {/* Email form */}
          {!success && (
            <div className="space-y-2.5">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder={lang === "fr" ? "Prénom (optionnel)" : "Name (optional)"}
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" placeholder="Email"
                  value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="password" placeholder={lang === "fr" ? "Mot de passe" : "Password"}
                  value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSignup()}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors" />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-destructive mt-2 text-center">{error}</p>}
          {success && <p className="text-sm text-green-400 mt-3 text-center font-medium">{success}</p>}

          {!success && (
            <button onClick={handleEmailSignup} disabled={loading}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-primary-foreground font-semibold py-3.5 rounded-2xl transition-all shadow-[0_0_30px_hsl(43,76%,52%,0.3)] disabled:opacity-70 text-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === "fr" ? "Inscription..." : "Signing up..."}</> : (
                <>{lang === "fr" ? "S'inscrire gratuitement" : "Sign up free"}</>
              )}
            </button>
          )}

          {/* Google fallback for in-app */}
          {isInApp && !success && (
            <>
              <div className="flex items-center gap-3 w-full my-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground">{lang === "fr" ? "ou" : "or"}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button onClick={handleGoogleSignup} disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-surface border border-border text-foreground font-medium py-3 rounded-2xl transition-all hover:border-gold/40 text-sm disabled:opacity-70">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {lang === "fr" ? "Continuer avec Google" : "Continue with Google"}
              </button>
            </>
          )}

          <p className="text-[8px] text-muted-foreground/60 text-center mt-3">
            {lang === "fr" ? "Gratuit · 10 sec" : "Free · 10 sec"} · {t("legalPrefix")}{" "}
            <Link to="/terms" className="text-gold/60 hover:underline">{t("terms")}</Link>{" "}{t("and")}{" "}
            <Link to="/privacy" className="text-gold/60 hover:underline">{t("privacy")}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
