import { Gift, Lock, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PartnerOffer {
  id: string;
  title: string;
  description: string;
  vip_only: boolean;
  expiration_date: string | null;
}

interface PartnerOfferCardProps {
  offer: PartnerOffer;
  isVip: boolean;
}

export default function PartnerOfferCard({ offer, isVip }: PartnerOfferCardProps) {
  const navigate = useNavigate();
  const locked = offer.vip_only && !isVip;

  return (
    <div className={`relative rounded-xl border p-3 ${locked ? "border-gold/20 bg-gold/5" : "border-border bg-surface"}`}>
      {locked && (
        <div className="absolute inset-0 rounded-xl bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <Lock className="w-5 h-5 text-gold mb-1" />
          <p className="text-[10px] text-gold font-semibold">Réservé aux VIP</p>
          <button
            onClick={() => navigate("/vip-pass")}
            className="mt-2 text-[10px] px-3 py-1 rounded-full bg-gold/20 text-gold font-bold"
          >
            Débloquer
          </button>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
          {offer.vip_only ? <Crown className="w-4 h-4 text-gold" /> : <Gift className="w-4 h-4 text-gold" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{offer.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{offer.description}</p>
          {offer.expiration_date && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Expire le {new Date(offer.expiration_date).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
