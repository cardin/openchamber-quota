import type { Adapter } from "./types.ts";
import { PROVIDER_MIN_INTERVAL_MS } from "../core/bridge.ts";
import { asNumber, asRecord, toIso } from "./parse.ts";
import { HttpError } from "../core/http-error.ts";
import type { Balance, QuotaWindow } from "../core/types.ts";

const labelFor = (seconds: number | null): string => {
  if (!seconds) return "Limit";
  if (seconds <= 6 * 3600) return "5h";
  if (seconds <= 8 * 86_400) return "7d";
  if (seconds <= 32 * 86_400) return "30d";
  return `${Math.round(seconds / 86_400)}d`;
};

const resetAtFor = (entry: Record<string, unknown>, now: number): string | null => {
  const direct = toIso(entry.reset_at);
  if (direct) return direct;
  const after = asNumber(entry.reset_after_seconds);
  return after !== null && after > 0 ? new Date(now + after * 1000).toISOString() : null;
};

const parseWindow = (value: unknown, index: number, now: number): QuotaWindow | null => {
  const entry = asRecord(value);
  if (!entry) return null;
  const used = asNumber(entry.used_percent);
  const resetAt = resetAtFor(entry, now);
  const seconds = asNumber(entry.limit_window_seconds);
  const window: QuotaWindow = {
    id: `window-${index}`,
    label: labelFor(seconds),
  };
  if (used === null || !resetAt) {
    window.error = {
      code: "bad_response",
      message: used === null ? "Usage unavailable." : "Reset time unavailable.",
    };
    return window;
  }
  window.remainingPercent = Math.min(100, Math.max(0, 100 - used));
  window.resetAt = resetAt;
  if (seconds !== null && seconds > 0) window.durationSeconds = seconds;
  return window;
};

export const codexAdapter: Adapter = {
  kind: "codex",
  minIntervalMs: PROVIDER_MIN_INTERVAL_MS,
  fetch: async (connection, context) => {
    const accessToken = connection.secret.accessToken;
    const accountId = connection.secret.accountId;
    if (!accessToken) {
      throw new HttpError(
        "not_configured",
        "Sign in to OpenAI in OpenCode. API keys cannot read ChatGPT quota.",
      );
    }
    if (!accountId) {
      throw new HttpError(
        "not_configured",
        "OpenAI needs an account id. Sign in to OpenAI in OpenCode, then refresh.",
      );
    }
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "ChatGPT-Account-Id": accountId,
      "User-Agent": "OpenChamber quota display",
    };
    const response = await context.requestJson("https://chatgpt.com/backend-api/wham/usage", {
      headers,
      timeoutMs: 10_000,
      deadlineAt: context.deadlineAt,
      signal: context.signal,
    }).catch((error: unknown) => {
      if (error instanceof HttpError && error.code === "auth") {
        throw new HttpError(
          "auth",
          "OpenAI rejected the sign-in. Sign in again in OpenCode, then refresh.",
        );
      }
      throw error;
    });
    const body = asRecord(response.body) ?? {};
    const rateLimit = asRecord(body.rate_limit) ?? {};
    const now = context.now();
    const windows: QuotaWindow[] = [];
    for (const [index, key] of ["primary_window", "secondary_window"].entries()) {
      const window = parseWindow(rateLimit[key], index, now);
      if (window) windows.push(window);
    }
    const monthlySeconds = 2_628_000;
    const spend = asRecord(body.spend_control);
    const individualLimit = asRecord(spend?.individual_limit);
    const remaining = asNumber(individualLimit?.remaining_percent);
    const spendReset = individualLimit ? resetAtFor(individualLimit, now) : null;
    if (
      !windows.some((window) => window.durationSeconds === monthlySeconds) &&
      remaining !== null &&
      spendReset
    ) {
      windows.push({
        id: "spend-monthly",
        label: "30d",
        remainingPercent: Math.min(100, Math.max(0, remaining)),
        resetAt: spendReset,
        durationSeconds: monthlySeconds,
      });
    }
    const balances: Balance[] = [];
    const credits = asRecord(body.credits);
    const balance = asNumber(credits?.balance);
    if (credits?.has_credits === true && balance !== null) {
      balances.push({ id: "credits", label: "Credits", value: balance, unit: "credits" });
    }
    if (!windows.length && !balances.length) {
      throw new HttpError("bad_response", "Codex returned no usable quota data.");
    }
    return { windows, caps: [], balances };
  },
};
