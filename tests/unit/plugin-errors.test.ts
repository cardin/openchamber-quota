import { describe, expect, test } from "bun:test";
import { HttpError } from "../../src/core/http-error.ts";
import { errorEntry, fetchProvider, toProviderError } from "../../src/opencode-plugin/fetch.ts";
import { BRIDGE_ROWS } from "../../src/core/bridge.ts";
import type { CredentialOutcome } from "../../src/opencode-plugin/credentials.ts";
import { NOW } from "../fixtures/provider.ts";

const row = BRIDGE_ROWS.get("openai")!;

const okOutcome = (): CredentialOutcome => ({
  ok: true,
  credentialType: "oauth",
  connection: {
    id: row.connectionId,
    kind: row.kind,
    label: row.label,
    createdAt: new Date(NOW).toISOString(),
    secret: { accessToken: "token", accountId: "acct" },
  },
});

describe("plugin error outcomes", () => {
  test("keeps auth, network, timeout and rate-limit distinctions", () => {
    expect(toProviderError(new HttpError("auth", "rejected"))).toMatchObject({ code: "auth" });
    expect(toProviderError(new HttpError("network", "offline"))).toMatchObject({ code: "network" });
    expect(toProviderError(new HttpError("timeout", "slow"))).toMatchObject({ code: "timeout" });
    const limited = toProviderError(
      new HttpError("rate_limited", "slow down", 429, "2026-11-23T12:05:00Z"),
    );
    expect(limited).toMatchObject({
      code: "rate_limited",
      retryAt: "2026-11-23T12:05:00Z",
    });
  });

  test("sanitizes credential-shaped error text", () => {
    const error = toProviderError(
      new HttpError("bad_response", "Bearer sentinel-token-1234567890 sk-live-abcdef123456"),
    );
    expect(error.message).not.toContain("sentinel-token");
    expect(error.message).not.toContain("sk-live");
    expect(error.message).toContain("[redacted]");
  });

  test("an error entry has no windows, caps or balances", () => {
    const entry = errorEntry(row, { code: "auth", message: "Sign in again." });
    expect(entry).toMatchObject({
      state: "error",
      windows: [],
      caps: [],
      balances: [],
      refreshing: false,
      error: { code: "auth", message: "Sign in again." },
    });
  });

  test("a provider fetch that is already aborted returns timeout without calling upstream", async () => {
    let called = false;
    const controller = new AbortController();
    controller.abort();
    const entry = await fetchProvider(row, okOutcome(), {
      now: () => NOW,
      requestJson: async () => {
        called = true;
        return { status: 200, body: {} };
      },
      dataDir: "",
      signal: controller.signal,
    });
    expect(called).toBe(false);
    expect(entry.state).toBe("error");
    expect(entry.error?.code).toBe("timeout");
  });

  test("a later success clears the error outcome for that provider", async () => {
    const failed = await fetchProvider(row, okOutcome(), {
      now: () => NOW,
      requestJson: async () => {
        throw new HttpError("auth", "rejected");
      },
      dataDir: "",
    });
    expect(failed.state).toBe("error");
    const recovered = await fetchProvider(row, okOutcome(), {
      now: () => NOW,
      requestJson: async () => ({
        status: 200,
        body: {
          rate_limit: {
            primary_window: { used_percent: 10, limit_window_seconds: 18_000, reset_at: "2026-11-24T00:00:00Z" },
          },
        },
      }),
      dataDir: "",
    });
    expect(recovered.state).toBe("ok");
    expect(recovered.error).toBeUndefined();
    expect(recovered.windows).toHaveLength(1);
  });
});
