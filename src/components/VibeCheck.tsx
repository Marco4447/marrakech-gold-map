import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { toast } from "sonner";

interface VibeCheckProps {
  placeId: string;
  placeName: string;
}

const MOODS = [
  { emoji: "🔥", label: "Plein", value: "full" },
  { emoji: "😴", label: "Mort", value: "dead" },
  { emoji: "💃", label: "Dancefloor", value: "dance" },
  { emoji: "🍸", label: "Chill", value: "chill" },
] as const;

type MoodValue = (typeof MOODS)[number]["value"];

interface VoteCounts {
  full: number;
  dead: number;
  dance: number;
  chill: number;
}

export default function VibeCheck({ placeId, placeName }: VibeCheckProps) {
  const [votes, setVotes] = useState<VoteCounts>({
    full: 0,
    dead: 0,
    dance: 0,
    chill: 0,
  });
  const [userVote, setUserVote] = useState<MoodValue | null>(null);
  const [loading, setLoading] = useState(true);
  const db = supabase;

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const dominantMood =
    totalVotes > 0
      ? MOODS.reduce((best, mood) =>
          votes[mood.value] > votes[best.value] ? mood : best
        )
      : null;

  useEffect(() => {
    fetchVotes();
  }, [placeId]);

  async function fetchVotes() {
    try {
      setLoading(true);
      const twoHoursAgo = new Date(
        Date.now() - 2 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await db
        .from("vibe_checks")
        .select("mood, device_id")
        .eq("place_id", placeId)
        .gte("created_at", twoHoursAgo);

      if (error) throw error;

      const counts: VoteCounts = { full: 0, dead: 0, dance: 0, chill: 0 };
      const deviceId = getDeviceId();

      data?.forEach((row: { mood: string; device_id: string }) => {
        if (row.mood in counts) {
          counts[row.mood as MoodValue]++;
        }
        if (row.device_id === deviceId) {
          setUserVote(row.mood as MoodValue);
        }
      });

      setVotes(counts);
    } catch {
     
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(mood: MoodValue) {
    if (userVote) {
      toast("Tu as déjà voté", {
        description: "Reviens dans 2h pour revoter !",
      });
      return;
    }

    // Optimistic update
    setUserVote(mood);
    setVotes((prev) => ({ ...prev, [mood]: prev[mood] + 1 }));

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    try {
      const deviceId = getDeviceId();

      const { error } = await db.from("vibe_checks").insert({
        place_id: placeId,
        mood,
        device_id: deviceId,
      });

      if (error) {
        // Rollback on error
        setUserVote(null);
        setVotes((prev) => ({ ...prev, [mood]: prev[mood] - 1 }));
        throw error;
      }

      toast("Vote enregistré !", {
        description: `Tu as voté ${MOODS.find((m) => m.value === mood)?.label} pour ${placeName}`,
      });
    } catch {
      toast.error("Erreur lors du vote");
    }
  }

  return (
    <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground/90">
        C'est comment là-bas ?
      </h3>

      {/* Mood Buttons */}
      <div className="flex gap-2">
        {MOODS.map((mood) => {
          const isSelected = userVote === mood.value;
          const voteCount = votes[mood.value];
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

          return (
            <motion.button
              key={mood.value}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleVote(mood.value)}
              disabled={loading}
              className={`
                relative flex-1 flex flex-col items-center gap-1 py-3 px-2
                rounded-xl transition-all duration-200 overflow-hidden
                ${
                  isSelected
                    ? "bg-gold/15 border border-gold/50 shadow-[0_0_12px_rgba(212,175,55,0.15)]"
                    : "bg-background/50 border border-border/30 hover:border-gold/20"
                }
              `}
            >
              {/* Background fill showing vote percentage */}
              {totalVotes > 0 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute bottom-0 left-0 right-0 bg-gold/5 pointer-events-none"
                />
              )}
              <span className="text-xl relative z-10">{mood.emoji}</span>
              <span
                className={`text-xs font-medium relative z-10 ${
                  isSelected ? "text-gold" : "text-foreground/60"
                }`}
              >
                {mood.label}
              </span>
              {totalVotes > 0 && (
                <span className="text-2xs text-foreground/40 relative z-10">
                  {voteCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Result Summary */}
      <AnimatePresence>
        {totalVotes > 0 && dominantMood && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center justify-between text-xs text-foreground/50 pt-1"
          >
            <span>
              Ambiance dominante : {dominantMood.emoji} {dominantMood.label}
            </span>
            <span className="text-gold/60">
              {totalVotes} vote{totalVotes > 1 ? "s" : ""}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {totalVotes === 0 && !loading && (
        <p className="text-xs text-foreground/40 text-center py-1">
          Aucun vote récent — sois le premier !
        </p>
      )}
    </div>
  );
}
