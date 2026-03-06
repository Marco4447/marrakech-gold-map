import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";

const REACTIONS = [
  { emoji: "❤️", label: "Love" },
  { emoji: "🔥", label: "Hot" },
  { emoji: "😍", label: "Wow" },
  { emoji: "🤤", label: "Foodie" },
  { emoji: "💀", label: "Dead" },
];

interface StoryReactionsProps {
  storyId: string;
  userId?: string | null;
  paused: boolean;
  onPause: (p: boolean) => void;
}

export default function StoryReactions({ storyId, userId, paused, onPause }: StoryReactionsProps) {
  const [reactedEmojis, setReactedEmojis] = useState<Set<string>>(new Set());
  const [floatingEmoji, setFloatingEmoji] = useState<string | null>(null);
  const [showBar, setShowBar] = useState(false);
  const floatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleReact = useCallback(async (emoji: string) => {
    if (reactedEmojis.has(emoji)) return;
    setReactedEmojis((prev) => new Set(prev).add(emoji));
    setFloatingEmoji(emoji);
    setShowBar(false);
    onPause(false);

    if (floatTimer.current) clearTimeout(floatTimer.current);
    floatTimer.current = setTimeout(() => setFloatingEmoji(null), 800);

    const deviceId = getDeviceId();
    await supabase.from("story_reactions" as any).upsert(
      { story_id: storyId, user_id: userId || null, device_id: deviceId, emoji } as any,
      { onConflict: "story_id,device_id,emoji" }
    );
  }, [storyId, userId, reactedEmojis, onPause]);

  const toggleBar = useCallback(() => {
    setShowBar((v) => {
      onPause(!v);
      return !v;
    });
  }, [onPause]);

  return (
    <>
      {/* Reaction bar button */}
      <div className="absolute bottom-28 right-4 z-20 flex flex-col items-center gap-3">
        {/* Like button */}
        <motion.button
          whileTap={{ scale: 1.3 }}
          onClick={(e) => { e.stopPropagation(); handleReact("❤️"); }}
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <Heart
            className={`w-6 h-6 transition-colors ${
              reactedEmojis.has("❤️") ? "fill-gold text-gold" : "text-white"
            }`}
          />
        </motion.button>

        {/* Emoji bar toggle */}
        <motion.button
          whileTap={{ scale: 1.2 }}
          onClick={(e) => { e.stopPropagation(); toggleBar(); }}
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <span className="text-xl">😍</span>
        </motion.button>
      </div>

      {/* Emoji reaction bar */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-28 right-16 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {REACTIONS.map((r, i) => (
              <motion.button
                key={r.emoji}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 500 }}
                onClick={() => handleReact(r.emoji)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                  reactedEmojis.has(r.emoji) ? "bg-gold/20 scale-110" : "hover:bg-white/10 active:scale-125"
                }`}
              >
                <span className="text-2xl">{r.emoji}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating emoji animation */}
      <AnimatePresence>
        {floatingEmoji && (
          <motion.div
            key={floatingEmoji + Date.now()}
            initial={{ scale: 0, y: 0, opacity: 1 }}
            animate={{ scale: [0, 1.6, 1.2], y: -120, opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute bottom-40 right-8 pointer-events-none z-50"
          >
            <span className="text-5xl drop-shadow-lg">{floatingEmoji}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Double-tap heart overlay for story viewer
export function StoryDoubleTapHeart({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1] }}
          exit={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <Heart className="w-24 h-24 fill-gold text-gold drop-shadow-[0_0_40px_hsl(43,76%,52%,0.8)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
