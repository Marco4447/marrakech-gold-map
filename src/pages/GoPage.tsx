import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Users, Star, Mail, Lock, User, Loader2, ExternalLink, Copy, Check, ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
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

type ViewMode = "hero" | "signup";

export default function GoPage() {
  const [searchParams] = useSearchParams();
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<ViewMode>("hero");
  const { lang, t } = useLanguage();

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

  const { data: recentVibeImages } = useQuery({
    queryKey: ["go-recent-vibe-images"],
    queryFn: async () => {
      const { data } = await supabase.from("vibes").select("image_url").order("created_at", { ascending: false }).limit(6);
      return data || [];
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
    trackEvent("go_google_signup_click", { source: utmSource });
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (error) { console.error("OAuth error:", error); setLoading(false); }
  };

  const handleEmailSignup = async () => {
    setError(null);
    if (!email || !password) { setError(lang === "fr" ? "Remplis tous les champs." : "Fill in all fields."); return; }
    if (password.length < 6) { setError(lang === "fr" ? "Mot de passe : 6 caractères min." : "Password: 6 characters min."); return; }
    setLoading(true);
    trackEvent("go_email_signup_submit", { source: utmSource });
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name || email.split("@")[0] }, emailRedirectTo: window.location.origin },
    });
    if (error) { setError(error.message); } else {
      setSuccess(lang === "fr" ? "Check ta boîte mail pour confirmer 📩" : "Check your inbox to confirm 📩");
      ttqTrack("CompleteRegistration", { content_name: "email_signup" });
    }
    setLoading(false);
  };

  const showSignup = () => {
    trackEvent("go_cta_clicked", { cta: "main", source: utmSource, campaign: utmCampaign });
    setView("signup");
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
      {isInApp && view === "hero" && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="absolute top-14 left-4 right-4 z-30 bg-gold backdrop-blur-md rounded-2xl p-4 shadow-[0_8px_30px_hsl(43_76%_52%/0.4)]">
          <p className="text-primary-foreground text-sm font-bold mb-1">
            {lang === "fr" ? "👆 Ouvre dans Safari" : "👆 Open in Safari"}
          </p>
          <p className="text-primary-foreground/90 text-xs leading-relaxed mb-3">
            {lang === "fr" ? "Pour Google, ouvre dans ton navigateur. Sinon inscris-toi par email ci-dessous ↓" : "For Google, open in your browser. Or sign up with email below ↓"}
          </p>
          <div className="flex gap-2">
            <button onClick={handleOpenInBrowser}
              className="flex-1 py-2.5 rounded-xl bg-background text-gold text-sm font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform shadow-md">
              <ExternalLink className="w-4 h-4" />
              {lang === "fr" ? "Ouvrir Safari" : "Open Safari"}
            </button>
            <button onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-background/80 text-gold text-sm font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "✓" : lang === "fr" ? "Copier" : "Copy"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-6 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {view === "hero" ? (
            <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}
              className="flex flex-col">

              {/* Live photo strip */}
              {recentVibeImages && recentVibeImages.length > 0 && (
                <div className="flex gap-1.5 mb-5 justify-center">
                  {recentVibeImages.slice(0, 5).map((v, i) => (
                    <div key={i} className="w-11 h-11 rounded-xl overflow-hidden border border-gold/30"
                      style={{ opacity: i > 2 ? 0.5 : 1, filter: i > 2 ? "blur(3px)" : "none" }}>
                      <img src={v.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="w-11 h-11 rounded-xl border border-dashed border-gold/40 flex items-center justify-center bg-gold/5">
                    <span className="text-[9px] text-gold font-bold">+{usersCount || 50}</span>
                  </div>
                </div>
              )}

              {/* Headline */}
              <div className="text-center mb-4">
                <h1 className="font-display text-[2rem] font-black leading-[1.1] tracking-tight text-foreground">
                  {lang === "fr" ? (<>Les spots que<br /><span className="text-gold">tout le monde cherche</span><br />à Marrakech</>) : (<>The spots<br /><span className="text-gold">everyone's looking for</span><br />in Marrakech</>)}
                </h1>
              </div>

              {/* Value props */}
              <div className="flex justify-center gap-4 mb-5">
                {(lang === "fr"
                  ? [["🗺️", "Carte live"], ["🔥", "Spots tendance"], ["🎁", "Deals exclusifs"]]
                  : [["🗺️", "Live map"], ["🔥", "Trending spots"], ["🎁", "Exclusive deals"]]
                ).map(([emoji, label]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="text-sm">{emoji}</span>
                    <span className="text-[11px] text-foreground/80 font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="flex items-center gap-1.5 bg-card/60 backdrop-blur-sm border border-border rounded-full px-3 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                  </span>
                  <span className="text-[11px] font-semibold text-foreground">
                    <span className="text-gold">{usersCount || "…"}</span> {lang === "fr" ? "insiders actifs" : "active insiders"}
                  </span>
                </div>
              </div>

              {/* Testimonial */}
              <div className="mb-5 h-5 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p key={testimonialIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
                    className="text-center text-[11px] text-muted-foreground">
                    {TESTIMONIALS[testimonialIdx].flag} "{TESTIMONIALS[testimonialIdx].text[lang]}" — {TESTIMONIALS[testimonialIdx].name}
                    {" "}<span className="inline-flex gap-px align-middle">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-2 h-2 text-gold fill-gold inline" />)}
                    </span>
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* PRIMARY CTA — goes to signup form */}
              <button onClick={showSignup}
                className="cta-shimmer relative w-full overflow-hidden bg-gold hover:bg-gold-light active:scale-[0.97] text-primary-foreground font-bold py-4 rounded-2xl transition-all shadow-[0_8px_30px_-6px_hsl(43_76%_52%/0.4)] text-base tracking-wide flex items-center justify-center gap-2.5 mb-3">
                <Flame className="w-5 h-5" />
                {lang === "fr" ? "Rejoindre gratuitement" : "Join for free"}
              </button>

              <p className="text-center text-[10px] text-muted-foreground mb-4">
                {lang === "fr" ? "Gratuit · 10 sec · Pas d'app à installer" : "Free · 10 sec · No app to install"}
              </p>

              <p className="text-[8px] text-muted-foreground/60 text-center">
                {t("legalPrefix")}{" "}
                <Link to="/terms" className="text-gold/60 hover:underline">{t("terms")}</Link>{" "}{t("and")}{" "}
                <Link to="/privacy" className="text-gold/60 hover:underline">{t("privacy")}</Link>
              </p>
            </motion.div>
          ) : (
            /* ====== SIGNUP FORM ====== */
            <motion.div key="signup" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col">

              {/* Back */}
              <button onClick={() => { setView("hero"); setError(null); setSuccess(null); }}
                className="self-start flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ArrowLeft className="w-4 h-4" />
                {lang === "fr" ? "Retour" : "Back"}
              </button>

              <h2 className="font-display text-xl font-bold text-foreground text-center mb-1">
                {lang === "fr" ? "Crée ton compte" : "Create your account"}
              </h2>
              <p className="text-xs text-muted-foreground text-center mb-5">
                {lang === "fr" ? "Accède aux spots et deals en 10 secondes" : "Access spots & deals in 10 seconds"}
              </p>

              {/* Google CTA — primary if not in WebView */}
              {!isInApp && (
                <>
                  <button onClick={handleGoogleSignup} disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-gold hover:bg-gold-light text-primary-foreground font-semibold py-4 rounded-2xl transition-all shadow-[0_0_30px_hsl(43,76%,52%,0.3)] disabled:opacity-70 text-base mb-4">
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
                  <div className="flex items-center gap-3 w-full mb-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{lang === "fr" ? "ou par email" : "or with email"}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                </>
              )}

              {/* Email form */}
              {!success && (
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" placeholder={lang === "fr" ? "Prénom (optionnel)" : "Name (optional)"}
                      value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="email" placeholder="Email"
                      value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="password" placeholder={lang === "fr" ? "Mot de passe" : "Password"}
                      value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      onKeyDown={(e) => e.key === "Enter" && handleEmailSignup()}
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors" />
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-destructive mt-3 text-center">{error}</p>}
              {success && <p className="text-sm text-green-400 mt-3 text-center font-medium">{success}</p>}

              {!success && (
                <button onClick={handleEmailSignup} disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-primary-foreground font-semibold py-4 rounded-2xl transition-all shadow-[0_0_30px_hsl(43,76%,52%,0.3)] disabled:opacity-70 text-base">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {lang === "fr" ? "Inscription..." : "Signing up..."}</> : (
                    <>{lang === "fr" ? "S'inscrire" : "Sign up"}</>
                  )}
                </button>
              )}

              {/* Google fallback for in-app */}
              {isInApp && !success && (
                <>
                  <div className="flex items-center gap-3 w-full my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{lang === "fr" ? "ou" : "or"}</span>
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

              <p className="text-[8px] text-muted-foreground/60 text-center mt-4">
                {t("legalPrefix")}{" "}
                <Link to="/terms" className="text-gold/60 hover:underline">{t("terms")}</Link>{" "}{t("and")}{" "}
                <Link to="/privacy" className="text-gold/60 hover:underline">{t("privacy")}</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
