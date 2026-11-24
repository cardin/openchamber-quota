import { describe, expect, test } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AdapterContext } from "../../src/providers/types.ts";
import { DEFAULT_SELECTION, type ProviderKind, type StoredConnection } from "../../src/core/types.ts";
import { customAdapter } from "../../src/providers/custom.ts";
import { tavilyAdapter } from "../../src/providers/tavily.ts";
import { openRouterAdapter } from "../../src/providers/openrouter.ts";
import { openCodeGoAdapter } from "../../src/providers/opencode-go.ts";
import { codexAdapter } from "../../src/providers/codex.ts";
import { openCodeZenAdapter } from "../../src/providers/opencode-zen.ts";
import { HttpError } from "../../src/service/http.ts";
import { renderWindow } from "../../src/section/view/window.ts";
import { customPayload, NOW, RESET } from "../fixtures/provider.ts";

const context = (body: (url: string) => unknown, codexHome?: string): AdapterContext => ({
  now: () => NOW,
  requestJson: async (url) => ({ status: 200, body: body(url) }),
  dataDir: "",
  codexHome,
});

const connection = (
  kind: ProviderKind,
  secret: Record<string, string> = {},
  extra: Partial<StoredConnection> = {},
): StoredConnection => ({
  id: kind,
  kind,
  label: kind,
  createdAt: new Date(NOW).toISOString(),
  secret,
  ...extra,
});

describe("provider adapters", () => {
  test("custom parses the supported format", async () => {
    const result = await customAdapter.fetch(
      connection("custom", { apiKey: "key" }, { endpoint: "https://example.com/quota" }),
      context(() => customPayload),
    );
    expect(result.windows).toHaveLength(1);
    expect(result.windows[0].remainingPercent).toBe(25);
    expect(result.caps).toHaveLength(1);
    expect(result.balances).toHaveLength(1);
  });

  test("tavily maps plan, key, and PAYG limits to monthly windows", async () => {
    const result = await tavilyAdapter.fetch(
      connection("tavily", { apiKey: "tvly" }),
      context(() => ({
        key: { usage: 10, limit: 100 },
        account: { plan_usage: 200, plan_limit: 1000, paygo_usage: 5, paygo_limit: 20 },
      })),
    );
    expect(result.windows).toHaveLength(3);
    expect(result.windows.map((window) => window.label)).toEqual(["Credits", "Key", "PAYG"]);
    expect(result.windows[0].remainingPercent).toBe(80);
    expect(result.windows[0].resetAt).toBe("2026-12-01T00:00:00.000Z");
    expect(result.windows[0].durationSeconds).toBe(30 * 86_400);
    expect(result.windows[0].used?.value).toBe(200);
    expect(result.windows[0].limit?.value).toBe(1000);
    expect(result.windows[1].used?.value).toBe(10);
    expect(result.windows[1].limit?.value).toBe(100);
    expect(result.windows[2].used?.value).toBe(5);
    expect(result.windows[2].limit?.value).toBe(20);
    expect(result.caps).toHaveLength(0);
  });

  test("tavily keeps PAYG usage without a maximum as a balance and hides key usage", async () => {
    const result = await tavilyAdapter.fetch(
      connection("tavily", { apiKey: "tvly" }),
      context(() => ({
        key: { usage: 10 },
        account: { plan_usage: 200, plan_limit: 1000, paygo_usage: 5 },
      })),
    );
    expect(result.windows).toHaveLength(1);
    expect(result.caps).toHaveLength(0);
    expect(result.balances.find((balance) => balance.id === "key-used")).toBeUndefined();
    expect(result.balances.find((balance) => balance.id === "paygo-used")?.value).toBe(5);
  });

  test("openrouter maps a limited key to a window and an unlimited key to spend", async () => {
    const limited = await openRouterAdapter.fetch(
      connection("openrouter", { apiKey: "sk-or" }),
      context(() => ({ data: { limit: 100, limit_remaining: 40, limit_reset: "monthly" } })),
    );
    expect(limited.windows[0].remainingPercent).toBe(40);
    expect(limited.windows[0].durationSeconds).toBeGreaterThan(0);

    const unlimited = await openRouterAdapter.fetch(
      connection("openrouter", { apiKey: "sk-or" }),
      context(() => ({ data: { limit: null, limit_remaining: null, usage_monthly: 12.5 } })),
    );
    expect(unlimited.windows).toHaveLength(0);
    expect(unlimited.balances[0].value).toBe(12.5);

    const missing = await openRouterAdapter.fetch(
      connection("openrouter", { apiKey: "sk-or" }),
      context(() => ({ data: { limit: 100, limit_remaining: null, limit_reset: "monthly" } })),
    );
    expect(missing.windows[0].error?.message).toBe("Remaining limit unavailable.");
  });

  test("opencode go maps rolling and weekly windows", async () => {
    const result = await openCodeGoAdapter.fetch(
      connection("opencode-go", { apiKey: "oc" }),
      context(() => ({
        usage: {
          rolling: { percent: 10, resetsAt: RESET },
          weekly: { percent: 20, resetsAt: RESET },
        },
      })),
    );
    expect(result.windows).toHaveLength(2);
    expect(result.windows[0].remainingPercent).toBe(90);
    expect(result.windows[1].remainingPercent).toBe(80);
  });

  test("opencode go uses precise Console meters to match the built-in Usage percentages", async () => {
    const requested: string[] = [];
    const result = await openCodeGoAdapter.fetch(
      connection("opencode-go", { apiKey: "oc" }),
      context((url) => {
        requested.push(url);
        if (!url.endsWith("/console/api/go/status")) {
          return { usage: { rolling: { percent: 4, resetsAt: RESET } } };
        }
        return {
          product: "go",
          access: {
            meters: {
              fiveHour: { usedMicroCents: 48, limitMicroCents: 1000, resetsAt: RESET },
              week: { usedMicroCents: 110, limitMicroCents: 1000, resetsAt: RESET },
              month: { usedMicroCents: 130, limitMicroCents: 1000, resetsAt: RESET },
            },
          },
        };
      }),
    );
    expect(requested).toEqual(["https://opencode.ai/console/api/go/status"]);
    expect(result.windows.map(({ id, remainingPercent }) => [id, remainingPercent])).toEqual([
      ["rolling", 95.2],
      ["weekly", 89],
      ["monthly", 87],
    ]);
    const html = renderWindow(result.windows[0], DEFAULT_SELECTION, NOW);
    expect(html).toContain('class="quota-value">95%</span>');
    expect(html).toContain("5h 95% remaining");
    expect(html).toContain("width:95.20%");
  });

  test("opencode go falls back to API-key usage when Console refuses the key", async () => {
    const requested: string[] = [];
    const result = await openCodeGoAdapter.fetch(connection("opencode-go", { apiKey: "oc" }), {
      ...context(() => ({})),
      requestJson: async (url, options) => {
        requested.push(url);
        expect(options?.headers?.Authorization).toBe("Bearer oc");
        if (url.endsWith("/console/api/go/status")) throw new HttpError("auth", "Forbidden", 403);
        return { status: 200, body: { usage: { rolling: { percent: 4, resetsAt: RESET } } } };
      },
    });
    expect(requested).toEqual([
      "https://opencode.ai/console/api/go/status",
      "https://opencode.ai/zen/go/v1/usage",
    ]);
    expect(result.windows[0].remainingPercent).toBe(96);
  });

  test("opencode go honors Console rate limits instead of making a second request", async () => {
    const failure = new HttpError("rate_limited", "Rate limited", 429, RESET);
    const requested: string[] = [];
    await expect(openCodeGoAdapter.fetch(connection("opencode-go", { apiKey: "oc" }), {
      ...context(() => ({})),
      requestJson: async (url) => {
        requested.push(url);
        throw failure;
      },
    })).rejects.toBe(failure);
    expect(requested).toEqual(["https://opencode.ai/console/api/go/status"]);
  });

  test("opencode go keeps a malformed reported window as a window error", async () => {
    const result = await openCodeGoAdapter.fetch(
      connection("opencode-go", { apiKey: "oc" }),
      context(() => ({
        usage: {
          rolling: { percent: 10, resetsAt: null },
          weekly: { percent: 20, resetsAt: RESET },
        },
      })),
    );
    expect(result.windows.find((window) => window.id === "rolling")?.error?.message).toBe(
      "Reset time unavailable.",
    );
    expect(result.windows.find((window) => window.id === "weekly")?.remainingPercent).toBe(80);
  });

  test("codex keeps a malformed reported window as a window error", async () => {
    const result = await codexAdapter.fetch(
      connection("codex", { accessToken: "token", accountId: "acct" }),
      context(() => ({
        rate_limit: {
          primary_window: { used_percent: 20, limit_window_seconds: 18_000, reset_at: null },
          secondary_window: { used_percent: 30, limit_window_seconds: 604_800, reset_at: RESET },
        },
      })),
    );
    expect(result.windows.find((window) => window.label === "5h")?.error?.message).toBe(
      "Reset time unavailable.",
    );
    expect(result.windows.find((window) => window.label === "7d")?.remainingPercent).toBe(70);
  });

  test("custom rejects a non-JSON content type", async () => {
    const adapterContext = context(() => customPayload);
    await expect(
      customAdapter.fetch(connection("custom", { apiKey: "key" }, { endpoint: "https://example.com/quota" }), {
        ...adapterContext,
        requestJson: async () => ({ status: 200, body: customPayload, contentType: "text/html" }),
      }),
    ).rejects.toThrow("application/json");
  });

  test("codex imports the CLI login and maps windows and credits", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "codex-home-"));
    await writeFile(
      path.join(dir, "auth.json"),
      JSON.stringify({ tokens: { access_token: "token", account_id: "acct" } }),
    );
    const result = await codexAdapter.fetch(
      connection("codex"),
      context(
        () => ({
          rate_limit: {
            primary_window: { used_percent: 20, limit_window_seconds: 18_000, reset_at: RESET },
            secondary_window: { used_percent: 30, limit_window_seconds: 604_800, reset_at: RESET },
          },
          credits: { has_credits: true, balance: 3 },
        }),
        dir,
      ),
    );
    expect(result.windows).toHaveLength(2);
    expect(result.windows[0].remainingPercent).toBe(80);
    expect(result.balances[0].value).toBe(3);
  });

  test("codex uses reset_after_seconds and ignores credits the account does not have", async () => {
    const result = await codexAdapter.fetch(
      connection("codex", { accessToken: "token" }),
      context(() => ({
        rate_limit: {
          primary_window: {
            used_percent: 10,
            limit_window_seconds: 18_000,
            reset_after_seconds: 3600,
          },
        },
        credits: { has_credits: false, balance: 0 },
      })),
    );
    expect(result.windows[0].resetAt).toBe(new Date(NOW + 3_600_000).toISOString());
    expect(result.balances).toEqual([]);
  });

  test("codex adds a monthly spend window when no rate-limit month exists", async () => {
    const result = await codexAdapter.fetch(
      connection("codex", { accessToken: "token" }),
      context(() => ({
        rate_limit: {
          primary_window: { used_percent: 10, limit_window_seconds: 18_000, reset_at: RESET },
        },
        spend_control: { individual_limit: { remaining_percent: 40, reset_at: RESET } },
      })),
    );
    expect(result.windows.find((window) => window.id === "spend-monthly")?.remainingPercent).toBe(40);
  });

  test("codex surfaces a rejected login", async () => {
    await expect(
      codexAdapter.fetch(
        connection("codex", { accessToken: "token" }),
        {
          ...context(() => ({})),
          requestJson: async () => {
            throw new HttpError("auth", "rejected");
          },
        },
      ),
    ).rejects.toThrow("Codex login was rejected");
  });

  test("zen surfaces an auth failure", async () => {
    await expect(
      openCodeZenAdapter.fetch(
        connection("opencode-zen", { apiKey: "key" }),
        {
          ...context(() => ({})),
          requestJson: async () => {
            throw new HttpError("auth", "rejected");
          },
        },
      ),
    ).rejects.toThrow("rejected");
  });

  test("zen maps requests and budget caps", async () => {
    const result = await openCodeZenAdapter.fetch(
      connection("opencode-zen", { apiKey: "key" }),
      context((url) => {
        if (url.includes("/usage/models")) return { requests: 12 };
        return [
          {
            serviceAccountId: "svc",
            name: "Main",
            spentMicroCents: 1_000_000_000,
            limitMicroCents: 5_000_000_000,
          },
        ];
      }),
    );
    expect(result.balances[0].value).toBe(12);
    expect(result.caps[0].used).toBe(10);
    expect(result.caps[0].limit).toBe(50);
  });
});
