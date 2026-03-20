import { motion } from "framer-motion";
import { useWeather } from "@/hooks/useWeather";

interface WeatherWidgetProps {
  tonightMode: boolean;
}

export default function WeatherWidget({ tonightMode }: WeatherWidgetProps) {
  const { weather, loading, recommendation } = useWeather();

  if (loading || !weather) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Temperature badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1.5 bg-card/80 backdrop-blur-md border border-border/40 rounded-full px-2.5 py-1 shadow-sm"
      >
        <span className="text-xs">{weather.icon}</span>
        <span className="text-[11px] font-semibold text-foreground">{weather.temp}°</span>
      </motion.div>

      {/* Contextual recommendation (only in tonight mode) */}
      {tonightMode && recommendation && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/90 backdrop-blur-md border border-gold/20 rounded-xl px-3 py-2 shadow-md max-w-[200px]"
        >
          <p className="text-[10px] text-gold font-semibold flex items-center gap-1">
            <span>{recommendation.emoji}</span>
            {recommendation.text}
          </p>
        </motion.div>
      )}
    </div>
  );
}
