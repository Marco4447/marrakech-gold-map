import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { timeAgo } from "@/lib/timeAgo";
import { Flame, Send } from "lucide-react";

interface EphemeralReviewsProps {
  placeId: string;
}

interface Review {
  id: string;
  user_id: string;
  text: string;
  rating: number;
  created_at: string;
}

export default function EphemeralReviews({ placeId }: EphemeralReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(3);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const db = supabase;

  useEffect(() => {
    fetchReviews();
  }, [placeId]);

  async function fetchReviews() {
    try {
      setLoading(true);
      const fortyEightHoursAgo = new Date(
        Date.now() - 48 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await db
        .from("ephemeral_reviews")
        .select("id, user_id, text, rating, created_at")
        .eq("place_id", placeId)
        .gte("created_at", fortyEightHoursAgo)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setReviews(data ?? []);
    } catch {
     
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!text.trim()) {
      toast.error("Écris quelque chose !");
      return;
    }
    if (!user) {
      toast.error("Connecte-toi pour laisser un avis");
      return;
    }

    setSubmitting(true);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    try {
      const { data, error } = await db
        .from("ephemeral_reviews")
        .insert({
          place_id: placeId,
          user_id: user.id,
          text: text.trim(),
          rating,
        })
        .select("id, user_id, text, rating, created_at")
        .single();

      if (error) throw error;

      setReviews((prev) => [data, ...prev]);
      setText("");
      setRating(3);
      setShowForm(false);
      toast.success("Avis publié !", {
        description: "Il disparaîtra dans 48h",
      });
    } catch {
      toast.error("Erreur lors de la publication");
    } finally {
      setSubmitting(false);
    }
  }

  function FlameRating({
    value,
    onChange,
    readonly = false,
  }: {
    value: number;
    onChange?: (v: number) => void;
    readonly?: boolean;
  }) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(i)}
            className={`transition-all duration-150 ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
          >
            <Flame
              className={`w-4 h-4 ${
                i <= value
                  ? "text-gold fill-gold/80"
                  : "text-foreground/20"
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-4">
      {/* Header / Toggle Form Button */}
      {!showForm ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4
            rounded-xl bg-background/50 border border-border/30
            text-sm font-medium text-foreground/70
            hover:border-gold/30 hover:text-foreground transition-all"
        >
          <Flame className="w-4 h-4 text-gold" />
          T'y es ? Dis-nous
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          {/* Text Input */}
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 140))}
              placeholder="C'est comment en ce moment ?"
              rows={2}
              className="w-full bg-background/50 border border-border/40 rounded-xl
                px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30
                resize-none focus:outline-none focus:border-gold/40
                transition-colors"
            />
            <span className="absolute bottom-2 right-3 text-2xs text-foreground/30">
              {text.length}/140
            </span>
          </div>

          {/* Rating + Submit Row */}
          <div className="flex items-center justify-between">
            <FlameRating value={rating} onChange={setRating} />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setText("");
                  setRating(3);
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-foreground/50
                  hover:text-foreground/80 transition-colors"
              >
                Annuler
              </button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={submitting || !text.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg
                  bg-gold/15 border border-gold/40 text-gold text-xs font-semibold
                  hover:bg-gold/25 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all"
              >
                <Send className="w-3 h-3" />
                {submitting ? "..." : "Publier"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-3 p-3 rounded-xl bg-background/30 border border-border/20"
            >
              {/* Avatar placeholder */}
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20
                flex items-center justify-center flex-shrink-0">
                <Flame className="w-3.5 h-3.5 text-gold/60" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <FlameRating value={review.rating} readonly />
                  <span className="text-2xs text-foreground/30 flex-shrink-0">
                    {timeAgo(review.created_at)}
                  </span>
                </div>
                <p className="text-xs text-foreground/60 leading-relaxed break-words">
                  {review.text}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!loading && reviews.length === 0 && !showForm && (
        <p className="text-xs text-foreground/40 text-center py-2">
          Aucun avis récent — sois le premier !
        </p>
      )}
    </div>
  );
}
