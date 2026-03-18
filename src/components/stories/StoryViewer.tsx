import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Star, ChevronRight, ChevronLeft } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
import type { Story } from "@/hooks/useStories";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import StoryReactions from "./StoryReactions";
import { useIsMobile } from "@/hooks/use-mobile";

const BADGE_COLORS: Record<string, string> = {
  "HOT TONIGHT": "bg-destructive",
  ROOFTOP: "bg-amber-500",
  CLUB: "bg-purple-600",
  RESTAURANT: "bg-emerald-600",
  EVENT: "bg-blue-500",
  INSIDER: "bg-gold",
};

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onViewed: (storyId: string) => void;
}

const STORY_DURATION = 10000;
const TICK = 50;

export default function StoryViewer({ stories, initialIndex, onClose, onViewed }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartY = useRef<number | null>(null);
  const lastTapTime = useRef(0);
  const doubleTapRef = useRef(0);
  const [doubleTapSignal, setDoubleTapSignal] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const story = stories[currentIndex];

  // Mark viewed
  useEffect(() => {
    if (story) onViewed(story.id);
  }, [story?.id]);

  // Auto-advance timer
  useEffect(() => {
    if (paused) return;
    setProgress(0);
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += TICK;
      setProgress(elapsed / STORY_DURATION);
      if (elapsed >= STORY_DURATION) {
        goNext();
      }
    }, TICK);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, paused]);

  // Keyboard navigation (desktop)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) setCurrentIndex((i) => i + 1);
    else onClose();
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleDoubleTapLike = useCallback(() => {
    doubleTapRef.current += 1;
    setDoubleTapSignal(doubleTapRef.current);
  }, []);

  // Tap navigation with double-tap detection
  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      e.stopPropagation();
      handleDoubleTapLike();
      lastTapTime.current = 0;
      return;
    }
    lastTapTime.current = now;

    setTimeout(() => {
      if (Date.now() - lastTapTime.current >= 280) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) goPrev();
        else if (x > (rect.width * 2) / 3) goNext();
      }
    }, 300);
  };

  // Swipe down to close (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (dy > 100) onClose();
      touchStartY.current = null;
    }
  };

  const handlePressStart = () => setPaused(true);
  const handlePressEnd = () => setPaused(false);

  if (!story) return null;

  const badge = story.badge || (story.source_type === "admin" ? "HOT TONIGHT" : null);

  // Desktop/tablet: centered card with side arrows
  // Mobile: fullscreen
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center select-none"
        onClick={(e) => {
          // Click on backdrop (not the story card) closes on desktop
          if (!isMobile && e.target === e.currentTarget) onClose();
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/95 md:bg-black/80" />

        {/* Desktop prev arrow */}
        {!isMobile && currentIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 lg:left-8 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Desktop next arrow */}
        {!isMobile && currentIndex < stories.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 lg:right-8 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Story card */}
        <motion.div
          key={story.id}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`relative z-10 flex flex-col overflow-hidden ${
            isMobile
              ? "w-full h-full"
              : "w-full max-w-[420px] h-[calc(100vh-80px)] max-h-[860px] rounded-2xl shadow-2xl"
          } bg-black`}
          onClick={handleTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePressStart}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
        >
          {/* Progress bars */}
          <div className="flex gap-[3px] px-2 pt-[env(safe-area-inset-top)] mt-2 z-20 relative">
            {stories.map((_, i) => (
              <div key={i} className="flex-1 h-[2.5px] bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{
                    width: i < currentIndex ? "100%" : i === currentIndex ? `${progress * 100}%` : "0%",
                    transition: i === currentIndex ? "width 50ms linear" : "none",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 z-20 relative">
            <div className="flex items-center gap-2.5">
              {story.avatar_url ? (
                <img
                  src={story.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gold/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-gold">
                    {(story.author_name || "W")[0]}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-semibold text-white">{story.author_name}</p>
                  {badge && (
                    <span
                      className={`text-[8px] font-bold px-1.5 py-[1px] rounded-full text-white ${
                        BADGE_COLORS[badge] || "bg-muted"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/50">{timeAgo(story.created_at)}</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Media */}
          <div className="flex-1 relative overflow-hidden">
            {story.media_type === "video" ? (
              <video
                ref={videoRef}
                src={story.media_url}
                className="w-full h-full object-contain"
                autoPlay
                muted
                playsInline
                loop={false}
              />
            ) : (
              <img
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
          </div>

          {/* Place info card at bottom */}
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
                  <img
                    src={story.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  />
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
      </motion.div>
    </AnimatePresence>
  );
}
