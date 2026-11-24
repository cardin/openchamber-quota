import type { Adapter } from "./types.ts";
import { asNumber, asRecord, toIso } from "./parse.ts";
import { HttpError } from "../service/http.ts";
import type { QuotaWindow } from "../core/types.ts";

const FIELDS = [
  { key: "rolling", label: "5h", seconds: 5 * 3600 },
  { key: "weekly", label: "7d", seconds: 7 * 86_400 },
  { key: "monthly", label: "30d", seconds: 30 * 86_400 },
] as const;

export const openCodeGoAdapter: Adapter = {
  kind: "opencode-go",
  minIntervalMs: 5 * 60_000,
  fetch: async (connection, context) => {
    const apiKey = connection.secret.apiKey;
    if (!apiKey) throw new HttpError("not_configured", "OpenCode Go has no API key.");
    const response = await context.requestJson("https://opencode.ai/zen/go/v1/usage", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-opencode-session": "openchamber-quota",
        "User-Agent": "OpenChamber quota display",
      },
      caBundle: context.caBundle,
      timeoutMs: 15_000,
    });
    const body = asRecord(response.body) ?? {};
    const usage = asRecord(body.usage) ?? {};
    const windows: QuotaWindow[] = [];
    for (const field of FIELDS) {
      const entry = asRecord(usage[field.key]);
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
        remainingPercent: Math.min(100, Math.max(0, 100 - used)),
        resetAt,
        durationSeconds: field.seconds,
      });
    }
    if (!windows.length) throw new HttpError("bad_response", "OpenCode Go returned no usable windows.");
    return { windows, caps: [], balances: [] };
  },
};
