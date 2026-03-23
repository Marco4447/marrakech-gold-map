import { useWeather } from "@/hooks/useWeather";

interface WeatherWidgetProps {
  tonightMode: boolean;
}

export default function WeatherWidget({ tonightMode }: WeatherWidgetProps) {
  const { weather, loading, recommendation } = useWeather();

  if (loading || !weather) return null;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Compact temp badge */}
      <div className="flex items-center gap-1 bg-card/80 backdrop-blur-md border border-border/40 rounded-full px-2 py-1 shadow-sm">
        <span className="text-2xs">{weather.icon}</span>
        <span className="text-xs font-semibold text-foreground">{weather.temp}°</span>
      </div>

      {/* Contextual tip — only in tonight mode, very compact */}
      {tonightMode && recommendation && (
        <div className="hidden sm:flex items-center gap-1 bg-gold/10 border border-gold/20 rounded-full px-2 py-1">
          <span className="text-2xs text-gold font-medium truncate max-w-[120px]">{recommendation.emoji} {recommendation.text.split("—")[0]}</span>
        </div>
      )}
    </div>
  );
}
