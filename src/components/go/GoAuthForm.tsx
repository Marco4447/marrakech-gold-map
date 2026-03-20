import { useState } from "react";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ttqTrack, ttqIdentify } from "@/lib/ttq";
import { trackEvent } from "@/lib/analytics";
import type { Lang } from "@/i18n/translations";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { isInAppBrowser } from "@/lib/openInExternalBrowser";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otpToken, setOtpToken] = useState("");

  const handleSendMagicLink = async () => {
    setError(null);
    if (!email || !email.includes("@")) {
      setError(lang === "fr" ? "Entre ton email." : "Enter your email.");
      return;
    }
    setLoading(true);
    trackEvent("go_magic_link_submit", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp });
    ttqTrack("InitiateCheckout", { content_name: "magic_link_attempt", content_id: "magic_link", content_category: "signup" });

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { full_name: email.split("@")[0] },
      },
    });

    if (otpError) {
      setError(otpError.message);
      trackEvent("go_magic_link_error", { error: otpError.message, source: utmSource });
    } else {
      setStep("otp");
      trackEvent("go_magic_link_sent", { source: utmSource, campaign: utmCampaign });
      ttqIdentify(email);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otpToken.length < 6) {
      setError(lang === "fr" ? "Entre le code à 6 chiffres." : "Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpToken,
      type: "email",
    });

    if (verifyError) {
      setError(lang === "fr" ? "Code invalide ou expiré. Réessaie." : "Invalid or expired code. Try again.");
      trackEvent("go_otp_verify_error", { error: verifyError.message, source: utmSource });
    } else {
      trackEvent("go_otp_verify_success", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp });
      ttqTrack("CompleteRegistration", { content_name: "magic_link", content_id: "otp_verify", content_category: "signup", value: 1, currency: "MAD" });
      supabase.from("acquisition_events").insert({ event_type: "signup_magic_link", source: utmSource, campaign: utmCampaign, is_inapp: isInApp, is_tiktok: isTikTok }).then(() => {});
      // Session is set — redirect to app
      setTimeout(() => { window.location.href = "/"; }, 300);
      return;
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { full_name: email.split("@")[0] } },
    });
    setError(lang === "fr" ? "Code renvoyé ! Vérifie ta boîte 📩" : "Code resent! Check your inbox 📩");
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    trackEvent("go_google_signin_click", { source: utmSource, campaign: utmCampaign, is_inapp: isInApp });
    ttqTrack("InitiateCheckout", { content_name: "google_signin", content_id: "google_oauth", content_category: "signup" });

    // Store pending info for post-redirect tracking
    try {
      sessionStorage.setItem("wk_google_signup_pending", JSON.stringify({ source: utmSource, campaign: utmCampaign }));
    } catch {}

    const { error: oauthError } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (oauthError) {
      setError(lang === "fr" ? "Erreur Google. Essaie par email." : "Google error. Try email instead.");
      trackEvent("go_google_signin_error", { error: String(oauthError), source: utmSource });
    }
    setLoading(false);
  };

  const inApp = isInAppBrowser();

  return (
    <div className="flex flex-col gap-3">
      {/* Google Sign-In — primary CTA (hidden in WebViews where it won't work) */}
      {!inApp && step === "email" && (
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 bg-card border border-border text-foreground font-bold py-4 rounded-2xl transition-all disabled:opacity-70 text-[15px] active:scale-[0.98] shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {lang === "fr" ? "Continuer avec Google" : "Continue with Google"}
            </>
          )}
        </button>
      )}

      {/* Separator */}
      {!inApp && step === "email" && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-muted-foreground">{lang === "fr" ? "ou par email" : "or with email"}</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {step === "email" && (
        <>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder={lang === "fr" ? "Ton email" : "Your email"}
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleSendMagicLink()}
              className="w-full pl-10 pr-4 py-4 rounded-2xl bg-card border border-border text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors"
            />
          </div>
          <button
            onClick={handleSendMagicLink}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-bold py-4 rounded-2xl transition-all disabled:opacity-70 text-[15px] active:scale-[0.98] shadow-lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {lang === "fr" ? "Accéder gratuitement" : "Get free access"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-[10px] text-muted-foreground text-center">
            ⚡ {lang === "fr" ? "On t'envoie un code. Pas de mot de passe." : "We'll send you a code. No password needed."}
          </p>
        </>
      )}

      {step === "otp" && (
        <>
          <p className="text-[13px] text-foreground text-center font-medium">
            📩 {lang === "fr" ? `Code envoyé à ${email}` : `Code sent to ${email}`}
          </p>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otpToken} onChange={setOtpToken}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <button
            onClick={handleVerifyOtp}
            disabled={loading || otpToken.length < 6}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-bold py-4 rounded-2xl transition-all disabled:opacity-70 text-[15px] active:scale-[0.98] shadow-lg"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              lang === "fr" ? "Valider le code ✓" : "Verify code ✓"
            )}
          </button>
          <div className="flex items-center justify-center gap-3">
            <button onClick={handleResend} disabled={loading} className="text-[12px] text-muted-foreground underline">
              {lang === "fr" ? "Renvoyer le code" : "Resend code"}
            </button>
            <span className="text-muted-foreground/30">·</span>
            <button onClick={() => { setStep("email"); setOtpToken(""); setError(null); }} className="text-[12px] text-muted-foreground underline">
              {lang === "fr" ? "Changer d'email" : "Change email"}
            </button>
          </div>
        </>
      )}

      {error && <p className="text-[12px] text-destructive text-center">{error}</p>}

      <p className="text-[9px] text-muted-foreground/50 text-center mt-1">
        {t("legalPrefix")} <Link to="/terms" className="underline">{t("terms")}</Link> {t("and")} <Link to="/privacy" className="underline">{t("privacy")}</Link>
      </p>
    </div>
  );
}
