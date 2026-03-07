import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AdminPage from "@/components/AdminPage";
import AuthGate from "@/components/AuthGate";
import { Loader2 } from "lucide-react";

export default function AdminRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthGate />;

  if (isAdmin === null) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-lg font-display font-bold text-foreground">Accès refusé</p>
          <p className="text-sm text-muted-foreground">Cette page est réservée aux administrateurs.</p>
          <button onClick={() => navigate("/")} className="mt-4 px-6 py-2.5 rounded-xl bg-gold/15 text-gold text-sm font-semibold hover:bg-gold/25 transition-colors">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return <AdminPage onBack={() => navigate("/")} />;
}
