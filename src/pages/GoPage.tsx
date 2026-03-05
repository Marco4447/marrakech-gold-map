import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Users, Star, ArrowRight, ExternalLink, Copy, Check } from "lucide-react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const { lang, t } = useLanguage();

  const isInApp = isInAppBrowser();
  const isTikTok = isTikTokInAppBrowser();

  const utmCampaign = searchParams.get("utm_campaign") || "unknown";
  const utmSource = searchParams.get("utm_source") || "direct";
  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (refCode) try { localStorage.setItem("weshkech_ref", refCode); } catch {}
  }, [refCode]);

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
    trackEvent("go_page_view", {
      source: utmSource,
      campaign: utmCampaign,
      is_inapp: isInApp,
      is_tiktok: isTikTok,
      referrer: document.referrer || "direct",
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleMainCTA = () => {
    trackEvent("go_cta_clicked", { cta: "main", source: utmSource, campaign: utmCampaign });
    ttqTrack("ViewContent", { content_name: "go_to_discover" });
    navigate("/discover" + (searchParams.toString() ? `?${searchParams.toString()}` : ""));
  };

  const handleOpenInBrowser = () => {
    trackEvent("go_open_external_browser", { browser: isTikTok ? "tiktok" : "other" });
    redirectToExternalBrowser();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[100dvh] bg-background relative overflow-hidden flex flex-col">
      {/* Full-screen hero background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Marrakech" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      {/* In-app browser banner */}
      {isInApp && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="absolute top-14 left-4 right-4 z-30 bg-gold/95 backdrop-blur-md rounded-2xl p-4 shadow-lg">
          <p className="text-primary-foreground text-xs font-bold mb-1">
            {lang === "fr" ? "⚠️ Ouvre dans ton navigateur" : "⚠️ Open in your browser"}
          </p>
          <p className="text-primary-foreground/80 text-[10px] leading-relaxed mb-3">
            {lang === "fr"
              ? "L'inscription ne fonctionne pas dans l'app. Ouvre dans Safari/Chrome."
              : "Sign-up doesn't work in-app. Open in Safari/Chrome."}
          </p>
          <div className="flex gap-2">
            <button onClick={handleOpenInBrowser}
              className="flex-1 py-2.5 rounded-xl bg-background text-gold text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
              <ExternalLink className="w-3.5 h-3.5" />
              {lang === "fr" ? "Ouvrir Safari" : "Open Safari"}
            </button>
            <button onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-background/80 text-gold text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "✓" : lang === "fr" ? "Copier" : "Copy"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Content — everything visible without scrolling */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-6 max-w-md mx-auto w-full">

        {/* Live photo strip — visual hook */}
        {recentVibeImages && recentVibeImages.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="flex gap-1.5 mb-5 justify-center">
            {recentVibeImages.slice(0, 5).map((v, i) => (
              <div key={i} className="w-11 h-11 rounded-xl overflow-hidden border border-gold/30"
                style={{ opacity: i > 2 ? 0.5 : 1, filter: i > 2 ? "blur(3px)" : "none" }}>
                <img src={v.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="w-11 h-11 rounded-xl border border-dashed border-gold/40 flex items-center justify-center bg-gold/5">
              <span className="text-[9px] text-gold font-bold">+{usersCount || 50}</span>
            </div>
          </motion.div>
        )}

        {/* Headline — 3 second value prop */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="text-center mb-4">
          <h1 className="font-display text-[2rem] font-black leading-[1.1] tracking-tight text-foreground">
            {lang === "fr" ? (
              <>Les spots que<br /><span className="text-gold">tout le monde cherche</span><br />à Marrakech</>
            ) : (
              <>The spots<br /><span className="text-gold">everyone's looking for</span><br />in Marrakech</>
            )}
          </h1>
        </motion.div>

        {/* 3 bullet value props */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="flex justify-center gap-4 mb-5">
          {(lang === "fr"
            ? [["🗺️", "Carte live"], ["🔥", "Spots tendance"], ["🎁", "Deals exclusifs"]]
            : [["🗺️", "Live map"], ["🔥", "Trending spots"], ["🎁", "Exclusive deals"]]
          ).map(([emoji, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-sm">{emoji}</span>
              <span className="text-[11px] text-foreground/80 font-medium">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Social proof — compact */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-3 mb-5">
          <div className="flex items-center gap-1.5 bg-card/60 backdrop-blur-sm border border-border rounded-full px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            <span className="text-[11px] font-semibold text-foreground">
              <span className="text-gold">{usersCount || "…"}</span> {lang === "fr" ? "insiders actifs" : "active insiders"}
            </span>
          </div>
        </motion.div>

        {/* Rotating testimonial — single line */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="mb-5 h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p key={testimonialIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
              className="text-center text-[11px] text-muted-foreground">
              {TESTIMONIALS[testimonialIdx].flag} "{TESTIMONIALS[testimonialIdx].text[lang]}" — {TESTIMONIALS[testimonialIdx].name}
              {" "}
              <span className="inline-flex gap-px align-middle">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-2 h-2 text-gold fill-gold inline" />)}
              </span>
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* PRIMARY CTA */}
        <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          onClick={handleMainCTA}
          className="cta-shimmer relative w-full overflow-hidden bg-gold hover:bg-gold-light active:scale-[0.97] text-primary-foreground font-bold py-4 rounded-2xl transition-all shadow-[0_8px_30px_-6px_hsl(43_76%_52%/0.4)] text-base tracking-wide flex items-center justify-center gap-2.5 mb-3">
          <Flame className="w-5 h-5" />
          {lang === "fr" ? "Voir les spots tendance" : "See trending spots"}
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        {/* Sub-info */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center text-[10px] text-muted-foreground mb-4">
          {lang === "fr" ? "Gratuit · 10 sec · Pas d'app à installer" : "Free · 10 sec · No app to install"}
        </motion.p>

        {/* Legal */}
        <p className="text-[8px] text-muted-foreground/60 text-center">
          {t("legalPrefix")}{" "}
          <Link to="/terms" className="text-gold/60 hover:underline">{t("terms")}</Link>{" "}{t("and")}{" "}
          <Link to="/privacy" className="text-gold/60 hover:underline">{t("privacy")}</Link>
        </p>
      </div>
    </div>
  );
}
