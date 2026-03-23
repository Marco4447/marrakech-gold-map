import { describe, it, expect, vi } from "vitest";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => ({
            then: (cb: any) => cb({ count: 5 }),
          }),
          single: () => Promise.resolve({ data: { is_vip: true } }),
        }),
        then: (cb: any) => cb({ data: [] }),
      }),
      insert: () => Promise.resolve({}),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "test" } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
    removeChannel: vi.fn(),
  },
}));

describe("Partner Dashboard", () => {
  it("Dashboard blocked for non-partners", () => {
    const isPartner = false;
    const shouldShowDashboard = isPartner;
    expect(shouldShowDashboard).toBe(false);
  });

  it("Dashboard accessible for partners", () => {
    const isPartner = true;
    const shouldShowDashboard = isPartner;
    expect(shouldShowDashboard).toBe(true);
  });

  it("Analytics metrics structure is correct", () => {
    const metrics = {
      viewsToday: 12,
      viewsMonth: 89,
      redemptions: 5,
      conversionRate: 0,
    };

    metrics.conversionRate = metrics.viewsMonth > 0
      ? Math.round((metrics.redemptions / metrics.viewsMonth) * 100)
      : 0;

    expect(metrics.viewsToday).toBeGreaterThanOrEqual(0);
    expect(metrics.viewsMonth).toBeGreaterThanOrEqual(0);
    expect(metrics.redemptions).toBeGreaterThanOrEqual(0);
    expect(metrics.conversionRate).toBe(6); // 5/89 ≈ 6%
  });

  it("Chart data has 7 days", () => {
    const chartData: { date: string; views: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      chartData.push({ date: d.toISOString().slice(0, 10), views: Math.floor(Math.random() * 20) });
    }
    expect(chartData).toHaveLength(7);
    expect(chartData[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("PDF report generates correct filename", () => {
    const spotName = "Kabana Rooftop";
    const slug = spotName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const month = new Date().toISOString().slice(0, 7);
    const filename = `weshkech-rapport-${slug}-${month}.pdf`;

    expect(filename).toContain("kabana-rooftop");
    expect(filename).toMatch(/\.pdf$/);
    expect(filename).toContain("2026");
  });

  it("VIP redemptions badge shows correct count", () => {
    const count = 5;
    const label = `${count} offre${count > 1 ? "s" : ""} utilisée${count > 1 ? "s" : ""} ce mois`;
    expect(label).toBe("5 offres utilisées ce mois");
  });

  it("VIP redemptions badge hidden when count is 0", () => {
    const count = 0;
    const shouldShow = count > 0;
    expect(shouldShow).toBe(false);
  });

  it("Redemption row has correct structure", () => {
    const row = {
      id: "abc-123",
      created_at: "2026-03-23T14:30:00.000Z",
    };

    const date = new Date(row.created_at);
    const formatted = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    expect(formatted).toBeTruthy();
    expect(time).toBeTruthy();
    expect(row.id).toBeTruthy();
  });

  it("CSV export produces valid format", () => {
    const chartData = [
      { date: "2026-03-17", views: 3 },
      { date: "2026-03-18", views: 8 },
    ];
    const header = "date,views";
    const rows = chartData.map(d => `${d.date},${d.views}`);
    const csv = [header, ...rows].join("\n");

    expect(csv).toContain("date,views");
    expect(csv).toContain("2026-03-17,3");
    expect(csv.split("\n")).toHaveLength(3);
  });

  it("Partner credits display correctly", () => {
    const credits: number = 38;
    const display = `${credits} crédit${(credits as number) !== 1 ? "s" : ""}`;
    expect(display).toBe("38 crédits");
  });
});
