import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Loader2, Gift } from "lucide-react";

interface VerifyResult {
  valid: boolean;
  name?: string;
  expiresAt?: string;
  daysLeft?: number;
}

export default function VerifyVip() {
  const [params] = useSearchParams();
  const userId = params.get("user_id");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [perkDesc, setPerkDesc] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setResult({ valid: false });
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase
          .rpc("verify_vip_status", { p_user_id: userId });

        if (error || !data || data.length === 0) {
          setResult({ valid: false });
        } else {
          const row = data[0];
          const expires = row.vip_expires_at ? new Date(row.vip_expires_at) : null;
          const now = new Date();
          const daysLeft = expires ? Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

          setResult({
            valid: !!row.valid,
            name: row.full_name || "Guest",
            expiresAt: row.vip_expires_at || undefined,
            daysLeft,
          });
        }

        // Fetch VIP perks from partner places
        const { data: places } = await supabase
          .from("places")
          .select("vip_perk_description")
          .eq("is_partner", true)
          .not("vip_perk_description", "is", null)
          .limit(1);

        if (places && places.length > 0) {
          setPerkDesc((places[0] as any).vip_perk_description);
        }
      } catch {
        setResult({ valid: false });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (!result || !result.valid) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8"
        style={{ background: "hsl(0, 70%, 45%)" }}
      >
        <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center mb-6">
          <X className="w-16 h-16 text-white" strokeWidth={3} />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight text-center">
          INVALIDE
        </h1>
        <p className="text-lg text-white/80 mt-2 text-center font-medium">
          Pass VIP expiré ou inexistant
        </p>
        <p className="text-sm text-white/50 mt-6">Weshkech Insider Pass</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8"
      style={{ background: "hsl(145, 65%, 38%)" }}
    >
      <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center mb-6">
        <Check className="w-16 h-16 text-white" strokeWidth={3} />
      </div>
      <h1 className="text-4xl font-black text-white tracking-tight text-center">
        VIP VALIDE ✅
      </h1>
      <p className="text-xl text-white/90 mt-3 text-center font-bold">
        {result.name}
      </p>
      <p className="text-sm text-white/70 mt-1 text-center">
        Expire dans {result.daysLeft} jour{result.daysLeft !== 1 ? "s" : ""}
      </p>

      {perkDesc && (
        <div className="mt-8 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 max-w-sm w-full border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wide">Avantage VIP</span>
          </div>
          <p className="text-lg text-white font-semibold">{perkDesc}</p>
        </div>
      )}

      <p className="text-xs text-white/40 mt-8">Weshkech Insider Pass</p>
    </div>
  );
}
