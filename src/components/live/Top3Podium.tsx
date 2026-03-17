import { motion } from "framer-motion";
import { Heart, MessageCircle, Zap } from "lucide-react";
import VibeMedia from "./VibeMedia";
import type { Vibe, VibeProfile } from "@/types/models";

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

const rankMedals = ["🥇", "🥈", "🥉"];

interface Props {
  top3Vibes: Vibe[];
  commentCounts: Record<string, number>;
  onOpenComments: (vibeId: string) => void;
}

export default function Top3Podium({ top3Vibes, commentCounts, onOpenComments }: Props) {
  if (top3Vibes.length === 0) return null;

  return (
    <div className="pt-3 pb-2 px-4">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-sm">🔥</span>
        <h2 className="text-[13px] font-semibold text-foreground">Top 3</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {top3Vibes.map((vibe, i) => (
          <motion.div
            key={`top-${vibe.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onOpenComments(vibe.id)}
            className={`relative flex-shrink-0 w-[42vw] aspect-[3/4] rounded-lg overflow-hidden cursor-pointer active:scale-[0.97] transition-transform ${
              i === 0 ? "ring-2 ring-foreground/20" : "ring-1 ring-border"
            }`}
          >
            <VibeMedia vibe={vibe} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />

            {/* Rank */}
            <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
              i === 0 ? "bg-foreground text-background" : "bg-background/70 backdrop-blur-md text-foreground"
            }`}>
              {rankMedals[i]} #{i + 1}
            </div>

            {/* Score */}
            <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-md px-1.5 py-0.5 rounded-md">
              <span className="text-[10px] font-bold text-foreground flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" />{getScore(vibe)}
              </span>
            </div>

            {/* Bottom */}
            <div className="absolute bottom-0 inset-x-0 p-2.5">
              <div className="flex items-center gap-1.5">
                {getAvatarUrl(vibe) ? (
                  <img src={getAvatarUrl(vibe)!} alt="" className="w-4 h-4 rounded-full border border-border object-cover" />
                ) : null}
                <p className="text-[11px] font-semibold text-foreground truncate">{getDisplayName(vibe)}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-foreground/70 flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{vibe.likes}</span>
                <span className="text-[10px] text-foreground/70 flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" />{commentCounts[vibe.id] || 0}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
