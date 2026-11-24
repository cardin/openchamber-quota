import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Adapter } from "./types.ts";
import { asNumber, asRecord, toIso } from "./parse.ts";
import { HttpError } from "../service/http.ts";
import type { Balance, QuotaWindow } from "../core/types.ts";

const labelFor = (seconds: number | null): string => {
  if (!seconds) return "Limit";
  if (seconds <= 6 * 3600) return "5h";
  if (seconds <= 8 * 86_400) return "7d";
  if (seconds <= 32 * 86_400) return "30d";
  return `${Math.round(seconds / 86_400)}d`;
};

const readCodexLogin = async (codexHome: string): Promise<{ accessToken: string; accountId?: string } | null> => {
  try {
    const raw = JSON.parse(await readFile(path.join(codexHome, "auth.json"), "utf8")) as {
      tokens?: { access_token?: unknown; account_id?: unknown };
    };
    if (typeof raw.tokens?.access_token !== "string" || !raw.tokens.access_token) return null;
    return {
      accessToken: raw.tokens.access_token,
      accountId: typeof raw.tokens.account_id === "string" ? raw.tokens.account_id : undefined,
    };
  } catch {
    return null;
  }
};

const parseWindow = (value: unknown, index: number): QuotaWindow | null => {
  const entry = asRecord(value);
  if (!entry) return null;
  const used = asNumber(entry.used_percent);
  const resetAt = toIso(entry.reset_at);
  const seconds = asNumber(entry.limit_window_seconds);
  const window: QuotaWindow = {
    id: `window-${seconds ?? `unknown-${index}`}`,
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
  minIntervalMs: 5 * 60_000,
  fetch: async (connection, context) => {
    const imported = connection.secret.accessToken
      ? { accessToken: connection.secret.accessToken, accountId: connection.secret.accountId }
      : await readCodexLogin(context.codexHome ?? path.join(os.homedir(), ".codex"));
    if (!imported) throw new HttpError("not_configured", "No OpenAI / Codex login was found. Run `codex login`.");
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${imported.accessToken}`,
    };
    if (imported.accountId) headers["ChatGPT-Account-Id"] = imported.accountId;
    const response = await context.requestJson("https://chatgpt.com/backend-api/wham/usage", {
      headers,
      caBundle: context.caBundle,
      timeoutMs: 15_000,
    }).catch((error: unknown) => {
      if (error instanceof HttpError && error.code === "auth") {
        throw new HttpError("auth", "OpenAI / Codex login was rejected. Run `codex login` and try again.");
      }
      throw error;
    });
    const body = asRecord(response.body) ?? {};
    const rateLimit = asRecord(body.rate_limit) ?? {};
    const windows: QuotaWindow[] = [];
    for (const [index, key] of ["primary_window", "secondary_window"].entries()) {
      const window = parseWindow(rateLimit[key], index);
      if (window) windows.push(window);
    }
    const balances: Balance[] = [];
    const credits = asRecord(body.credits);
    const balance = asNumber(credits?.balance);
    if (balance !== null) {
      balances.push({ id: "credits", label: "Credits", value: balance, unit: "credits" });
    }
    if (!windows.length && !balances.length) {
      throw new HttpError("bad_response", "Codex returned no usable quota data.");
    }
    return { windows, caps: [], balances };
  },
};
