import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { X, MapPin, Star, ChevronRight } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
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

const SEGMENT_DURATION = 5000; // 5s per segment — Instagram standard
const TICK = 50;

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
  const [direction, setDirection] = useState(0); // -1 left, 1 right for animation
  const [dragY, setDragY] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapTime = useRef(0);
  const doubleTapRef = useRef(0);
  const [doubleTapSignal, setDoubleTapSignal] = useState(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressing = useRef(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  const group = groups[groupIndex];
  const story = group?.stories[segmentIndex];
  const segmentCount = group?.stories.length ?? 0;

  // Mark viewed
  useEffect(() => {
    if (story) onViewed(story.id);
  }, [story?.id]);

  // Auto-advance timer
  useEffect(() => {
    if (paused || !story) return;
    setProgress(0);
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += TICK;
      setProgress(elapsed / SEGMENT_DURATION);
      if (elapsed >= SEGMENT_DURATION) {
        goNextSegment();
      }
    }, TICK);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [groupIndex, segmentIndex, paused]);

  // Pause/play video in sync
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, story?.id]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNextSegment();
      else if (e.key === "ArrowLeft") goPrevSegment();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [groupIndex, segmentIndex]);

  // --- Navigation ---
  const goNextSegment = useCallback(() => {
    if (segmentIndex < segmentCount - 1) {
      setSegmentIndex((i) => i + 1);
    } else {
      goNextGroup();
    }
  }, [segmentIndex, segmentCount, groupIndex, groups.length]);

  const goPrevSegment = useCallback(() => {
    if (segmentIndex > 0) {
      setSegmentIndex((i) => i - 1);
    } else {
      goPrevGroup();
    }
  }, [segmentIndex, groupIndex]);

  const goNextGroup = useCallback(() => {
    if (groupIndex < groups.length - 1) {
      setDirection(1);
      setGroupIndex((i) => i + 1);
      setSegmentIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [groupIndex, groups.length, onClose]);

  const goPrevGroup = useCallback(() => {
    if (groupIndex > 0) {
      setDirection(-1);
      setGroupIndex((i) => i - 1);
      setSegmentIndex(0);
      setProgress(0);
    }
  }, [groupIndex]);

  // --- Tap zones (left third / right third) with double-tap detection ---
  const handleTap = (e: React.MouseEvent) => {
    if (isLongPressing.current) return;
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      e.stopPropagation();
      doubleTapRef.current += 1;
      setDoubleTapSignal(doubleTapRef.current);
      lastTapTime.current = 0;
      return;
    }
    lastTapTime.current = now;

    setTimeout(() => {
      if (Date.now() - lastTapTime.current >= 280) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) goPrevSegment();
        else goNextSegment();
      }
    }, 300);
  };

  // --- Long press → pause ---
  const handlePointerDown = () => {
    isLongPressing.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      setPaused(true);
    }, 200);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isLongPressing.current) {
      setPaused(false);
      isLongPressing.current = false;
    }
  };

  // --- Swipe gestures (Framer Motion) ---
  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;

    // Swipe down → close
    if (offset.y > 100 || (offset.y > 50 && velocity.y > 300)) {
      onClose();
      return;
    }

    // Swipe left → next group
    if (offset.x < -60 || (offset.x < -30 && velocity.x < -300)) {
      goNextGroup();
      return;
    }

    // Swipe right → prev group
    if (offset.x > 60 || (offset.x > 30 && velocity.x > 300)) {
      goPrevGroup();
      return;
    }

    setDragY(0);
  };

  if (!story || !group) return null;

  const badge = story.badge || (story.source_type === "admin" ? "HOT TONIGHT" : null);

  return (
    <div className="fixed inset-0 z-[9999] bg-black select-none">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${groupIndex}-${segmentIndex}`}
          initial={{
            x: direction === 0 ? 0 : direction > 0 ? "100%" : "-100%",
            opacity: direction === 0 ? 0 : 1,
            scale: direction === 0 ? 0.95 : 1,
          }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{
            x: direction > 0 ? "-30%" : direction < 0 ? "30%" : 0,
            opacity: 0,
            scale: 0.95,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-0 flex flex-col bg-black"
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={{ left: 0.15, right: 0.15, top: 0.3, bottom: 0.3 }}
          onDrag={(_, info) => setDragY(info.offset.y)}
          onDragEnd={handleDragEnd}
          style={{ opacity: Math.max(0.4, 1 - Math.abs(dragY) / 400) }}
          onClick={handleTap}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* ── Segmented progress bars ── */}
          <div className="flex gap-[3px] px-2 pt-[env(safe-area-inset-top)] mt-2 z-20 relative">
            {group.stories.map((_, i) => (
              <div key={i} className="flex-1 h-[2.5px] bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{
                    width: i < segmentIndex ? "100%" : i === segmentIndex ? `${progress * 100}%` : "0%",
                    transition: i === segmentIndex ? "width 50ms linear" : "none",
                  }}
                />
              </div>
            ))}
          </div>

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-3 py-2.5 z-20 relative">
            <div className="flex items-center gap-2.5">
              {group.avatarUrl ? (
                <img src={group.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gold/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-gold">{group.name[0]}</span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-semibold text-white">{group.name}</p>
                  {badge && (
                    <span className={`text-[8px] font-bold px-1.5 py-[1px] rounded-full text-white ${BADGE_COLORS[badge] || "bg-muted"}`}>
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/50">{timeAgo(story.created_at)}</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors z-30"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* ── Media (full screen) ── */}
          <div className="flex-1 relative overflow-hidden">
            {story.media_type === "video" ? (
              <video
                ref={videoRef}
                key={story.id}
                src={story.media_url}
                className="w-full h-full object-contain"
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
                className="w-full h-full object-contain"
              />
            )}

            {/* Caption overlay */}
            {story.caption && (
              <div className="absolute bottom-24 left-4 right-16 text-center">
                <p className="text-white text-sm font-medium drop-shadow-lg bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl inline-block max-w-full">
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
              doubleTapSignal={doubleTapSignal}
            />

            {/* Paused indicator */}
            <AnimatePresence>
              {paused && isLongPressing.current && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                >
                  <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
                    <div className="w-5 h-5 border-l-[3px] border-r-[3px] border-white rounded-sm" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Place info card ── */}
          {story.place_id && story.place_name && (
            <div className="absolute bottom-4 left-3 right-3 z-20">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-3 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (story.place_slug) {
                    onClose();
                    navigate(`/venue/${story.place_slug}`);
                  }
                }}
              >
                {story.avatar_url && (
                  <img src={story.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{story.place_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {story.place_category && (
                      <span className="text-[10px] text-white/60 capitalize">{story.place_category}</span>
                    )}
                    {story.place_rating && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gold">
                        <Star className="w-2.5 h-2.5 fill-gold" /> {story.place_rating}
                      </span>
                    )}
                    {story.place_address && (
                      <span className="flex items-center gap-0.5 text-[10px] text-white/50 truncate">
                        <MapPin className="w-2.5 h-2.5 shrink-0" /> {story.place_address.slice(0, 20)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 bg-gold rounded-full p-1.5">
                  <ChevronRight className="w-4 h-4 text-primary-foreground" />
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Group navigation indicators (small dots) */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-30 flex gap-1">
        {groups.length > 1 && groups.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === groupIndex ? "bg-white w-3" : "bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
