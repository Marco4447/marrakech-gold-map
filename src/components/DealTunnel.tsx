import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Check, QrCode, Loader2, MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DealTunnelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeName: string;
}

type Step = "email" | "success";

export default function DealTunnel({ open, onOpenChange, placeName }: DealTunnelProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Pre-fill email from profile
  const displayEmail = profile?.email || email;
  const displayName = profile?.full_name || "Invité";

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) return;
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("bookings").insert({
        place_name: placeName,
        amount: 0,
        status: "free_pass",
        user_id: user?.id,
      });
    } catch (e) {
      console.error("Booking error:", e);
    }
    setTimeout(() => {
      setProcessing(false);
      setStep("success");
    }, 1000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("email");
      setEmail("");
    }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/70 backdrop-blur-md z-[2000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-[2001] max-h-[85vh]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="bg-card rounded-t-3xl border-t border-border shadow-2xl">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="px-6 pb-8">
                {step === "email" ? (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        Pass Invité 🎁
                      </h2>
                      <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="bg-gold/5 border border-gold/15 rounded-xl p-3 mb-5 space-y-1.5">
                      <p className="text-xs text-foreground font-medium">100% gratuit — Vous recevrez :</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>📖 PDF <span className="text-gold">« Marrakech : 48h sans pièges à touristes »</span></li>
                        <li>🔑 Accès à la communauté <span className="text-gold">Weshkech</span></li>
                        <li>🎟️ QR code Pass Invité pour {placeName}</li>
                      </ul>
                    </div>

                    {/* Email input */}
                    <div className="space-y-2 mb-5">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <Mail className="w-3 h-3" /> Votre email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      />
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={processing || !email.includes("@")}
                      className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>Obtenir mon Pass Invité</>
                      )}
                    </button>

                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      Aucun paiement requis · Gratuit pour toujours
                    </p>
                  </>
                ) : (
                <div className="text-center py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-4"
                    >
                      <Check className="w-8 h-8 text-gold" />
                    </motion.div>

                    <h2 className="font-display text-xl font-semibold text-foreground mb-1">Pass Découverte Weshkech 🎉</h2>
                    <p className="text-sm text-gold font-medium mb-0.5">{displayName}</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Votre guide <span className="text-gold font-medium">« 48h sans pièges »</span> arrive sur <span className="text-gold font-medium">{displayEmail}</span>
                    </p>

                    <div className="bg-foreground rounded-2xl p-4 w-48 h-48 mx-auto mb-3 flex items-center justify-center">
                      <div className="relative">
                        <QrCode className="w-32 h-32 text-background" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-gold rounded-md flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-[10px]">WK</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      Votre Pass Découverte · Montrez-le chez {placeName}
                    </p>

                    <div className="bg-gold/5 border border-gold/15 rounded-xl p-3 mb-4 text-left">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        <span className="text-gold font-medium">⚡ Prélancement</span> — Weshkech est en phase de prélancement. Présentez votre pass pour nous aider à identifier nos futurs partenaires officiels ! Aucun avantage n'est garanti pour le moment, mais votre feedback est précieux.
                      </p>
                    </div>

                    {/* Feedback section */}
                    {!showFeedback && !feedbackSent && (
                      <button
                        onClick={() => setShowFeedback(true)}
                        className="w-full bg-gold/10 hover:bg-gold/20 text-gold font-medium py-3 rounded-xl transition-colors border border-gold/20 flex items-center justify-center gap-2 mb-3"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Je suis au restaurant, tout se passe bien ?
                      </button>
                    )}

                    <AnimatePresence>
                      {showFeedback && !feedbackSent && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-3 space-y-2"
                        >
                          <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Dites-nous comment ça se passe…"
                            rows={3}
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all resize-none"
                          />
                          <button
                            onClick={() => {
                              if (!feedbackText.trim()) return;
                              setFeedbackSent(true);
                              setShowFeedback(false);
                            }}
                            disabled={!feedbackText.trim()}
                            className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Envoyer mon feedback
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {feedbackSent && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gold/10 border border-gold/20 rounded-xl p-3 mb-3 flex items-center gap-2 justify-center"
                      >
                        <Check className="w-4 h-4 text-gold" />
                        <span className="text-sm text-gold font-medium">Merci pour votre retour !</span>
                      </motion.div>
                    )}

                    <button
                      onClick={handleClose}
                      className="w-full bg-surface hover:bg-surface-elevated text-foreground font-medium py-3 rounded-xl transition-colors border border-border"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
