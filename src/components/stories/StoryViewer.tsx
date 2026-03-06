import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Star, ChevronRight } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
import type { Story } from "@/hooks/useStories";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import StoryReactions from "./StoryReactions";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";

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
  const doubleTapRef = useRef(0); // increments on double-tap to signal StoryReactions
  const [doubleTapSignal, setDoubleTapSignal] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) setCurrentIndex((i) => i + 1);
    else onClose();
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  // Double-tap like handler — just signal StoryReactions
  const handleDoubleTapLike = useCallback(() => {
    doubleTapRef.current += 1;
    setDoubleTapSignal(doubleTapRef.current);
  }, []);

  // Tap navigation with double-tap detection
  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      // Double tap
      e.stopPropagation();
      handleDoubleTapLike();
      lastTapTime.current = 0;
      return;
    }
    lastTapTime.current = now;

    // Delay single tap to avoid conflict with double tap
    setTimeout(() => {
      if (Date.now() - lastTapTime.current >= 280) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) goPrev();
        else if (x > (rect.width * 2) / 3) goNext();
      }
    }, 300);
  };

  // Swipe down to close
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

  // Long press pause
  const handlePressStart = () => setPaused(true);
  const handlePressEnd = () => setPaused(false);

  if (!story) return null;

  const badge = story.badge || (story.source_type === "admin" ? "HOT TONIGHT" : null);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black flex flex-col select-none"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerLeave={handlePressEnd}
      >
        {/* Progress bars */}
        <div className="flex gap-1 px-3 pt-[env(safe-area-inset-top)] mt-2">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-75"
                style={{
                  width: i < currentIndex ? "100%" : i === currentIndex ? `${progress * 100}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 z-10">
          <div className="flex items-center gap-2.5">
            {story.avatar_url ? (
              <img
                src={story.avatar_url}
                alt=""
                className="w-9 h-9 rounded-full object-cover border border-white/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gold/30 flex items-center justify-center">
                <span className="text-sm font-bold text-gold">
                  {(story.author_name || "W")[0]}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-white">{story.author_name}</p>
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
              <p className="text-[10px] text-white/60">{timeAgo(story.created_at)}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2"
          >
            <X className="w-6 h-6 text-white" />
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
              <p className="text-white text-sm font-medium drop-shadow-lg bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl inline-block">
                {story.caption}
              </p>
            </div>
          )}

          {/* Reaction buttons + double-tap heart */}
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
          <div className="absolute bottom-6 left-4 right-4 z-10">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 flex items-center gap-3"
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
                  className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
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
                    <span className="flex items-center gap-0.5 text-[10px] text-white/50">
                      <MapPin className="w-2.5 h-2.5" /> {story.place_address.slice(0, 20)}
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
  );
}
