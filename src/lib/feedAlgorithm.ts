/**
 * Feed Ranking Algorithm for Weshkech
 * "Le radar social de Marrakech"
 * 
 * Scoring weights:
 * - Popularity (engagement): 30%
 * - Recency (time decay): 25%
 * - Social relationship: 20%
 * - Proximity (geo): 15%
 * - Engagement velocity: 10%
 * 
 * Additional modifiers:
 * - Official/partner content: +15%
 * - Paid boost: +20%
 * - VIP author: +5%
 */

import { getDistanceMeters } from "./energy";

// Constants
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_GEO_DISTANCE = 10000; // 10km radius for Marrakech

// Weights configuration
const WEIGHTS = {
  popularity: 0.30,
  recency: 0.25,
  relationship: 0.20,
  proximity: 0.15,
  velocity: 0.10,
} as const;

// Bonus modifiers
const MODIFIERS = {
  official: 0.15,
  paidBoost: 0.20,
  vipAuthor: 0.05,
  followedAuthor: 0.25, // Extra boost for followed accounts in For You
} as const;

export interface FeedVibe {
  id: string;
  user_id: string | null;
  likes: number;
  super_vibes: number;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  is_official?: boolean;
  location: string | null;
  profile?: {
    is_vip?: boolean;
  } | null;
}

export interface ScoringContext {
  userLocation: { lat: number; lng: number } | null;
  followingIds: Set<string>;
  boostedVibeIds: Set<string>;
  commentCounts: Record<string, number>;
  likesInLastHour: Record<string, number>; // For velocity calculation
  maxEngagement: number; // For normalization
}

/**
 * Calculate the total engagement score for a vibe
 * Likes = 1pt, Super Vibes = 3pts, Comments = 2pts
 */
function getEngagementScore(vibe: FeedVibe, commentCount: number): number {
  return vibe.likes + (vibe.super_vibes || 0) * 3 + commentCount * 2;
}

/**
 * Calculate recency score (1 = just posted, 0 = 6+ hours old)
 */
function getRecencyScore(createdAt: string): number {
  const age = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, 1 - age / SIX_HOURS_MS);
}

/**
 * Calculate proximity score (1 = same location, 0 = 10km+ away)
 */
function getProximityScore(
  vibe: FeedVibe,
  userLocation: { lat: number; lng: number } | null
): number {
  if (!userLocation || vibe.latitude == null || vibe.longitude == null) {
    return 0.5; // Neutral score if location unavailable
  }
  const distance = getDistanceMeters(
    userLocation.lat,
    userLocation.lng,
    vibe.latitude,
    vibe.longitude
  );
  return Math.max(0, 1 - distance / MAX_GEO_DISTANCE);
}

/**
 * Calculate social relationship score
 * 1 = followed author, 0 = not followed
 */
function getRelationshipScore(vibe: FeedVibe, followingIds: Set<string>): number {
  if (!vibe.user_id) return 0;
  return followingIds.has(vibe.user_id) ? 1 : 0;
}

/**
 * Calculate engagement velocity (how fast a post is getting engagement)
 * Posts with rapid early engagement get boosted
 */
function getVelocityScore(
  vibe: FeedVibe,
  likesInLastHour: Record<string, number>,
  totalEngagement: number
): number {
  const recentLikes = likesInLastHour[vibe.id] || 0;
  if (totalEngagement === 0) return 0;
  
  // Velocity = recent likes / total engagement, weighted by post age
  const age = Date.now() - new Date(vibe.created_at).getTime();
  const hoursSincePost = Math.max(1, age / ONE_HOUR_MS);
  
  // Normalize: a post with 50% of its likes in the last hour has velocity = 1
  const velocityRatio = recentLikes / Math.max(1, totalEngagement);
  const ageBonus = Math.max(0.5, 1 - hoursSincePost / 6); // Recent posts get velocity bonus
  
  return Math.min(1, velocityRatio * 2) * ageBonus;
}

/**
 * Calculate the final ranking score for a vibe
 */
export function calculateVibeScore(
  vibe: FeedVibe,
  ctx: ScoringContext
): number {
  const commentCount = ctx.commentCounts[vibe.id] || 0;
  const engagement = getEngagementScore(vibe, commentCount);
  
  // Normalized scores (0-1)
  const popularityScore = ctx.maxEngagement > 0 
    ? engagement / ctx.maxEngagement 
    : 0;
  const recencyScore = getRecencyScore(vibe.created_at);
  const proximityScore = getProximityScore(vibe, ctx.userLocation);
  const relationshipScore = getRelationshipScore(vibe, ctx.followingIds);
  const velocityScore = getVelocityScore(vibe, ctx.likesInLastHour, engagement);
  
  // Base score calculation
  let score = 
    popularityScore * WEIGHTS.popularity +
    recencyScore * WEIGHTS.recency +
    relationshipScore * WEIGHTS.relationship +
    proximityScore * WEIGHTS.proximity +
    velocityScore * WEIGHTS.velocity;
  
  // Apply modifiers
  if (vibe.is_official) {
    score += MODIFIERS.official;
  }
  if (ctx.boostedVibeIds.has(vibe.id)) {
    score += MODIFIERS.paidBoost;
  }
  if (vibe.profile?.is_vip) {
    score += MODIFIERS.vipAuthor;
  }
  // Extra boost for followed accounts even in For You tab
  if (vibe.user_id && ctx.followingIds.has(vibe.user_id)) {
    score += MODIFIERS.followedAuthor;
  }
  
  return score;
}

/**
 * Sort vibes by calculated score
 */
export function rankFeedVibes<T extends FeedVibe>(
  vibes: T[],
  ctx: ScoringContext
): T[] {
  return [...vibes].sort((a, b) => {
    const scoreA = calculateVibeScore(a, ctx);
    const scoreB = calculateVibeScore(b, ctx);
    return scoreB - scoreA;
  });
}

/**
 * Create scoring context from app state
 */
export function createScoringContext(params: {
  vibes: FeedVibe[];
  userLocation: { lat: number; lng: number } | null;
  followingIds: Set<string>;
  boostedVibeIds: Set<string>;
  commentCounts: Record<string, number>;
}): ScoringContext {
  // Calculate max engagement for normalization
  const engagements = params.vibes.map(v => 
    v.likes + (v.super_vibes || 0) * 3 + (params.commentCounts[v.id] || 0) * 2
  );
  const maxEngagement = Math.max(1, ...engagements);
  
  // Estimate recent likes (simplified: assume 30% of likes came in last hour for recent posts)
  const likesInLastHour: Record<string, number> = {};
  const now = Date.now();
  params.vibes.forEach(v => {
    const age = now - new Date(v.created_at).getTime();
    if (age < ONE_HOUR_MS) {
      // Post is less than 1 hour old, all likes are "recent"
      likesInLastHour[v.id] = v.likes;
    } else if (age < SIX_HOURS_MS) {
      // Estimate: decay based on age
      const freshness = 1 - age / SIX_HOURS_MS;
      likesInLastHour[v.id] = Math.round(v.likes * freshness * 0.3);
    } else {
      likesInLastHour[v.id] = 0;
    }
  });
  
  return {
    userLocation: params.userLocation,
    followingIds: params.followingIds,
    boostedVibeIds: params.boostedVibeIds,
    commentCounts: params.commentCounts,
    likesInLastHour,
    maxEngagement,
  };
}

/**
 * Get debug info for a vibe's score breakdown
 */
export function getScoreBreakdown(
  vibe: FeedVibe,
  ctx: ScoringContext
): Record<string, number> {
  const commentCount = ctx.commentCounts[vibe.id] || 0;
  const engagement = getEngagementScore(vibe, commentCount);
  
  return {
    popularity: ctx.maxEngagement > 0 ? engagement / ctx.maxEngagement : 0,
    recency: getRecencyScore(vibe.created_at),
    proximity: getProximityScore(vibe, ctx.userLocation),
    relationship: getRelationshipScore(vibe, ctx.followingIds),
    velocity: getVelocityScore(vibe, ctx.likesInLastHour, engagement),
    isOfficial: vibe.is_official ? 1 : 0,
    isBoosted: ctx.boostedVibeIds.has(vibe.id) ? 1 : 0,
    isVip: vibe.profile?.is_vip ? 1 : 0,
    isFollowed: vibe.user_id && ctx.followingIds.has(vibe.user_id) ? 1 : 0,
    totalScore: calculateVibeScore(vibe, ctx),
  };
}
