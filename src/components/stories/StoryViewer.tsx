import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, MapPin, Star, ChevronRight, Heart } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
import { toast } from "sonner";
import type { Story } from "@/hooks/useStories";
import type { StoryGroup } from "./StoriesModule";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import StoryReactions from "./StoryReactions";

const BADGE_COLORS: Record<string, string> = {
  "HOT TONIGHT": "bg-destructive",
  ROOFTOP: "bg-amber-500",
  CLUB: "bg-purple-600",
  RESTAURANT: "bg-emerald-600",
  EVENT: "bg-blue-500",
  INSIDER: "bg-gold",
};

const SEGMENT_DURATION = 5000;

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onViewed: (storyId: string) => void;
}

export default function StoryViewer({ groups, initialGroupIndex, onClose, onViewed }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [slideDirection, setSlideDirection] = useState(0);

  const progressRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Touch tracking — all gesture logic is manual for Instagram-exact behavior
  const touchRef = useRef({ startX: 0, startY: 0, startTime: 0, moved: false });
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPaused = useRef(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  const group = groups[groupIndex];
  const story = group?.stories[segmentIndex];
  const segmentCount = group?.stories.length ?? 0;

  // ─── Mark viewed ───
  useEffect(() => {
    if (story) onViewed(story.id);
  }, [story?.id]);

  // ─── Timer (requestAnimationFrame for smooth progress) ───
  const startTimer = useCallback(() => {
    progressRef.current = 0;
    setProgress(0);
    const start = performance.now();
    const tick = () => {
      if (isPaused.current) {
        timerRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = performance.now() - start;
      const p = Math.min(elapsed / SEGMENT_DURATION, 1);
      progressRef.current = p;
      setProgress(p);
      if (p >= 1) {
        nextSegment();
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };
    timerRef.current = requestAnimationFrame(tick);
  }, [groupIndex, segmentIndex]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
  }, []);

  useEffect(() => {
    startTimer();
    return stopTimer;
  }, [groupIndex, segmentIndex, startTimer, stopTimer]);

  // Sync paused ref
  useEffect(() => { isPaused.current = paused; }, [paused]);

  // Video sync
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause(); else v.play().catch(() => {});
  }, [paused, story?.id]);

  // ─── Navigation ───
  const nextSegment = useCallback(() => {
    if (segmentIndex < segmentCount - 1) {
      setSegmentIndex(i => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setSlideDirection(1);
      setGroupIndex(i => i + 1);
      setSegmentIndex(0);
    } else {
      onClose();
    }
  }, [segmentIndex, segmentCount, groupIndex, groups.length, onClose]);

  const prevSegment = useCallback(() => {
    // If we're past 20% of current segment, restart it (Instagram behavior)
    if (progressRef.current > 0.2) {
      stopTimer();
      startTimer();
      return;
    }
    if (segmentIndex > 0) {
      setSegmentIndex(i => i - 1);
    } else if (groupIndex > 0) {
      setSlideDirection(-1);
      setGroupIndex(i => i - 1);
      setSegmentIndex(0);
    }
  }, [segmentIndex, groupIndex, stopTimer, startTimer]);

  const nextGroup = useCallback(() => {
    if (groupIndex < groups.length - 1) {
      setSlideDirection(1);
      setGroupIndex(i => i + 1);
      setSegmentIndex(0);
    } else {
      onClose();
    }
  }, [groupIndex, groups.length, onClose]);

  const prevGroup = useCallback(() => {
    if (groupIndex > 0) {
      setSlideDirection(-1);
      setGroupIndex(i => i - 1);
      setSegmentIndex(0);
    }
  }, [groupIndex]);

  // ─── Touch handlers (Instagram-exact) ───
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, startTime: Date.now(), moved: false };

    // Long press → pause after 500ms (Instagram uses ~500ms)
    longPressRef.current = setTimeout(() => {
      isPaused.current = true;
      setPaused(true);
      touchRef.current.moved = true; // prevent tap action
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchRef.current.startX);
    const dy = Math.abs(t.clientY - touchRef.current.startY);
    if (dx > 10 || dy > 10) {
      touchRef.current.moved = true;
      // Cancel long press if finger moves
      if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Cancel long press timer
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }

    // If was paused by long press, just unpause
    if (isPaused.current) {
      isPaused.current = false;
      setPaused(false);
      return;
    }

    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;
    const elapsed = Date.now() - touchRef.current.startTime;

    // Swipe detection
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Swipe down → close
    if (dy > 80 && absDy > absDx * 1.5) {
      onClose();
      return;
    }

    // Swipe left → next group
    if (dx < -60 && absDx > absDy * 1.2) {
      nextGroup();
      return;
    }

    // Swipe right → prev group
    if (dx > 60 && absDx > absDy * 1.2) {
      prevGroup();
      return;
    }

    // Tap (no movement, short duration)
    if (!touchRef.current.moved && elapsed < 500) {
      const screenWidth = window.innerWidth;
      const tapX = t.clientX;

      // Left third → prev, rest → next (Instagram behavior)
      if (tapX < screenWidth * 0.3) {
        prevSegment();
      } else {
        nextSegment();
      }
    }
  }, [nextSegment, prevSegment, nextGroup, prevGroup, onClose]);

  // Keyboard (desktop)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSegment();
      else if (e.key === "ArrowLeft") prevSegment();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nextSegment, prevSegment, onClose]);

  if (!story || !group) return null;

  const badge = story.badge || (story.source_type === "admin" ? "HOT TONIGHT" : null);

  // Instagram 3D cube-like slide for group transitions
  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? "100%" : d < 0 ? "-100%" : 0,
      scale: d === 0 ? 0.95 : 1,
      opacity: d === 0 ? 0 : 1,
      rotateY: d > 0 ? -15 : d < 0 ? 15 : 0,
    }),
    center: { x: 0, scale: 1, opacity: 1, rotateY: 0 },
    exit: (d: number) => ({
      x: d > 0 ? "-40%" : d < 0 ? "40%" : 0,
      scale: 0.9,
      opacity: 0.5,
      rotateY: d > 0 ? 10 : d < 0 ? -10 : 0,
    }),
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black select-none overflow-hidden"
      style={{ perspective: "1200px" }}
    >
      <AnimatePresence mode="popLayout" custom={slideDirection} initial={false}>
        <motion.div
          key={groupIndex}
          custom={slideDirection}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0 flex flex-col bg-black"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          // Desktop: click left/right half
          onClick={(e) => {
            if ("ontouchstart" in window) return; // mobile uses touch handlers
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width * 0.3) prevSegment();
            else nextSegment();
          }}
        >
          {/* ── Progress bars ── */}
          <div className="flex gap-[3px] px-2 pt-[env(safe-area-inset-top)] mt-2 z-20 relative">
            {group.stories.map((_, i) => (
              <div key={i} className="flex-1 h-[2px] bg-white/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{
                    width: i < segmentIndex ? "100%" : i === segmentIndex ? `${progress * 100}%` : "0%",
                    transition: i === segmentIndex ? "none" : "none",
                  }}
                />
              </div>
            ))}
          </div>

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-3 py-2 z-20 relative">
            <div className="flex items-center gap-2.5">
              {group.avatarUrl ? (
                <img src={group.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{group.name[0]}</span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-semibold text-white">{group.name}</p>
                  {badge && (
                    <span className={`text-[8px] font-bold px-1.5 py-[1px] rounded-full text-white ${BADGE_COLORS[badge] || "bg-white/20"}`}>
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/50">{timeAgo(story.created_at)}</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              onTouchEnd={(e) => { e.stopPropagation(); onClose(); }}
              className="p-2 z-30"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* ── Media (full screen, cover like Instagram) ── */}
          <div className="flex-1 relative overflow-hidden">
            {story.media_type === "video" ? (
              <video
                ref={videoRef}
                key={story.id}
                src={story.media_url}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                loop={false}
              />
            ) : (
              <img
                key={story.id}
                src={story.media_url}
                alt={story.caption || ""}
                className="w-full h-full object-cover"
              />
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />

            {/* Caption */}
            {story.caption && (
              <div className="absolute bottom-20 left-4 right-16 z-20">
                <p className="text-white text-[15px] font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-snug">
                  {story.caption}
                </p>
              </div>
            )}

            {/* Reactions */}
            <StoryReactions
              storyId={story.id}
              userId={user?.id}
              paused={paused}
              onPause={setPaused}
            />

            {/* Paused overlay */}
            {paused && (
              <div className="absolute inset-0 bg-black/10 pointer-events-none z-10" />
            )}
          </div>

          {/* ── Place card ── */}
          {story.place_id && story.place_name && (
            <div className="absolute bottom-4 left-3 right-3 z-20">
              <div
                className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-3"
                onClick={(e) => { e.stopPropagation(); if (story.place_slug) { onClose(); navigate(`/venue/${story.place_slug}`); } }}
                onTouchEnd={(e) => { e.stopPropagation(); if (story.place_slug) { onClose(); navigate(`/venue/${story.place_slug}`); } }}
              >
                {story.avatar_url && (
                  <img src={story.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{story.place_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {story.place_category && <span className="text-[10px] text-white/60 capitalize">{story.place_category}</span>}
                    {story.place_rating && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gold">
                        <Star className="w-2.5 h-2.5 fill-gold" /> {story.place_rating}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0" />
              </div>
            </div>
          )}

          {/* ── Reply input (Instagram style) ── */}
          <div className="absolute bottom-0 inset-x-0 z-30 px-3 pb-[env(safe-area-inset-bottom)] pb-3"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Envoyer un message..."
                className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                    toast.success("Message envoyé !");
                    (e.target as HTMLInputElement).value = "";
                    setPaused(false);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
              <button
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
                onClick={() => { toast("❤️"); try { navigator.vibrate?.(10); } catch {} }}
              >
                <Heart className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
