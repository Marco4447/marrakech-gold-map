import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Crown, Gift, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVibeCountdown, isUnderTwoHours } from "@/hooks/useVibeCountdown";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function VipPerkBox({ location }: { location: string | null }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [perk, setPerk] = useState<string | null>(null);
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    if (!location) return;
    // Fetch perk from matching place
    supabase
      .from("places")
      .select("vip_perk_description")
      .eq("is_partner", true)
      .ilike("name", `%${location}%`)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPerk((data[0] as any).vip_perk_description);
        }
      });
    // Check VIP status
    if (user) {
      supabase
        .from("profiles")
        .select("is_vip, vip_expires_at")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setIsVip(!!data.is_vip && !!data.vip_expires_at && new Date(data.vip_expires_at) > new Date());
          }
        });
    }
  }, [location, user]);

  if (!perk) return null;

  return (
    <div className="relative rounded-xl border border-gold/30 bg-gold/5 backdrop-blur-sm p-3 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-gold/5 to-transparent pointer-events-none" />
      <div className="relative flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Gift className="w-4 h-4 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-bold text-gold">VIP Perk</p>
          <p className="text-xs text-foreground font-medium mt-0.5">{perk}</p>
          {!isVip && (
            <button
              onClick={() => navigate("/vip-pass")}
              className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-gold hover:text-gold/80 transition-colors"
            >
              <Lock className="w-3 h-3" />
              Débloquer avec le Pass VIP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface VibePin {
  id: string;
  image_url: string;
  mood: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  location: string | null;
  media_type?: string;
  is_official?: boolean;
}

const MOOD_LABELS: Record<string, string> = {
  hot: "🔥 Hot",
  chill: "🍸 Chill",
  secret: "✨ Secret",
  deal: "🎁 Foodie",
};

interface VibeSheetProps {
  vibe: VibePin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VibeSheet({ vibe, open, onOpenChange }: VibeSheetProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatted, expired } = useVibeCountdown(vibe?.created_at ?? null, vibe?.is_official);

  // TikTok ViewContent tracking
  useEffect(() => {
    if (open && vibe) {
      import("@/lib/ttq").then(({ ttqTrack }) => {
        ttqTrack("ViewContent", {
          content_type: "vibe",
          content_id: vibe.id,
          content_name: vibe.caption || vibe.location || "vibe",
        });
      });
    }
  }, [open, vibe?.id]);

  // Auto-close when vibe expires
  useEffect(() => {
    if (expired && open) {
      onOpenChange(false);
    }
  }, [expired, open, onOpenChange]);


  const handleVipCta = () => {
    navigate("/vip-pass");
  };

  if (!vibe) return null;

  const isVideo = vibe.media_type === "video";
  const isRecent = isUnderTwoHours(vibe.created_at);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm z-[1001]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-[1002] px-3 pb-20 max-h-[85vh] flex flex-col"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 350, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 300) onOpenChange(false);
            }}
          >
            <div className="vibe-sheet-glass rounded-3xl overflow-hidden shadow-2xl shadow-black/40 border border-white/[0.06] flex flex-col max-h-full">
              {/* Drag handle */}
              <div className="flex items-center justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="overflow-y-auto no-scrollbar flex-1">
              {/* Media — 60% of sheet */}
              <div className="relative h-[55vw] max-h-[340px] overflow-hidden mx-3 rounded-2xl">
                {isVideo ? (
                  <video
                    src={vibe.image_url}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={vibe.image_url}
                    alt="Vibe"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                {/* Close button */}
                <button
                  onClick={() => onOpenChange(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Mood badge */}
                {vibe.mood && (
                  <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full">
                    <span className="text-xs font-semibold text-white/90">
                      {MOOD_LABELS[vibe.mood] || vibe.mood}
                    </span>
                  </div>
                )}

                {/* FOMO Timer — bottom of media */}
                {formatted && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border ${
                      isRecent
                        ? "bg-red-500/20 border-red-500/30 shadow-[0_0_20px_hsl(0,70%,50%,0.2)]"
                        : "bg-black/40 border-white/10"
                    }`}>
                      <span className="relative flex h-2 w-2">
                        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isRecent ? "animate-ping bg-red-400" : "bg-amber-400"
                        }`} />
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          isRecent ? "bg-red-400" : "bg-amber-400"
                        }`} />
                      </span>
                      <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
                        {isRecent ? "Live" : "Fading"}
                      </span>
                      <span className="text-xs font-mono font-bold text-white tabular-nums">
                        {formatted}
                      </span>
                    </div>
                  </div>
                )}

                {/* Official badge */}
                {vibe.is_official && (
                  <div className="absolute bottom-3 left-3 bg-gold/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg shadow-gold/30">
                    <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-wider">
                      ⭐ Officiel
                    </span>
                  </div>
                )}
              </div>

              {/* Info + CTAs */}
              <div className="px-4 pt-3 pb-4 space-y-3">
                {/* Location */}
                {vibe.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold shrink-0" />
                    <span className="text-sm font-display font-semibold text-foreground">
                      {vibe.location}
                    </span>
                  </div>
                )}

                {/* VIP Perk Box */}
                <VipPerkBox location={vibe.location} />

                {/* CTA Buttons */}
                <div className="flex gap-2">
                  {/* VIP Pass CTA */}
                  <button
                    onClick={handleVipCta}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-[0.97] border border-gold/30 shadow-lg shadow-gold/10"
                    style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
                  >
                    <Crown className="w-4 h-4 text-primary-foreground" />
                    <span className="text-primary-foreground">
                      {user ? "🌟 Pass VIP" : "🌟 Devenir VIP"}
                    </span>
                  </button>
                </div>
              </div>
              </div>{/* end overflow scroll */}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
