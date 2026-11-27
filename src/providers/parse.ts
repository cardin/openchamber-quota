import { HttpError } from "../core/http-error.ts";

export const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const asNumber = (value: unknown): number | null => {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
};

export const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export function bad(message: string): never {
  throw new HttpError("bad_response", message);
}

export const toIso = (value: unknown): string | null => {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 10_000_000_000 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  return null;
};

export const minutes = (value: number): number => value * 60_000;
