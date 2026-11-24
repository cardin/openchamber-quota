import type { Adapter } from "./types.ts";
import { asNumber, asRecord } from "./parse.ts";
import { HttpError } from "../service/http.ts";
import type { Balance, QuotaWindow } from "../core/types.ts";

const monthPeriod = (now: number): { resetAt: string; seconds: number } => {
  const date = new Date(now);
  const first = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
  const previous = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
  return {
    resetAt: new Date(first).toISOString(),
    seconds: Math.round((first - previous) / 1000),
  };
};

const monthlyWindow = (
  id: string,
  label: string,
  used: number,
  limit: number,
  unit: string,
  now: number,
): QuotaWindow => {
  const period = monthPeriod(now);
  return {
    id,
    label,
    remainingPercent: Math.min(100, Math.max(0, ((limit - used) / limit) * 100)),
    resetAt: period.resetAt,
    durationSeconds: period.seconds,
    used: { value: used, unit },
    limit: { value: limit, unit },
  };
};

export const tavilyAdapter: Adapter = {
  kind: "tavily",
  minIntervalMs: 10 * 60_000,
  fetch: async (connection, context) => {
    const apiKey = connection.secret.apiKey;
    if (!apiKey) throw new HttpError("not_configured", "Tavily has no API key.");
    const response = await context.requestJson("https://api.tavily.com/usage", {
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      caBundle: context.caBundle,
      timeoutMs: 10_000,
    });
    const body = asRecord(response.body) ?? {};
    const key = asRecord(body.key) ?? {};
    const account = asRecord(body.account) ?? {};
    const windows: QuotaWindow[] = [];
    const balances: Balance[] = [];
    const now = context.now();

    const planLimit = asNumber(account.plan_limit);
    const planUsage = asNumber(account.plan_usage);
    if (planLimit !== null && planLimit > 0 && planUsage !== null && planUsage >= 0) {
      windows.push(monthlyWindow("plan", "Credits", planUsage, planLimit, "credits", now));
    }

    const keyLimit = asNumber(key.limit);
    const keyUsage = asNumber(key.usage);
    if (keyLimit !== null && keyLimit > 0 && keyUsage !== null && keyUsage >= 0) {
      windows.push(monthlyWindow("key", "Key", keyUsage, keyLimit, "credits", now));
    }

    const paygoLimit = asNumber(account.paygo_limit);
    const paygoUsage = asNumber(account.paygo_usage);
    if (paygoLimit !== null && paygoLimit > 0 && paygoUsage !== null && paygoUsage >= 0) {
      windows.push(monthlyWindow("paygo", "PAYG", paygoUsage, paygoLimit, "units", now));
    } else if (paygoUsage !== null) {
      balances.push({ id: "paygo-used", label: "Pay-as-you-go used", value: paygoUsage, unit: "units" });
    }

    return { windows, caps: [], balances };
  },
};
