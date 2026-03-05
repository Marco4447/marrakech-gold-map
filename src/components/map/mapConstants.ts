import L from "leaflet";

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
  Food: { emoji: "🍽️", color: "hsl(25,90%,55%)" },
  Night: { emoji: "🎶", color: "hsl(280,60%,60%)" },
  Hôtel: { emoji: "🏨", color: "hsl(200,70%,55%)" },
  Secret: { emoji: "✨", color: "hsl(340,65%,55%)" },
};

export const MOOD_FILTERS: { key: string; emoji: string; label: string; categories: string[] }[] = [
  { key: "hot", emoji: "🔥", label: "Hot", categories: [] },
  { key: "offers", emoji: "✨", label: "Offres", categories: [] },
  { key: "party", emoji: "💃", label: "Party", categories: ["Nightlife", "Night", "Dinner Show"] },
  { key: "chill", emoji: "🍸", label: "Chill", categories: ["Rooftop", "Chill", "Cocktail Bar", "Café", "Hôtel"] },
  { key: "pool", emoji: "🏖️", label: "Pool", categories: ["Pool Party"] },
  { key: "food", emoji: "🍽️", label: "Food", categories: ["Restaurant", "Food"] },
];

const DEFAULT_CAT = { emoji: "📍", color: "hsl(43,56%,52%)" };

export const createCategoryIcon = (category: string | null, options: { trending?: boolean; isPartner?: boolean; hasOffer?: boolean; blurred?: boolean } = {}) => {
  const cat = CATEGORY_CONFIG[category || ""] || DEFAULT_CAT;
  const { trending = false, isPartner = false, hasOffer = false, blurred = false } = options;
  const size = isPartner ? 42 : trending ? 42 : 34;
  const emojiSize = isPartner ? 18 : trending ? 18 : 15;

  const borderColor = isPartner ? "hsl(43,76%,52%)" : cat.color;
  const borderWidth = isPartner ? "3px" : "2px";
  const glow = isPartner
    ? "0 0 12px hsl(43,76%,52%,0.5)"
    : `0 2px ${trending ? 12 : 6}px ${cat.color.replace(")", ",0.35)")}`;

  const partnerBadge = isPartner
    ? `<div style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:hsl(43,76%,52%);display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 2px 4px hsl(43,76%,52%,0.4)">${hasOffer ? "🎁" : "⭐"}</div>`
    : "";

  const trendingBadge = trending && !isPartner
    ? `<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:hsl(43,56%,52%);color:hsl(30,20%,95%);font-size:7px;font-weight:800;padding:1px 4px;border-radius:3px;white-space:nowrap;letter-spacing:0.05em">LIVE</div>`
    : "";

  const blurFilter = blurred ? "filter:blur(4px) grayscale(0.5);opacity:0.6;" : "";
  const lockBadge = blurred
    ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;z-index:2">🔒</div>`
    : "";

  return L.divIcon({
    className: trending ? "trending-marker" : isPartner ? "gold-marker" : "",
    html: `
      <div class="category-marker" style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:hsl(0,0%,8%);
        border:${borderWidth} solid ${borderColor};
        box-shadow:${glow};
        display:flex;align-items:center;justify-content:center;
        position:relative;${blurFilter}
      ">
        <span style="font-size:${emojiSize}px;line-height:1">${cat.emoji}</span>
        ${partnerBadge}
        ${trendingBadge}
      </div>
      ${lockBadge}
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};
