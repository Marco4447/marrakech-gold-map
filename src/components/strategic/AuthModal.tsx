import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login - in real app, this would call Supabase auth
    onLogin();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-surface border border-border/60 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
                {isLogin ? "Bienvenue" : "Rejoignez WeshKech"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isLogin 
                  ? "Connectez-vous pour débloquer toutes les fonctionnalités" 
                  : "Créez un compte pour poster et sauvegarder"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-gold to-accent-warm text-background font-semibold rounded-xl shadow-lg shadow-gold/20 hover:shadow-gold/30 transition-shadow"
              >
                {isLogin ? "Se connecter" : "Créer un compte"}
              </motion.button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin 
                  ? "Pas encore de compte ? S'inscrire" 
                  : "Déjà un compte ? Se connecter"}
              </button>
            </div>

            {/* Skip option for browse first */}
            <button
              onClick={onClose}
              className="w-full mt-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continuer sans s'inscrire
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
