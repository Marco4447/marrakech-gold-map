import { User, Settings } from "lucide-react";

interface ProfilPageProps {
  onOpenAdmin?: () => void;
}

export default function ProfilPage({ onOpenAdmin }: ProfilPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 relative">
      <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
        <User className="w-7 h-7 text-gold" />
      </div>
      <h2 className="font-display text-xl font-semibold text-foreground mb-2">Profil</h2>
      <p className="text-muted-foreground text-sm text-center max-w-xs">
        Connecte-toi pour sauvegarder tes spots préférés à Marrakech.
      </p>

      {/* Hidden admin button */}
      <button
        onClick={onOpenAdmin}
        className="absolute bottom-24 right-6 w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold/30 transition-colors"
        title="Admin"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}
