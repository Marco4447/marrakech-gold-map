import { useState, useRef, useEffect } from "react";
import { Video, VolumeX, Volume2 } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/imageOptimize";
import type { Vibe } from "@/types/models";

function withCacheBust(url: string, token: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("cb", token);
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}cb=${encodeURIComponent(token)}`;
  }
}

export default function VibeMedia({ vibe, className }: { vibe: Vibe; className?: string }) {
  const [muted, setMuted] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [imageSrc, setImageSrc] = useState(() => {
    const raw = withCacheBust(vibe.image_url, vibe.created_at || `${Date.now()}`);
    return getOptimizedImageUrl(raw, { width: 600, quality: 75 });
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = vibe.media_type === "video";

  useEffect(() => {
    setRetryCount(0);
    const raw = withCacheBust(vibe.image_url, vibe.created_at || `${Date.now()}`);
    setImageSrc(getOptimizedImageUrl(raw, { width: 600, quality: 75 }));
  }, [vibe.id, vibe.image_url, vibe.created_at]);

  const handleImageError = () => {
    if (retryCount >= 2) return;
    const nextRetry = retryCount + 1;
    setRetryCount(nextRetry);
    setTimeout(() => {
      const raw = withCacheBust(vibe.image_url, `${Date.now()}-${nextRetry}`);
      setImageSrc(getOptimizedImageUrl(raw, { width: 600, quality: 75 }));
    }, 400 * nextRetry);
  };

  if (!isVideo) {
    return (
      <img
        src={imageSrc}
        alt={vibe.caption || "Vibe"}
        className={className}
        loading="lazy"
        onError={handleImageError}
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={vibe.image_url}
        className={className}
        autoPlay
        loop
        muted={muted}
        playsInline
        preload="metadata"
      />
      <button
        onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
        className="absolute bottom-12 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center z-10"
      >
        {muted ? <VolumeX className="w-4 h-4 text-foreground" /> : <Volume2 className="w-4 h-4 text-foreground" />}
      </button>
      <div className="absolute top-3 left-12 flex items-center gap-1 bg-background/60 backdrop-blur-md px-2 py-1 rounded-lg">
        <Video className="w-3 h-3 text-destructive" />
        <span className="text-[10px] text-foreground font-medium">Vidéo</span>
      </div>
    </div>
  );
}
