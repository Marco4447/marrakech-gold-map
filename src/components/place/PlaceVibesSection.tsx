import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Radio, Play } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";

interface PlaceVibe {
  id: string;
  image_url: string;
  caption: string | null;
  mood: string | null;
  username: string | null;
  created_at: string;
  media_type: string;
  is_official: boolean;
  likes: number;
  super_vibes: number;
}

interface Props {
  placeName: string;
}

export default function PlaceVibesSection({ placeName }: Props) {
  const [vibes, setVibes] = useState<PlaceVibe[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!placeName) return;
    supabase
      .from("vibes")
      .select("id, image_url, caption, mood, username, created_at, media_type, is_official, likes, super_vibes")
      .ilike("location", `%${placeName.split(" ")[0]}%`)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setVibes(data);
      });
  }, [placeName]);

  if (vibes.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-gold animate-pulse" />
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Vibes récentes
        </h4>
        <span className="text-[10px] text-muted-foreground">({vibes.length})</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {vibes.map((vibe, i) => (
          <motion.button
            key={vibe.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setExpanded(expanded === vibe.id ? null : vibe.id)}
            className="relative aspect-square rounded-xl overflow-hidden group"
          >
            {vibe.media_type === "video" ? (
              <>
                <video
                  src={vibe.image_url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  autoPlay={expanded === vibe.id}
                  loop
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="w-5 h-5 text-white fill-white drop-shadow-lg" />
                </div>
              </>
            ) : (
              <img src={vibe.image_url} alt="" className="w-full h-full object-cover" />
            )}

            {/* Official badge */}
            {vibe.is_official && (
              <span className="absolute top-1 left-1 text-[8px] bg-gold/90 text-primary-foreground px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Officiel
              </span>
            )}

            {/* Engagement overlay */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
              <p className="text-[9px] text-white/90 font-medium truncate">
                {vibe.caption || vibe.mood || ""}
              </p>
              <div className="flex items-center gap-1.5 text-[8px] text-white/70">
                <span>❤️ {vibe.likes}</span>
                {vibe.super_vibes > 0 && <span>⚡ {vibe.super_vibes}</span>}
                <span className="ml-auto">{timeAgo(vibe.created_at)}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Expanded vibe viewer */}
      {expanded && (() => {
        const vibe = vibes.find(v => v.id === expanded);
        if (!vibe) return null;
        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl overflow-hidden border border-gold/20 bg-card"
          >
            <div className="relative aspect-video">
              {vibe.media_type === "video" ? (
                <video
                  src={vibe.image_url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                />
              ) : (
                <img src={vibe.image_url} alt="" className="w-full h-full object-cover" />
              )}
              {vibe.is_official && (
                <span className="absolute top-2 left-2 text-[10px] bg-gold text-primary-foreground px-2 py-0.5 rounded-full font-bold">
                  ✨ Officiel
                </span>
              )}
            </div>
            {vibe.caption && (
              <div className="px-3 py-2">
                <p className="text-xs text-foreground">{vibe.caption}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {vibe.username || "Anonyme"} · {timeAgo(vibe.created_at)}
                </p>
              </div>
            )}
          </motion.div>
        );
      })()}
    </div>
  );
}
