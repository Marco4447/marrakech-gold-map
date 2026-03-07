import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthGate from "@/components/AuthGate";
import { Loader2, CheckCircle, XCircle, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";

export default function PartnerInvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "accepting" | "success" | "error" | "auth">("loading");
  const [error, setError] = useState("");
  const [businessName, setBusinessName] = useState("");

  // Check invite validity
  useEffect(() => {
    if (!token) { setStatus("error"); setError("Lien invalide"); return; }

    const checkInvite = async () => {
      const { data, error: fetchError } = await supabase
        .from("partner_invites" as any)
        .select("business_name, used_by, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (fetchError || !data) {
        setStatus("error");
        setError("Invitation introuvable");
        return;
      }

      const invite = data as any;
      if (invite.used_by) {
        setStatus("error");
        setError("Cette invitation a déjà été utilisée");
        return;
      }
      if (new Date(invite.expires_at) < new Date()) {
        setStatus("error");
        setError("Cette invitation a expiré");
        return;
      }

      setBusinessName(invite.business_name);

      if (!user && !authLoading) {
        setStatus("auth");
      } else if (user) {
        acceptInvite();
      }
    };

    if (!authLoading) checkInvite();
  }, [token, user, authLoading]);

  const acceptInvite = async () => {
    setStatus("accepting");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("accept-partner-invite", {
        body: { token },
      });
      if (fnError || data?.error) {
        setStatus("error");
        setError(data?.error || fnError?.message || "Erreur");
        return;
      }
      setBusinessName(data.business_name);
      setStatus("success");
      // Redirect to partner dashboard after 3s
      setTimeout(() => navigate("/partner-dashboard"), 3000);
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Erreur inattendue");
    }
  };

  if (authLoading || status === "loading") {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (status === "auth") {
    return <AuthGate />;
  }

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full text-center space-y-6"
      >
        {status === "accepting" && (
          <>
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto" />
            <p className="text-foreground font-semibold">Activation de votre compte partenaire...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="relative">
              <PartyPopper className="w-16 h-16 text-gold mx-auto" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Bienvenue, {businessName} ! 🎉
            </h1>
            <p className="text-muted-foreground text-sm">
              Votre compte partenaire est activé. Vous allez être redirigé vers votre Partner Studio...
            </p>
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Compte activé</span>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-display font-bold text-foreground">Oops</h1>
            <p className="text-muted-foreground text-sm">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 px-6 py-2.5 rounded-xl bg-gold/15 text-gold text-sm font-semibold hover:bg-gold/25 transition-colors"
            >
              Retour à l'accueil
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
