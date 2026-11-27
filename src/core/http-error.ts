import type { QuotaErrorCode } from "./types.ts";

export class HttpError extends Error {
  readonly code: QuotaErrorCode;
  readonly status?: number;
  readonly retryAt?: string;

  constructor(code: QuotaErrorCode, message: string, status?: number, retryAt?: string) {
    super(message);
    this.name = "HttpError";
    this.code = code;
    this.status = status;
    this.retryAt = retryAt;
  }
}

export type HttpOptions = {
  method?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  deadlineAt?: number;
  signal?: AbortSignal;
  body?: string;
  maxBytes?: number;
};

export type HttpResult = { status: number; body: unknown; contentType?: string };

export const parseRetryAt = (
  value: string | string[] | undefined,
  now: number,
): string | undefined => {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return new Date(now + seconds * 1000).toISOString();
  const date = Date.parse(raw);
  return Number.isFinite(date) ? new Date(date).toISOString() : undefined;
};

/**
 * The effective per-call timeout never exceeds the remaining operation budget.
 * A missing deadline falls back to the caller's own timeout.
 */
export const effectiveTimeout = (
  options: Pick<HttpOptions, "timeoutMs" | "deadlineAt">,
  now: number,
  fallbackMs = 10_000,
): number => {
  const own = options.timeoutMs ?? fallbackMs;
  if (options.deadlineAt === undefined) return own;
  return Math.max(0, Math.min(own, options.deadlineAt - now));
};
