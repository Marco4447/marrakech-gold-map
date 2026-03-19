import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Clock, Music, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  title: string;
  place_id: string;
  place_name?: string;
  date: string;
  time: string;
  description: string | null;
  image_url: string | null;
  type: "dj_set" | "ladies_night" | "opening" | "live" | "special";
}

const EVENT_TYPES: Record<
  Event["type"],
  { emoji: string; label: string; color: string }
> = {
  dj_set: { emoji: "🎧", label: "DJ Set", color: "bg-purple-500/15 text-purple-400" },
  ladies_night: { emoji: "👠", label: "Ladies Night", color: "bg-pink-500/15 text-pink-400" },
  opening: { emoji: "🎉", label: "Opening", color: "bg-[#D4AF37]/15 text-[#D4AF37]" },
  live: { emoji: "🎤", label: "Live", color: "bg-blue-500/15 text-blue-400" },
  special: { emoji: "✨", label: "Special", color: "bg-amber-500/15 text-amber-400" },
};

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTH_NAMES = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function getDays(count: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function EventsPage() {
  const navigate = useNavigate();
  const days = useMemo(() => getDays(8), []);
  const [selectedDate, setSelectedDate] = useState(formatDateISO(days[0]));
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const db = supabase;

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        const todayStr = formatDateISO(new Date());
        const { data, error } = await db
          .from("events")
          .select("id, title, place_id, date, time, description, image_url, type, places(name)")
          .gte("date", todayStr)
          .order("date", { ascending: true })
          .order("time", { ascending: true });

        if (error) {
          console.error("Error fetching events:", error);
          setEvents([]);
        } else {
          const mapped: Event[] = (data || []).map((row: any) => ({
            id: row.id,
            title: row.title,
            place_id: row.place_id,
            place_name: row.places?.name || undefined,
            date: row.date,
            time: row.time,
            description: row.description,
            image_url: row.image_url,
            type: row.type || "special",
          }));
          setEvents(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) => e.date === selectedDate);

  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const selectedLabel = `${selectedDateObj.getDate()} ${MONTH_NAMES[selectedDateObj.getMonth()]}`;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0f0f1a]/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            <h1 className="text-lg font-semibold">Événements</h1>
          </div>
        </div>

        {/* Day pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {days.map((day) => {
            const iso = formatDateISO(day);
            const isSelected = iso === selectedDate;
            const isToday = iso === formatDateISO(new Date());
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={`flex flex-col items-center min-w-[52px] px-3 py-2 rounded-xl transition-all shrink-0 ${
                  isSelected
                    ? "bg-[#D4AF37] text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <span className="text-[10px] font-medium uppercase">
                  {isToday ? "Auj" : DAY_NAMES[day.getDay()]}
                </span>
                <span className="text-lg font-bold leading-tight">{day.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-5 space-y-3">
        <p className="text-white/40 text-xs font-medium uppercase tracking-wide">
          {selectedLabel}
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-white/5 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Music className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40 text-sm">Rien de prévu — reviens bientôt !</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event, index) => {
              const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.special;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors cursor-pointer"
                  onClick={() => {
                    if (event.place_id) {
                      navigate(`/venue/${event.place_id}`);
                    }
                  }}
                >
                  <div className="flex gap-3 p-3">
                    {/* Image or fallback */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-3xl">{typeInfo.emoji}</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h3 className="text-white text-sm font-semibold truncate">
                          {event.title}
                        </h3>
                        {event.place_name && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#D4AF37]" />
                            <span className="text-white/50 text-xs truncate">
                              {event.place_name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-white/30" />
                          <span className="text-white/60 text-xs font-medium">
                            {event.time ? event.time.replace(":", "h") : "—"}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}
                        >
                          {typeInfo.emoji} {typeInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {event.description && (
                    <div className="px-3 pb-3">
                      <p className="text-white/30 text-xs line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
