import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, Users, Loader2, MapPin, Flame, Eye, Star, ArrowRight } from "lucide-react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import heroImage from "@/assets/marrakech-hero.jpg";
import { ttqTrack } from "@/lib/ttq";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const TESTIMONIALS = [
  { name: "Sophia", text: { fr: "J'ai trouvé le meilleur rooftop en 2 min 🔥", en: "Found the best rooftop in 2 min 🔥" }, flag: "🇫🇷", avatar: "S" },
  { name: "Youssef", text: { fr: "Les deals VIP sont incroyables", en: "The VIP deals are amazing" }, flag: "🇲🇦", avatar: "Y" },
  { name: "Emma", text: { fr: "Indispensable pour sortir à Kech", en: "Essential for going out in Kech" }, flag: "🇬🇧", avatar: "E" },
  { name: "Karim", text: { fr: "Meilleure app pour découvrir Marrakech", en: "Best app to discover Marrakech" }, flag: "🇲🇦", avatar: "K" },
  { name: "Julie", text: { fr: "On a découvert des pépites grâce à Weshkech", en: "We discovered hidden gems thanks to Weshkech" }, flag: "🇧🇪", avatar: "J" },
];

export default function GoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const { lang, t } = useLanguage();

  const utmCampaign = searchParams.get("utm_campaign") || "unknown";
  const utmSource = searchParams.get("utm_source") || "direct";
  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (refCode) {
      try { localStorage.setItem("weshkech_ref", refCode); } catch {}
    }
  }, [refCode]);

  const { data: liveVibes } = useQuery({
    queryKey: ["go-live-vibes"],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase.from("vibes").select("id", { count: "exact", head: true }).gte("created_at", sixHoursAgo);
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: usersCount } = useQuery({
    queryKey: ["go-users-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendingPlaces } = useQuery({
    queryKey: ["go-trending-places"],
    queryFn: async () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const { data: vibes } = await supabase.from("vibes").select("location, image_url, likes, super_vibes").gte("created_at", threeHoursAgo).not("location", "is", null).not("image_url", "is", null).order("created_at", { ascending: false }).limit(50);
      if (!vibes || vibes.length === 0) {
        const { data: places } = await supabase.from("places").select("name, image_url, category").not("image_url", "is", null).eq("is_partner", true).limit(3);
        return (places || []).map(p => ({ name: p.name, image: p.image_url!, count: Math.floor(Math.random() * 80) + 30, category: p.category || "spot" }));
      }
      const grouped: Record<string, { count: number; image: string; score: number }> = {};
      for (const v of vibes) {
        const loc = v.location!;
        if (!grouped[loc]) grouped[loc] = { count: 0, image: v.image_url, score: 0 };
        grouped[loc].count++;
        grouped[loc].score += (v.likes || 0) + (v.super_vibes || 0) * 3;
      }
      return Object.entries(grouped).sort((a, b) => b[1].score - a[1].score).slice(0, 3).map(([name, d]) => ({ name, image: d.image, count: d.count, category: "trending" }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentVibeImages } = useQuery({
    queryKey: ["go-recent-vibe-images"],
    queryFn: async () => {
      const { data } = await supabase.from("vibes").select("image_url, username").order("created_at", { ascending: false }).limit(8);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    ttqTrack("ViewContent", { content_name: "go_landing", description: `${utmSource}/${utmCampaign}` });
    trackEvent("landing_viewed", { source: utmSource, campaign: utmCampaign });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length), 3500);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    ttqTrack("CompleteRegistration", { content_name: "go_landing_signup", description: `${utmSource}/${utmCampaign}` });
    trackEvent("signup_started", { source: "go_page" });
    try { localStorage.setItem("weshkech_utm", JSON.stringify({ source: utmSource, campaign: utmCampaign, ts: Date.now() })); } catch {}
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (error) { console.error("OAuth error:", error); setLoading(false); }
  };

  const handleDiscover = () => {
    trackEvent("preview_clicked", { source: "go_page" });
    ttqTrack("ViewContent", { content_name: "go_to_discover" });
    navigate("/discover" + (searchParams.toString() ? `?${searchParams.toString()}` : ""));
  };

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden flex flex-col">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Marrakech" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/40" />
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center px-5 pt-8 pb-28 max-w-md mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 px-4 py-1.5 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span className="text-[11px] font-bold text-gold uppercase tracking-wider">{t("go_seenOnTikTok")}</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-4">
          <h1 className="font-display text-[2.2rem] font-black leading-[1.08] tracking-tight">
            <span className="text-gold">{t("go_headline1")}</span><br />
            <span className="text-foreground">{t("go_headline2")}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2.5 leading-relaxed max-w-[300px] mx-auto">
            {t("go_subtitle")}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2.5 mb-5">
          {liveVibes != null && (
            <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 rounded-full px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
              <span className="text-xs font-bold text-destructive-foreground">{liveVibes} {t("go_liveNow")}</span>
            </div>
          )}
          {usersCount != null && (
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5">
              <Users className="w-3 h-3 text-gold" />
              <span className="text-xs font-semibold text-foreground">{usersCount}+ {t("insiders")}</span>
            </div>
          )}
        </motion.div>

        {trendingPlaces && trendingPlaces.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full mb-5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Flame className="w-3.5 h-3.5 text-gold" />
              <span className="text-[10px] font-bold text-gold uppercase tracking-wider">{t("go_trendingNow")}</span>
            </div>
            <div className="space-y-2">
              {trendingPlaces.map((spot, i) => (
                <motion.div key={spot.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.1 }}
                  className="flex items-center gap-3 bg-card/70 backdrop-blur-md border border-border rounded-2xl p-2.5 cursor-pointer active:scale-[0.98] transition-transform" onClick={handleDiscover}>
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative">
                    <img src={spot.image} alt={spot.name} className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 bg-destructive/90 text-[7px] font-bold text-destructive-foreground px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Flame className="w-2 h-2" /> HOT
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{spot.name}</p>
                    <span className="text-[10px] text-gold font-medium flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" /> {spot.count * 12 + Math.floor(Math.random() * 50)} {t("go_checking")}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} onClick={handleDiscover}
          className="cta-shimmer relative w-full overflow-hidden bg-gold hover:bg-gold-light active:scale-[0.97] text-primary-foreground font-bold py-4 rounded-2xl transition-all shadow-[0_8px_30px_-6px_hsl(43_76%_52%/0.4)] text-base tracking-wide flex items-center justify-center gap-2.5 mb-6">
          <MapPin className="w-5 h-5" /> {t("go_seeHottest")} <ArrowRight className="w-5 h-5" />
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="w-full mb-6">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Users className="w-3.5 h-3.5 text-gold" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("go_peopleDiscovering")}</span>
          </div>
          {recentVibeImages && recentVibeImages.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3">
              {recentVibeImages.slice(0, 6).map((v, i) => (
                <div key={i} className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-border" style={{ filter: i > 2 ? "blur(4px)" : "none", opacity: i > 2 ? 0.6 : 1 }}>
                  <img src={v.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-xl border border-dashed border-gold/30 flex items-center justify-center flex-shrink-0 bg-gold/5">
                <span className="text-[8px] text-gold font-bold">+{usersCount || 100}</span>
              </div>
            </div>
          )}
          <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-3.5 min-h-[56px]">
            <AnimatePresence mode="wait">
              <motion.div key={testimonialIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gold">{TESTIMONIALS[testimonialIdx].avatar}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground font-medium">{TESTIMONIALS[testimonialIdx].text[lang]}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{TESTIMONIALS[testimonialIdx].flag} {TESTIMONIALS[testimonialIdx].name}</p>
                </div>
                <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 text-gold fill-gold" />)}</div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} onClick={handleDiscover}
          className="w-full py-3.5 rounded-2xl border border-gold/30 bg-gold/5 text-gold text-sm font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-2 mb-6">
          <MapPin className="w-4 h-4" /> {t("go_seeFullMap")} <ChevronRight className="w-4 h-4" />
        </motion.button>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }} className="w-full grid grid-cols-2 gap-2 mb-6">
          <button onClick={() => {
            const text = t("go_shareText");
            const url = window.location.href;
            if (navigator.share) navigator.share({ title: "Weshkech", text, url }).catch(() => {});
            else window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`);
          }} className="py-3 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
            {t("go_shareWhatsApp")}
          </button>
          <button onClick={handleDiscover} className="py-3 rounded-2xl bg-gold/5 border border-gold/20 text-gold text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
            {t("go_unlockVip")}
          </button>
        </motion.div>

        <p className="text-[9px] text-muted-foreground text-center leading-relaxed max-w-[280px]">
          {t("legalPrefix")}{" "}<Link to="/terms" className="text-gold hover:underline">{t("terms")}</Link>{" "}{t("and")}{" "}<Link to="/privacy" className="text-gold hover:underline">{t("privacy")}</Link>.
        </p>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">{t("madeIn")}</p>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-md mx-auto">
          <button onClick={handleDiscover} className="cta-shimmer relative w-full overflow-hidden bg-gold hover:bg-gold-light active:scale-[0.97] text-primary-foreground font-bold py-3.5 rounded-2xl transition-all shadow-[0_8px_30px_-6px_hsl(43_76%_52%/0.4)] text-sm tracking-wide flex items-center justify-center gap-2">
            <Flame className="w-4 h-4" /> {t("go_seeHottestSticky")}
          </button>
        </div>
      </div>
    </div>
  );
}
