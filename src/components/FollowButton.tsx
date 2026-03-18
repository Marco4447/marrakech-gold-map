import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useFollows } from "@/hooks/useFollows";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FollowButtonProps {
  targetUserId: string;
  size?: "sm" | "md" | "lg";
  variant?: "pill" | "outline" | "text";
  onFollowChange?: (isNowFollowing: boolean) => void;
}

export default function FollowButton({
  targetUserId,
  size = "md",
  variant = "pill",
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuth();
  const { isFollowing, toggleFollow } = useFollows();
  const [loading, setLoading] = useState(false);

  // Hide on own profile only
  if (user && targetUserId === user.id) return null;

  const followed = user ? isFollowing(targetUserId) : false;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast("Connecte-toi pour suivre cet utilisateur", { duration: 2000 });
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      await toggleFollow(targetUserId);
      onFollowChange?.(!followed);
      if (!followed) {
        toast("✅ Abonné !", { duration: 1500 });
      }
    } catch {
      toast.error("Action impossible");
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: "px-2.5 py-1 text-[10px] gap-1",
    md: "px-3.5 py-1.5 text-xs gap-1.5",
    lg: "px-5 py-2.5 text-sm gap-2",
  };

  const variantClasses = {
    pill: followed
      ? "bg-card border border-border text-muted-foreground"
      : "bg-foreground text-background",
    outline: followed
      ? "bg-transparent border border-border text-muted-foreground"
      : "bg-transparent border border-gold/50 text-gold",
    text: followed
      ? "text-muted-foreground"
      : "text-gold font-bold",
  };

  const iconSize = size === "sm" ? "w-2.5 h-2.5" : size === "lg" ? "w-4 h-4" : "w-3 h-3";

  if (variant === "text") {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`font-bold transition-all active:scale-95 disabled:opacity-50 ${variantClasses.text}`}
      >
        {loading ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : followed ? (
          "Suivi"
        ) : (
          "Suivre"
        )}
      </button>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={loading}
      whileTap={{ scale: 0.94 }}
      className={`
        flex items-center justify-center font-bold rounded-full
        transition-all duration-200 disabled:opacity-50
        ${sizeClasses[size]}
        ${variantClasses[variant]}
      `}
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 className={`${iconSize} animate-spin`} />
          </motion.span>
        ) : followed ? (
          <motion.span
            key="following"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
            <UserCheck className={iconSize} />
            Suivi
          </motion.span>
        ) : (
          <motion.span
            key="follow"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
            <UserPlus className={iconSize} />
            Suivre
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
