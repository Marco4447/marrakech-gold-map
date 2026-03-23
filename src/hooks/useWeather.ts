import { reportError } from "@/lib/errorReporting";
import { useState, useEffect } from "react";

interface Weather {
  temp: number;
  description: string;
  icon: string;
  isRainy: boolean;
  isHot: boolean;
  isCool: boolean;
}

const CACHE_KEY = "wk_weather_cache";
const CACHE_DURATION = 30 * 60 * 1000; // 30 min
const MARRAKECH_LAT = 31.6295;
const MARRAKECH_LNG = -7.9811;

// Free OpenWeatherMap fallback — uses environment variable or hardcoded free key
const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY || "";

export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      // Check cache first
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setWeather(data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // If no API key, use a reasonable default for Marrakech
      if (!API_KEY) {
        const fallback: Weather = {
          temp: 28,
          description: "Ensoleillé",
          icon: "☀️",
          isRainy: false,
          isHot: true,
          isCool: false,
        };
        setWeather(fallback);
        setLoading(false);
        return;
      }

      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${MARRAKECH_LAT}&lon=${MARRAKECH_LNG}&appid=${API_KEY}&units=metric&lang=fr`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error");
        const json = await res.json();

        const temp = Math.round(json.main.temp);
        const weatherId = json.weather[0]?.id || 800;
        const desc = json.weather[0]?.description || "N/A";

        // Weather icon mapping
        let icon = "☀️";
        if (weatherId >= 200 && weatherId < 300) icon = "⛈️";
        else if (weatherId >= 300 && weatherId < 600) icon = "🌧️";
        else if (weatherId >= 600 && weatherId < 700) icon = "❄️";
        else if (weatherId >= 700 && weatherId < 800) icon = "🌫️";
        else if (weatherId === 800) icon = "☀️";
        else if (weatherId > 800) icon = "⛅";

        const isRainy = weatherId >= 200 && weatherId < 700;
        const isHot = temp > 25;
        const isCool = temp < 20;

        const data: Weather = { temp, description: desc, icon, isRainy, isHot, isCool };
        setWeather(data);

        // Cache it
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        } catch {}
      } catch (err) {
        reportError(err, { context: "Weather fetch" });
        // Fallback
        setWeather({ temp: 26, description: "Ensoleillé", icon: "☀️", isRainy: false, isHot: true, isCool: false });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  // Contextual recommendation
  const recommendation = weather
    ? weather.isRainy
      ? { text: "Il pleut — clubs et bars couverts", filter: "indoor" as const, emoji: "🌧️" }
      : weather.isCool
        ? { text: "Soirée fraîche — bars cosy et spots indoor", filter: "indoor" as const, emoji: "🧥" }
        : weather.isHot
          ? { text: "Soirée chaude — rooftops et terrasses", filter: "outdoor" as const, emoji: "🌙" }
          : null
    : null;

  return { weather, loading, recommendation };
}
