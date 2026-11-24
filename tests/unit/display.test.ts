import { describe, expect, test } from "bun:test";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";
import { barState } from "../../src/section/view/status.ts";
import { renderBalance, renderCap, renderProvider, renderWindow } from "../../src/section/view/window.ts";
import { fixtureSnapshot, NOW } from "../fixtures/provider.ts";

describe("display", () => {
  test("25% halfway shows a warning bar and a 50% benchmark", () => {
    const html = renderWindow(
      { id: "daily", label: "Daily", remainingPercent: 25, resetAt: "2026-11-24T00:00:00Z", durationSeconds: 86_400 },
      DEFAULT_SELECTION,
      NOW,
    );
    expect(html).toContain("width:25.00%");
    expect(html).toContain("left:50.00%");
    expect(html).toContain("state-warning");
    expect(html).toContain(">12h<");
  });

  test("danger below the cutoff and at zero", () => {
    expect(barState(9, 50, 10)).toBe("danger");
    const html = renderWindow(
      { id: "x", label: "X", remainingPercent: 0, resetAt: "2026-11-24T00:00:00Z", durationSeconds: 86_400 },
      DEFAULT_SELECTION,
      NOW,
    );
    expect(html).toContain("state-danger");
    expect(html).toContain("width:0.00%");
    expect(html).toContain("left:50.00%");
  });

  test("missing reset shows an error, not a bar", () => {
    const html = renderWindow(
      { id: "x", label: "X", remainingPercent: 40, resetAt: "not-a-date" },
      DEFAULT_SELECTION,
      NOW,
    );
    expect(html).toContain("reset time unavailable");
    expect(html).not.toContain("quota-bar");
  });

  test("caps use a bar without reset or benchmark; balances are text", () => {
    const cap = renderCap({ id: "c", label: "Monthly", used: 12.5, limit: 50, unit: "USD" });
    expect(cap).toContain("no reset");
    expect(cap).not.toContain("quota-benchmark");
    expect(cap).toContain("width:75.00%");
    expect(cap).toContain("$37.50 / $50.00");

    const balance = renderBalance({ id: "b", label: "Credit", value: 25, unit: "USD" });
    expect(balance).toContain("Credit");
    expect(balance).not.toContain("quota-bar");
  });

  test("provider error replaces its bars", () => {
    const provider = fixtureSnapshot().providers[1];
    const html = renderProvider(provider, DEFAULT_SELECTION, NOW);
    expect(html).toContain("Provider rejected the key.");
    expect(html).not.toContain("quota-bar");
  });

  test("Tavily heading uses the decorative brand mark", () => {
    const provider = { ...fixtureSnapshot().providers[0], kind: "tavily" as const, label: "Tavily" };
    const html = renderProvider(provider, DEFAULT_SELECTION, NOW);
    expect(html).toContain('<span class="quota-provider-icon"><svg class="quota-tavily-mark"');
    expect(html).toMatch(/class="quota-tavily-mark"[^>]*aria-hidden="true"/);
    expect(html).toContain("</svg></span>Tavily</h3>");
  });

  test("an expired window keeps its label and puts the status at the bar column", () => {
    const html = renderWindow(
      { id: "rolling", label: "5h", remainingPercent: 90, resetAt: "2026-11-23T11:59:00Z", durationSeconds: 18_000 },
      DEFAULT_SELECTION,
      NOW,
    );
    expect(html).toContain('class="quota-row quota-row-line quota-row-window quota-window-status"');
    expect(html).toContain('<span class="quota-label">5h</span>');
    expect(html).toContain('<span class="quota-status-text" role="status">refreshing…</span>');
    expect(html).not.toContain("quota-bar");
  });

  test("a raw-value window shows remaining against limit and a reset", () => {
    const html = renderWindow(
      {
        id: "plan",
        label: "Credits",
        remainingPercent: 82.1,
        resetAt: "2026-12-01T00:00:00Z",
        durationSeconds: 30 * 86_400,
        used: { value: 179, unit: "credits" },
        limit: { value: 1000, unit: "credits" },
      },
      DEFAULT_SELECTION,
      NOW,
    );
    expect(html).toContain("821 / 1000");
    expect(html).toContain("resets");
    expect(html).toContain("width:82.10%");
    expect(html).not.toContain(">82%<");
  });

  test("hides key credits used while keeping PAYG usage", () => {
    const provider = fixtureSnapshot().providers[0];
    const html = renderProvider(
      {
        ...provider,
        balances: [
          { id: "key-used", label: "Key credits used", value: 179, unit: "credits" },
          { id: "paygo-used", label: "Pay-as-you-go used", value: 0, unit: "units" },
        ],
      },
      DEFAULT_SELECTION,
      NOW,
    );
    expect(html).not.toContain("Key credits used");
    expect(html).toContain("Pay-as-you-go used");
  });

  test("a window error keeps its label and does not hide other windows", () => {
    const html = renderWindow(
      { id: "weekly", label: "7d", error: { code: "bad_response", message: "Usage unavailable." } },
      DEFAULT_SELECTION,
      NOW,
    );
    expect(html).toContain('<span class="quota-label">7d</span>');
    expect(html).toContain("Usage unavailable.");
    expect(html).toContain("quota-window-error");
    expect(html).not.toContain("quota-bar");
  });

  test("a refreshing provider keeps unexpired bars", () => {
    const provider = fixtureSnapshot().providers[0];
    const html = renderProvider({ ...provider, refreshing: true }, DEFAULT_SELECTION, NOW);
    expect(html).toContain("quota-bar");
    expect(html).toContain("Refreshing…");
    expect(html).not.toContain("Loading quota…");
  });
});
