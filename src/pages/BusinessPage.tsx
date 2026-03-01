import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Tag, Gift, Phone, Send, Check, ArrowLeft, Star, Eye, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { z } from "zod";

const partnerSchema = z.object({
  business_name: z.string().trim().min(2, "Nom requis").max(100),
  category: z.string().trim().min(2, "Catégorie requise").max(50),
  offer_description: z.string().trim().min(5, "Décrivez votre offre").max(500),
  whatsapp_number: z.string().trim().min(8, "Numéro invalide").max(20).regex(/^[\d\s+()-]+$/, "Format invalide"),
});

const categories = [
  "Restaurant & Café",
  "Rooftop & Bar",
  "Riad & Hôtel",
  "Spa & Bien-être",
  "Activité & Excursion",
  "Shopping & Artisanat",
  "Autre",
];

const perks = [
  { icon: Star, title: "Spot Certifié", desc: "Badge exclusif sur la carte et le flux Live." },
  { icon: Eye, title: "Priorité Radar", desc: "Votre établissement mis en avant pour les Insiders." },
  { icon: Zap, title: "Offres Pass Invité", desc: "Attirez de nouveaux clients avec des avantages exclusifs." },
];

export default function BusinessPage() {
  const [form, setForm] = useState({
    business_name: "",
    category: "",
    offer_description: "",
    whatsapp_number: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleSubmit = async () => {
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
    try {
      const { error } = await supabase.from("partner_requests" as any).insert({
        business_name: result.data.business_name,
        category: result.data.category,
        offer_description: result.data.offer_description,
        whatsapp_number: result.data.whatsapp_number,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (e) {
      console.error("Partner request error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-xl font-bold">
            <span className="text-gold">Business</span>
            <span className="text-foreground"> Partner</span>
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-8 pb-20 space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <h2 className="font-display text-2xl font-bold text-foreground leading-tight">
            Propulsez votre établissement sur{" "}
            <span className="text-gold">Weshkech</span>
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Devenez un Spot Certifié, affichez vos offres exclusives et apparaissez en priorité sur le Radar Live.
          </p>
        </motion.div>

        {/* Perks */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          {perks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-surface border border-border rounded-xl p-3 text-center space-y-2">
              <div className="w-9 h-9 mx-auto rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-gold" />
              </div>
              <p className="text-xs font-semibold text-foreground">{title}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Success state */}
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
              <h3 className="font-display text-lg font-semibold text-foreground">Demande envoyée !</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Merci ! Notre équipe vous contactera sous 24h pour valider votre accès Insider.
              </p>
              <Link
                to="/"
                className="inline-block mt-2 text-sm font-medium text-gold hover:text-gold-light transition-colors"
              >
                ← Retour à l'app
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gold" />
                Formulaire d'adhésion
              </h3>

              {/* Business name */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Nom de l'établissement
                </label>
                <input
                  value={form.business_name}
                  onChange={(e) => handleChange("business_name", e.target.value)}
                  placeholder="Le Jardin Secret"
                  maxLength={100}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                />
                {errors.business_name && <p className="text-xs text-destructive">{errors.business_name}</p>}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Catégorie
                </label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all appearance-none"
                >
                  <option value="" disabled>Choisir une catégorie</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
              </div>

              {/* Offer */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <Gift className="w-3 h-3" /> Offre Pass Invité
                </label>
                <textarea
                  value={form.offer_description}
                  onChange={(e) => handleChange("offer_description", e.target.value)}
                  placeholder="Ex: -20% sur l'addition, thé offert, accès VIP rooftop..."
                  maxLength={500}
                  rows={3}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all resize-none"
                />
                {errors.offer_description && <p className="text-xs text-destructive">{errors.offer_description}</p>}
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Numéro WhatsApp
                </label>
                <input
                  value={form.whatsapp_number}
                  onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                  placeholder="+212 6XX XX XX XX"
                  maxLength={20}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                />
                {errors.whatsapp_number && <p className="text-xs text-destructive">{errors.whatsapp_number}</p>}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer ma demande
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
