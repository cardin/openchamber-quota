import { describe, expect, test } from "bun:test";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";
import { barState } from "../../src/section/view/status.ts";
import { renderBalance, renderCap, renderProvider, renderWindow } from "../../src/section/view/window.ts";
import { fixtureSnapshot, NOW } from "../fixtures/provider.ts";
import { bridgeProviderFixture } from "../fixtures/bridge.ts";

const usedSelection = { ...DEFAULT_SELECTION, quotaDisplay: "used" as const };

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

  test("used mode mirrors the fill and benchmark but keeps the warning and reset", () => {
    const window = {
      id: "daily", label: "Daily", remainingPercent: 25, resetAt: "2026-11-24T06:00:00Z", durationSeconds: 86_400,
    };
    const html = renderWindow(window, usedSelection, NOW);
    expect(html).toContain("width:75.00%");
    expect(html).toContain("left:25.00%");
    expect(html).toContain(">75%<");
    expect(html).toContain("Daily 75% used, resets");
    expect(html).toContain("Even-use benchmark 25% used");
    expect(html).toContain("state-warning");
    expect(html).toContain(">18h<");
  });

  test("used mode shows actual credits and caps, but leaves balances unchanged", () => {
    const provider = {
      ...fixtureSnapshot().providers[0],
      windows: [{
        id: "plan", label: "Credits", remainingPercent: 82.1, resetAt: "2026-12-01T00:00:00Z",
        used: { value: 179, unit: "credits" }, limit: { value: 1000, unit: "credits" },
      }],
    };
    const html = renderProvider(provider, usedSelection, NOW);
    expect(html).toContain("179 / 1000");
    expect(html).toContain("width:17.90%");
    expect(html).toContain("$12.50 / $50.00");
    expect(html).toContain("width:25.00%");
    expect(html).toContain("Monthly spend 25% used");
    expect(html).not.toContain("quota-benchmark");
    expect(html).toContain(renderBalance(provider.balances[0]));
  });

  test("used mode fills exhausted quotas and keeps the actual amount for an over-limit cap", () => {
    const window = { id: "daily", label: "Daily", remainingPercent: 0, resetAt: "2026-11-24T00:00:00Z" };
    const html = renderWindow(window, usedSelection, NOW);
    expect(html).toContain("width:100.00%");
    expect(html).toContain("state-danger");
    expect(html).not.toContain("quota-benchmark");
    expect(renderWindow({ ...window, remainingPercent: 100 }, usedSelection, NOW)).toContain("width:0.00%");

    const cap = renderCap({ id: "cap", label: "Credits", used: 110, limit: 100, unit: "credits" }, "used");
    expect(cap).toContain("110 / 100");
    expect(cap).toContain("width:100.00%");
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
    expect(html).toContain(
      '<span class="quota-provider-icon" aria-hidden="true"><span class="quota-provider-logo"><svg class="quota-tavily-mark"',
    );
    expect(html).toMatch(/class="quota-tavily-mark"[^>]*aria-hidden="true"/);
    expect(html).toContain(
      '</svg></span></span><span class="quota-provider-name">Tavily</span>',
    );
    expect(html).toContain('class="quota-provider-chevron"');
  });

  test("an expired window keeps a historical sampled bar and age", () => {
    const html = renderWindow(
      { id: "rolling", label: "5h", remainingPercent: 90, resetAt: "2026-11-23T11:59:00Z", durationSeconds: 18_000 },
      DEFAULT_SELECTION,
      NOW,
      "2026-11-23T11:00:00Z",
    );
    expect(html).toContain("quota-historical");
    expect(html).toContain('<span class="quota-label">5h</span>');
    expect(html).toContain("width:90.00%");
    expect(html).toContain(">past<");
    expect(html).toContain("Sampled 1h ago; the reset time has passed.");
    expect(html).not.toContain("refreshing…");
    expect(html).not.toContain("quota-benchmark");
    expect(html).not.toContain("resets ");
  });

  test("a waiting provider uses a neutral status instead of a red error", () => {
    const provider = {
      ...fixtureSnapshot().providers[0],
      state: "error" as const,
      windows: [],
      caps: [],
      balances: [],
      fetchedAt: undefined,
      error: {
        code: "provider_error" as const,
        message: "Waiting for the next scheduled refresh.",
      },
    };
    const html = renderProvider(provider, DEFAULT_SELECTION, NOW);
    expect(html).toContain("Waiting for the next scheduled refresh.");
    expect(html).toContain('role="status"');
    expect(html).not.toContain("quota-error");
    expect(html).not.toContain("quota-bar");
  });

  test("an unconfigured provider shows guidance, no bars, and no empty-window claim", () => {
    const provider = {
      ...fixtureSnapshot().providers[0],
      kind: "openrouter" as const,
      label: "OpenRouter",
      state: "unconfigured" as const,
      windows: [],
      caps: [],
      balances: [],
      fetchedAt: undefined,
      error: {
        code: "not_configured" as const,
        message: "Sign in to OpenRouter in OpenCode, then refresh.",
      },
    };
    const html = renderProvider(provider, DEFAULT_SELECTION, NOW);
    expect(html).toContain("Sign in to OpenRouter in OpenCode");
    expect(html).not.toContain("quota-bar");
    expect(html).not.toContain("No quota windows reported.");
    expect(html).not.toContain("Refreshing…");
  });

  test("a stale provider keeps its sample and names the out-of-date reading", () => {
    const provider = {
      ...fixtureSnapshot().providers[0],
      state: "ok" as const,
      fetchedAt: "2026-11-23T11:30:00Z",
      error: {
        code: "provider_error" as const,
        message: "The OpenCode plugin is unavailable; showing the last reading.",
      },
    };
    const html = renderProvider(provider, DEFAULT_SELECTION, NOW);
    expect(html).toContain("quota-bar");
    expect(html).toContain("showing the last reading");
    expect(html).toContain("Last sampled 30m ago.");
    expect(html).not.toContain("Refreshing…");
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

  test("a collapsed provider shows its configured short quota and hides its rows", () => {
    const provider = fixtureSnapshot().providers[0];
    const least = renderProvider(provider, DEFAULT_SELECTION, NOW, true, "least-remaining");
    expect(least).toContain('aria-expanded="false"');
    expect(least).toContain("quota-provider-summary");
    expect(least).toContain(">0%<");
    expect(least).not.toContain("quota-window-rows");
    expect(least).not.toContain("quota-bar");

    const specific = renderProvider(provider, DEFAULT_SELECTION, NOW, true, "daily");
    expect(specific).toContain(">25%<");
    expect(specific).toContain(">12h<");
    const summaryAt = specific.indexOf('class="quota-provider-summary"');
    expect(summaryAt).toBeGreaterThan(specific.indexOf('class="quota-provider-name"'));
    expect(summaryAt).toBeLessThan(specific.indexOf("</button>"));

    const earliest = renderProvider(provider, DEFAULT_SELECTION, NOW, true, "earliest-reset");
    expect(earliest).toContain(">25%<");
  });

  test("a single-window provider falls back to that window when a special mode is saved", () => {
    const provider = {
      ...fixtureSnapshot().providers[0],
      windows: [
        { id: "plan", label: "Credits", remainingPercent: 80, resetAt: "2026-12-01T00:00:00Z" },
      ],
    };
    for (const mode of ["earliest-reset", "least-remaining"]) {
      const html = renderProvider(provider, DEFAULT_SELECTION, NOW, true, mode);
      expect(html).toContain(">80%<");
      expect(html).toContain("Credits");
    }
  });

  test("Tavily's selected PAYG balance shows zero units without a percentage or reset", () => {
    const provider = bridgeProviderFixture(4);
    for (const selection of [DEFAULT_SELECTION, usedSelection]) {
      const html = renderProvider(provider, selection, NOW, true, "balance:paygo-used");
      expect(html).toContain('data-collapsed-balance="paygo-used"');
      expect(html).toContain(">Pay-as-you-go used<");
      expect(html).toContain(">0 units<");
      expect(html).not.toContain("quota-reset");
      expect(html).not.toContain("data-collapsed-window");
    }
    const hidden = { ...DEFAULT_SELECTION, hiddenBalances: [provider.connectionId] };
    expect(renderProvider(provider, hidden, NOW, true, "balance:paygo-used")).toContain('data-collapsed-window="plan"');
  });

  test("a rate-limited cached reading shows a short notice and sample age", () => {
    const provider = {
      ...bridgeProviderFixture(4),
      fetchedAt: new Date(NOW - 4 * 60_000).toISOString(),
      error: { code: "provider_error" as const, message: "Rate limited." },
    };
    expect(renderProvider(provider, DEFAULT_SELECTION, NOW)).toContain("Rate limited. Last sampled 4m ago.");
  });

  test("a selected cap and a same-ID balance remain distinct summary choices", () => {
    const fixture = fixtureSnapshot().providers[0];
    const provider = {
      ...fixture,
      balances: [{ ...fixture.balances[0], id: fixture.caps[0].id }],
    };
    expect(renderProvider(provider, DEFAULT_SELECTION, NOW, true, "cap:monthly"))
      .toContain('data-collapsed-cap="monthly"');
    expect(renderProvider(provider, DEFAULT_SELECTION, NOW, true, "balance:monthly"))
      .toContain('data-collapsed-balance="monthly"');
  });
  test("a stale window suppresses the benchmark before its old reset", () => {
    const provider = {
      ...bridgeProviderFixture(3),
      error: { code: "provider_error" as const, message: "Bridge unavailable." },
    };
    const html = renderProvider(provider, DEFAULT_SELECTION, NOW);
    expect(html).toContain("data-historical");
    expect(html).toContain("Last sampled");
    expect(html).not.toContain("quota-benchmark");
  });

  test("a collapsed comparison falls back to usable readings before window errors", () => {
    const provider = bridgeProviderFixture(3);
    const failedWindow = {
      id: "failed",
      label: "Unavailable",
      resetAt: provider.windows[0].resetAt,
      error: { code: "bad_response" as const, message: "Usage unavailable." },
    };
    const rendered = renderProvider({
      ...provider, windows: [failedWindow, ...provider.windows],
    }, DEFAULT_SELECTION, NOW, true, "earliest-reset");
    expect(rendered).toContain('data-collapsed-window="primary"');
    const balance = renderProvider({
      ...provider,
      windows: [failedWindow],
      balances: [{ id: "credits", label: "Credits", value: 5, unit: "USD" }],
    }, DEFAULT_SELECTION, NOW, true, "earliest-reset");
    expect(balance).toContain('data-collapsed-balance="credits"');
  });

  test("a refreshing provider keeps unexpired bars and spins beside its name", () => {
    const provider = fixtureSnapshot().providers[0];
    const html = renderProvider({ ...provider, refreshing: true }, DEFAULT_SELECTION, NOW);
    expect(html).toContain("quota-bar");
    expect(html).toContain('class="quota-provider-refresh"');
    expect(html).toContain('class="quota-spinner"');
    expect(html).not.toContain("Refreshing…");
    expect(html).not.toContain("quota-row-loading");
    expect(html).not.toContain("Loading quota…");
  });
});
