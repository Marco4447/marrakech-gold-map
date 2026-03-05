import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/timeAgo";

interface StoryVibe {
  id: string;
  image_url: string;
  location: string | null;
  mood: string | null;
  created_at: string;
  username: string | null;
  user_id: string | null;
  media_type?: string;
  is_official?: boolean;
  avatar_url?: string | null;
  full_name?: string | null;
}

const MOOD_EMOJI: Record<string, string> = {
  hot: "🔥", chill: "🍸", secret: "✨", foodie: "🥗",
};

export default function VibeStories({ onVibeClick }: { onVibeClick?: (vibeId: string) => void }) {
  const [stories, setStories] = useState<StoryVibe[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStories = async () => {
      const since = new Date(Date.now() - 6 * 3600000).toISOString();
      const { data } = await supabase
        .from("vibes")
        .select("id, image_url, location, mood, created_at, username, user_id, media_type, is_official")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!data || data.length === 0) { setStories([]); return; }

      const userIds = [...new Set(data.filter(v => v.user_id).map(v => v.user_id!))];
      let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles_public" as any)
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        if (profiles) profilesMap = Object.fromEntries((profiles as any[]).map(p => [p.user_id, p]));
      }

      setStories(data.map(v => ({
        ...v,
        avatar_url: v.user_id ? profilesMap[v.user_id]?.avatar_url : null,
        full_name: v.user_id ? profilesMap[v.user_id]?.full_name : null,
      })));
    };
    fetchStories();
  }, []);

  // Auto-advance story
  useEffect(() => {
    if (activeIndex === null) return;
    setProgress(0);
    const DURATION = 5000;
    const INTERVAL = 50;
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += INTERVAL;
      setProgress(elapsed / DURATION);
      if (elapsed >= DURATION) {
        if (activeIndex < stories.length - 1) {
          setActiveIndex(activeIndex + 1);
        } else {
          setActiveIndex(null);
        }
      }
    }, INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeIndex, stories.length]);

  if (stories.length === 0) return null;

  const getName = (s: StoryVibe) => {
    if (s.full_name) return s.full_name.split(" ")[0];
    if (s.username) return s.username.split(" ")[0];
    return "Anon";
  };

  const activeStory = activeIndex !== null ? stories[activeIndex] : null;

  return (
    <>
      {/* Story bubbles */}
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar px-4 py-3">
        {stories.map((story, i) => (
          <button
            key={story.id}
            onClick={() => setActiveIndex(i)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-gold via-amber-400 to-orange-500">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                {story.avatar_url ? (
                  <img src={story.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gold/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-gold">
                      {story.mood ? MOOD_EMOJI[story.mood] || "📸" : "📸"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] font-medium text-foreground/80 truncate w-16 text-center">
              {getName(story)}
            </span>
          </button>
        ))}
      </div>

      {/* Fullscreen story viewer */}
      <AnimatePresence>
        {activeStory && activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col"
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              const x = e.clientX - rect.left;
              if (x < rect.width / 3) {
                setActiveIndex(Math.max(0, activeIndex - 1));
              } else if (x > (rect.width * 2) / 3) {
                if (activeIndex < stories.length - 1) setActiveIndex(activeIndex + 1);
                else setActiveIndex(null);
              }
            }}
          >
            {/* Progress bars */}
            <div className="flex gap-1 px-3 pt-[env(safe-area-inset-top)] mt-2">
              {stories.map((_, i) => (
                <div key={i} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{
                      width: i < activeIndex ? "100%" : i === activeIndex ? `${progress * 100}%` : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                {activeStory.avatar_url ? (
                  <img src={activeStory.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/30" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gold/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-gold">{getName(activeStory)[0]}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{getName(activeStory)}</p>
                  <p className="text-[10px] text-white/60">{timeAgo(activeStory.created_at)}</p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setActiveIndex(null); }} className="p-2">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Media */}
            <div className="flex-1 relative">
              {activeStory.media_type === "video" ? (
                <video src={activeStory.image_url} className="w-full h-full object-contain" autoPlay muted playsInline />
              ) : (
                <img src={activeStory.image_url} alt="" className="w-full h-full object-contain" />
              )}

              {/* Location overlay */}
              {activeStory.location && (
                <div className="absolute bottom-6 left-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-gold" />
                  <span className="text-xs font-medium text-white">{activeStory.location}</span>
                </div>
              )}

              {/* Mood overlay */}
              {activeStory.mood && (
                <div className="absolute bottom-6 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                  <span className="text-sm">{MOOD_EMOJI[activeStory.mood] || "📸"}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
