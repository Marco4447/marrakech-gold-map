import { User } from "lucide-react";

export default function ProfilPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
        <User className="w-7 h-7 text-gold" />
      </div>
      <h2 className="font-display text-xl font-semibold text-foreground mb-2">Profil</h2>
      <p className="text-muted-foreground text-sm text-center max-w-xs">
        Connecte-toi pour sauvegarder tes spots préférés à Marrakech.
      </p>
    </div>
  );
}
