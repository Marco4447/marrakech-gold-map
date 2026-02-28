import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Check, QrCode } from "lucide-react";

interface DealTunnelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeName: string;
}

type Step = "payment" | "success";

export default function DealTunnel({ open, onOpenChange, placeName }: DealTunnelProps) {
  const [step, setStep] = useState<Step>("payment");
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep("success");
    }, 1800);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setStep("payment"), 300);
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
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="px-6 pb-8">
                {step === "payment" ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        Deal Flash
                      </h2>
                      <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Order summary */}
                    <div className="bg-surface rounded-xl p-4 mb-5 border border-border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Récapitulatif</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground">{placeName}</span>
                        <span className="text-sm font-semibold text-gold">2,00 €</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Frais de mise en relation</p>
                    </div>

                    {/* Fake card input */}
                    <div className="space-y-3 mb-6">
                      <div className="bg-surface rounded-xl p-3 border border-border flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-foreground">•••• •••• •••• 4242</p>
                          <p className="text-[10px] text-muted-foreground">Expire 12/27</p>
                        </div>
                        <span className="text-[10px] text-gold font-medium bg-gold/10 px-2 py-0.5 rounded-full">Par défaut</span>
                      </div>
                    </div>

                    {/* Pay button */}
                    <button
                      onClick={handlePay}
                      disabled={processing}
                      className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>Payer 2,00 €</>
                      )}
                    </button>

                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      Paiement sécurisé · Simulation de démonstration
                    </p>
                  </>
                ) : (
                  <div className="text-center py-4">
                    {/* Success */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-4"
                    >
                      <Check className="w-8 h-8 text-gold" />
                    </motion.div>

                    <h2 className="font-display text-xl font-semibold text-foreground mb-1">Deal confirmé !</h2>
                    <p className="text-sm text-muted-foreground mb-5">
                      Votre réservation pour <span className="text-gold font-medium">{placeName}</span> est validée.
                    </p>

                    {/* QR Code placeholder */}
                    <div className="bg-foreground rounded-2xl p-4 w-48 h-48 mx-auto mb-4 flex items-center justify-center">
                      <div className="relative">
                        <QrCode className="w-32 h-32 text-background" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-gold rounded-md flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-[10px]">WK</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-5">
                      Présentez ce QR code à l'établissement
                    </p>

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
