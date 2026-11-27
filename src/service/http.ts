import https from "node:https";
import {
  HttpError,
  effectiveTimeout,
  parseRetryAt,
} from "../core/http-error.ts";
import type { HttpOptions, HttpResult } from "../core/http-error.ts";

export { HttpError, parseRetryAt, effectiveTimeout } from "../core/http-error.ts";
export type { HttpOptions, HttpResult } from "../core/http-error.ts";

const requestOnce = (url: string, options: HttpOptions): Promise<HttpResult> =>
  new Promise((resolve, reject) => {
    const target = new URL(url);
    if (target.protocol !== "https:") {
      reject(new HttpError("network", "Only HTTPS endpoints are allowed."));
      return;
    }
    if (options.signal?.aborted) {
      reject(new HttpError("timeout", "The operation was cancelled."));
      return;
    }
    const timeout = effectiveTimeout(options, Date.now());
    if (timeout <= 0) {
      reject(new HttpError("timeout", "The provider did not answer in time."));
      return;
    }

    const request = https.request(
      target,
      {
        method: options.method ?? "GET",
        headers: options.headers,
        timeout,
        signal: options.signal,
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
                "Rate limited.",
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
      else if (options.signal?.aborted) reject(new HttpError("timeout", "The operation was cancelled."));
      else reject(new HttpError("network", "Could not reach the provider."));
    });

    if (options.body) request.write(options.body);
    request.end();
  });

export const requestJson = (url: string, options: HttpOptions = {}): Promise<HttpResult> =>
  requestOnce(url, options);
