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

  return (
    <div className="flex flex-col gap-3">
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
