import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Calendar, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
  placeId: string | null;
  canTrending: boolean;
}

interface SponsoredEvent {
  id: string;
  title: string;
  event_date: string;
  boost_level: string;
  status: string;
}

const BOOST_PRICES: Record<string, { label: string; price: string; amount: number }> = {
  standard: { label: "Standard", price: "29 €", amount: 2900 },
  premium: { label: "Premium", price: "59 €", amount: 5900 },
  featured: { label: "Featured", price: "99 €", amount: 9900 },
};

export default function PartnerPromotions({ userId, placeId, canTrending }: Props) {
  const [events, setEvents] = useState<SponsoredEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [boostLevel, setBoostLevel] = useState("standard");
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    if (!placeId) { setLoading(false); return; }
    const { data } = await supabase
      .from("sponsored_events")
      .select("id, title, event_date, boost_level, status")
      .eq("place_id", placeId)
      .order("event_date", { ascending: false })
      .limit(20);
    setEvents((data as SponsoredEvent[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [placeId]);

  const handleCreate = async () => {
    if (!placeId || !title.trim() || !eventDate) return;
    setSubmitting(true);
    try {
      const boost = BOOST_PRICES[boostLevel];
      // Create checkout for sponsored event
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId: "sponsored_event",
          productType: "sponsored_event",
          boostLevel,
          sponsoredTitle: title.trim(),
          sponsoredDate: eventDate,
          placeId,
          amount: boost.amount,
        },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      setShowForm(false);
      setTitle("");
      setEventDate("");
    } catch (err: any) {
      toast.error(err?.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  if (!placeId) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-muted-foreground">Liez votre compte à un lieu pour accéder aux promotions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!canTrending && (
        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
          <p className="text-xs text-gold font-medium">
            ⚡ Passez au plan Featured pour accéder aux promotions Trending Tonight
          </p>
        </div>
      )}

      {canTrending && (
        <>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gold/15 border border-gold/30 text-gold hover:bg-gold/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Sponsoriser une soirée
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-4 space-y-3"
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                placeholder="Nom de l'événement"
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
              <div className="flex gap-2">
                {Object.entries(BOOST_PRICES).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setBoostLevel(key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                      boostLevel === key
                        ? "bg-gold/20 border border-gold/50 text-gold"
                        : "bg-surface border border-border text-muted-foreground"
                    }`}
                  >
                    {val.label}
                    <br />
                    <span className="text-2xs">{val.price}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-surface border border-border text-muted-foreground"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={submitting || !title.trim() || !eventDate}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-primary-foreground disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
                >
                  {submitting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Réserver"}
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Events list */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Événements sponsorisés</p>
        {loading ? (
          <Loader2 className="w-5 h-5 text-gold animate-spin mx-auto" />
        ) : events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Aucun événement sponsorisé.</p>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between bg-card/80 border border-border rounded-xl p-3">
              <div className="flex items-center gap-3">
                <Flame className="w-4 h-4 text-gold" />
                <div>
                  <p className="text-sm font-medium text-foreground">{ev.title}</p>
                  <p className="text-2xs text-muted-foreground">
                    {new Date(ev.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                ev.status === "active" ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"
              }`}>
                {ev.status === "active" ? "ACTIF" : ev.status.toUpperCase()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
