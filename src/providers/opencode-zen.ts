import type { Adapter } from "./types.ts";
import { PROVIDER_MIN_INTERVAL_MS } from "../core/bridge.ts";
import { asArray, asNumber, asRecord, asString } from "./parse.ts";
import { HttpError } from "../core/http-error.ts";
import type { Balance, Cap } from "../core/types.ts";

const MICRO_CENTS_PER_DOLLAR = 100_000_000;

const usd = (microCents: number): number => microCents / MICRO_CENTS_PER_DOLLAR;

export const openCodeZenAdapter: Adapter = {
  kind: "opencode-zen",
  minIntervalMs: PROVIDER_MIN_INTERVAL_MS,
  fetch: async (connection, context) => {
    const token = connection.secret.apiKey ?? connection.secret.accessToken;
    if (!token) throw new HttpError("not_configured", "Sign in to OpenCode Zen in OpenCode.");
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "x-opencode-session": "openchamber-quota",
      "User-Agent": "OpenChamber quota display",
    };
    // Zen resolves orgID first (accountId fallback) into secret.accountId.
    const orgId = connection.secret.accountId;
    if (orgId) headers["x-org-id"] = orgId;

    const requestOptions = {
      headers,
      timeoutMs: 10_000,
      deadlineAt: context.deadlineAt,
      signal: context.signal,
    };
    const usage = await context.requestJson(
      "https://opencode.ai/console/api/usage/models?range=30d&page=1&pageSize=50",
      requestOptions,
    );
    const usageBody = asRecord(usage.body) ?? {};
    const requests = asNumber(usageBody.requests);
    const balances: Balance[] = requests !== null && requests >= 0
      ? [{ id: "requests", label: "Requests (30d)", value: requests, unit: "requests" }]
      : [];

    let caps: Cap[] = [];
    try {
      const budgets = await context.requestJson(
        "https://opencode.ai/console/api/budgets/service-accounts/status",
        requestOptions,
      );
      const rows = asArray(budgets.body);
      caps = rows.flatMap((row, index) => {
        const entry = asRecord(row);
        if (!entry) return [];
        const spent = asNumber(entry.spentMicroCents);
        const limit = asNumber(entry.limitMicroCents);
        if (spent === null || limit === null || limit <= 0) return [];
        const name = (asString(entry.name) ?? `Budget ${index + 1}`).slice(0, 40);
        return [{ id: `budget-${index}`, label: name, used: usd(spent), limit: usd(limit), unit: "USD" }];
      });
    } catch (error) {
      if (error instanceof HttpError && error.code === "rate_limited") throw error;
      if (balances.length === 0) throw error;
    }

    if (balances.length === 0 && caps.length === 0) {
      throw new HttpError("bad_response", "OpenCode Zen returned no usable quota data.");
    }
    return { windows: [], caps, balances };
  },
};
