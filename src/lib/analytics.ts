// Analytics event helper for GA4 custom events
// Uses gtag if available (loaded in index.html)

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(eventName: string, params?: EventParams) {
  try {
    window.gtag?.("event", eventName, params);
  } catch {
    // silently ignore
  }
}

// Pre-defined events for consistency
export const analytics = {
  // Activation funnel
  signup: () => trackEvent("sign_up", { method: "google" }),
  firstVibe: () => trackEvent("first_vibe_posted"),
  firstLike: () => trackEvent("first_like"),
  
  // Engagement
  viewPlace: (placeId: string, placeName: string) =>
    trackEvent("view_place", { place_id: placeId, place_name: placeName }),
  viewVibe: (vibeId: string) =>
    trackEvent("view_vibe", { vibe_id: vibeId }),
  likeVibe: (vibeId: string) =>
    trackEvent("like_vibe", { vibe_id: vibeId }),
  superVibe: (vibeId: string) =>
    trackEvent("super_vibe", { vibe_id: vibeId }),
  shareVibe: (vibeId: string, method: string) =>
    trackEvent("share", { content_type: "vibe", item_id: vibeId, method }),
  sharePlace: (placeId: string, method: string) =>
    trackEvent("share", { content_type: "place", item_id: placeId, method }),
  
  // Navigation
  tabChange: (tab: string) =>
    trackEvent("tab_change", { tab }),
  
  // Monetization
  vipView: () => trackEvent("vip_page_view"),
  vipPurchaseStart: () => trackEvent("begin_checkout", { item_name: "Insider Pass" }),
  creditPurchaseStart: (packName: string) =>
    trackEvent("begin_checkout", { item_name: packName }),
  
  // Referral
  referralShare: () => trackEvent("referral_share"),
  referralUse: () => trackEvent("referral_use"),
};
