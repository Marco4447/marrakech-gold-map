import { Gift } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface VipOffer {
  id: string;
  title: string;
  description: string;
  perk_type: string;
  end_time: string | null;
}

interface Props {
  isPartner: boolean;
  hasOffer: boolean;
  vipOffers: VipOffer[];
  placeName: string;
}

export default function PlaceVipSection({ isPartner, hasOffer, vipOffers, placeName }: Props) {
  const { t } = useLanguage();

  if (!isPartner) return null;

  if (vipOffers.length > 0) {
    return (
      <div className="space-y-2">
        {vipOffers.map((vip) => {
          const perkEmoji = vip.perk_type === "drink" ? "🍸" : vip.perk_type === "food" ? "🍽️" : vip.perk_type === "entry" ? "🎫" : "🎁";
          return (
            <div key={vip.id} className="bg-gold/10 border border-gold/25 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{perkEmoji}</span>
                <span className="text-sm font-bold text-gold">{vip.title}</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{vip.description}</p>
              {vip.end_time && (
                <p className="text-[10px] text-muted-foreground">
                  Jusqu'à {new Date(vip.end_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (hasOffer) {
    return (
      <div className="bg-gold/10 border border-gold/25 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2"><Gift className="w-4 h-4 text-gold" /><span className="text-sm font-semibold text-gold">{t("place_insiderOffer")}</span></div>
        <p className="text-xs text-foreground/80">{t("place_insiderOfferDesc")} {placeName}.</p>
      </div>
    );
  }

  return null;
}
