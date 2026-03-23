import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Copy, Gift, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId: string;
  businessName: string;
}

export default function PartnerReferral({ userId, businessName }: Props) {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [usesCount, setUsesCount] = useState(0);
  const [loadingCode, setLoadingCode] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const loadOrCreate = async () => {
      try {
        // Try to fetch existing code
        const { data: codeRow } = await supabase
          .from("referral_codes")
          .select("code")
          .eq("user_id", userId)
          .maybeSingle();

        let code: string;
        if (codeRow?.code) {
          code = codeRow.code;
        } else {
          // Generate and insert
          code = `WK-${userId.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
          await supabase.from("referral_codes").insert({ user_id: userId, code });
        }
        setReferralCode(code);

        // Count uses
        const { count } = await supabase
          .from("referral_uses")
          .select("id", { count: "exact", head: true })
          .eq("referrer_user_id", userId);
        setUsesCount(count ?? 0);
      } catch (err) {
       
        toast.error("Erreur chargement parrainage");
      } finally {
        setLoadingCode(false);
      }
    };
    loadOrCreate();
  }, [userId]);

  const referralUrl = `${window.location.origin}/business?ref=${referralCode || ""}`;

  const handleCopy = async () => {
    if (!referralCode) return;
    const text = `🔥 ${businessName} te recommande Weshkech Partners !\n\nRejoins la première app nightlife de Marrakech et booste la visibilité de ton établissement.\n\n👉 ${referralUrl}\n\nCode parrain : ${referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Weshkech Partners", text, url: referralUrl });
        return;
      } catch {}
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Lien de parrainage copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 via-card/80 to-card/80 backdrop-blur-xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-gold" />
        <h3 className="font-display text-sm font-bold text-foreground">Parrainage Partenaire</h3>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Recommande Weshkech à un autre établissement. Pour chaque parrainage activé, tu gagnes <span className="text-gold font-bold">10 crédits vibes gratuits</span> 🎁
      </p>

      <div className="bg-card/60 border border-border rounded-xl p-3 flex items-center gap-2">
        {loadingCode ? (
          <Loader2 className="w-4 h-4 text-gold animate-spin" />
        ) : (
          <code className="text-xs text-gold font-mono flex-1 truncate">{referralCode}</code>
        )}
        <button
          onClick={handleCopy}
          disabled={loadingCode}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gold/15 text-gold hover:bg-gold/25 transition-colors disabled:opacity-40"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copié" : "Partager"}
        </button>
      </div>

      {/* Uses counter */}
      {!loadingCode && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{usesCount} établissement{usesCount !== 1 ? "s" : ""} parrainé{usesCount !== 1 ? "s" : ""}</p>
          {usesCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              🎁 {usesCount} × 10 crédits gagnés
            </span>
          )}
        </div>
      )}

      <button
        onClick={handleCopy}
        disabled={loadingCode}
        className="w-full py-3 rounded-xl text-sm font-bold text-primary-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light)), hsl(var(--gold-dark)))" }}
      >
        <Gift className="w-4 h-4" /> Inviter un établissement
      </button>
    </motion.div>
  );
}
