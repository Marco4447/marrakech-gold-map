import L from "leaflet";
import { isBoosted } from "@/lib/boostedPlaces";
export const MARRAKECH_CENTER: [number, number] = [31.6295, -7.9811];
export const SIX_HOURS = 6 * 60 * 60 * 1000;
export const THREE_HOURS = 3 * 60 * 60 * 1000;

export const MOOD_COLORS: Record<string, string> = {
  hot: "hsl(15,80%,50%)",
  chill: "hsl(200,60%,50%)",
  secret: "hsl(280,60%,55%)",
  deal: "hsl(43,76%,52%)",
};

export const MOOD_EMOJIS: Record<string, string> = {
  hot: "🔥",
  chill: "🍸",
  secret: "✨",
  deal: "🎁",
};

export const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  Nightlife: { emoji: "🎶", color: "hsl(280,60%,60%)" },
  Luxury: { emoji: "🏨", color: "hsl(200,70%,55%)" },
  Restaurant: { emoji: "🍽️", color: "hsl(25,90%,55%)" },
  Rooftop: { emoji: "🌅", color: "hsl(43,56%,52%)" },
  "Pool Party": { emoji: "🏖️", color: "hsl(190,70%,50%)" },
  "Dinner Show": { emoji: "🎭", color: "hsl(340,65%,55%)" },
  Chill: { emoji: "🍸", color: "hsl(160,50%,45%)" },
  "Cocktail Bar": { emoji: "🍹", color: "hsl(320,60%,55%)" },
  Café: { emoji: "☕", color: "hsl(30,50%,45%)" },
  "Street Food": { emoji: "🧆", color: "hsl(85,60%,42%)" },
  Food: { emoji: "🍽️", color: "hsl(25,90%,55%)" },
  Night: { emoji: "🎶", color: "hsl(280,60%,60%)" },
  Hôtel: { emoji: "🏨", color: "hsl(200,70%,55%)" },
  Secret: { emoji: "✨", color: "hsl(340,65%,55%)" },
  Attraction: { emoji: "📸", color: "hsl(350,65%,55%)" },
  Activity: { emoji: "🎯", color: "hsl(350,65%,55%)" },
};

export const MOOD_FILTERS: { key: string; emoji: string; label: string; categories: string[] }[] = [
  { key: "hot", emoji: "🔥", label: "Hot", categories: [] },
  { key: "offers", emoji: "✨", label: "Offres", categories: [] },
  { key: "party", emoji: "💃", label: "Party", categories: ["Nightlife", "Night", "Dinner Show"] },
  { key: "chill", emoji: "🍸", label: "Chill", categories: ["Rooftop", "Chill", "Cocktail Bar", "Café", "Hôtel"] },
  
  { key: "food", emoji: "🍽️", label: "Food", categories: ["Restaurant", "Food", "Street Food"] },
];

const DEFAULT_CAT = { emoji: "📍", color: "hsl(43,56%,52%)" };

export const createCategoryIcon = (category: string | null, options: { trending?: boolean; isPartner?: boolean; hasOffer?: boolean; blurred?: boolean; placeName?: string; imageUrl?: string | null; energyLabel?: string | null; energyEmoji?: string | null; listingTier?: string | null; hasActiveVipOffer?: boolean; highlighted?: boolean; highlightEmoji?: string; energyScore?: number } = {}) => {
  const cat = CATEGORY_CONFIG[category || ""] || DEFAULT_CAT;
  const { isPartner = false, hasOffer = false, blurred = false, placeName, imageUrl, hasActiveVipOffer = false, energyScore = 50 } = options;
  const boosted = isBoosted(placeName);

  // ── SIZE: partners bigger, then by energy ──
  const isPartnerSpot = isPartner || boosted;
  const size = isPartnerSpot ? 36 : energyScore > 70 ? 50 : energyScore > 40 ? 40 : 28;
  const borderColor = isPartnerSpot ? "#C44A2A" : (hasActiveVipOffer ? "#C8821E" : "rgba(255,255,255,0.12)");
  const glow = isPartnerSpot
    ? "0 0 10px rgba(196,74,42,0.4)"
    : energyScore > 70 ? "0 0 10px rgba(200,130,30,0.4)" : "0 2px 4px rgba(0,0,0,0.4)";
  const pulse = isPartnerSpot || hasActiveVipOffer ? "animation:pin-pulse 2s ease-in-out infinite;" : "";

  // ── PHOTO or EMOJI fallback ──
  const hasPhoto = imageUrl && !blurred;
  const photo = hasPhoto
    ? `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span style="display:none;align-items:center;justify-content:center;width:100%;height:100%;font-size:${size * 0.4}px">${cat.emoji}</span>`
    : `<span style="font-size:${size * 0.4}px;line-height:1">${cat.emoji}</span>`;

  // ── STAR + BADGE ──
  const partnerStar = isPartnerSpot
    ? `<div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);color:#E8C86E;font-size:11px;font-weight:bold;text-shadow:0 1px 3px rgba(0,0,0,0.6)">★</div>`
    : "";
  const badge = hasActiveVipOffer
    ? `<div style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:#C44A2A;display:flex;align-items:center;justify-content:center;font-size:8px;box-shadow:0 1px 4px rgba(196,74,42,0.6)">🎁</div>`
    : "";

  // ── NAME label ──
  const name = placeName || "";
  const shortName = name.length > 12 ? name.slice(0, 11) + "…" : name;
  const nameLabel = shortName
    ? `<div style="position:absolute;top:${size + 2}px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:9px;font-weight:600;color:white;text-shadow:0 1px 3px rgba(0,0,0,0.8);max-width:70px;overflow:hidden;text-overflow:ellipsis;text-align:center">${shortName}</div>`
    : "";

  const blurCSS = blurred ? "filter:blur(3px) grayscale(0.5);opacity:0.5;" : "";

  return L.divIcon({
    className: "photo-pin",
    html: `
      <div style="position:relative;${pulse}">
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:#111;
          border:2.5px solid ${borderColor};
          box-shadow:${glow};
          display:flex;align-items:center;justify-content:center;
          overflow:hidden;${blurCSS}
        ">
          ${photo}
        </div>
        ${partnerStar}
        ${badge}
        ${nameLabel}
      </div>
    `,
    iconSize: [size, size + 16],
    iconAnchor: [size / 2, size / 2],
  });
};
