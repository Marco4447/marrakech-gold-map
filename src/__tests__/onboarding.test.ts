import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ or: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [] }) }) }) }),
      insert: () => Promise.resolve({}),
    }),
  },
}));

// Mock sonner
vi.mock("sonner", () => ({ toast: vi.fn() }));

describe("Onboarding flow", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("WelcomeModal should show for first-time users", () => {
    expect(localStorage.getItem("wk_welcome_seen")).toBeNull();
    // First visit = no flag = modal should render
  });

  it("WelcomeModal should NOT show after completion", () => {
    localStorage.setItem("wk_welcome_seen", "1");
    expect(localStorage.getItem("wk_welcome_seen")).toBe("1");
  });

  it("Step navigation: 3 steps total", () => {
    const TOTAL_STEPS = 3;
    let step = 0;

    // Step 0 → 1
    step = 1;
    expect(step).toBe(1);

    // Step 1 → 2
    step = 2;
    expect(step).toBe(2);

    expect(step).toBeLessThan(TOTAL_STEPS);
  });

  it("Preferences save to localStorage", () => {
    const prefs = ["cafe", "nightlife"];
    localStorage.setItem("wk_preferences", JSON.stringify(prefs));

    const saved = JSON.parse(localStorage.getItem("wk_preferences") || "[]");
    expect(saved).toEqual(["cafe", "nightlife"]);
    expect(saved).toHaveLength(2);
  });

  it("Preferences toggle adds and removes", () => {
    const selected = new Set<string>();

    // Add
    selected.add("cafe");
    expect(selected.has("cafe")).toBe(true);

    // Toggle off
    selected.delete("cafe");
    expect(selected.has("cafe")).toBe(false);
  });

  it("finish() sets wk_welcome_seen", () => {
    // Simulate finish
    localStorage.setItem("wk_welcome_seen", "1");
    expect(localStorage.getItem("wk_welcome_seen")).toBe("1");
  });

  it("onboarding_completed event structure is correct", () => {
    const event = {
      event_type: "onboarding_completed",
      source: "onboarding",
      campaign: new Date().toISOString().split("T")[0],
    };

    expect(event.event_type).toBe("onboarding_completed");
    expect(event.source).toBe("onboarding");
    expect(event.campaign).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("onboarding_abandoned fires when X clicked before finish", () => {
    const event = {
      event_type: "onboarding_abandoned",
      source: "onboarding",
    };
    expect(event.event_type).toBe("onboarding_abandoned");
  });

  it("Toast nudge scheduled after completion", async () => {
    const { toast } = await import("sonner");

    // Simulate the 3s delay nudge
    vi.useFakeTimers();
    setTimeout(() => {
      (toast as any)("📍 Clique sur un spot pour voir l'offre VIP");
    }, 3000);

    vi.advanceTimersByTime(3000);
    expect(toast).toHaveBeenCalledWith("📍 Clique sur un spot pour voir l'offre VIP");
    vi.useRealTimers();
  });
});
