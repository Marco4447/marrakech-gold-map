import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Share2, Users, Crown, Gift, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";
import LanguageToggle from "@/components/LanguageToggle";

function generateCode(userId: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
  }
  let code = "WK";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.abs(hash + i * 7) % chars.length];
  }
  return code;
}

export default function ReferralPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      // Get or create referral code
      const { data: existing } = await supabase
        .from("referral_codes" as any)
        .select("code")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        setCode((existing as any).code);
      } else {
        const newCode = generateCode(user.id);
        await supabase.from("referral_codes" as any).insert({
          user_id: user.id,
          code: newCode,
        });
        setCode(newCode);
      }

      // Count referrals
      const { count } = await supabase
        .from("referral_uses" as any)
        .select("id", { count: "exact", head: true })
        .eq("referrer_user_id", user.id);

      setReferralCount(count ?? 0);
      setLoading(false);
    };

    init();
  }, [user]);

  const shareUrl = code ? `${window.location.origin}/go?ref=${code}` : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Lien copié !");
    analytics.referralShare();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Weshkech",
          text: "Rejoins Weshkech et découvre Marrakech en live ! 🔥",
          url: shareUrl,
        });
        analytics.referralShare();
      } catch {}
    } else {
      handleCopy();
    }
  };

  const progress = Math.min(referralCount, 3);
  const nextReward = 3 - (referralCount % 3);

  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Parrainage</h1>
            <p className="text-xs text-muted-foreground">Invite tes amis, débloque le VIP</p>
          </div>
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 pt-6 space-y-6">
          {/* Reward progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-gold/30 rounded-2xl p-5 text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mb-3">
              <Crown className="w-8 h-8 text-gold" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">
              {referralCount >= 3 ? "VIP débloqué ! 🎉" : `Encore ${nextReward} ami${nextReward > 1 ? "s" : ""}`}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Invite 3 amis → 7 jours de Pass VIP offerts
            </p>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-3 mb-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    progress >= i
                      ? "bg-gold border-gold text-primary-foreground"
                      : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  {progress >= i ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-gold font-semibold">
              {referralCount} ami{referralCount !== 1 ? "s" : ""} inscrit{referralCount !== 1 ? "s" : ""}
            </p>
          </motion.div>

          {/* Share code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-4"
          >
            <h3 className="font-display text-base font-semibold text-foreground">Ton code</h3>
            <div className="flex items-center gap-3 bg-surface rounded-xl p-3">
              <span className="flex-1 font-mono text-lg font-bold text-gold tracking-wider text-center">
                {code}
              </span>
              <button
                onClick={handleCopy}
                className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center"
              >
                {copied ? <Check className="w-4 h-4 text-gold" /> : <Copy className="w-4 h-4 text-gold" />}
              </button>
            </div>

            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-primary-foreground"
              style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
            >
              <Share2 className="w-4 h-4" />
              Partager mon lien
            </button>
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-3"
          >
            <h3 className="font-display text-base font-semibold text-foreground">Comment ça marche ?</h3>
            {[
              { icon: "📤", text: "Partage ton lien avec tes amis" },
              { icon: "✅", text: "Ils s'inscrivent via ton lien" },
              { icon: "🎁", text: "À 3 inscriptions → 7 jours VIP" },
              { icon: "🔄", text: "Le compteur repart à zéro, recommence !" },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg">{step.icon}</span>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
