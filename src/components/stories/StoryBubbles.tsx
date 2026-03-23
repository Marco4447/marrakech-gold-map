import { useRef } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { StoryGroup } from "./StoriesModule";

interface StoryBubblesProps {
  groups: StoryGroup[];
  onGroupPress: (groupIndex: number) => void;
  onAddStory?: () => void;
}

export default function StoryBubbles({ groups, onGroupPress, onAddStory }: StoryBubblesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (groups.length === 0 && !onAddStory) return null;

  return (
    <div className="border-b border-border/30 bg-background overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar px-3 py-2.5 sm:px-4 sm:gap-4 cursor-grab active:cursor-grabbing"
        style={{ WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}
        onPointerDown={(e) => {
          const el = scrollRef.current;
          if (!el) return;
          const startX = e.clientX;
          const scrollLeft = el.scrollLeft;
          const onMove = (ev: PointerEvent) => { el.scrollLeft = scrollLeft - (ev.clientX - startX); };
          const onUp = () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onUp); };
          document.addEventListener("pointermove", onMove);
          document.addEventListener("pointerup", onUp);
        }}
      >
        {/* Your Story — Instagram style */}
        {onAddStory && (
          <button onClick={onAddStory} className="flex flex-col items-center gap-1 shrink-0 w-[66px] sm:w-[72px]">
            <div className="relative">
              <div className="w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg">
                📷
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[hsl(210,100%,50%)] border-2 border-background flex items-center justify-center">
                <Plus className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-xs text-muted-foreground leading-tight truncate w-full text-center">Ma story</span>
          </button>
        )}

        {groups.map((group, gi) => (
          <motion.button
            key={group.key}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: gi * 0.03, duration: 0.2 }}
            onClick={() => onGroupPress(gi)}
            className="flex flex-col items-center gap-1 shrink-0 w-[66px] sm:w-[72px]"
          >
            {/* Ring — Instagram gradient: purple/orange if unseen, gray if seen */}
            <div
              className={`w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] rounded-full p-[2.5px] transition-all ${
                group.hasUnviewed
                  ? "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]"
                  : "bg-muted-foreground/30"
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden border-[2.5px] border-background">
                {group.avatarUrl ? (
                  <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-base font-semibold text-foreground/60">{group.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <span className={`text-xs leading-tight truncate w-full text-center ${group.hasUnviewed ? "text-foreground/80" : "text-muted-foreground"}`}>
              {group.name.length > 10 ? group.name.slice(0, 10) + "…" : group.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
