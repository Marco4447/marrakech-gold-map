import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Share2, Bookmark, MapPin, Music, Flame } from "lucide-react";

interface Vibe {
  id: string;
  videoUrl: string;
  imageUrl: string;
  venueName: string;
  location: string;
  tags: string[];
  likes: number;
  isVideo: boolean;
  hasVipOffer?: boolean;
  offerExpiresAt?: string;
}

const MOCK_VIBES: Vibe[] = [
  {
    id: "1",
    videoUrl: "/videos/coco-reel.mp4",
    imageUrl: "/images/coco-photo-1.jpg",
    venueName: "Mazel Café",
    location: "Guéliz, Marrakech",
    tags: ["#Bohème", "#LiveMusic"],
    likes: 247,
    isVideo: true,
    hasVipOffer: true,
    offerExpiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 min
  },
  {
    id: "2",
    videoUrl: "",
    imageUrl: "/images/kabana-photo-1.jpg",
    venueName: "Kabana",
    location: "Médina, Marrakech",
    tags: ["#Rooftop", "#Cocktails"],
    likes: 189,
    isVideo: false,
  },
  {
    id: "3",
    videoUrl: "",
    imageUrl: "/images/theatro-2.jpg",
    venueName: "Théatro",
    location: "Hivernage, Marrakech",
    tags: ["#Nightlife", "#DJ"],
    likes: 312,
    isVideo: false,
    hasVipOffer: true,
    offerExpiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3h
  },
];

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expiré";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function VibeCard({ vibe, isActive }: { vibe: Vibe; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(vibe.likes);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const isUrgent = vibe.hasVipOffer && vibe.offerExpiresAt && 
    new Date(vibe.offerExpiresAt).getTime() - Date.now() < 2 * 60 * 60 * 1000;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Background Media */}
      {vibe.isVideo ? (
        <video
          ref={videoRef}
          src={vibe.videoUrl}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={vibe.imageUrl}
          alt={vibe.venueName}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />

      {/* Top Status Bar */}
      <div className="absolute top-12 left-0 right-0 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
          </span>
          <span className="text-xs font-medium text-white/90 tracking-wide">LIVE</span>
        </div>
        <Music className="w-5 h-5 text-white/70" />
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
        >
          <div className={`p-3 rounded-full backdrop-blur-md transition-all duration-200 ${
            isLiked ? "bg-accent-warm/20" : "bg-white/10"
          }`}>
            <Heart
              className={`w-6 h-6 transition-all duration-200 ${
                isLiked ? "fill-accent-warm text-accent-warm" : "text-white"
              }`}
            />
          </div>
          <span className="text-xs font-semibold text-white">{likes}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="p-3 rounded-full bg-white/10 backdrop-blur-md">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-semibold text-white">Share</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setIsSaved(!isSaved)}
          className="flex flex-col items-center gap-1"
        >
          <div className={`p-3 rounded-full backdrop-blur-md transition-all duration-200 ${
            isSaved ? "bg-gold/20" : "bg-white/10"
          }`}>
            <Bookmark
              className={`w-6 h-6 transition-all duration-200 ${
                isSaved ? "fill-gold text-gold" : "text-white"
              }`}
            />
          </div>
          <span className="text-xs font-semibold text-white">Save</span>
        </motion.button>
      </div>

      {/* Bottom Left Info */}
      <div className="absolute bottom-28 left-4 right-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-2xl font-semibold text-white mb-1">
            {vibe.venueName}
          </h2>
          <div className="flex items-center gap-1.5 text-white/70 mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-sm">{vibe.location}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {vibe.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs font-medium bg-white/15 backdrop-blur-md rounded-full text-white/90"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Floating VIP CTA */}
      {vibe.hasVipOffer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-6 left-4 right-4"
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            className={`relative w-full py-4 rounded-2xl font-semibold text-sm tracking-wide overflow-hidden ${
              isUrgent
                ? "bg-accent-warm text-white shadow-lg shadow-accent-warm/30"
                : "bg-gold text-background shadow-lg shadow-gold/20"
            }`}
          >
            {/* Pulse Animation for Urgent */}
            {isUrgent && (
              <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-accent-warm" />
            )}
            
            <div className="relative flex items-center justify-center gap-2">
              <Flame className={`w-4 h-4 ${isUrgent ? "animate-pulse" : ""}`} />
              <span>OFFRE VIP — {formatTimeLeft(vibe.offerExpiresAt!)}</span>
            </div>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

export default function VibeFeedScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = window.innerHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
    >
      {MOCK_VIBES.map((vibe, index) => (
        <div key={vibe.id} className="h-screen w-full snap-start">
          <VibeCard vibe={vibe} isActive={index === currentIndex} />
        </div>
      ))}
    </div>
  );
}
