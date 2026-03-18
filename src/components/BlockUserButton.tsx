import { useState } from "react";
import { ShieldOff, Shield } from "lucide-react";
import { useBlocks } from "@/hooks/useBlocks";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BlockUserButtonProps {
  targetUserId: string;
  targetName?: string;
}

export default function BlockUserButton({ targetUserId, targetName }: BlockUserButtonProps) {
  const { user } = useAuth();
  const { isBlocked, blockUser, unblockUser } = useBlocks();
  const [showConfirm, setShowConfirm] = useState(false);
  const blocked = isBlocked(targetUserId);

  if (!user || user.id === targetUserId) return null;

  const handleBlock = async () => {
    if (blocked) {
      await unblockUser(targetUserId);
      toast.success("Utilisateur débloqué");
    } else {
      await blockUser(targetUserId);
      toast.success("Utilisateur bloqué");
    }
    setShowConfirm(false);
  };

  if (showConfirm && !blocked) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20">
        <p className="text-[11px] text-foreground flex-1">
          Bloquer {targetName || "cet utilisateur"} ? Il ne pourra plus voir ton profil ni t'envoyer de messages.
        </p>
        <button
          onClick={handleBlock}
          className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-[11px] font-bold active:scale-95 transition-transform"
        >
          Bloquer
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-[11px] font-bold active:scale-95 transition-transform"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => blocked ? handleBlock() : setShowConfirm(true)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors active:scale-95 ${
        blocked
          ? "bg-muted text-muted-foreground"
          : "bg-destructive/10 text-destructive hover:bg-destructive/20"
      }`}
    >
      {blocked ? (
        <>
          <Shield className="w-3.5 h-3.5" />
          Débloquer
        </>
      ) : (
        <>
          <ShieldOff className="w-3.5 h-3.5" />
          Bloquer
        </>
      )}
    </button>
  );
}
