import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, MapPin, Lock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/marrakech-hero.jpg";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from the auth link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    setError(null);
    if (!password || !confirmPassword) {
      setError("Veuillez remplir les deux champs.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Marrakech" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center px-8 text-center max-w-sm w-full"
      >
        <div className="w-14 h-14 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mb-4">
          <MapPin className="w-7 h-7 text-gold" />
        </div>

        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Mot de passe modifié !</h2>
            <p className="text-sm text-muted-foreground">Redirection en cours…</p>
          </motion.div>
        ) : !isRecovery ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Vérification du lien…</p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl font-bold text-foreground mb-1">Nouveau mot de passe</h2>
            <p className="text-xs text-muted-foreground mb-6">Choisissez un nouveau mot de passe pour votre compte</p>

            <div className="w-full space-y-3">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-400 mt-3 text-center">{error}</p>}

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-primary-foreground font-semibold py-3.5 rounded-2xl transition-all shadow-[0_0_30px_hsl(43,76%,52%,0.3)] disabled:opacity-70 text-sm"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mise à jour…</>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
