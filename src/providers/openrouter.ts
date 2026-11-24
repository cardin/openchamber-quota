import type { Adapter } from "./types.ts";
import { asNumber, asRecord, asString } from "./parse.ts";
import { HttpError } from "../service/http.ts";
import type { Balance, QuotaWindow } from "../core/types.ts";

const PERIOD_SECONDS: Record<string, number> = {
  daily: 86_400,
  weekly: 604_800,
};

const calendarPeriod = (period: string, now: number): { resetAt: string; seconds: number } | null => {
  if (period === "daily") {
    const date = new Date(now);
    const next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
    return { resetAt: new Date(next).toISOString(), seconds: PERIOD_SECONDS.daily };
  }
  if (period === "weekly") {
    const date = new Date(now);
    const day = date.getUTCDay();
    const next = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + ((8 - day) % 7 || 7),
    );
    return { resetAt: new Date(next).toISOString(), seconds: PERIOD_SECONDS.weekly };
  }
  if (period === "monthly") {
    const date = new Date(now);
    const first = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
    const previous = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
    return {
      resetAt: new Date(first).toISOString(),
      seconds: Math.round((first - previous) / 1000),
    };
  }
  return null;
};

export const openRouterAdapter: Adapter = {
  kind: "openrouter",
  minIntervalMs: 5 * 60_000,
  fetch: async (connection, context) => {
    const apiKey = connection.secret.apiKey;
    if (!apiKey) throw new HttpError("not_configured", "OpenRouter has no API key.");
    const response = await context.requestJson("https://openrouter.ai/api/v1/key", {
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      timeoutMs: 10_000,
    });
    const body = asRecord(response.body) ?? {};
    const data = asRecord(body.data) ?? body;
    const limit = asNumber(data.limit);
    const remaining = asNumber(data.limit_remaining);
    const usageMonthly = asNumber(data.usage_monthly);
    const resetPeriod = asString(data.limit_reset);

    if (limit !== null && limit > 0) {
      const period = resetPeriod ? calendarPeriod(resetPeriod, context.now()) : null;
      const label = resetPeriod === "daily" ? "1d" : resetPeriod === "weekly" ? "7d" : "30d";
      if (period) {
        if (remaining === null) {
          return {
            windows: [
              {
                id: "limit",
                label,
                resetAt: period.resetAt,
                durationSeconds: period.seconds,
                error: { code: "bad_response", message: "Remaining limit unavailable." },
              },
            ],
            caps: [],
            balances: [],
          };
        }
        return {
          windows: [
            {
              id: "limit",
              label,
              remainingPercent: Math.min(100, Math.max(0, (remaining / limit) * 100)),
              resetAt: period.resetAt,
              durationSeconds: period.seconds,
            },
          ],
          caps: [],
          balances: [],
        };
      }
      if (remaining !== null) {
        return {
          windows: [],
          caps: [
            {
              id: "limit",
              label: "Key limit",
              used: Math.max(0, limit - remaining),
              limit,
              unit: "USD",
            },
          ],
          balances: [],
        };
      }
    }

    const balances: Balance[] = [];
    if (usageMonthly !== null) {
      balances.push({ id: "monthly-spend", label: "Monthly spend", value: usageMonthly, unit: "USD" });
    }
    return { windows: [], caps: [], balances };
  },
};
