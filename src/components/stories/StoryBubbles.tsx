import { useRef } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
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
  onAddStory?: () => void;
}

export default function StoryBubbles({ stories, onStoryPress, onAddStory }: StoryBubblesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (stories.length === 0 && !onAddStory) return null;

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
    <div className="border-b border-border/30 bg-background">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar px-3 py-2 sm:px-4 sm:gap-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Add story — Instagram "Your Story" */}
        {onAddStory && (
          <button
            onClick={onAddStory}
            className="flex flex-col items-center gap-1 shrink-0 w-[66px] sm:w-[72px]"
          >
            <div className="relative">
              <div className="w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] rounded-full bg-muted flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg">
                  📷
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[hsl(210,100%,50%)] border-2 border-background flex items-center justify-center">
                <Plus className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground leading-tight truncate w-full text-center">
              Ma story
            </span>
          </button>
        )}

        {groups.map(({ story, index }, gi) => {
          const name = story.author_name || "Anon";
          const isViewed = story.viewed;
          const hasImage = !!story.avatar_url;

          return (
            <motion.button
              key={story.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: gi * 0.03, duration: 0.2 }}
              onClick={() => onStoryPress(index)}
              className="flex flex-col items-center gap-1 shrink-0 w-[66px] sm:w-[72px]"
            >
              {/* Ring — exact Instagram style */}
              <div
                className={`w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] rounded-full p-[2.5px] transition-all ${
                  isViewed
                    ? "bg-muted-foreground/25"
                    : "bg-gradient-to-tr from-[hsl(45,100%,55%)] via-[hsl(330,80%,55%)] to-[hsl(280,70%,55%)]"
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden border-[2.5px] border-background">
                  {hasImage ? (
                    <img
                      src={story.avatar_url!}
                      alt={name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-base font-semibold text-foreground/60">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Name — Instagram truncation */}
              <span
                className={`text-[11px] leading-tight truncate w-full text-center ${
                  isViewed ? "text-muted-foreground" : "text-foreground/80"
                }`}
              >
                {name.length > 10 ? name.slice(0, 10) + "…" : name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
