import { describe, it, expect } from "vitest";
import { calculateVibeScore, createScoringContext, rankFeedVibes, type FeedVibe, type ScoringContext } from "@/lib/feedAlgorithm";

const makeVibe = (overrides: Partial<FeedVibe> = {}): FeedVibe => ({
  id: "v1",
  user_id: "u1",
  likes: 10,
  super_vibes: 2,
  created_at: new Date().toISOString(),
  latitude: 31.63,
  longitude: -7.98,
  is_official: false,
  location: "Test Place",
  profile: null,
  ...overrides,
});

const makeContext = (overrides: Partial<ScoringContext> = {}): ScoringContext => ({
  userLocation: { lat: 31.63, lng: -7.98 },
  followingIds: new Set(),
  boostedVibeIds: new Set(),
  commentCounts: {},
  likesInLastHour: {},
  maxEngagement: 20,
  ...overrides,
});

describe("feedAlgorithm", () => {
  describe("calculateVibeScore", () => {
    it("returns a positive score for a normal vibe", () => {
      const score = calculateVibeScore(makeVibe(), makeContext());
      expect(score).toBeGreaterThan(0);
    });

    it("gives higher score to official vibes", () => {
      const ctx = makeContext();
      const normal = calculateVibeScore(makeVibe({ is_official: false }), ctx);
      const official = calculateVibeScore(makeVibe({ is_official: true }), ctx);
      expect(official).toBeGreaterThan(normal);
    });

    it("gives higher score to boosted vibes", () => {
      const vibe = makeVibe();
      const normal = calculateVibeScore(vibe, makeContext());
      const boosted = calculateVibeScore(vibe, makeContext({ boostedVibeIds: new Set([vibe.id]) }));
      expect(boosted).toBeGreaterThan(normal);
    });

    it("gives higher score to followed authors", () => {
      const vibe = makeVibe({ user_id: "u1" });
      const notFollowed = calculateVibeScore(vibe, makeContext());
      const followed = calculateVibeScore(vibe, makeContext({ followingIds: new Set(["u1"]) }));
      expect(followed).toBeGreaterThan(notFollowed);
    });

    it("gives higher score to VIP authors", () => {
      const normal = calculateVibeScore(makeVibe({ profile: null }), makeContext());
      const vip = calculateVibeScore(makeVibe({ profile: { is_vip: true } }), makeContext());
      expect(vip).toBeGreaterThan(normal);
    });

    it("gives higher score to recent vibes vs old ones", () => {
      const recent = calculateVibeScore(makeVibe({ created_at: new Date().toISOString() }), makeContext());
      const old = calculateVibeScore(makeVibe({ created_at: new Date(Date.now() - 5 * 3600000).toISOString() }), makeContext());
      expect(recent).toBeGreaterThan(old);
    });

    it("gives higher score to closer vibes", () => {
      const ctx = makeContext({ userLocation: { lat: 31.63, lng: -7.98 } });
      const nearby = calculateVibeScore(makeVibe({ latitude: 31.63, longitude: -7.98 }), ctx);
      const faraway = calculateVibeScore(makeVibe({ latitude: 33.0, longitude: -7.0 }), ctx);
      expect(nearby).toBeGreaterThan(faraway);
    });
  });

  describe("rankFeedVibes", () => {
    it("ranks vibes by score descending", () => {
      const vibes = [
        makeVibe({ id: "old", likes: 0, super_vibes: 0, created_at: new Date(Date.now() - 5 * 3600000).toISOString() }),
        makeVibe({ id: "popular", likes: 50, super_vibes: 10 }),
        makeVibe({ id: "normal", likes: 5, super_vibes: 0 }),
      ];
      const ctx = makeContext({ maxEngagement: 80 });
      const ranked = rankFeedVibes(vibes, ctx);
      expect(ranked[0].id).toBe("popular");
    });

    it("does not mutate original array", () => {
      const vibes = [makeVibe({ id: "a" }), makeVibe({ id: "b" })];
      const original = [...vibes];
      rankFeedVibes(vibes, makeContext());
      expect(vibes.map(v => v.id)).toEqual(original.map(v => v.id));
    });
  });

  describe("createScoringContext", () => {
    it("computes maxEngagement from vibes", () => {
      const vibes = [
        makeVibe({ likes: 10, super_vibes: 5 }),
        makeVibe({ likes: 2, super_vibes: 0 }),
      ];
      const ctx = createScoringContext({
        vibes,
        userLocation: null,
        followingIds: new Set(),
        boostedVibeIds: new Set(),
        commentCounts: {},
      });
      // 10 + 5*3 + 0 = 25
      expect(ctx.maxEngagement).toBe(25);
    });

    it("estimates recent likes for fresh vibes", () => {
      const vibe = makeVibe({ id: "fresh", likes: 10, created_at: new Date().toISOString() });
      const ctx = createScoringContext({
        vibes: [vibe],
        userLocation: null,
        followingIds: new Set(),
        boostedVibeIds: new Set(),
        commentCounts: {},
      });
      expect(ctx.likesInLastHour["fresh"]).toBe(10);
    });
  });
});
