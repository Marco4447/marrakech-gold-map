import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Phone, Send, Check, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const REST_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/partner_requests`;
const REST_API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const BusinessForm = forwardRef<HTMLDivElement>((_, ref) => {
  const [form, setForm] = useState({ business_name: "", whatsapp_number: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setSubmitError("");
    const newErrors: Record<string, string> = {};
    if (!form.business_name.trim() || form.business_name.trim().length < 2) newErrors.business_name = "Nom requis";
    if (!form.whatsapp_number.trim() || form.whatsapp_number.trim().length < 8) newErrors.whatsapp_number = "Numéro invalide";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSubmitting(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
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
          business_name: form.business_name.trim(),
          category: "À définir",
          offer_description: "Demande via page business",
          whatsapp_number: form.whatsapp_number.trim(),
          user_id: user?.id || null,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`REQUEST_FAILED_${response.status}`);
      setSuccess(true);
    } catch (e) {
      const isTimeout = e instanceof DOMException && e.name === "AbortError";
      setSubmitError(isTimeout ? "Timeout. Réessayez." : "Erreur. Vérifiez votre connexion.");
    } finally {
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
              <h3 className="font-display text-lg font-bold text-foreground">Demande envoyée ! 🎉</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Notre équipe vous contacte sur WhatsApp sous 24h pour activer vos 15 crédits gratuits.
              </p>
              <Link to="/" className="inline-block mt-2 text-sm font-medium text-gold hover:text-gold-light transition-colors">
                ← Retour à l'app
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-gold/15 rounded-2xl p-5 space-y-4"
            >
              <div className="text-center space-y-1.5">
                <h3 className="font-display text-base font-bold text-foreground">
                  Rejoignez WeshKech en 30 secondes
                </h3>
                <p className="text-xs text-muted-foreground">
                  On vous contacte sur WhatsApp pour tout configurer.
                </p>
              </div>

              {/* Business name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Nom de l'établissement
                </label>
                <input
                  value={form.business_name}
                  onChange={(e) => { setForm(f => ({ ...f, business_name: e.target.value })); setErrors(e => ({ ...e, business_name: "" })); }}
                  placeholder="Ex: Le Jardin Secret"
                  maxLength={100}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                />
                {errors.business_name && <p className="text-xs text-destructive">{errors.business_name}</p>}
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </label>
                <input
                  value={form.whatsapp_number}
                  onChange={(e) => { setForm(f => ({ ...f, whatsapp_number: e.target.value })); setErrors(e => ({ ...e, whatsapp_number: "" })); }}
                  placeholder="+212 6XX XX XX XX"
                  maxLength={20}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                />
                {errors.whatsapp_number && <p className="text-xs text-destructive">{errors.whatsapp_number}</p>}
              </div>

              {submitError && <p className="text-xs text-destructive">{submitError}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-primary-foreground shadow-lg shadow-gold/20 flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Activer mes 15 crédits gratuits
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-muted-foreground">
                Sans engagement · Activation sous 24h · Support WhatsApp
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});

BusinessForm.displayName = "BusinessForm";
export default BusinessForm;
