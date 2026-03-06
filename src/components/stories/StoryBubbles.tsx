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

const SOURCE_ICON: Record<string, string> = {
  admin: "🔥",
  partner: "⭐",
  user: "📸",
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
      className="flex gap-3 overflow-x-auto no-scrollbar px-4 py-3"
    >
      {groups.map(({ story, index }, gi) => {
        const name = story.author_name || "Anon";
        const isViewed = story.viewed;
        const badge = story.badge || (story.source_type === "admin" ? "HOT TONIGHT" : null);

        return (
          <motion.button
            key={story.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: gi * 0.05, duration: 0.25 }}
            onClick={() => onStoryPress(index)}
            className="flex flex-col items-center gap-1 flex-shrink-0 relative"
          >
            {/* Ring */}
            <div
              className={`w-[66px] h-[66px] rounded-full p-[2.5px] ${
                isViewed
                  ? "bg-muted-foreground/30"
                  : "bg-gradient-to-tr from-[hsl(330,80%,55%)] via-[hsl(25,95%,55%)] to-[hsl(280,70%,55%)]"
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden border-[2.5px] border-background">
                {story.avatar_url ? (
                  <img
                    src={story.avatar_url}
                    alt={name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-base">{SOURCE_ICON[story.source_type] || "📸"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Badge */}
            {badge && (
              <span
                className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[7px] font-bold px-1.5 py-[1px] rounded-full whitespace-nowrap leading-tight ${
                  BADGE_COLORS[badge] || "bg-muted text-foreground"
                }`}
              >
                {badge}
              </span>
            )}

            {/* Name */}
            <span className="text-[10px] font-medium text-foreground/70 truncate w-[66px] text-center mt-0.5">
              {name.length > 10 ? name.slice(0, 9) + "…" : name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
