import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Tag, Gift, Phone, Send, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

const partnerSchema = z.object({
  business_name: z.string().trim().min(2, "Nom requis").max(100),
  category: z.string().trim().min(2, "Catégorie requise").max(50),
  offer_description: z.string().trim().min(5, "Décrivez votre offre").max(500),
  whatsapp_number: z.string().trim().min(8, "Numéro invalide").max(20).regex(/^[\d\s+()-]+$/, "Format invalide"),
});

const REST_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/partner_requests`;
const REST_API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const categories = [
  "Restaurant & Café",
  "Rooftop & Bar",
  "Riad & Hôtel",
  "Spa & Bien-être",
  "Activité & Excursion",
  "Shopping & Artisanat",
  "Autre",
];

const inputClass =
  "w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all";

const BusinessForm = forwardRef<HTMLDivElement>((_, ref) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    business_name: "",
    category: "",
    offer_description: "",
    whatsapp_number: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleSubmit = async () => {
    setSubmitError("");
    const result = partnerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 12000);

      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch(REST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: REST_API_KEY,
          Authorization: `Bearer ${REST_API_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          business_name: result.data.business_name,
          category: result.data.category,
          offer_description: result.data.offer_description,
          whatsapp_number: result.data.whatsapp_number,
          user_id: user?.id || null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`REQUEST_FAILED_${response.status}`);
      setSuccess(true);
    } catch (e) {
      console.error("Partner request error:", e);
      const isTimeout = e instanceof DOMException && e.name === "AbortError";
      setSubmitError(
        isTimeout
          ? "Le serveur met trop de temps à répondre. Réessayez dans quelques secondes."
          : "Impossible d'envoyer la demande pour le moment. Vérifiez votre connexion puis réessayez."
      );
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  return (
    <section className="px-5" ref={ref}>
      <div className="max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gold/10 border border-gold/20 rounded-2xl p-6 text-center space-y-3"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-gold/20 flex items-center justify-center">
                <Check className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{t("biz_successTitle")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("biz_successDesc")}</p>
              <Link to="/" className="inline-block mt-2 text-sm font-medium text-gold hover:text-gold-light transition-colors">
                {t("biz_backToApp")}
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gold" />
                {t("biz_formTitle")}
              </h3>

              {/* Business name */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> {t("biz_businessName")}
                </label>
                <input value={form.business_name} onChange={(e) => handleChange("business_name", e.target.value)} placeholder="Le Jardin Secret" maxLength={100} className={inputClass} />
                {errors.business_name && <p className="text-xs text-destructive">{errors.business_name}</p>}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> {t("biz_category")}
                </label>
                <select value={form.category} onChange={(e) => handleChange("category", e.target.value)} className={`${inputClass} appearance-none`}>
                  <option value="" disabled>{t("biz_chooseCategory")}</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
              </div>

              {/* Offer */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <Gift className="w-3 h-3" /> {t("biz_guestPassOffer")}
                </label>
                <textarea value={form.offer_description} onChange={(e) => handleChange("offer_description", e.target.value)} placeholder={t("biz_offerPlaceholder")} maxLength={500} rows={3} className={`${inputClass} resize-none`} />
                {errors.offer_description && <p className="text-xs text-destructive">{errors.offer_description}</p>}
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> {t("biz_whatsapp")}
                </label>
                <input value={form.whatsapp_number} onChange={(e) => handleChange("whatsapp_number", e.target.value)} placeholder="+212 6XX XX XX XX" maxLength={20} className={inputClass} />
                {errors.whatsapp_number && <p className="text-xs text-destructive">{errors.whatsapp_number}</p>}
              </div>

              {submitError && <p className="text-xs text-destructive" aria-live="polite">{submitError}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-primary-foreground shadow-lg shadow-gold/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-40 transition-all"
                style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t("biz_submit")}
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});

BusinessForm.displayName = "BusinessForm";
export default BusinessForm;
