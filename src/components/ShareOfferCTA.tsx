import { Share2, Gift } from "lucide-react";
import { toast } from "sonner";

interface Props {
  placeName: string;
  slug: string | null;
  offerTitle?: string;
}

export default function ShareOfferCTA({ placeName, slug, offerTitle }: Props) {
  const url = slug
    ? `${window.location.origin}/go/${slug}`
    : window.location.href;

  const handleShare = async () => {
    const text = offerTitle
      ? `🎁 ${offerTitle} chez ${placeName} — rejoins-moi sur Weshkech !`
      : `🔥 Découvre ${placeName} sur Weshkech !`;

    if (navigator.share) {
      try {
        await navigator.share({ title: placeName, text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Lien copié !");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-card/80 border border-border hover:border-gold/30 text-foreground transition-all active:scale-[0.98]"
    >
      <Share2 className="w-4 h-4 text-gold" />
      <span className="text-xs font-semibold">Partage cette offre à un ami 🎁</span>
    </button>
  );
}
