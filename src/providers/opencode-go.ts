import type { Adapter } from "./types.ts";
import { asNumber, asRecord, toIso } from "./parse.ts";
import { HttpError } from "../service/http.ts";
import type { QuotaWindow } from "../core/types.ts";

const FIELDS = [
  { key: "rolling", consoleKey: "fiveHour", label: "5h", seconds: 5 * 3600 },
  { key: "weekly", consoleKey: "week", label: "7d", seconds: 7 * 86_400 },
  { key: "monthly", consoleKey: "month", label: "30d", seconds: 30 * 86_400 },
] as const;

const CONSOLE_PRODUCTS = new Set(["go", "go-plus", "go-teams"]);
const remainingPercent = (usedPercent: number): number =>
  Math.min(100, Math.max(0, 100 - usedPercent));

const parseConsoleWindows = (payload: unknown): QuotaWindow[] => {
  const body = asRecord(payload);
  if (typeof body?.product !== "string" || !CONSOLE_PRODUCTS.has(body.product)) return [];
  const meters = asRecord(asRecord(body.access)?.meters);
  const windows: QuotaWindow[] = [];
  for (const field of FIELDS) {
    const entry = asRecord(meters?.[field.consoleKey]);
    const used = asNumber(entry?.usedMicroCents);
    const limit = asNumber(entry?.limitMicroCents);
    const resetAt = toIso(entry?.resetsAt);
    if (used === null || used < 0 || limit === null || limit <= 0 || !resetAt) continue;
    windows.push({
      id: field.key,
      label: field.label,
      remainingPercent: remainingPercent((used / limit) * 100),
      resetAt,
      durationSeconds: field.seconds,
    });
  }
  return windows;
};

export const openCodeGoAdapter: Adapter = {
  kind: "opencode-go",
  minIntervalMs: 5 * 60_000,
  fetch: async (connection, context) => {
    const apiKey = connection.secret.apiKey;
    if (!apiKey) throw new HttpError("not_configured", "OpenCode Go has no API key.");
    const requestOptions = {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-opencode-session": "openchamber-quota",
        "User-Agent": "OpenChamber quota display",
      },
      timeoutMs: 15_000,
    };
    // Prefer Console precision, but the Go API can supply a reset for an inactive 5h meter.
    let consoleWindows: QuotaWindow[] = [];
    try {
      const status = await context.requestJson("https://opencode.ai/console/api/go/status", requestOptions);
      consoleWindows = parseConsoleWindows(status.body);
    } catch (error) {
      if (error instanceof HttpError && error.code === "rate_limited") throw error;
    }
    if (consoleWindows.length === FIELDS.length) {
      return { windows: consoleWindows, caps: [], balances: [] };
    }

    let usage: Record<string, unknown> | null = null;
    try {
      const response = await context.requestJson("https://opencode.ai/zen/go/v1/usage", requestOptions);
      usage = asRecord(asRecord(response.body)?.usage);
    } catch (error) {
      if (!consoleWindows.length || (error instanceof HttpError && error.code === "rate_limited")) {
        throw error;
      }
    }
    const windows: QuotaWindow[] = [];
    for (const field of FIELDS) {
      const consoleWindow = consoleWindows.find((window) => window.id === field.key);
      if (consoleWindow) {
        windows.push(consoleWindow);
        continue;
      }
      const entry = asRecord(usage?.[field.key]);
      if (!entry) continue;
      const used = asNumber(entry.percent);
      const resetAt = toIso(entry.resetsAt);
      if (used === null || !resetAt) {
        windows.push({
          id: field.key,
          label: field.label,
          error: {
            code: "bad_response",
            message: used === null ? "Usage unavailable." : "Reset time unavailable.",
          },
        });
        continue;
      }
      windows.push({
        id: field.key,
        label: field.label,
        remainingPercent: remainingPercent(used),
        resetAt,
        durationSeconds: field.seconds,
      });
    }
    if (!windows.length) throw new HttpError("bad_response", "OpenCode Go returned no usable windows.");
    return { windows, caps: [], balances: [] };
  },
};
