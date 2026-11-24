import https from "node:https";
import type { QuotaErrorCode } from "../core/types.ts";

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
  body?: string;
  maxBytes?: number;
};

export type HttpResult = { status: number; body: unknown; contentType?: string };

const parseRetryAt = (value: string | string[] | undefined, now: number): string | undefined => {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return new Date(now + seconds * 1000).toISOString();
  const date = Date.parse(raw);
  return Number.isFinite(date) ? new Date(date).toISOString() : undefined;
};

const requestOnce = (
  url: string,
  options: HttpOptions,
  redirects: number,
): Promise<HttpResult> =>
  new Promise((resolve, reject) => {
    const target = new URL(url);
    if (target.protocol !== "https:") {
      reject(new HttpError("network", "Only HTTPS endpoints are allowed."));
      return;
    }

    const request = https.request(
      target,
      {
        method: options.method ?? "GET",
        headers: options.headers,
        timeout: options.timeoutMs ?? 10_000,
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          response.resume();
          reject(new HttpError("bad_response", "The provider redirected the request."));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > (options.maxBytes ?? 65536)) {
            request.destroy();
            reject(new HttpError("bad_response", "The provider response is too large."));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          if (status === 401 || status === 403) {
            reject(new HttpError("auth", "The provider rejected the credential.", status));
            return;
          }
          if (status === 429) {
            reject(
              new HttpError(
                "rate_limited",
                "The provider rate-limited the request.",
                status,
                parseRetryAt(response.headers["retry-after"], Date.now()),
              ),
            );
            return;
          }
          if (status < 200 || status >= 300) {
            reject(new HttpError("provider_error", `The provider returned HTTP ${status}.`, status));
            return;
          }
          const text = Buffer.concat(chunks).toString("utf8");
          try {
            resolve({
              status,
              body: text ? JSON.parse(text) : null,
              contentType: response.headers["content-type"],
            });
          } catch {
            reject(new HttpError("bad_response", "The provider returned invalid JSON.", status));
          }
        });
      },
    );

    request.on("timeout", () => {
      request.destroy();
      reject(new HttpError("timeout", "The provider did not answer in time."));
    });
    request.on("error", (error) => {
      if (error instanceof HttpError) reject(error);
      else reject(new HttpError("network", "Could not reach the provider."));
    });

    if (options.body) request.write(options.body);
    request.end();
  });

export const requestJson = (url: string, options: HttpOptions = {}): Promise<HttpResult> =>
  requestOnce(url, options, 0);
