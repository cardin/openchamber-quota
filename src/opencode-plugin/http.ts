import {
  HttpError,
  effectiveTimeout,
  parseRetryAt,
} from "../core/http-error.ts";
import type { HttpOptions, HttpResult } from "../core/http-error.ts";

const DEFAULT_MAX_BYTES = 65_536;

const readBounded = async (
  response: Response,
  maxBytes: number,
): Promise<string> => {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new HttpError("bad_response", "The provider response is too large.");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text;
  } finally {
    reader.releaseLock();
  }
};

/**
 * HTTPS-only, redirect-rejecting fetch transport shared by the six OpenCode-backed
 * adapters. One cycle AbortSignal and deadline cover sequential fallbacks.
 */
export const requestJson = async (
  url: string,
  options: HttpOptions = {},
): Promise<HttpResult> => {
  const target = new URL(url);
  if (target.protocol !== "https:") {
    throw new HttpError("network", "Only HTTPS endpoints are allowed.");
  }
  if (options.signal?.aborted) {
    throw new HttpError("timeout", "The operation was cancelled.");
  }
  const timeout = effectiveTimeout(options, Date.now());
  if (timeout <= 0) {
    throw new HttpError("timeout", "The provider did not answer in time.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const onAbort = (): void => controller.abort();
  options.signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(target, {
      method: options.method ?? "GET",
      headers: options.headers,
      body: options.body,
      redirect: "error",
      signal: controller.signal,
    });
    const status = response.status;
    if (status >= 300 && status < 400) {
      await response.body?.cancel();
      throw new HttpError("bad_response", "The provider redirected the request.");
    }
    if (status === 401 || status === 403) {
      await response.body?.cancel();
      throw new HttpError("auth", "The provider rejected the credential.", status);
    }
    if (status === 429) {
      await response.body?.cancel();
      throw new HttpError(
        "rate_limited",
        "Rate limited.",
        status,
        parseRetryAt(response.headers.get("retry-after") ?? undefined, Date.now()),
      );
    }
    if (status === 503) {
      const retryAt = parseRetryAt(response.headers.get("retry-after") ?? undefined, Date.now());
      if (retryAt) {
        await response.body?.cancel();
        throw new HttpError(
          "rate_limited",
          "The provider is temporarily unavailable.",
          status,
          retryAt,
        );
      }
    }
    if (status < 200 || status >= 300) {
      await response.body?.cancel();
      throw new HttpError("provider_error", `The provider returned HTTP ${status}.`, status);
    }
    const text = await readBounded(response, options.maxBytes ?? DEFAULT_MAX_BYTES);
    if (!text) return { status, body: null, contentType: response.headers.get("content-type") ?? undefined };
    try {
      return {
        status,
        body: JSON.parse(text),
        contentType: response.headers.get("content-type") ?? undefined,
      };
    } catch {
      throw new HttpError("bad_response", "The provider returned invalid JSON.", status);
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (controller.signal.aborted) {
      throw new HttpError("timeout", "The provider did not answer in time.");
    }
    if (error instanceof TypeError && /redirect/i.test(error.message)) {
      throw new HttpError("bad_response", "The provider redirected the request.");
    }
    throw new HttpError("network", "Could not reach the provider.");
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
};
