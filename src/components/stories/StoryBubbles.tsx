import { useRef } from "react";
import { motion } from "framer-motion";
import type { Story } from "@/hooks/useStories";

const BADGE_COLORS: Record<string, string> = {
  "HOT TONIGHT": "bg-destructive text-destructive-foreground",
  ROOFTOP: "bg-amber-500 text-white",
  CLUB: "bg-purple-600 text-white",
  RESTAURANT: "bg-emerald-600 text-white",
  EVENT: "bg-blue-500 text-white",
  INSIDER: "bg-gold text-primary-foreground",
};

interface StoryBubblesProps {
  stories: Story[];
  onStoryPress: (index: number) => void;
}

export default function StoryBubbles({ stories, onStoryPress }: StoryBubblesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (stories.length === 0) return null;

  // Group stories by author (place or user)
  const groups: { key: string; story: Story; index: number }[] = [];
  const seen = new Set<string>();
  stories.forEach((s, i) => {
    const key = s.source_type === "admin" ? "weshkech" : (s.place_id || s.user_id || s.id);
    if (!seen.has(key)) {
      seen.add(key);
      groups.push({ key, story: s, index: i });
    }
  });

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto no-scrollbar px-4 py-2.5 border-b border-border/30"
    >
      {groups.map(({ story, index }, gi) => {
        const name = story.author_name || "Anon";
        const isViewed = story.viewed;
        const hasImage = !!story.avatar_url;

        return (
          <motion.button
            key={story.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: gi * 0.05, duration: 0.25 }}
            onClick={() => onStoryPress(index)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            {/* Ring — Instagram size */}
            <div
              className={`w-[76px] h-[76px] rounded-full p-[3px] ${
                isViewed
                  ? "bg-muted-foreground/30"
                  : "bg-gradient-to-tr from-[hsl(330,80%,55%)] via-[hsl(25,95%,55%)] to-[hsl(280,70%,55%)]"
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-background">
                {hasImage ? (
                  <img
                    src={story.avatar_url!}
                    alt={name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-bold text-foreground/60">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <span className="text-[11px] font-normal text-foreground/70 truncate w-[76px] text-center leading-tight">
              {name.length > 12 ? name.slice(0, 11) + "…" : name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
