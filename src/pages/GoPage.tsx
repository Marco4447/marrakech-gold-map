import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Loader2, ExternalLink, Copy, Check, Mail, MapPin, Flame, Users, Star, Utensils, Moon, Gem, Compass } from "lucide-react";
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
import GoHero from "@/components/go/GoHero";
import GoSections from "@/components/go/GoSections";
import GoFAQ from "@/components/go/GoFAQ";
import GoAuthForm from "@/components/go/GoAuthForm";

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
  const shouldReduceMotion = useReducedMotion();

  // Redirect authenticated users
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
            ttqIdentify(user.email);
            ttqTrack("CompleteRegistration", { content_name: "google_signup", content_id: "google_oauth", content_category: "signup", source, campaign });
            supabase.from("acquisition_events").insert({ event_type: "signup_google", source, campaign, user_id: user.id, is_inapp: isInAppBrowser(), is_tiktok: isTikTokInAppBrowser() }).then(() => {});
            sessionStorage.setItem(trackedKey, "1");
          }
          sessionStorage.removeItem("wk_google_signup_pending");
        }
      } catch { /* no-op */ }
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const isInApp = isInAppBrowser();
  const isTikTok = isTikTokInAppBrowser();
  const utmSource = searchParams.get("utm_source") || "direct";
  const utmCampaign = searchParams.get("utm_campaign") || "unknown";
  const refCode = searchParams.get("ref");

  useEffect(() => { if (refCode) try { localStorage.setItem("weshkech_ref", refCode); } catch {} }, [refCode]);
  useEffect(() => { if (isTikTok) trackEvent("tiktok_webview_detected", { source: utmSource }); }, [isTikTok]);

  // Live data
  const { data: usersCount } = useQuery({
    queryKey: ["go-users-count"],
    queryFn: async () => { const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }); return count || 0; },
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
      return { activeNow: Math.max(checkinsRes.count || 0, 3), vibesToday: vibesRes.count || 0, totalPlaces: placesRes.count || 0 };
    },
    staleTime: 2 * 60 * 1000, refetchInterval: 60 * 1000,
  });

  const animatedUsers = useCountUp(usersCount || 0);
  const animatedPlaces = useCountUp(liveStats?.totalPlaces || 0);

  // Analytics
  useEffect(() => {
    ttqTrack("ViewContent", { content_name: "go_landing", content_id: "go_page", content_category: "acquisition", description: `${utmSource}/${utmCampaign}` });
    trackEvent("go_page_view", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp, is_tiktok: isTikTok, referrer: document.referrer || "direct" });
    supabase.from("acquisition_events").insert({ event_type: "page_view", source: utmSource, campaign: utmCampaign, referrer: document.referrer || null, is_inapp: isInApp, is_tiktok: isTikTok }).then(() => {});
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  const handleOpenInBrowser = () => { trackEvent("go_open_external_browser", { browser: isTikTok ? "tiktok" : "other" }); redirectToExternalBrowser(); };
  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); } catch {
      const input = document.createElement("input"); input.value = window.location.href;
      document.body.appendChild(input); input.select(); document.execCommand("copy"); document.body.removeChild(input);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const scrollToSignup = () => {
    document.getElementById("go-signup")?.scrollIntoView({ behavior: "smooth" });
    trackEvent("go_cta_click", { location: "section", source: utmSource });
  };

  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 17 || currentHour < 4;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Language toggle */}
      <div className="fixed top-4 right-4 z-50"><LanguageToggle /></div>

      {/* ===== HERO SECTION ===== */}
      <GoHero
        heroImage={heroImage}
        isEvening={isEvening}
        liveStats={liveStats}
        animatedUsers={animatedUsers}
        animatedPlaces={animatedPlaces}
        lang={lang}
        t={t as (key: string) => string}
        onCtaClick={scrollToSignup}
        isInApp={isInApp}
        isTikTok={isTikTok}
        utmSource={utmSource}
        utmCampaign={utmCampaign}
      />

      {/* In-app browser banner */}
      {isInApp && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-card border-b border-border p-3">
          <p className="text-foreground text-[12px] font-medium mb-2 text-center">
            {lang === "fr" ? "👆 Pour Google, ouvre dans Safari. Sinon inscris-toi par email ↓" : "👆 For Google, open in Safari. Or sign up with email ↓"}
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={handleOpenInBrowser}
              className="py-2 px-4 rounded-lg bg-foreground text-background text-[12px] font-semibold flex items-center gap-1.5 active:scale-[0.97] transition-transform">
              <ExternalLink className="w-3.5 h-3.5" />
              {lang === "fr" ? "Ouvrir Safari" : "Open Safari"}
            </button>
            <button onClick={handleCopyLink}
              className="py-2 px-3 rounded-lg bg-card border border-border text-foreground text-[12px] font-medium flex items-center gap-1.5 active:scale-[0.97] transition-transform">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "✓" : lang === "fr" ? "Copier" : "Copy"}
            </button>
          </div>
        </motion.div>
      )}

      {/* ===== SOCIAL PROOF BAR ===== */}
      <section className="py-6 px-5 max-w-lg mx-auto">
        <div className="flex justify-center gap-3 flex-wrap">
          {[
            { icon: Users, value: animatedUsers, label: "insiders" },
            { icon: MapPin, value: animatedPlaces, label: "spots" },
            { icon: Flame, value: liveStats?.vibesToday || 0, label: "vibes today" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border">
              <Icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
              <span className="text-2xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Rotating testimonial */}
        <div className="flex items-center justify-center gap-2 mt-4 min-h-[20px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={testimonialIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="flex items-center gap-1.5">
              <span className="text-sm">{TESTIMONIALS[testimonialIdx].flag}</span>
              <span className="text-xs text-muted-foreground italic">"{TESTIMONIALS[testimonialIdx].text[lang]}"</span>
              <span className="text-2xs text-muted-foreground/60">— {TESTIMONIALS[testimonialIdx].name}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ===== MID CTA ===== */}
      <section className="px-5 pb-6 max-w-lg mx-auto">
        <button onClick={scrollToSignup}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] active:scale-[0.98] transition-transform shadow-lg">
          {lang === "fr" ? "Découvrir les spots →" : "Discover spots →"}
        </button>
      </section>

      {/* ===== SEO SECTIONS ===== */}
      <GoSections lang={lang} t={t as (key: string) => string} onCtaClick={scrollToSignup} />

      {/* Signup form is now in the hero */}

      {/* ===== FAQ ===== */}
      <GoFAQ lang={lang} t={t as (key: string) => string} />

      {/* ===== BOTTOM CTA ===== */}
      <section className="px-5 py-10 max-w-lg mx-auto text-center">
        <h2 className="text-lg font-bold text-foreground mb-2">
          {lang === "fr" ? "Prêt à découvrir Marrakech ?" : "Ready to discover Marrakech?"}
        </h2>
        <p className="text-[12px] text-muted-foreground mb-4">
          {lang === "fr" ? "Rejoignez des milliers d'insiders. C'est gratuit." : "Join thousands of insiders. It's free."}
        </p>
        <button onClick={scrollToSignup}
          className="w-full py-3.5 rounded-2xl bg-foreground text-background font-bold text-[15px] active:scale-[0.98] transition-transform">
          {lang === "fr" ? "Créer mon compte gratuit" : "Create my free account"}
        </button>
      </section>

      {/* Legal footer */}
      <footer className="px-5 pb-8 text-center">
        <p className="text-2xs text-muted-foreground/50">
          © {new Date().getFullYear()} WeshKech · {t("madeIn")} · {" "}
          <Link to="/terms" className="underline">{t("terms")}</Link>{" · "}
          <Link to="/privacy" className="underline">{t("privacy")}</Link>
        </p>
      </footer>
    </div>
  );
}
