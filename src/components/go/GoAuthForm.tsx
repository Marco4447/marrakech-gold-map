import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ttqTrack, ttqIdentify } from "@/lib/ttq";
import { trackEvent } from "@/lib/analytics";
import { isInAppBrowser, isTikTokInAppBrowser } from "@/lib/openInExternalBrowser";
import type { Lang } from "@/i18n/translations";

interface GoAuthFormProps {
  lang: Lang;
  t: (key: string) => string;
  isInApp: boolean;
  isTikTok: boolean;
  utmSource: string;
  utmCampaign: string;
}

export default function GoAuthForm({ lang, t, isInApp, isTikTok, utmSource, utmCampaign }: GoAuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      sessionStorage.setItem("wk_google_signup_pending", JSON.stringify({ source: utmSource, campaign: utmCampaign, at: Date.now() }));
    } catch {}
    trackEvent("go_google_signup_click", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp });
    ttqTrack("InitiateCheckout", { content_name: "google_signup_attempt", content_id: "google_oauth", content_category: "signup" });
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (error) {
      try { sessionStorage.removeItem("wk_google_signup_pending"); } catch {}
      trackEvent("go_google_signup_error", { error: String(error), source: utmSource });
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    setError(null);
    if (!email || !email.includes("@")) {
      setError(lang === "fr" ? "Entre ton email." : "Enter your email.");
      return;
    }
    if (!password || password.length < 6) {
      setError(lang === "fr" ? "Mot de passe : 6 caractères min." : "Password: 6 characters min.");
      return;
    }
    setLoading(true);
    trackEvent("go_email_signup_submit", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp });
    ttqTrack("InitiateCheckout", { content_name: "email_password_attempt", content_id: "email_password", content_category: "signup" });

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: email.split("@")[0] }, emailRedirectTo: window.location.origin },
    });

    if (signupError) {
      if (signupError.message?.includes("already registered") || signupError.message?.includes("already been registered")) {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
          setError(lang === "fr" ? "Email déjà utilisé ou mot de passe incorrect." : "Email already used or wrong password.");
        } else {
          trackEvent("go_email_login_success", { source: utmSource, campaign: utmCampaign });
          ttqIdentify(email);
        }
      } else {
        setError(signupError.message);
      }
    } else {
      if (signupData.user && !signupData.session) {
        setSuccess(lang === "fr" ? "Vérifie ta boîte mail pour confirmer 📩" : "Check your inbox to confirm 📩");
      } else {
        setSuccess(lang === "fr" ? "Compte créé ! Redirection..." : "Account created! Redirecting...");
      }
      trackEvent("go_email_signup_success", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp });
      ttqIdentify(email);
      ttqTrack("CompleteRegistration", { content_name: "email_password", content_id: "email_signup", content_category: "signup", value: 1, currency: "MAD" });
      supabase.from("acquisition_events").insert({ event_type: "signup_email", source: utmSource, campaign: utmCampaign, is_inapp: isInApp, is_tiktok: isTikTok }).then(() => {});
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Google CTA */}
      {!isInApp && !success && (
        <>
          <button onClick={handleGoogleSignup} disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-foreground text-background font-bold py-4 rounded-2xl transition-all disabled:opacity-70 text-[15px] active:scale-[0.98] shadow-lg">
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
          <p className="text-[10px] text-muted-foreground text-center">⚡ {lang === "fr" ? "10 secondes — pas de mot de passe" : "10 seconds — no password"}</p>
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">{lang === "fr" ? "ou par email" : "or with email"}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </>
      )}

      {/* Email form */}
      {!success && (
        <>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="email" placeholder="Email" autoComplete="email" inputMode="email"
              value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors" />
          </div>
          <input type="password" placeholder={lang === "fr" ? "Mot de passe (6+ car.)" : "Password (6+ chars)"}
            autoComplete="new-password"
            value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleEmailSignup()}
            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors" />
          <button onClick={handleEmailSignup} disabled={loading}
            className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all disabled:opacity-70 text-[14px] active:scale-[0.98] ${
              isInApp ? "bg-foreground text-background shadow-lg" : "bg-card border border-border text-foreground"
            }`}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === "fr" ? "Envoi..." : "Sending..."}</> : (
              <>{lang === "fr" ? (isInApp ? "Créer mon compte 🔓" : "S'inscrire par email") : (isInApp ? "Create my account 🔓" : "Sign up with email")}</>
            )}
          </button>
        </>
      )}

      {/* Google fallback for in-app */}
      {isInApp && !success && (
        <>
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">{lang === "fr" ? "ou" : "or"}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <button onClick={handleGoogleSignup} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-card border border-border text-foreground font-medium py-3 rounded-xl text-[13px] disabled:opacity-70 active:scale-[0.98]">
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

      {error && <p className="text-[12px] text-destructive text-center">{error}</p>}
      {success && <p className="text-[13px] text-accent text-center font-medium">{success}</p>}

      <p className="text-[9px] text-muted-foreground/50 text-center mt-1">
        {t("legalPrefix")} <Link to="/terms" className="underline">{t("terms")}</Link> {t("and")} <Link to="/privacy" className="underline">{t("privacy")}</Link>
      </p>
    </div>
  );
}
