/**
 * B2B Partner plan & credit pack configuration.
 * All Stripe IDs are production references.
 */

export type PlanType = "basic" | "premium" | "featured";

export interface PartnerPlan {
  type: PlanType;
  name: string;
  price: string;
  priceAmount: number; // cents
  priceId: string;
  productId: string;
  features: string[];
  highlight?: boolean;
}

export const PARTNER_PLANS: PartnerPlan[] = [
  {
    type: "basic",
    name: "Basic",
    price: "99 €/mois",
    priceAmount: 9900,
    priceId: "price_1T7jBpJ8RyilXHbf7rmKFQNd",
    productId: "prod_U5v1FkrvI4A65z",
    features: [
      "Fiche lieu sur la carte",
      "Page profil établissement",
      "Badge partenaire",
    ],
  },
  {
    type: "premium",
    name: "Premium",
    price: "249 €/mois",
    priceAmount: 24900,
    priceId: "price_1T7jCKJ8RyilXHbfbWOr7fQS",
    productId: "prod_U5v2sFUBmCGQRL",
    features: [
      "Tout Basic +",
      "Vibes Officielles",
      "Boost visibilité feed",
      "Dashboard analytique",
    ],
    highlight: true,
  },
  {
    type: "featured",
    name: "Featured",
    price: "499 €/mois",
    priceAmount: 49900,
    priceId: "price_1T7jCjJ8RyilXHbfJ2oHd2wh",
    productId: "prod_U5v2KvLBJLzJtA",
    features: [
      "Tout Premium +",
      "Trending Tonight",
      "Placement homepage",
      "Priorité carte",
    ],
  },
];

export interface CreditPack {
  id: string;
  priceId: string;
  name: string;
  credits: number;
  price: string;
  unitPrice: string;
  popular?: boolean;
  badge?: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pulse",
    priceId: "price_1T6lm6J8RyilXHbfYe1I2cPh",
    name: "Pulse Pack",
    credits: 1,
    price: "9,90 €",
    unitPrice: "9,90 €/crédit",
  },
  {
    id: "resonance",
    priceId: "price_1T6lmfJ8RyilXHbf7enV2Cxn",
    name: "Resonance Pack",
    credits: 5,
    price: "39,90 €",
    unitPrice: "7,98 €/crédit",
    popular: true,
    badge: "Meilleur rapport",
  },
  {
    id: "empire",
    priceId: "price_1T7jDDJ8RyilXHbfdeswNi24",
    name: "Empire Pack",
    credits: 20,
    price: "129 €",
    unitPrice: "6,45 €/crédit",
    badge: "Volume pro",
  },
];

/** Map plan type to allowed features */
export function planAllows(plan: PlanType | null, feature: "vibes" | "analytics" | "trending" | "homepage" | "priority_map"): boolean {
  if (!plan) return false;
  const map: Record<string, PlanType[]> = {
    vibes: ["premium", "featured"],
    analytics: ["premium", "featured"],
    trending: ["featured"],
    homepage: ["featured"],
    priority_map: ["featured"],
  };
  return (map[feature] || []).includes(plan);
}
