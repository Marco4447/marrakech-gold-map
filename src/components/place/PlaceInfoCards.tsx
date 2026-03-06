import { Clock, DollarSign, Music, Shirt } from "lucide-react";

interface Props {
  details: {
    opening_hours?: string;
    price_range?: string;
    music_style?: string;
    dress_code?: string;
  } | null;
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
      {items.map(({ key, icon: Icon }) => (
        <div key={key} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <Icon className="w-3.5 h-3.5 text-gold shrink-0" />
          <span className="text-[11px] text-foreground">{details[key]}</span>
        </div>
      ))}
    </div>
  );
}
