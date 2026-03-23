import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StreakBadgeProps {
  userId: string;
  compact?: boolean;
}

export default function StreakBadge({ userId, compact = false }: StreakBadgeProps) {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const calcStreak = async () => {
      // Fetch user's vibe dates (last 30 days)
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase
        .from("vibes")
        .select("created_at")
        .eq("user_id", userId as any)
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      
      if (!data || data.length === 0) { setStreak(0); return; }

      // Group by day (UTC)
      const days = new Set(data.map(v => new Date(v.created_at).toISOString().split("T")[0]));
      const sortedDays = [...days].sort().reverse();

      // Count consecutive days from today/yesterday
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      
      let count = 0;
      let checkDate = days.has(today) ? today : days.has(yesterday) ? yesterday : null;
      if (!checkDate) { setStreak(0); return; }

      const checkDay = new Date(checkDate);
      for (let i = 0; i < 30; i++) {
        const dayStr = checkDay.toISOString().split("T")[0];
        if (days.has(dayStr)) {
          count++;
          checkDay.setDate(checkDay.getDate() - 1);
        } else break;
      }
      setStreak(count);
    };
    calcStreak();
  }, [userId]);

  if (streak < 2) return null;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-0.5 text-2xs font-bold text-orange-400">
        <Flame className="w-3 h-3" />
        {streak}
      </span>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ 
        background: streak >= 7 
          ? "linear-gradient(135deg, hsl(25 95% 50% / 0.2), hsl(0 80% 50% / 0.2))" 
          : "hsl(25 95% 50% / 0.1)",
        border: `1px solid hsl(25 95% 50% / ${streak >= 7 ? 0.4 : 0.2})`,
      }}
    >
      <Flame className={`w-3.5 h-3.5 ${streak >= 7 ? "text-red-400" : "text-orange-400"}`} />
      <span className={`text-xs font-bold ${streak >= 7 ? "text-red-400" : "text-orange-400"}`}>
        {streak}j streak
      </span>
      {streak >= 7 && <span className="text-xs">🔥</span>}
    </motion.div>
  );
}
