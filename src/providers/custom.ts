import type { Adapter, AdapterContext } from "./types.ts";
import { PROVIDER_MIN_INTERVAL_MS } from "../core/bridge.ts";
import { emptyResult } from "./types.ts";
import { asArray, asNumber, asRecord, asString, bad } from "./parse.ts";
import { HttpError } from "../core/http-error.ts";
import type { Balance, Cap, QuotaWindow, StoredConnection } from "../core/types.ts";

const MAX_ITEMS = 20;

const endpointOf = (connection: StoredConnection): URL => {
  if (!connection.endpoint) bad("The custom provider has no endpoint.");
  const parsed = (() => {
    try {
      return new URL(connection.endpoint);
    } catch {
      return null;
    }
  })();
  if (!parsed) bad("The custom endpoint is not a valid URL.");
  if (parsed.protocol !== "https:") bad("The custom endpoint must use HTTPS.");
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    bad("The custom endpoint must not contain credentials, a query, or a fragment.");
  }
  return parsed;
};

const parseWindow = (value: unknown): QuotaWindow => {
  const entry = asRecord(value);
  if (!entry) bad("A custom window is not an object.");
  const id = asString(entry.id);
  const label = asString(entry.label);
  const remaining = asNumber(entry.remainingPercent);
  const resetAt = asString(entry.resetAt);
  const duration = asNumber(entry.durationSeconds);
  if (!id || !label) bad("A custom window needs an id and label.");
  if (remaining === null || remaining < 0 || remaining > 100) bad("remainingPercent must be 0–100.");
  if (!resetAt || !Number.isFinite(Date.parse(resetAt))) bad("A custom window needs a valid resetAt.");
  if (duration !== null && duration <= 0) bad("durationSeconds must be positive.");
  const window: QuotaWindow = {
    id,
    label,
    remainingPercent: remaining,
    resetAt: new Date(resetAt).toISOString(),
  };
  if (duration !== null) window.durationSeconds = duration;
  return window;
};

const parseCap = (value: unknown): Cap => {
  const entry = asRecord(value);
  if (!entry) bad("A custom cap is not an object.");
  const id = asString(entry.id);
  const label = asString(entry.label);
  const used = asNumber(entry.used);
  const limit = asNumber(entry.limit);
  const unit = asString(entry.unit);
  if (!id || !label || !unit) bad("A custom cap needs id, label, and unit.");
  if (used === null || used < 0) bad("A custom cap needs used >= 0.");
  if (limit === null || limit <= 0) bad("A custom cap needs limit > 0.");
  return { id, label, used, limit, unit };
};

const parseBalance = (value: unknown): Balance => {
  const entry = asRecord(value);
  if (!entry) bad("A custom balance is not an object.");
  const id = asString(entry.id);
  const label = asString(entry.label);
  const amount = asNumber(entry.value);
  const unit = asString(entry.unit);
  if (!id || !label || !unit) bad("A custom balance needs id, label, and unit.");
  if (amount === null) bad("A custom balance needs a numeric value.");
  return { id, label, value: amount, unit };
};

const parsePayload = (value: unknown): ReturnType<typeof emptyResult> => {
  const payload = asRecord(value);
  if (!payload || payload.version !== 1) bad("The custom provider must return openchamber-quota-v1.");
  const windows = asArray(payload.windows);
  const caps = asArray(payload.caps);
  const balances = asArray(payload.balances);
  if (windows.length > MAX_ITEMS || caps.length > MAX_ITEMS || balances.length > MAX_ITEMS) {
    bad("The custom provider returned too many items.");
  }
  if (!windows.length && !caps.length && !balances.length) {
    bad("The custom provider returned no windows, caps, or balances.");
  }
  return {
    windows: windows.map(parseWindow),
    caps: caps.map(parseCap),
    balances: balances.map(parseBalance),
  };
};

export const customAdapter: Adapter = {
  kind: "custom",
  minIntervalMs: PROVIDER_MIN_INTERVAL_MS,
  fetch: async (connection, context) => {
    const endpoint = endpointOf(connection);
    const apiKey = connection.secret.apiKey;
    if (!apiKey) throw new HttpError("not_configured", "The custom provider has no key.");
    const response = await context.requestJson(endpoint.toString(), {
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      timeoutMs: 10_000,
      deadlineAt: context.deadlineAt,
      signal: context.signal,
      maxBytes: 65_536,
    });
    if (
      response.contentType &&
      !response.contentType.toLowerCase().includes("application/json")
    ) {
      bad("The custom provider must return application/json.");
    }
    return parsePayload(response.body);
  },
};
