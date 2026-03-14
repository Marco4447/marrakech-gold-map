import { Clock, MapPin, DollarSign, Music, Shirt } from "lucide-react";

interface Props {
  neighborhood?: string | null;
  address?: string | null;
  openingHours?: string | null;
  priceRange?: string | null;
  musicStyle?: string | null;
  dressCode?: string | null;
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <p className="text-sm text-foreground font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function PlacePracticalInfo({ neighborhood, address, openingHours, priceRange, musicStyle, dressCode }: Props) {
  const rows = [
    neighborhood || address ? { icon: MapPin, label: "Localisation", value: [address, neighborhood].filter(Boolean).join(", ") } : null,
    openingHours ? { icon: Clock, label: "Horaires", value: openingHours } : null,
    priceRange ? { icon: DollarSign, label: "Budget", value: priceRange } : null,
    musicStyle ? { icon: Music, label: "Ambiance musicale", value: musicStyle } : null,
    dressCode ? { icon: Shirt, label: "Dress code", value: dressCode } : null,
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg shadow-black/10">
      <h3 className="font-display text-base font-bold text-foreground mb-1">Infos pratiques</h3>
      <div className="mt-2">
        {rows.map((row) => (
          <InfoRow key={row.label} {...row} />
        ))}
      </div>
    </div>
  );
}
