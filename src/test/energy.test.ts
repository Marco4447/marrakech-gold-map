import { describe, it, expect } from "vitest";
import { computeEnergyScores, getEnergy, getDistanceMeters, formatDistance } from "@/lib/energy";

describe("energy", () => {
  describe("computeEnergyScores", () => {
    it("returns empty map for no vibes", () => {
      const result = computeEnergyScores([]);
      expect(result.size).toBe(0);
    });

    it("computes score per location (case insensitive)", () => {
      const vibes = [
        { location: "Mazel", likes: 5, super_vibes: 1, created_at: new Date().toISOString(), is_official: false },
        { location: "mazel", likes: 3, super_vibes: 0, created_at: new Date().toISOString(), is_official: false },
      ];
      const result = computeEnergyScores(vibes);
      expect(result.has("mazel")).toBe(true);
      expect(result.get("mazel")!.score).toBeGreaterThan(0);
    });

    it("ignores vibes without location", () => {
      const vibes = [
        { location: null, likes: 10, super_vibes: 5, created_at: new Date().toISOString() },
      ];
      const result = computeEnergyScores(vibes);
      expect(result.size).toBe(0);
    });

    it("labels HOT NOW for high scores", () => {
      const vibes = Array.from({ length: 10 }, () => ({
        location: "HotSpot",
        likes: 5,
        super_vibes: 2,
        created_at: new Date().toISOString(),
        is_official: true,
      }));
      const result = computeEnergyScores(vibes);
      expect(result.get("hotspot")!.label).toBe("HOT NOW");
    });
  });

  describe("getEnergy", () => {
    it("returns null for unknown place", () => {
      const map = computeEnergyScores([]);
      expect(getEnergy(map, "unknown")).toBeNull();
    });

    it("returns null for null input", () => {
      expect(getEnergy(new Map(), null)).toBeNull();
    });
  });

  describe("getDistanceMeters", () => {
    it("returns 0 for same point", () => {
      expect(getDistanceMeters(31.63, -7.98, 31.63, -7.98)).toBe(0);
    });

    it("returns roughly correct distance for known points", () => {
      // Marrakech to Casablanca is ~240km
      const dist = getDistanceMeters(31.63, -7.98, 33.57, -7.59);
      expect(dist).toBeGreaterThan(200000);
      expect(dist).toBeLessThan(260000);
    });
  });

  describe("formatDistance", () => {
    it("formats meters for short distances", () => {
      expect(formatDistance(500)).toBe("500m");
    });

    it("formats km for long distances", () => {
      expect(formatDistance(2500)).toBe("2.5km");
    });
  });
});
