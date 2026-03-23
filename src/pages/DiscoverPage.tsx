import { reportError } from "@/lib/errorReporting";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Lock, ChevronRight, Flame, Eye, Loader2, ArrowLeft, Crown, Sparkles, Users, Mail, User } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ttqTrack } from "@/lib/ttq";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import { isInAppBrowser } from "@/lib/openInExternalBrowser";

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { lang, t } = useLanguage();
  const inApp = isInAppBrowser();

  // Email signup state
  const [showEmailForm, setShowEmailForm] = useState(inApp); // auto-show for WebView users
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const utmSource = searchParams.get("utm_source") || "direct";
  const utmCampaign = searchParams.get("utm_campaign") || "unknown";

  const { data: places } = useQuery({
    queryKey: ["discover-places"],
    queryFn: async () => {
      const { data } = await supabase.from("places").select("id, name, image_url, category, latitude, longitude, is_partner").not("image_url", "is", null).limit(12);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: vibes } = useQuery({
    queryKey: ["discover-vibes"],
    queryFn: async () => {
      const { data } = await supabase.from("vibes").select("id, image_url, location, mood, likes, super_vibes, username").order("created_at", { ascending: false }).limit(8);
      return data || [];
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

  useEffect(() => {
    ttqTrack("ViewContent", { content_name: "discover_page", description: `${utmSource}/${utmCampaign}` });
    trackEvent("discover_viewed", { source: utmSource, is_inapp: inApp });
  }, []);

  const handleGoogleSignup = async () => {
    setLoading(true);
    ttqTrack("CompleteRegistration", { content_name: "discover_signup_google", description: `${utmSource}/${utmCampaign}` });
    trackEvent("unlock_cta_clicked", { source: "discover_page", method: "google" });
    try { localStorage.setItem("weshkech_utm", JSON.stringify({ source: utmSource, campaign: utmCampaign, ts: Date.now() })); } catch {}
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (error) { reportError(error, { context: "OAuth error" }); setLoading(false); }
  };

  const handleEmailSignup = async () => {
    setError(null);
    if (!email || !password) {
      setError(lang === "fr" ? "Remplissez tous les champs." : "Fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError(lang === "fr" ? "Mot de passe : 6 caractères min." : "Password: 6 characters min.");
      return;
    }
    setLoading(true);
    ttqTrack("CompleteRegistration", { content_name: "discover_signup_email", description: `${utmSource}/${utmCampaign}` });
    trackEvent("unlock_cta_clicked", { source: "discover_page", method: "email" });
    try { localStorage.setItem("weshkech_utm", JSON.stringify({ source: utmSource, campaign: utmCampaign, ts: Date.now() })); } catch {}
    
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || email.split("@")[0] },
        emailRedirectTo: window.location.origin,
      },
    });
    if (signupError) {
      setError(signupError.message);
    } else {
      setSuccess(lang === "fr" ? "Vérifiez votre email pour confirmer ✉️" : "Check your email to confirm ✉️");
    }
    setLoading(false);
  };

  const visiblePlaces = places?.slice(0, 3) || [];
  const blurredPlaces = places?.slice(3, 8) || [];
  const visibleVibes = vibes?.slice(0, 2) || [];
  const lockedVibes = vibes?.slice(2, 6) || [];

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden flex flex-col">
      <div className="relative z-20 flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold text-foreground">Weshkech</h1>
          <p className="text-2xs text-muted-foreground">{t("discover_liveMap")}</p>
        </div>
        <LanguageToggle />
        <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 rounded-full px-2.5 py-1 ml-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
          </span>
          <span className="text-2xs font-bold text-destructive-foreground">{t("liveBadge")}</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-4 pb-36 max-w-md mx-auto w-full overflow-y-auto">
        {/* Map preview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full mb-5">
          <div className="relative rounded-2xl overflow-hidden border border-border h-48 bg-card">
            <div className="absolute inset-0 bg-[hsl(0_0%_6%)]">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `linear-gradient(hsl(0 0% 20%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 20%) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
              {visiblePlaces.map((p, i) => (
                <div key={p.id} className="absolute flex items-center justify-center" style={{ left: `${20 + i * 25}%`, top: `${30 + (i % 2) * 25}%` }}>
                  <div className="w-8 h-8 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center shadow-[0_0_12px_hsl(43_76%_52%/0.4)]">
                    <span className="text-xs">📍</span>
                  </div>
                  <span className="absolute -bottom-4 text-[7px] font-semibold text-foreground/70 whitespace-nowrap">{p.name.slice(0, 12)}</span>
                </div>
              ))}
              {blurredPlaces.map((p, i) => (
                <div key={p.id} className="absolute" style={{ left: `${10 + i * 18}%`, top: `${15 + (i % 3) * 22}%`, filter: 'blur(4px)', opacity: 0.4 }}>
                  <div className="w-6 h-6 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center"><span className="text-2xs">📍</span></div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent flex items-end justify-center pb-3">
              <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-md border border-gold/20 rounded-full px-3 py-1.5">
                <Flame className="w-3 h-3 text-gold" />
                <span className="text-2xs font-semibold text-foreground">{t("discover_moreTrending")}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Visible place cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5 text-gold" />
            <span className="text-2xs font-bold text-gold uppercase tracking-wider">{t("discover_topSpots")}</span>
          </div>
          <div className="space-y-2">
            {visiblePlaces.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-2.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative">
                  <img src={p.image_url!} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute top-0.5 left-0.5 bg-destructive/90 text-[6px] font-bold text-destructive-foreground px-1 py-0.5 rounded-full">LIVE</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-2xs text-muted-foreground capitalize">{p.category || "spot"}</p>
                </div>
                <div className="text-2xs text-gold font-medium flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{(i + 1) * 47}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Vibe feed preview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">{t("discover_liveVibes")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {visibleVibes.map((v) => (
              <div key={v.id} className="rounded-2xl overflow-hidden border border-border bg-card aspect-[3/4] relative">
                <img src={v.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-2xs font-semibold text-foreground truncate">{v.location || "Marrakech"}</p>
                  <p className="text-2xs text-muted-foreground">{v.username || "Anonymous"} · {v.mood || "🔥"}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 relative">
            {lockedVibes.map((v) => (
              <div key={v.id} className="rounded-2xl overflow-hidden border border-border bg-card aspect-[3/4] relative">
                <img src={v.image_url} alt="" className="w-full h-full object-cover blur-lg scale-105" />
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center"><Lock className="w-5 h-5 text-gold/60" /></div>
              </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-card/90 backdrop-blur-xl border border-gold/25 rounded-2xl p-5 text-center max-w-[280px] shadow-[0_0_40px_hsl(43_76%_52%/0.15)]">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center"><Crown className="w-6 h-6 text-gold" /></div>
                <p className="text-sm font-display font-bold text-foreground mb-1">{t("discover_unlockMap")}</p>
                <p className="text-2xs text-muted-foreground mb-3">{t("free")} · {t("discover_joinInsiders")} {usersCount || "500"}+ {t("discover_insidersLabel")}</p>
                
                {/* Email signup form (primary for WebView, toggle for others) */}
                {showEmailForm ? (
                  <div className="space-y-2 mb-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={lang === "fr" ? "Nom (optionnel)" : "Name (optional)"}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder={lang === "fr" ? "Mot de passe (6+ car.)" : "Password (6+ chars)"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        onKeyDown={(e) => e.key === "Enter" && handleEmailSignup()}
                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
                      />
                    </div>
                    {error && <p className="text-2xs text-destructive">{error}</p>}
                    {success && <p className="text-2xs text-green-400">{success}</p>}
                    {!success && (
                      <button onClick={handleEmailSignup} disabled={loading}
                        className="cta-shimmer relative overflow-hidden w-full bg-gold hover:bg-gold-light active:scale-[0.97] text-primary-foreground font-bold py-2.5 rounded-xl transition-all shadow-[0_6px_20px_-4px_hsl(43_76%_52%/0.4)] text-xs flex items-center justify-center gap-2 disabled:opacity-70">
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                          <><Mail className="w-3.5 h-3.5" /> {lang === "fr" ? "S'inscrire avec Email" : "Sign up with Email"}</>
                        )}
                      </button>
                    )}
                    {!inApp && (
                      <button onClick={() => setShowEmailForm(false)} className="text-2xs text-muted-foreground hover:text-gold transition-colors">
                        {lang === "fr" ? "← Continuer avec Google" : "← Continue with Google"}
                      </button>
                    )}
                    {!inApp && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-2xs text-muted-foreground">{lang === "fr" ? "ou" : "or"}</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}
                    {!inApp && (
                      <button onClick={handleGoogleSignup} disabled={loading}
                        className="w-full bg-background border border-border text-foreground font-medium py-2 rounded-xl text-2xs flex items-center justify-center gap-1.5 hover:border-gold/40 transition-colors disabled:opacity-70">
                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button onClick={handleGoogleSignup} disabled={loading}
                      className="cta-shimmer relative overflow-hidden w-full bg-gold hover:bg-gold-light active:scale-[0.97] text-primary-foreground font-bold py-2.5 rounded-xl transition-all shadow-[0_6px_20px_-4px_hsl(43_76%_52%/0.4)] text-xs flex items-center justify-center gap-2 disabled:opacity-70">
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          {t("discover_createFree")}
                        </>
                      )}
                    </button>
                    <button onClick={() => setShowEmailForm(true)} className="text-2xs text-muted-foreground hover:text-gold transition-colors">
                      <Mail className="w-3 h-3 inline mr-1" />
                      {lang === "fr" ? "Ou s'inscrire avec Email" : "Or sign up with Email"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social proof */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="w-full flex items-center justify-center gap-2 py-3">
          <div className="flex -space-x-2">
            {["S", "Y", "E", "K", "J"].map((letter, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-gold/15 border-2 border-background flex items-center justify-center">
                <span className="text-2xs font-bold text-gold">{letter}</span>
              </div>
            ))}
          </div>
          <span className="text-2xs text-muted-foreground font-medium">
            <span className="text-gold font-semibold">{usersCount || "500"}+</span> {t("discover_peopleTonight")}
          </span>
        </motion.div>

        <p className="text-2xs text-muted-foreground text-center leading-relaxed max-w-[280px] mx-auto mt-4">
          {t("legalPrefix")}{" "}<Link to="/terms" className="text-gold hover:underline">{t("terms")}</Link>{" "}{t("and")}{" "}<Link to="/privacy" className="text-gold hover:underline">{t("privacy")}</Link>.
        </p>
      </div>

      {/* Bottom sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-md mx-auto">
          {showEmailForm || inApp ? (
            <button onClick={() => { document.querySelector('input[type="email"]')?.scrollIntoView({ behavior: "smooth", block: "center" }); (document.querySelector('input[type="email"]') as HTMLInputElement)?.focus(); }}
              className="cta-shimmer relative w-full overflow-hidden bg-gold hover:bg-gold-light active:scale-[0.97] text-primary-foreground font-bold py-3.5 rounded-2xl transition-all shadow-[0_8px_30px_-6px_hsl(43_76%_52%/0.4)] text-sm tracking-wide flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> {lang === "fr" ? "S'inscrire — Tout débloquer" : "Sign up — Unlock all"}
            </button>
          ) : (
            <button onClick={handleGoogleSignup} disabled={loading}
              className="cta-shimmer relative w-full overflow-hidden bg-gold hover:bg-gold-light active:scale-[0.97] text-primary-foreground font-bold py-3.5 rounded-2xl transition-all shadow-[0_8px_30px_-6px_hsl(43_76%_52%/0.4)] text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Crown className="w-4 h-4" /> {t("discover_unlockAll")}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
