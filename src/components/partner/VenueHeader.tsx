import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Eye, Pencil, ExternalLink, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PlanType } from "@/lib/partnerPlans";

interface Props {
  placeId: string | null;
  planType: PlanType | null;
  credits: number;
  onEditVenue: () => void;
  onPostVibe: () => void;
}

export default function VenueHeader({ placeId, planType, credits, onEditVenue, onPostVibe }: Props) {
  const [venue, setVenue] = useState<{ name: string; image_url: string | null; category: string | null; listing_tier: string | null; has_active_offer: boolean; slug: string | null; is_founder: boolean } | null>(null);

  useEffect(() => {
    if (!placeId) return;
    supabase
      .from("places")
      .select("name, image_url, category, listing_tier, has_active_offer, slug, is_founder")
      .eq("id", placeId)
      .single()
      .then(({ data }) => {
        if (data) setVenue(data as any);
      });
  }, [placeId]);

  if (!venue) return null;

  const getStatusLabel = () => {
    if (venue.has_active_offer) return { text: "Offre VIP active", color: "text-green-400 bg-green-400/10 border-green-400/20" };
    if (venue.listing_tier === "featured") return { text: "Trending Tonight", color: "text-gold bg-gold/10 border-gold/20" };
    if (venue.listing_tier === "premium") return { text: "Premium", color: "text-gold bg-gold/10 border-gold/20" };
    return { text: "Visible", color: "text-muted-foreground bg-muted border-border" };
  };

  const status = getStatusLabel();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold/20 bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-xl overflow-hidden"
    >
      {/* Venue cover */}
      {venue.image_url && (
        <div className="relative h-28 overflow-hidden">
          <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        </div>
      )}

      <div className={`p-4 space-y-3 ${venue.image_url ? "-mt-8 relative" : ""}`}>
        {/* Identity */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">{venue.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {venue.is_founder && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                  🛡️ Fondateur
                </span>
              )}
              {planType && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-gold">
                  <Crown className="w-3 h-3" />
                  {planType.charAt(0).toUpperCase() + planType.slice(1)}
                </span>
              )}
              {venue.listing_tier === "featured" && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-accent">
                  ⚡ Featured
                </span>
              )}
              {venue.category && (
                <span className="text-[10px] text-muted-foreground">{venue.category}</span>
              )}
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${status.color}`}>
            {status.text}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onEditVenue}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
          >
            <Pencil className="w-3 h-3" /> Éditer
          </button>
          {venue.slug && (
            <a
              href={`/venue/${venue.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3 h-3" /> Page publique
            </a>
          )}
          <button
            onClick={onPostVibe}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-primary-foreground flex items-center justify-center gap-1.5"
            style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light)), hsl(var(--gold-dark)))" }}
          >
            <Zap className="w-3 h-3" /> Vibe
            <span className="bg-primary-foreground/20 px-1.5 py-0.5 rounded text-[8px]">{credits}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
