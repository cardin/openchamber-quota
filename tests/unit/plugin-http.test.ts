import { afterEach, describe, expect, test } from "bun:test";
import { requestJson } from "../../src/opencode-plugin/http.ts";
import { HttpError } from "../../src/core/http-error.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const fakeFetch = (handler: (url: URL, init: RequestInit) => Promise<Response>): void => {
  globalThis.fetch = ((url: URL | RequestInfo, init?: RequestInit) =>
    handler(url as URL, init ?? {})) as typeof fetch;
};

describe("plugin HTTP transport", () => {
  test("rejects non-HTTPS URLs before any request", async () => {
    let called = false;
    fakeFetch(async () => {
      called = true;
      return new Response("{}");
    });
    await expect(requestJson("http://example.com/quota")).rejects.toMatchObject({
      code: "network",
    });
    expect(called).toBe(false);
  });

  test("passes no redirect and rejects a redirect response", async () => {
    let redirectMode: RequestRedirect | undefined;
    fakeFetch(async (_url, init) => {
      redirectMode = init.redirect;
      return new Response("moved", { status: 302, headers: { location: "https://elsewhere.example" } });
    });
    await expect(requestJson("https://example.com/quota")).rejects.toMatchObject({
      code: "bad_response",
    });
    expect(redirectMode).toBe("error");
  });

  test("maps authentication and Retry-After responses", async () => {
    fakeFetch(async () => new Response("no", { status: 401 }));
    await expect(requestJson("https://example.com/quota")).rejects.toBeInstanceOf(HttpError);
    await expect(requestJson("https://example.com/quota")).rejects.toMatchObject({ code: "auth" });

    fakeFetch(async () =>
      new Response("slow", { status: 429, headers: { "retry-after": "60" } }),
    );
    const error = await requestJson("https://example.com/quota").catch((cause) => cause);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.code).toBe("rate_limited");
    expect(error.message).toBe("Rate limited.");
    expect(Number.isFinite(Date.parse(error.retryAt))).toBe(true);
  });

  test("honors Retry-After on a temporary 503", async () => {
    fakeFetch(async () =>
      new Response("unavailable", { status: 503, headers: { "retry-after": "120" } }),
    );
    const limited = await requestJson("https://example.com/quota").catch((cause) => cause);
    expect(limited).toBeInstanceOf(HttpError);
    expect(limited).toMatchObject({ code: "rate_limited", status: 503 });
    expect(Number.isFinite(Date.parse(limited.retryAt))).toBe(true);

    fakeFetch(async () => new Response("unavailable", { status: 503 }));
    await expect(requestJson("https://example.com/quota")).rejects.toMatchObject({
      code: "provider_error",
    });
  });

  test("rejects an oversized body and invalid JSON", async () => {
    fakeFetch(async () => new Response("x".repeat(100)));
    await expect(
      requestJson("https://example.com/quota", { maxBytes: 10 }),
    ).rejects.toMatchObject({ code: "bad_response" });

    fakeFetch(async () => new Response("not json"));
    await expect(requestJson("https://example.com/quota")).rejects.toMatchObject({
      code: "bad_response",
    });
  });

  test("aborting a delayed response becomes a timeout", async () => {
    fakeFetch(
      async (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    const controller = new AbortController();
    const pending = requestJson("https://example.com/quota", {
      signal: controller.signal,
      timeoutMs: 5_000,
    });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "timeout" });
  });

  test("a shared deadline shortens the per-call timeout without restarting it", async () => {
    let called = false;
    fakeFetch(
      async (_url, init) => {
        called = true;
        return new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
          setTimeout(() => reject(new Error("late")), 100);
        });
      },
    );
    await expect(
      requestJson("https://example.com/a", { timeoutMs: 10_000, deadlineAt: Date.now() + 20 }),
    ).rejects.toMatchObject({ code: "timeout" });
    expect(called).toBe(true);

    called = false;
    await expect(
      requestJson("https://example.com/a", { timeoutMs: 10_000, deadlineAt: Date.now() - 1 }),
    ).rejects.toMatchObject({ code: "timeout" });
    expect(called).toBe(false);
  });
});
