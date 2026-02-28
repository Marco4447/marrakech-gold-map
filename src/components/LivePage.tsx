import { Radio } from "lucide-react";

export default function LivePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
        <Radio className="w-7 h-7 text-gold" />
      </div>
      <h2 className="font-display text-xl font-semibold text-foreground mb-2">Live</h2>
      <p className="text-muted-foreground text-sm text-center max-w-xs">
        Les événements live de Marrakech arrivent bientôt. Stay tuned ✨
      </p>
    </div>
  );
}
