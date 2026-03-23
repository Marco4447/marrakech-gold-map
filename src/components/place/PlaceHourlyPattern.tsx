import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  placeName: string;
}

export default function PlaceHourlyPattern({ placeName }: Props) {
  const [hours, setHours] = useState<number[]>(new Array(24).fill(0));
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const since = new Date(Date.now() - 30 * 24 * 3600000).toISOString();
      const { data } = await supabase
        .from("vibes")
        .select("created_at")
        .ilike("location", placeName)
        .gte("created_at", since);

      if (!data || data.length < 3) return;

      const counts = new Array(24).fill(0);
      data.forEach(v => {
        const h = new Date(v.created_at).getHours();
        counts[h]++;
      });
      setHours(counts);
      setHasData(true);
    };
    fetch();
  }, [placeName]);

  if (!hasData) return null;

  const max = Math.max(...hours, 1);
  // Show 12h–4h range (nightlife focus)
  const displayHours = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3];
  const peakHour = hours.indexOf(Math.max(...hours));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gold" />
          <h3 className="font-display text-sm font-semibold text-foreground">Quand ça vibe</h3>
        </div>
        <span className="text-2xs text-muted-foreground">30 derniers jours</span>
      </div>

      {/* Peak indicator */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-gold font-semibold">🔥 Peak:</span>
        <span className="text-foreground font-medium">{peakHour}h00</span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-[3px] h-16">
        {displayHours.map(h => {
          const value = hours[h];
          const height = Math.max(4, (value / max) * 100);
          const isPeak = h === peakHour;
          return (
            <div key={h} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: displayHours.indexOf(h) * 0.02 }}
                className={`w-full rounded-t-sm ${
                  isPeak ? "bg-gold" : value > max * 0.6 ? "bg-gold/60" : value > 0 ? "bg-muted-foreground/30" : "bg-muted/30"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-[3px]">
        {displayHours.map(h => (
          <div key={h} className="flex-1 text-center">
            <span className={`text-[7px] ${h === peakHour ? "text-gold font-bold" : h % 3 === 0 ? "text-muted-foreground" : "text-transparent"}`}>
              {h}h
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
