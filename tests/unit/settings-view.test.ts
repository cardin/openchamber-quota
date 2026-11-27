import { describe, expect, test } from "bun:test";
import { renderConnections } from "../../src/section/view/connections.ts";
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

  test("keeps setup guidance short and omits the key form and empty custom list", () => {
    const html = renderConnections([]);
    expect(html).not.toContain('name="apiKey"');
    expect(html).not.toContain('data-action="save-connection"');
    expect(html).toContain("Manage provider sign-ins and keys in OpenCode.");
    expect(html).not.toContain("full access");
    expect(html).not.toContain("quota-connections");
    expect(html).not.toContain("Manual Tavily and Exa keys");
  });

  test("offers test and remove for an existing custom connection", () => {
    const html = renderConnections([
      {
        id: "custom-gateway",
        kind: "custom",
        label: "Gateway",
        endpoint: "https://example.com/quota",
        createdAt: "2026-11-24T00:00:00Z",
      },
    ]);
    expect(html).toContain('data-action="test-connection"');
    expect(html).toContain('data-action="delete-connection"');
    expect(html).not.toContain('data-action="edit-connection"');
  });

  test("display hides providers with no OpenCode credential", () => {
    const snapshot = {
      version: 1 as const,
      generatedAt: "2026-11-24T00:00:00Z",
      providers: [
        {
          connectionId: "bridge-opencode-zen",
          kind: "opencode-zen" as const,
          label: "OpenCode Zen",
          state: "unconfigured" as const,
          windows: [],
          caps: [],
          balances: [],
          refreshing: false,
          error: {
            code: "not_configured" as const,
            message: "Sign in to OpenCode Zen in OpenCode, then refresh.",
          },
        },
        {
          connectionId: "bridge-openrouter",
          kind: "openrouter" as const,
          label: "OpenRouter",
          state: "ok" as const,
          windows: [{ id: "limit", label: "30d", remainingPercent: 50, resetAt: "2026-11-24T00:00:00Z" }],
          caps: [],
          balances: [],
          refreshing: false,
          fetchedAt: "2026-11-23T12:00:00Z",
        },
      ],
    };
    const html = renderSelector(snapshot, DEFAULT_SELECTION);
    expect(html).toContain("OpenRouter");
    expect(html).not.toContain("OpenCode Zen");
    const explicit = renderSelector(snapshot, {
      ...DEFAULT_SELECTION,
      saved: true,
      providers: ["bridge-opencode-zen"],
      explicitProviderSelections: ["bridge-opencode-zen"],
    });
    expect(explicit).not.toContain("OpenCode Zen");
  });

  test("display reorders providers and configures the collapsed quota", () => {
    const provider = (id: string, kind: "openrouter" | "opencode-go", label: string) => ({
      connectionId: id,
      kind,
      label,
      state: "ok" as const,
      windows: [
        { id: "primary", label: "Primary", remainingPercent: 50, resetAt: "2026-11-24T00:00:00Z" },
        { id: "secondary", label: "Secondary", remainingPercent: 75, resetAt: "2026-11-25T00:00:00Z" },
      ],
      caps: [],
      balances: [],
      refreshing: false,
      fetchedAt: "2026-11-23T12:00:00Z",
    });
    const snapshot = {
      version: 1 as const,
      generatedAt: "2026-11-23T12:00:00Z",
      providers: [
        provider("bridge-openrouter", "openrouter", "OpenRouter"),
        provider("bridge-opencode-go", "opencode-go", "OpenCode Go"),
      ],
    };
    const html = renderSelector(snapshot, {
      ...DEFAULT_SELECTION,
      collapsedQuota: { "bridge-opencode-go": "earliest-reset" },
    });
    expect(html).toContain('data-action="move-provider-down"');
    expect(html).toContain('data-action="move-provider-up"');
    expect(html).toContain("data-collapsed-quota");
    expect(html).toContain('data-provider="bridge-opencode-go" aria-label="Move OpenCode Go up"');
    expect(html).toMatch(/<option value="earliest-reset" selected>Earliest reset<\/option>/);

    const reversed = renderSelector(snapshot, {
      ...DEFAULT_SELECTION,
      providerOrder: ["bridge-opencode-go", "bridge-openrouter"],
    });
    expect(reversed.indexOf("OpenCode Go")).toBeLessThan(reversed.indexOf("OpenRouter"));
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

  test("collapsed modes match the provider's actual windows", () => {
    const base = {
      connectionId: "bridge-tavily",
      kind: "tavily" as const,
      label: "Tavily",
      state: "ok" as const,
      caps: [],
      balances: [],
      refreshing: false,
      fetchedAt: "2026-11-23T12:00:00Z",
    };
    const single = renderSelector(
      {
        version: 1,
        generatedAt: "2026-11-23T12:00:00Z",
        providers: [{
          ...base,
          windows: [
            { id: "plan", label: "Credits", remainingPercent: 80, resetAt: "2026-12-01T00:00:00Z" },
          ],
        }],
      },
      DEFAULT_SELECTION,
    );
    expect(single).not.toContain("Least remaining");
    expect(single).not.toContain("Earliest reset");
    expect(single).toMatch(/<option value="plan" selected>Credits<\/option>/);

    const sameReset = renderSelector(
      {
        version: 1,
        generatedAt: "2026-11-23T12:00:00Z",
        providers: [{
          ...base,
          windows: [
            { id: "plan", label: "Credits", remainingPercent: 80, resetAt: "2026-12-01T00:00:00Z" },
            { id: "key", label: "Key", remainingPercent: 60, resetAt: "2026-11-30T19:00:00-05:00" },
          ],
        }],
      },
      DEFAULT_SELECTION,
    );
    expect(sameReset).toContain("Least remaining");
    expect(sameReset).not.toContain("Earliest reset");

    const distinctResets = renderSelector(
      {
        version: 1,
        generatedAt: "2026-11-23T12:00:00Z",
        providers: [{
          ...base,
          windows: [
            { id: "plan", label: "Credits", remainingPercent: 80, resetAt: "2026-12-01T00:00:00Z" },
            { id: "key", label: "Key", remainingPercent: 60, resetAt: "2026-11-26T00:00:00Z" },
          ],
        }],
      },
      DEFAULT_SELECTION,
    );
    expect(distinctResets).toContain("Least remaining");
    expect(distinctResets).toContain("Earliest reset");

    const balancesOnly = renderSelector(
      {
        version: 1,
        generatedAt: "2026-11-23T12:00:00Z",
        providers: [
          {
            ...base,
            windows: [],
            balances: [{ id: "credit", label: "Credit", value: 25, unit: "USD" }],
          },
        ],
      },
      DEFAULT_SELECTION,
    );
    expect(balancesOnly).toContain("data-collapsed-quota");
    expect(balancesOnly).toContain('<option value="balance:credit" selected>Credit</option>');
  });

  test("collapsed choices use only the windows visible in Quotas", () => {
    const snapshot = {
      version: 1 as const,
      generatedAt: "2026-11-23T12:00:00Z",
      providers: [{
        connectionId: "bridge-tavily",
        kind: "tavily" as const,
        label: "Tavily",
        state: "ok" as const,
        caps: [],
        balances: [],
        refreshing: false,
        fetchedAt: "2026-11-23T12:00:00Z",
        windows: [
          { id: "plan", label: "Credits", remainingPercent: 80, resetAt: "2026-12-01T00:00:00Z" },
          { id: "key", label: "Key", remainingPercent: 60, resetAt: "2026-11-26T00:00:00Z" },
        ],
      }],
    };
    const selection = {
      ...DEFAULT_SELECTION,
      saved: true,
      providers: ["bridge-tavily"],
      windows: { "bridge-tavily": ["plan"] },
      collapsedQuota: { "bridge-tavily": "key" },
    };
    const html = renderSelector(snapshot, selection);
    expect(html).toMatch(/data-window="key"[^>]*>/);
    expect(html).not.toMatch(/data-window="key"[^>]*checked/);
    expect(html).not.toContain('<option value="key"');
    expect(html).not.toContain("Earliest reset");
    expect(html).toMatch(/<option value="plan" selected>Credits<\/option>/);
  });

  test("provider status table reports authentication errors but omits unconfigured providers", () => {
    const snapshot = {
      version: 1 as const,
      generatedAt: "2026-11-23T12:00:00Z",
      providers: [
        {
          connectionId: "bridge-exa",
          kind: "exa" as const,
          label: "Exa",
          state: "error" as const,
          windows: [],
          caps: [],
          balances: [],
          refreshing: false,
          error: {
            code: "auth" as const,
            message: "Exa needs a Team Management service key in OpenCode to read credits.",
          },
        },
        {
          connectionId: "bridge-opencode-go",
          kind: "opencode-go" as const,
          label: "OpenCode Go",
          state: "unconfigured" as const,
          windows: [],
          caps: [],
          balances: [],
          refreshing: false,
          error: {
            code: "not_configured" as const,
            message: "Sign in to OpenCode Go in OpenCode, then refresh.",
          },
        },
      ],
    };
    const html = renderConnections([], snapshot);
    expect(html).toContain("Exa");
    expect(html).toContain("Authentication failed");
    expect(html).toContain("Team Management service key");
    expect(html).not.toContain('data-provider-row="bridge-opencode-go"');
    expect(html).not.toContain("Sign in to OpenCode Go");
    expect(renderSelector(snapshot, DEFAULT_SELECTION)).not.toContain("Exa");
  });

  test("provider status table explains setup and shows a bridge notice", () => {
    const snapshot = {
      version: 1 as const,
      generatedAt: "2026-11-23T12:00:00Z",
      providers: [
        {
          connectionId: "bridge-tavily",
          kind: "tavily" as const,
          label: "Tavily",
          state: "ok" as const,
          windows: [],
          caps: [],
          balances: [],
          refreshing: false,
          fetchedAt: "2026-11-23T12:00:00Z",
        },
      ],
    };
    const html = renderConnections([], snapshot);
    expect(html).toContain("Provider status");
    expect(html).toContain("OpenCode key or environment");
    expect(html).toContain("Connected");
    expect(html).toContain('<td data-label="Details" class="quota-provider-detail"></td>');
    expect(html).not.toContain("OpenCode plugin is not connected");
  });

  test("Tavily can collapse to PAYG usage without making it a percentage window", () => {
    const snapshot = {
      version: 1 as const,
      generatedAt: "2026-11-24T00:00:00Z",
      providers: [
        {
          connectionId: "bridge-tavily",
          kind: "tavily" as const,
          label: "Tavily",
          state: "ok" as const,
          refreshing: false,
          windows: [
            { id: "plan", label: "Credits", remainingPercent: 80, resetAt: "2026-12-01T00:00:00Z" },
          ],
          caps: [],
          balances: [
            { id: "key-used", label: "Key credits used", value: 179, unit: "credits" },
            { id: "paygo-used", label: "Pay-as-you-go used", value: 0, unit: "units" },
          ],
        },
      ],
    };
    const selection = { ...DEFAULT_SELECTION, collapsedQuota: { "bridge-tavily": "balance:paygo-used" } };
    const html = renderSelector(snapshot, selection);
    expect(html).toContain('<option value="balance:paygo-used" selected>Pay-as-you-go used</option>');
    expect(html).toContain('value="plan"');
    expect(html).not.toContain("Key credits used");
    expect(html).not.toContain("Least remaining");
    expect(html).not.toContain("Earliest reset");
    const hidden = renderSelector(snapshot, { ...selection, hiddenBalances: ["bridge-tavily"] });
    expect(hidden).not.toContain("Pay-as-you-go used");
    expect(hidden).toContain('<option value="plan" selected>Credits</option>');
  });
});
