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
  
  { key: "food", emoji: "🍽️", label: "Food", categories: ["Restaurant", "Food"] },
];

const DEFAULT_CAT = { emoji: "📍", color: "hsl(43,56%,52%)" };

export const createCategoryIcon = (category: string | null, options: { trending?: boolean; isPartner?: boolean; hasOffer?: boolean; blurred?: boolean; placeName?: string; imageUrl?: string | null; energyLabel?: string | null; energyEmoji?: string | null; listingTier?: string | null; hasActiveVipOffer?: boolean } = {}) => {
  const cat = CATEGORY_CONFIG[category || ""] || DEFAULT_CAT;
  const { trending = false, isPartner = false, hasOffer = false, blurred = false, placeName, imageUrl, energyLabel, energyEmoji, listingTier, hasActiveVipOffer = false } = options;
  const boosted = isBoosted(placeName);

  // Check if place has a local logo (handle URL-encoded paths too)
  const hasLocalLogo = imageUrl && (imageUrl.startsWith("/images/") || imageUrl.includes("vibes_media/places") || imageUrl.includes("vibes_media%2Fplaces"));

  // Tier-based sizing: Featured > Premium > Basic/standard
  const isFeatured = listingTier === "featured";
  const isPremium = listingTier === "premium";
  const size = boosted ? 52 : isFeatured ? 48 : isPremium ? 44 : isPartner ? 42 : hasLocalLogo ? 40 : trending ? 42 : 34;
  const emojiSize = boosted ? 22 : isFeatured ? 20 : isPremium ? 18 : isPartner ? 18 : trending ? 18 : 15;

  const borderColor = boosted ? "hsl(43,76%,52%)" : isFeatured ? "hsl(43,76%,52%)" : isPartner ? "hsl(43,76%,52%)" : cat.color;
  const borderWidth = boosted ? "3px" : isFeatured ? "3px" : isPremium ? "2.5px" : isPartner ? "3px" : "2px";
  const glow = boosted
    ? "0 0 20px hsl(43,76%,52%,0.7), 0 0 40px hsl(43,76%,52%,0.3)"
    : isFeatured
      ? "0 0 18px hsl(43,76%,52%,0.6), 0 0 35px hsl(43,76%,52%,0.25)"
      : isPartner
        ? "0 0 12px hsl(43,76%,52%,0.5)"
        : `0 2px ${trending ? 12 : 6}px ${cat.color.replace(")", ",0.35)")}`;

  const boostedRing = boosted
    ? `<div class="boosted-ring" style="position:absolute;inset:-5px;border-radius:50%;border:2px solid hsl(43,76%,52%,0.6);animation:boosted-pulse 2s ease-in-out infinite"></div>
       <div class="boosted-ring-2" style="position:absolute;inset:-10px;border-radius:50%;border:1.5px solid hsl(43,76%,52%,0.25);animation:boosted-pulse 2s ease-in-out 0.5s infinite"></div>`
    : isFeatured
      ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid hsl(43,76%,52%,0.5);animation:boosted-pulse 2s ease-in-out infinite"></div>
         <div style="position:absolute;inset:-8px;border-radius:50%;border:1px solid hsl(43,76%,52%,0.2);animation:boosted-pulse 2s ease-in-out 0.5s infinite"></div>`
      : "";

  const partnerBadge = boosted
    ? `<div style="position:absolute;top:-10px;right:-10px;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#BF953F,#FCF6BA,#B38728);display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px hsl(43,76%,52%,0.6)">👑</div>`
    : isPartner
      ? `<div style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:hsl(43,76%,52%);display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 2px 4px hsl(43,76%,52%,0.4)">${hasOffer ? "🎁" : "⭐"}</div>`
      : "";

  const boostedLabel = boosted
    ? `<div style="position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#BF953F,#FCF6BA,#B38728);color:hsl(30,20%,10%);font-size:6px;font-weight:900;padding:1px 5px;border-radius:4px;white-space:nowrap;letter-spacing:0.08em;box-shadow:0 2px 6px hsl(43,76%,52%,0.4)">PARTENAIRE</div>`
    : "";

  // 🔥 OFFER TONIGHT badge for places with active VIP offers — animated
  const offerTonightBadge = hasActiveVipOffer && !boosted && !blurred
    ? `<div class="offer-tonight-badge" style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,hsl(15,80%,50%),hsl(30,90%,50%));color:white;font-size:6px;font-weight:900;padding:2px 5px;border-radius:4px;white-space:nowrap;letter-spacing:0.05em;box-shadow:0 2px 6px hsl(15,80%,50%,0.5);z-index:3;animation:offer-badge-pulse 2s ease-in-out infinite">🔥 OFFER TONIGHT</div>`
    : "";

  const trendingBadge = trending && !isPartner && !boosted && !hasActiveVipOffer
    ? `<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:hsl(43,56%,52%);color:hsl(30,20%,95%);font-size:7px;font-weight:800;padding:1px 4px;border-radius:3px;white-space:nowrap;letter-spacing:0.05em">LIVE</div>`
    : "";

  const blurFilter = blurred ? "filter:blur(4px) grayscale(0.5);opacity:0.6;" : "";
  const lockBadge = blurred
    ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;z-index:2">🔒</div>`
    : "";

  const isHotEnergy = energyLabel === "HOT NOW" || energyLabel === "PACKED";
  const energyBadge = energyLabel && !boosted && !blurred && !hasActiveVipOffer
    ? `<div style="position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);background:hsl(0,0%,5%,0.85);backdrop-filter:blur(4px);color:white;font-size:7px;font-weight:800;padding:1px 5px;border-radius:4px;white-space:nowrap;letter-spacing:0.03em">${energyEmoji || ""} ${energyLabel}</div>`
    : "";
  const markerClass = boosted ? "boosted-marker gold-marker" : isFeatured ? "featured-marker gold-marker" : isHotEnergy ? "energy-hot-marker gold-marker" : trending ? "trending-marker" : isPartner ? "gold-marker" : "";

  // Determine inner content: show logo for local images (/images/) or Supabase storage, emoji for generic Unsplash
  const isLocalLogo = imageUrl && (imageUrl.startsWith("/images/") || imageUrl.includes("vibes_media/places") || imageUrl.includes("vibes_media%2Fplaces"));
  const hasLogo = (isPartner || boosted || isLocalLogo) && imageUrl;
  const innerContent = boosted && imageUrl
    ? `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : boosted
      ? `<img src="/images/kabana-logo.png" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : hasLogo
      ? `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span style="font-size:${emojiSize}px;line-height:1;display:none;align-items:center;justify-content:center;width:100%;height:100%">${cat.emoji}</span>`
      : `<span style="font-size:${emojiSize}px;line-height:1">${cat.emoji}</span>`;

  return L.divIcon({
    className: markerClass,
    html: `
      <div class="category-marker" style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${boosted ? "linear-gradient(135deg, hsl(0,0%,8%), hsl(30,10%,12%))" : isFeatured ? "linear-gradient(135deg, hsl(0,0%,8%), hsl(30,10%,12%))" : "hsl(0,0%,8%)"};
        border:${borderWidth} solid ${borderColor};
        box-shadow:${glow};
        display:flex;align-items:center;justify-content:center;
        position:relative;${blurFilter}overflow:hidden;
      ">
        ${boostedRing}
        ${innerContent}
        ${partnerBadge}
        ${offerTonightBadge}
        ${trendingBadge}
        ${boostedLabel}
        ${energyBadge}
      </div>
      ${lockBadge}
    `,
    iconSize: [size + (boosted || isFeatured ? 20 : 0), size + (boosted || isFeatured ? 20 : 0)],
    iconAnchor: [(size + (boosted || isFeatured ? 20 : 0)) / 2, size + (boosted || isFeatured ? 20 : 0)],
  });
};
