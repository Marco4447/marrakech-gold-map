import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Mail, Loader2, ExternalLink, Copy, Check, MapPin, Flame, Users, Clock } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import heroImage from "@/assets/marrakech-hero.jpg";
import { ttqTrack, ttqIdentify } from "@/lib/ttq";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import { isTikTokInAppBrowser, isInAppBrowser, redirectToExternalBrowser } from "@/lib/openInExternalBrowser";

const TESTIMONIALS = [
  { name: "Sophia", text: { fr: "Meilleur rooftop trouvé en 2 min 🔥", en: "Found the best rooftop in 2 min 🔥" }, flag: "🇫🇷" },
  { name: "Youssef", text: { fr: "Les deals VIP sont incroyables", en: "The VIP deals are amazing" }, flag: "🇲🇦" },
  { name: "Emma", text: { fr: "Indispensable pour sortir à Kech", en: "Essential for going out in Kech" }, flag: "🇬🇧" },
  { name: "Lucas", text: { fr: "J'ai eu un cocktail gratuit dès le 1er soir", en: "Got a free cocktail on the first night" }, flag: "🇫🇷" },
  { name: "Amina", text: { fr: "La carte live c'est un game changer", en: "The live map is a game changer" }, flag: "🇲🇦" },
];

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

export default function GoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const { lang, t } = useLanguage();

  // Redirect authenticated users to home + capture Google signup completion after OAuth callback
  useEffect(() => {
    if (!authLoading && user) {
      try {
        const pendingRaw = sessionStorage.getItem("wk_google_signup_pending");
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw) as { source?: string; campaign?: string };
          const source = pending.source || "direct";
          const campaign = pending.campaign || "unknown";
          const trackedKey = `wk_google_signup_tracked_${user.id}`;

          if (!sessionStorage.getItem(trackedKey)) {
            trackEvent("go_google_signup_success", { source, campaign });
            trackEvent("sign_up", { method: "google", source, campaign });
            ttqTrack("CompleteRegistration", { content_name: "google_signup", source, campaign });
            sessionStorage.setItem(trackedKey, "1");
          }

          sessionStorage.removeItem("wk_google_signup_pending");
        }
      } catch {
        // no-op
      }

      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Signup state
  const [email, setEmail] = useState("");
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

  // Track TikTok WebView visits
  useEffect(() => {
    if (isTikTok) {
      trackEvent("tiktok_webview_detected", { source: utmSource });
    }
  }, [isTikTok]);

  // --- Live data for social proof ---
  const { data: usersCount } = useQuery({
    queryKey: ["go-users-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: liveStats } = useQuery({
    queryKey: ["go-live-stats"],
    queryFn: async () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const [checkinsRes, vibesRes, placesRes] = await Promise.all([
        supabase.from("checkins").select("id", { count: "exact", head: true }).gte("created_at", threeHoursAgo),
        supabase.from("vibes").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("places").select("id", { count: "exact", head: true }),
      ]);

      return {
        activeNow: Math.max(checkinsRes.count || 0, 3), // min 3 for social proof
        vibesToday: vibesRes.count || 0,
        totalPlaces: placesRes.count || 0,
      };
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const animatedUsers = useCountUp(usersCount || 0);
  const animatedPlaces = useCountUp(liveStats?.totalPlaces || 0);

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
    try {
      sessionStorage.setItem(
        "wk_google_signup_pending",
        JSON.stringify({ source: utmSource, campaign: utmCampaign, at: Date.now() })
      );
    } catch {
      // ignore storage errors
    }

    trackEvent("go_google_signup_click", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp });
    ttqTrack("InitiateCheckout", { content_name: "google_signup_attempt" });

    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (error) {
      console.error("OAuth error:", error);
      try {
        sessionStorage.removeItem("wk_google_signup_pending");
      } catch {
        // ignore storage errors
      }
      trackEvent("go_google_signup_error", { error: String(error), source: utmSource });
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    setError(null);
    if (!email || !email.includes("@")) {
      setError(lang === "fr" ? "Entre ton email." : "Enter your email.");
      trackEvent("go_signup_validation_error", { reason: "invalid_email", source: utmSource });
      return;
    }
    setLoading(true);
    trackEvent("go_email_signup_submit", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp });
    ttqTrack("InitiateCheckout", { content_name: "magic_link_attempt" });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: { full_name: email.split("@")[0] },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setError(error.message);
      trackEvent("go_email_signup_error", { error: error.message, source: utmSource, campaign: utmCampaign });
    } else {
      setSuccess(lang === "fr" ? "Lien envoyé ! Vérifie ta boîte mail 📩" : "Link sent! Check your inbox 📩");
      trackEvent("go_email_signup_success", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp });
      ttqTrack("CompleteRegistration", { content_name: "magic_link" });
    }
    setLoading(false);
  };

  // Tonight's hour for urgency
  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 17 || currentHour < 4;

  return (
    <div className="h-[100dvh] bg-background relative overflow-hidden flex flex-col">
      {/* Hero image — top portion */}
      <div className="relative w-full aspect-[4/5] max-h-[45vh] flex-shrink-0">
        <img src={heroImage} alt="Marrakech" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Live badge overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-background/80 backdrop-blur-md border border-border rounded-full px-3 py-1.5"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <span className="text-[11px] font-semibold text-foreground">
            {liveStats?.activeNow || "…"} {lang === "fr" ? "connectés" : "online"}
          </span>
        </motion.div>
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-20"><LanguageToggle /></div>

      {/* In-app browser banner */}
      {isInApp && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="absolute top-14 left-4 right-4 z-30 bg-card border border-border rounded-xl p-3">
          <p className="text-foreground text-[12px] font-medium mb-2">
            {lang === "fr" ? "👆 Pour Google, ouvre dans Safari. Sinon inscris-toi par email ↓" : "👆 For Google, open in Safari. Or sign up with email ↓"}
          </p>
          <div className="flex gap-2">
            <button onClick={handleOpenInBrowser}
              className="flex-1 py-2 rounded-lg bg-foreground text-background text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
              <ExternalLink className="w-3.5 h-3.5" />
              {lang === "fr" ? "Ouvrir Safari" : "Open Safari"}
            </button>
            <button onClick={handleCopyLink}
              className="py-2 px-3 rounded-lg bg-card border border-border text-foreground text-[12px] font-medium flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "✓" : lang === "fr" ? "Copier" : "Copy"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-6 -mt-12 max-w-md mx-auto w-full overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex flex-col">

          {/* Headline — urgency driven */}
          <h1 className="font-body text-[22px] font-black text-center leading-tight text-foreground mb-1">
            {isEvening
              ? (lang === "fr"
                ? <>Où sortir <span className="text-gold">ce soir</span> à Marrakech ?</>
                : <>Where to go <span className="text-gold">tonight</span> in Marrakech?</>)
              : (lang === "fr"
                ? <>Les spots <span className="text-gold">tendance</span> à Marrakech</>
                : <><span className="text-gold">Trending</span> spots in Marrakech</>)
            }
          </h1>

          {/* Sub — value prop */}
          <p className="text-[12px] text-muted-foreground text-center mb-3">
            {lang === "fr"
              ? "Carte live · Deals exclusifs · Gratuit"
              : "Live map · Exclusive deals · Free"}
          </p>

          {/* Live stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-3 mb-4"
          >
            {[
              { icon: Users, value: animatedUsers, label: "insiders" },
              { icon: MapPin, value: animatedPlaces, label: lang === "fr" ? "spots" : "spots" },
              { icon: Flame, value: liveStats?.vibesToday || 0, label: lang === "fr" ? "vibes today" : "vibes today" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/60 border border-border">
                <Icon className="w-3 h-3 text-gold" />
                <span className="text-[12px] font-bold text-foreground tabular-nums">{value}</span>
                <span className="text-[9px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* Rotating testimonial */}
          <div className="flex items-center justify-center gap-2 mb-4 min-h-[20px]">
            <AnimatePresence mode="wait">
              <motion.div key={testimonialIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-1.5">
                <span className="text-sm">{TESTIMONIALS[testimonialIdx].flag}</span>
                <span className="text-[11px] text-muted-foreground italic">
                  "{TESTIMONIALS[testimonialIdx].text[lang]}"
                </span>
                <span className="text-[10px] text-muted-foreground/60">— {TESTIMONIALS[testimonialIdx].name}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Google CTA — primary */}
          {!isInApp && (
            <>
              <button onClick={handleGoogleSignup} disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-foreground text-background font-bold py-4 rounded-2xl transition-all disabled:opacity-70 text-[15px] mb-2 active:scale-[0.98] shadow-lg">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {lang === "fr" ? "Accéder gratuitement 🔓" : "Get free access 🔓"}
              </button>
              <p className="text-[10px] text-muted-foreground text-center mb-2">
                {lang === "fr" ? "⚡ 10 secondes — pas de mot de passe" : "⚡ 10 seconds — no password"}
              </p>
              <div className="flex items-center gap-3 w-full mb-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-muted-foreground">{lang === "fr" ? "ou par email" : "or with email"}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          {/* Email form */}
          {!success && (
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" placeholder="Email" autoComplete="email" inputMode="email"
                value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleEmailSignup()}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors" />
            </div>
          )}

          {error && <p className="text-[12px] text-destructive mt-2 text-center">{error}</p>}
          {success && <p className="text-[13px] text-green-400 mt-3 text-center font-medium">{success}</p>}

          {!success && (
            <button onClick={handleEmailSignup} disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-card border border-border text-foreground font-semibold py-3 rounded-xl transition-all disabled:opacity-70 text-[14px] active:scale-[0.98]">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === "fr" ? "Envoi..." : "Sending..."}</> : (
                <>{lang === "fr" ? "Recevoir mon accès" : "Get my access"}</>
              )}
            </button>
          )}

          {/* Google fallback for in-app */}
          {isInApp && !success && (
            <>
              <div className="flex items-center gap-3 w-full my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-muted-foreground">{lang === "fr" ? "ou" : "or"}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button onClick={handleGoogleSignup} disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-card border border-border text-foreground font-medium py-3 rounded-xl transition-all hover:border-foreground/20 text-[13px] disabled:opacity-70 active:scale-[0.98]">
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

          <p className="text-[9px] text-muted-foreground/50 text-center mt-2.5">
            {lang === "fr" ? "Gratuit · Sans engagement" : "Free · No commitment"} · {t("legalPrefix")}{" "}
            <Link to="/terms" className="underline">{t("terms")}</Link>{" "}{t("and")}{" "}
            <Link to="/privacy" className="underline">{t("privacy")}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
