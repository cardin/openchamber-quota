import { describe, expect, test } from "bun:test";
import { renderConnections } from "../../src/section/view/connections.ts";
import { renderUsage } from "../../src/section/view/usage.ts";
import { renderSelector } from "../../src/section/view/selector.ts";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";

describe("settings provider list", () => {
  test("offers Remaining and Used and keeps the current choice selected", () => {
    const snapshot = { version: 1 as const, generatedAt: "2026-11-24T00:00:00Z", providers: [] };
    const defaults = renderSelector(snapshot, DEFAULT_SELECTION);
    expect(defaults).toContain("Show quota as");
    expect(defaults).toContain('<select data-quota-display>');
    expect(defaults).toContain('<option value="remaining" selected>Remaining</option>');
    const used = renderSelector(snapshot, { ...DEFAULT_SELECTION, quotaDisplay: "used" });
    expect(used).toContain('<option value="used" selected>Used</option>');
    expect(used).not.toContain('<option value="remaining" selected>');
  });

  test("does not offer unverified providers in the add-provider list", () => {
    const html = renderConnections([]);
    expect(html).not.toContain('<option value="custom"');
    expect(html).not.toContain('<option value="codex"');
    expect(html).not.toContain('<option value="opencode-zen"');
    expect(html).toContain('<option value="tavily"');
    expect(html).toContain('<option value="openrouter"');
    expect(html).toContain('<option value="opencode-go"');
  });

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

  test("API key field has an accessible eye toggle", () => {
    const html = renderConnections([]);
    expect(html).toMatch(/<input id="quota-api-key" name="apiKey" type="password"/);
    expect(html).toContain('data-action="toggle-key"');
    expect(html).toContain('aria-controls="quota-api-key"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Show API key"');
    expect(html).toContain('data-icon="show"');
    expect(html).toContain('data-icon="hide"');
    expect(html).not.toContain(">Show</button>");
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
