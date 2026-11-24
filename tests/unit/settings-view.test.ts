import { describe, expect, test } from "bun:test";
import { renderConnections } from "../../src/section/view/connections.ts";
import { renderUsage } from "../../src/section/view/usage.ts";
import { renderSelector } from "../../src/section/view/selector.ts";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";

describe("settings provider list", () => {
  test("offers edit, test, remove, and cancel edit controls", () => {
    const html = renderConnections([
      {
        id: "custom-gateway",
        kind: "custom",
        label: "Gateway",
        endpoint: "https://example.com/quota",
        createdAt: "2026-11-24T00:00:00Z",
      },
    ]);
    expect(html).toContain('data-action="edit-connection"');
    expect(html).toContain('data-action="test-connection"');
    expect(html).toContain('data-action="delete-connection"');
    expect(html).toContain('data-action="cancel-edit"');
  });

  test("display offers a hide-balances checkbox for a provider that reports balances", () => {
    const snapshot = {
      version: 1 as const,
      generatedAt: "2026-11-24T00:00:00Z",
      providers: [
        {
          connectionId: "tavily",
          kind: "tavily" as const,
          label: "Tavily",
          state: "ok" as const,
          refreshing: false,
          windows: [],
          caps: [],
          balances: [{ id: "paygo-used", label: "Pay-as-you-go used", value: 0, unit: "units" }],
        },
      ],
    };
    const shown = renderSelector(snapshot, DEFAULT_SELECTION);
    expect(shown).toContain("data-balance-toggle");
    expect(shown).toContain("non-reporting balances");
    expect(shown).toMatch(/quota-select-windows[\s\S]*data-balance-toggle/);
    expect(shown).not.toContain("quota-balance-toggle");
    expect(shown).toMatch(/data-balance-toggle[^>]*checked/);
    const hidden = renderSelector(snapshot, {
      ...DEFAULT_SELECTION,
      hiddenBalances: ["tavily"],
    });
    expect(hidden).not.toMatch(/data-balance-toggle[^>]*checked/);
  });

  test("usage shows PAYG used but not key credits used", () => {
    const html = renderUsage({
      version: 1,
      generatedAt: "2026-11-24T00:00:00Z",
      providers: [
        {
          connectionId: "tavily",
          kind: "tavily",
          label: "Tavily",
          state: "ok",
          refreshing: false,
          windows: [],
          caps: [],
          balances: [
            { id: "key-used", label: "Key credits used", value: 179, unit: "credits" },
            { id: "paygo-used", label: "Pay-as-you-go used", value: 0, unit: "units" },
          ],
        },
      ],
    });
    expect(html).toContain("Pay-as-you-go used");
    expect(html).toContain("0 units");
    expect(html).not.toContain("Key credits used");
  });
});
