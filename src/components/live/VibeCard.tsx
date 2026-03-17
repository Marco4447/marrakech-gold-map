import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageCircle, MapPin, Loader2, Trash2, Zap, Crown, Sparkles, Share2, Camera } from "lucide-react";
import VibeReplies from "../VibeReplies";
import VibeMedia from "./VibeMedia";
import DoubleTapHeart from "../DoubleTapHeart";
import VibeReactions, { FloatingReaction } from "../VibeReactions";
import SuperVibeParticles from "../SuperVibeParticles";
import { timeAgo } from "@/lib/timeAgo";
import { getShareUrl } from "@/lib/shareUrl";
import { toast } from "sonner";
import type { Vibe, VibeProfile } from "@/types/models";
import VibeExpiryBar from "../VibeExpiryBar";

function getUserTier(vibeCount: number): { emoji: string; label: string } | null {
  if (vibeCount >= 20) return { emoji: "👑", label: "Legend" };
  if (vibeCount >= 5) return { emoji: "🔥", label: "Insider" };
  if (vibeCount >= 1) return { emoji: "🧭", label: "Explorer" };
  return null;
}

function getDisplayName(vibe: Vibe): string {
  if (vibe.profile?.full_name) return vibe.profile.full_name;
  if (vibe.profile?.email) {
    const name = vibe.profile.email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  if (vibe.username) return vibe.username;
  return "Anonyme";
}

function getAvatarUrl(vibe: Vibe): string | null {
  return vibe.profile?.avatar_url || null;
}

function getScore(v: Vibe) {
  return v.likes + (v.super_vibes || 0) * 3;
}

function isNew(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < 30 * 60 * 1000;
}

interface Props {
  vibe: Vibe;
  index: number;
  liked: boolean;
  isAnimating: boolean;
  doubleTapId: string | null;
  superVibeIds: Set<string>;
  superVibeAnimId: string | null;
  canSuperVibe: boolean;
  deletingId: string | null;
  commentCounts: Record<string, number>;
  userVibeCounts: Record<string, number>;
  reactionsVibeId: string | null;
  floatingReaction: { id: string; emoji: string } | null;
  activeTab: "tendances" | "recents";
  currentUserId?: string;
  onLike: (vibeId: string) => void;
  onSuperVibe: (vibeId: string) => void;
  onDelete: (vibeId: string) => void;
  onDoubleTap: (vibeId: string) => void;
  onOpenComments: (vibeId: string) => void;
  onReaction: (vibeId: string, emoji: string) => void;
  onSetReactionsVibeId: (id: string | null) => void;
  onGoToMap?: (lat: number, lng: number) => void;
}

export default function VibeCard({
  vibe, index, liked, isAnimating, doubleTapId, superVibeIds, superVibeAnimId,
  canSuperVibe, deletingId, commentCounts, userVibeCounts, reactionsVibeId,
  floatingReaction, activeTab, currentUserId, onLike, onSuperVibe, onDelete,
  onDoubleTap, onOpenComments, onReaction, onSetReactionsVibeId, onGoToMap,
}: Props) {
  const [showReplies, setShowReplies] = useState(false);

  return (
    <motion.div
      key={vibe.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-card"
    >
      {/* ── Instagram-style HEADER ── */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link to={vibe.user_id ? `/u/${vibe.user_id}` : "#"} className="shrink-0">
            {getAvatarUrl(vibe) ? (
              <img src={getAvatarUrl(vibe)!} alt="" className="w-8 h-8 rounded-full border border-border object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-foreground">{getDisplayName(vibe).charAt(0).toUpperCase()}</span>
              </div>
            )}
          </Link>
          <div className="min-w-0">
            <Link to={vibe.user_id ? `/u/${vibe.user_id}` : "#"}>
              <p className="text-[13px] font-semibold text-foreground truncate flex items-center gap-1.5 hover:underline">
              {getDisplayName(vibe)}
              {vibe.is_official && (
                <span className="text-[9px] bg-gold/15 text-gold px-1.5 py-0.5 rounded font-bold">PRO</span>
              )}
              {!vibe.is_official && vibe.profile?.is_vip && (
                <Crown className="w-3 h-3 text-gold" />
              )}
              {!vibe.is_official && vibe.user_id && getUserTier(userVibeCounts[vibe.user_id] || 0) && (
                <span className="text-[10px] text-muted-foreground">
                  {getUserTier(userVibeCounts[vibe.user_id] || 0)!.emoji}
                </span>
              )}
            </p>
            </Link>
            {vibe.location && (
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground truncate">{vibe.location}</span>
                {vibe.latitude != null && vibe.longitude != null && onGoToMap && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onGoToMap(vibe.latitude!, vibe.longitude!); }}
                    className="text-[10px] text-gold font-medium"
                  >
                    · Voir
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {vibe.is_official && (
            <span className="text-[9px] text-muted-foreground font-medium">Sponsorisé</span>
          )}
          {!vibe.is_official && isNew(vibe.created_at) && (
            <div className="flex items-center gap-1 bg-destructive/15 px-1.5 py-0.5 rounded-full live-badge-blink">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
              <span className="text-[9px] font-bold text-destructive uppercase">Live</span>
            </div>
          )}
          <span className="text-[11px] text-muted-foreground">{timeAgo(vibe.created_at)}</span>
          {currentUserId && vibe.user_id === currentUserId && (
            <button
              onClick={() => onDelete(vibe.id)}
              disabled={deletingId === vibe.id}
              className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
            >
              {deletingId === vibe.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* ── MEDIA ── */}
      <div className="relative aspect-[4/5] bg-background" onClick={() => onDoubleTap(vibe.id)}>
        <VibeMedia vibe={vibe} className="w-full h-full object-cover" />
        <DoubleTapHeart show={doubleTapId === vibe.id} />
        {vibe.mood && (
          <div className="absolute top-3 left-3 bg-background/70 backdrop-blur-md px-2.5 py-1 rounded-full">
            <span className="text-[10px] font-semibold text-foreground">
              {vibe.mood} {vibe.location || ''}
            </span>
          </div>
        )}
        {activeTab === "tendances" && getScore(vibe) > 0 && (
          <div className="absolute top-3 right-3 bg-background/70 backdrop-blur-md px-2 py-1 rounded-full">
            <span className="text-[10px] font-bold text-gold flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" /> {getScore(vibe)}
            </span>
          </div>
        )}
      </div>

      {/* ── ACTION BAR ── */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-4">
          {/* Like */}
          <div className="relative">
            <VibeReactions
              show={reactionsVibeId === vibe.id}
              onReact={(emoji) => onReaction(vibe.id, emoji)}
              onClose={() => onSetReactionsVibeId(null)}
            />
            <button
              onClick={() => onLike(vibe.id)}
              onContextMenu={(e) => { e.preventDefault(); onSetReactionsVibeId(vibe.id); }}
              onTouchStart={() => {
                const timer = setTimeout(() => onSetReactionsVibeId(vibe.id), 500);
                (window as unknown as Record<string, ReturnType<typeof setTimeout>>).__reactionTimer = timer;
              }}
              onTouchEnd={() => clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>).__reactionTimer)}
              className="group"
            >
              <motion.div
                animate={isAnimating ? { scale: [1, 1.4, 0.9, 1.15, 1] } : {}}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Heart
                  className={`w-6 h-6 transition-colors duration-200 ${
                    liked
                      ? "fill-gold text-gold"
                      : "text-foreground group-hover:text-foreground/70"
                  }`}
                />
              </motion.div>
            </button>
            <FloatingReaction
              emoji={floatingReaction?.id === vibe.id ? floatingReaction.emoji : null}
              show={floatingReaction?.id === vibe.id}
            />
          </div>
          {/* Comment */}
          <button onClick={() => onOpenComments(vibe.id)} className="group">
            <MessageCircle className="w-6 h-6 text-foreground group-hover:text-foreground/70 transition-colors" />
          </button>
          {/* Vibe Reply */}
          <button onClick={() => setShowReplies(true)} className="group">
            <Camera className="w-5.5 h-5.5 text-foreground group-hover:text-foreground/70 transition-colors" />
          </button>
          {/* Share */}
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const url = getShareUrl("vibe", vibe.id);
              const text = `${vibe.location || "Marrakech"} sur Weshkech 🔥`;
              if (navigator.share) {
                try { await navigator.share({ title: "Weshkech", text, url }); } catch {}
              } else {
                await navigator.clipboard.writeText(url);
                toast.success("Lien copié !");
              }
            }}
            className="group"
          >
            <Share2 className="w-5 h-5 text-foreground group-hover:text-foreground/70 transition-colors" />
          </button>
        </div>
        {/* Super Vibe */}
        <button
          onClick={() => onSuperVibe(vibe.id)}
          disabled={!canSuperVibe || superVibeIds.has(vibe.id)}
          className="group relative"
          title="Super Vibe — Booste ce post ×3 !"
        >
          <motion.div
            animate={superVibeAnimId === vibe.id ? { scale: [1, 1.6, 0.8, 1.2, 1], rotate: [0, -10, 10, -5, 0] } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Zap
              className={`w-6 h-6 transition-colors duration-200 ${
                superVibeIds.has(vibe.id)
                  ? "fill-gold text-gold"
                  : !canSuperVibe
                  ? "text-foreground/30"
                  : "text-foreground group-hover:text-foreground/70"
              }`}
            />
          </motion.div>
          <SuperVibeParticles active={superVibeAnimId === vibe.id} />
        </button>
      </div>

      {/* ── LIKES + CAPTION ── */}
      <div className="px-3 pb-3 space-y-1">
        <div className="flex items-center gap-3 text-[13px]">
          <span className="font-semibold text-foreground">{vibe.likes} J'aime{vibe.likes !== 1 ? "s" : ""}</span>
          {(vibe.super_vibes || 0) > 0 && (
            <span className="text-gold font-semibold flex items-center gap-0.5">
              <Zap className="w-3 h-3" /> {vibe.super_vibes} boost{(vibe.super_vibes || 0) !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {vibe.caption && (
          <p className="text-[13px] text-foreground">
            <span className="font-semibold mr-1.5">{getDisplayName(vibe)}</span>
            {vibe.caption}
          </p>
        )}
        {vibe.insider_tip && (
          <div className="flex items-start gap-1.5 mt-1 px-2.5 py-2 rounded-lg bg-gold/[0.08] border border-gold/[0.15]">
            <Sparkles className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-gold leading-relaxed">
              <span className="font-semibold">Insider tip :</span> {vibe.insider_tip}
            </p>
          </div>
        )}
        {(commentCounts[vibe.id] || 0) > 0 && (
          <button onClick={() => onOpenComments(vibe.id)} className="text-[13px] text-muted-foreground">
            Voir les {commentCounts[vibe.id]} commentaire{(commentCounts[vibe.id] || 0) !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Expiry bar */}
      <VibeExpiryBar createdAt={vibe.created_at} isOfficial={vibe.is_official} />

      {/* Vibe Replies modal */}
      <VibeReplies vibeId={vibe.id} open={showReplies} onOpenChange={setShowReplies} />
    </motion.div>
  );
}
