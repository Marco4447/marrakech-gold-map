import { Clock, DollarSign, Music, Shirt } from "lucide-react";

interface Props {
  details: {
    opening_hours?: string;
    price_range?: string;
    music_style?: string;
    dress_code?: string;
  } | null;
}

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_KEYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

function formatSchedule(raw: string): string {
  // Try JSON (new format from VenueEditor)
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const openDays = DAYS_KEYS.filter(k => parsed[k]?.open);
      if (openDays.length === 0) return "Fermé";
      if (openDays.length === 7) {
        const first = parsed[openDays[0]];
        const allSame = openDays.every(k => parsed[k].from === first.from && parsed[k].to === first.to);
        if (allSame) return `Tous les jours ${first.from} – ${first.to}`;
      }
      return openDays.map(k => {
        const idx = DAYS_KEYS.indexOf(k);
        return `${DAYS_SHORT[idx]} ${parsed[k].from}–${parsed[k].to}`;
      }).join(" · ");
    }
  } catch {
    // not JSON, return raw
  }
  return raw;
}

const infoItems = [
  { key: "opening_hours" as const, icon: Clock, label: "Horaires" },
  { key: "price_range" as const, icon: DollarSign, label: "Prix" },
  { key: "music_style" as const, icon: Music, label: "Musique" },
  { key: "dress_code" as const, icon: Shirt, label: "Dress code" },
];

export default function PlaceInfoCards({ details }: Props) {
  if (!details) return null;
  const items = infoItems.filter(item => details[item.key]);
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ key, icon: Icon }) => {
        const value = key === "opening_hours" ? formatSchedule(details[key]!) : details[key]!;
        return (
          <div key={key} className="flex items-start gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Icon className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
            <span className="text-[11px] text-foreground leading-snug">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
