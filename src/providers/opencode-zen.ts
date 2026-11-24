import type { Adapter } from "./types.ts";
import { asArray, asNumber, asRecord, asString } from "./parse.ts";
import { HttpError } from "../service/http.ts";
import type { Balance, Cap } from "../core/types.ts";

const MICRO_CENTS_PER_DOLLAR = 100_000_000;

const usd = (microCents: number): number => microCents / MICRO_CENTS_PER_DOLLAR;

export const openCodeZenAdapter: Adapter = {
  kind: "opencode-zen",
  minIntervalMs: 5 * 60_000,
  fetch: async (connection, context) => {
    const token = connection.secret.apiKey ?? connection.secret.accessToken;
    if (!token) throw new HttpError("not_configured", "OpenCode Zen has no key or token.");
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "x-opencode-session": "openchamber-quota",
      "User-Agent": "OpenChamber quota display",
    };
    if (connection.accountId) headers["x-org-id"] = connection.accountId;

    const usage = await context.requestJson(
      "https://opencode.ai/console/api/usage/models?range=30d&page=1&pageSize=50",
      { headers, caBundle: context.caBundle, timeoutMs: 15_000 },
    );
    const usageBody = asRecord(usage.body) ?? {};
    const requests = asNumber(usageBody.requests) ?? asArray(usageBody.items).length;
    const balances: Balance[] = [{ id: "requests", label: "Requests (30d)", value: requests, unit: "requests" }];

    let caps: Cap[] = [];
    try {
      const budgets = await context.requestJson(
        "https://opencode.ai/console/api/budgets/service-accounts/status",
        { headers, caBundle: context.caBundle, timeoutMs: 15_000 },
      );
      const rows = asArray(budgets.body);
      caps = rows.flatMap((row, index) => {
        const entry = asRecord(row);
        if (!entry) return [];
        const spent = asNumber(entry.spentMicroCents);
        const limit = asNumber(entry.limitMicroCents);
        if (spent === null || limit === null || limit <= 0) return [];
        const name = (
          asString(entry.name) ??
          asString(entry.serviceAccountId) ??
          `Budget ${index + 1}`
        ).slice(0, 40);
        return [{ id: `budget-${index}`, label: name, used: usd(spent), limit: usd(limit), unit: "USD" }];
      });
    } catch {
      caps = [];
    }

    return { windows: [], caps, balances };
  },
};
