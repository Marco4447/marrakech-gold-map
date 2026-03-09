import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Camera, Gift, Star, Utensils, Moon, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/marrakech-hero.jpg";
import ambientVideo from "@/assets/marrakech-ambiance.mp4";
import ExplainerSheet from "@/components/ExplainerSheet";
import LanguageToggle from "@/components/LanguageToggle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/i18n/LanguageContext";

interface RecentVibePreview {
  id: string;
  image_url: string;
  location: string | null;
  mood: string | null;
}

interface LandingPageProps {
  onEnter: () => void;
}

const previewSlideKeys = [
  { emoji: "🗺️", titleKey: "landing_mapTitle" as const, descKey: "landing_mapDesc" as const },
  { emoji: "📸", titleKey: "landing_vibesTitle" as const, descKey: "landing_vibesDesc" as const },
  { emoji: "🎁", titleKey: "landing_passTitle" as const, descKey: "landing_passDesc" as const },
];

const heroImages = [
  heroImage,
  "/images/landing-hero-1.jpg",
  "/images/landing-hero-2.jpg",
];

const LandingPage = forwardRef<HTMLDivElement, LandingPageProps>(({ onEnter }, ref) => {
  const [insiderCount, setInsiderCount] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const [recentVibes, setRecentVibes] = useState<RecentVibePreview[]>([]);
  const [explainerTab, setExplainerTab] = useState<"insider" | "partner" | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => {
      setInsiderCount(count ?? 0);
    });
    supabase.from("vibes").select("id, image_url, location, mood").order("created_at", { ascending: false }).limit(5).then(({ data }) => {
      if (data) setRecentVibes(data as RecentVibePreview[]);
    });
  }, []);

  useEffect(() => {
    const heroInterval = setInterval(() => setHeroIndex((prev) => (prev + 1) % heroImages.length), 5000);
    return () => clearInterval(heroInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveSlide((prev) => (prev + 1) % previewSlideKeys.length), 4000);
    return () => clearInterval(interval);
  }, []);

  const pillars = [
    { icon: MapPin, label: t("landing_explore"), desc: t("landing_exploreDesc") },
    { icon: Camera, label: t("landing_vibe"), desc: t("landing_vibeDesc") },
    { icon: Gift, label: t("landing_enjoy"), desc: t("landing_enjoyDesc") },
  ];

  const seoSections = [
    { icon: Star, titleKey: "seo_rooftopsTitle" as const, descKey: "seo_rooftopsDesc" as const },
    { icon: Utensils, titleKey: "seo_restaurantsTitle" as const, descKey: "seo_restaurantsDesc" as const },
    { icon: Moon, titleKey: "seo_nightlifeTitle" as const, descKey: "seo_nightlifeDesc" as const },
    { icon: Sparkles, titleKey: "seo_hiddenTitle" as const, descKey: "seo_hiddenDesc" as const },
    { icon: Users, titleKey: "seo_localTitle" as const, descKey: "seo_localDesc" as const },
  ];

  const faqItems = [
    { qKey: "seo_faq1Q" as const, aKey: "seo_faq1A" as const },
    { qKey: "seo_faq2Q" as const, aKey: "seo_faq2A" as const },
    { qKey: "seo_faq3Q" as const, aKey: "seo_faq3A" as const },
    { qKey: "seo_faq4Q" as const, aKey: "seo_faq4A" as const },
  ];

  return (
    <motion.div ref={ref} className="fixed inset-0 z-[3000] flex flex-col bg-background overflow-y-auto" exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5, ease: "easeInOut" }}>
      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      {/* Hero media — top half */}
      <div className="relative w-full aspect-[4/5] max-h-[55vh] flex-shrink-0">
        <img src={heroImage} alt="Rooftop view of Marrakech at sunset — best spots and nightlife" className={`w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-0" : "opacity-100"}`} />
        <video src={ambientVideo} autoPlay loop muted playsInline onCanPlayThrough={() => setVideoLoaded(true)} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-100" : "opacity-0"}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content below hero */}
      <div className="relative z-10 flex-1 px-5 -mt-10 pb-8 space-y-5 max-w-md mx-auto w-full">
        {/* H1 + social proof */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="space-y-2">
          <h1 className="font-body text-[22px] font-bold text-foreground leading-tight tracking-tight">{t("seo_h1")}</h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{t("landing_subtitle")}</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            <span className="text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground">{insiderCount !== null ? insiderCount : "…"}</span> {t("landing_insidersConnected")}
            </span>
          </div>
        </motion.div>

        {/* Live vibes strip */}
        {recentVibes.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }} className="space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("landing_nowInKech")}</span>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
              {recentVibes.map((vibe, i) => (
                <div key={vibe.id} className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border bg-muted" style={{ filter: i > 1 ? "blur(4px)" : "none" }}>
                  <img src={vibe.image_url} alt={`Live vibe from ${vibe.location || "Marrakech"}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  {i > 1 && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                      <span className="text-xs">🔒</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Feature pills */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
          <div className="flex gap-2">
            {pillars.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Preview carousel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.4 }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSlide} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <span className="text-xl flex-shrink-0">{previewSlideKeys[activeSlide].emoji}</span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{t(previewSlideKeys[activeSlide].titleKey)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t(previewSlideKeys[activeSlide].descKey)}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {previewSlideKeys.map((_, i) => (
              <button key={i} onClick={() => setActiveSlide(i)} className={`h-1 rounded-full transition-all duration-300 ${i === activeSlide ? "w-4 bg-foreground" : "w-1 bg-foreground/20"}`} />
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }} className="space-y-2.5 pt-1">
          <button onClick={onEnter} className="w-full bg-foreground text-background font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] text-[14px]">
            {t("landing_becomeInsider")}
          </button>
          <div className="flex gap-2">
            <button onClick={() => setExplainerTab("insider")} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-[12px] font-medium transition-all active:scale-[0.97]">
              {t("landing_whatsThis")}
            </button>
            <button onClick={() => setExplainerTab("partner")} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-[12px] font-medium transition-all active:scale-[0.97]">
              {t("landing_partnerSpace")}
            </button>
          </div>
        </motion.div>

        <ExplainerSheet open={explainerTab !== null} onClose={() => setExplainerTab(null)} initialTab={explainerTab ?? "insider"} showAuthCta onEnter={onEnter} />

        {/* SEO Content Sections */}
        <section className="space-y-4 pt-4">
          {seoSections.map(({ icon: Icon, titleKey, descKey }) => (
            <article key={titleKey} className="p-4 bg-card rounded-xl border border-border space-y-1.5">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <h2 className="text-[14px] font-semibold text-foreground">{t(titleKey)}</h2>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{t(descKey)}</p>
            </article>
          ))}
        </section>

        {/* FAQ Section */}
        <section className="pt-2 pb-4">
          <h2 className="text-[14px] font-semibold text-foreground mb-3">{t("seo_faqTitle")}</h2>
          <Accordion type="single" collapsible className="space-y-1">
            {faqItems.map(({ qKey, aKey }, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-3 bg-card">
                <AccordionTrigger className="text-[13px] font-medium text-foreground py-3 hover:no-underline">
                  {t(qKey)}
                </AccordionTrigger>
                <AccordionContent className="text-[12px] text-muted-foreground leading-relaxed">
                  {t(aKey)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Hidden SEO content */}
        <div className="sr-only">
          <h1>WeshKech – Discover the Best Spots in Marrakech</h1>
          <h2>Marrakech Nightlife Guide — Bars, Clubs & Night Spots</h2>
          <h2>Best Rooftops in Marrakech — Sunset Views & Cocktails</h2>
          <h2>Best Restaurants in Marrakech — Local Cuisine & Fine Dining</h2>
          <h2>Hidden Gems in Marrakech — Off the Beaten Path</h2>
          <h2>Local Spots Only Locals Know — Marrakech Insider Guide</h2>
          <p>Discover where to go in Marrakech tonight. WeshKech is the local guide that shows you the best bars, rooftops, restaurants and clubs in Marrakech in real time. Find hidden gems, share your favorite spots and enjoy exclusive deals. Your Marrakech night guide.</p>
        </div>
      </div>
    </motion.div>
  );
});

LandingPage.displayName = "LandingPage";
export default LandingPage;
