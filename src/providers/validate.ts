import type { Balance, Cap, QuotaError, QuotaWindow } from "../core/types.ts";
import type { AdapterResult } from "./types.ts";
import { HttpError } from "../service/http.ts";

const MAX_ID = 80;
const MAX_LABEL = 40;
const MAX_UNIT = 16;

const text = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.length >= 1 && value.length <= max;

const amount = (value: { value: unknown; unit: unknown } | undefined): boolean =>
  value === undefined || (Number.isFinite(value.value) && text(value.unit, MAX_UNIT));

const error = (value: QuotaError): boolean =>
  text(value.message, 200) &&
  ["not_configured", "auth", "rate_limited", "timeout", "network", "bad_response", "provider_error"].includes(value.code) &&
  (value.retryAt === undefined || Number.isFinite(Date.parse(value.retryAt)));

const window = (value: QuotaWindow): boolean => {
  if (!text(value.id, MAX_ID) || !text(value.label, MAX_LABEL)) return false;
  if (value.error !== undefined) return error(value.error);
  if (typeof value.remainingPercent !== "number" || !Number.isFinite(value.remainingPercent)) return false;
  if (value.remainingPercent < 0 || value.remainingPercent > 100) return false;
  if (!value.resetAt || !Number.isFinite(Date.parse(value.resetAt))) return false;
  if (
    value.durationSeconds !== undefined &&
    (!Number.isFinite(value.durationSeconds) || value.durationSeconds <= 0)
  ) {
    return false;
  }
  return amount(value.used) && amount(value.limit);
};

const cap = (value: Cap): boolean =>
  text(value.id, MAX_ID) &&
  text(value.label, MAX_LABEL) &&
  Number.isFinite(value.used) &&
  value.used >= 0 &&
  Number.isFinite(value.limit) &&
  value.limit > 0 &&
  text(value.unit, MAX_UNIT);

const balance = (value: Balance): boolean =>
  text(value.id, MAX_ID) &&
  text(value.label, MAX_LABEL) &&
  Number.isFinite(value.value) &&
  text(value.unit, MAX_UNIT);

export const assertAdapterResult = (result: AdapterResult): void => {
  if (
    !Array.isArray(result.windows) ||
    !Array.isArray(result.caps) ||
    !Array.isArray(result.balances) ||
    !result.windows.every(window) ||
    !result.caps.every(cap) ||
    !result.balances.every(balance)
  ) {
    throw new HttpError("bad_response", "The provider returned invalid quota data.");
  }
};
