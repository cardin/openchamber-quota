import { describe, expect, test } from "bun:test";
import {
  bridgeNeverReadMessage,
  bridgeUnavailableMessage,
  bridgeWaitingMessage,
  isStaleSample,
  markBridgeUnavailable,
  mergeBridgeResult,
} from "../../src/core/snapshot-merge.ts";
import { bridgeProviderFixture, bridgeProviders } from "../fixtures/bridge.ts";
import { NOW } from "../fixtures/provider.ts";

const emptyState = () => ({ current: {}, lastSuccess: {} });

describe("snapshot merge", () => {
  test("a complete ok cycle updates all six and keeps their sample time", () => {
    const state = mergeBridgeResult(emptyState(), bridgeProviders(), NOW);
    expect(Object.keys(state.current)).toHaveLength(6);
    for (const provider of bridgeProviders()) {
      expect(state.current[provider.connectionId].state).toBe("ok");
      expect(state.current[provider.connectionId].fetchedAt).toBe(provider.fetchedAt);
      expect(state.lastSuccess[provider.connectionId].fetchedAt).toBe(provider.fetchedAt);
    }
  });

  test("a transient error keeps the last sample and its actual fetchedAt", () => {
    const first = mergeBridgeResult(emptyState(), bridgeProviders(), NOW);
    const failing = bridgeProviders();
    failing[0] = {
      ...failing[0],
      state: "error",
      windows: [],
      caps: [],
      balances: [],
      fetchedAt: undefined,
      error: { code: "timeout", message: "The provider did not answer in time." },
    };
    const next = mergeBridgeResult(first, failing, NOW + 60_000);
    const kept = next.current[failing[0].connectionId];
    expect(kept.state).toBe("ok");
    expect(kept.fetchedAt).toBe(new Date(NOW).toISOString());
    expect(kept.windows).toHaveLength(1);
    expect(kept.error?.code).toBe("provider_error");
    expect(kept.error?.message).toContain("did not answer");
    expect(next.lastSuccess[failing[0].connectionId].fetchedAt).toBe(new Date(NOW).toISOString());
  });

  test("a fresh auth failure is shown instead of a stale success", () => {
    const first = mergeBridgeResult(emptyState(), bridgeProviders(), NOW);
    const auth = bridgeProviders();
    auth[3] = bridgeProviderFixture(3, "error");
    const next = mergeBridgeResult(first, auth, NOW + 60_000);
    expect(next.current[auth[3].connectionId].state).toBe("error");
    expect(next.current[auth[3].connectionId].error?.code).toBe("auth");
    expect(next.current[auth[3].connectionId].windows).toHaveLength(0);
  });

  test("a connectivity failure after auth replaces the auth notice without reviving quota", () => {
    const id = bridgeProviders()[3].connectionId;
    const first = mergeBridgeResult(emptyState(), bridgeProviders(), NOW);
    const auth = bridgeProviders();
    auth[3] = bridgeProviderFixture(3, "error");
    const rejected = mergeBridgeResult(first, auth, NOW + 30_000);
    expect(rejected.current[id].error?.code).toBe("auth");

    const timeout = bridgeProviders();
    timeout[3] = {
      ...bridgeProviderFixture(3, "error"),
      error: { code: "timeout", message: "The provider did not answer in time." },
    };
    const next = mergeBridgeResult(rejected, timeout, NOW + 60_000);
    expect(next.current[id].error?.code).toBe("timeout");
    expect(next.current[id].windows).toEqual([]);
    expect(next.lastSuccess[id]).toBeUndefined();
    const down = markBridgeUnavailable(next, NOW + 90_000);
    expect(down.current[id].error?.code).toBe("provider_error");
    expect(down.current[id].windows).toEqual([]);

    const waiting = bridgeProviders();
    waiting[3] = {
      ...bridgeProviderFixture(3, "error"),
      error: { code: "provider_error", message: bridgeWaitingMessage },
    };
    const held = mergeBridgeResult(rejected, waiting, NOW + 60_000);
    expect(held.current[id].error?.code).toBe("auth");
  });

  test("missing credentials are unconfigured, never invented zeros", () => {
    const missing = bridgeProviders();
    missing[2] = bridgeProviderFixture(2, "unconfigured");
    const next = mergeBridgeResult(emptyState(), missing, NOW);
    expect(next.current[missing[2].connectionId].state).toBe("unconfigured");
    expect(next.current[missing[2].connectionId].windows).toEqual([]);
    expect(next.current[missing[2].connectionId].error?.code).toBe("not_configured");
  });

  test("an outage does not revive a signed-out or rejected provider", () => {
    const first = mergeBridgeResult(emptyState(), bridgeProviders(), NOW);
    const next = mergeBridgeResult(first, [
      bridgeProviderFixture(0, "unconfigured"),
      bridgeProviderFixture(1, "error"),
    ], NOW + 30_000);
    const down = markBridgeUnavailable(next, NOW + 40_000);
    expect(down.current["bridge-openrouter"].state).toBe("unconfigured");
    expect(down.current["bridge-opencode-go"].error?.code).toBe("auth");
    expect(down.current["bridge-opencode-zen"].fetchedAt).toBeDefined();
  });

  test("bridge loss keeps a never-read provider as a notice alone", () => {
    const state = markBridgeUnavailable(emptyState(), NOW + 1_000);
    const entry = state.current["bridge-codex"];
    expect(entry.state).toBe("error");
    expect(entry.windows).toEqual([]);
    expect(entry.error?.message).toBe(bridgeNeverReadMessage);
    expect(bridgeNeverReadMessage).toContain("restart OpenCode or OpenChamber");
  });

  test("bridge loss preserves last-success values with an out-of-date notice", () => {
    const first = mergeBridgeResult(emptyState(), bridgeProviders(), NOW);
    const down = markBridgeUnavailable(first, NOW + 60_000);
    for (const provider of bridgeProviders()) {
      expect(down.current[provider.connectionId].state).toBe("ok");
      expect(down.current[provider.connectionId].fetchedAt).toBe(provider.fetchedAt);
      expect(down.current[provider.connectionId].windows).toEqual(provider.windows);
      expect(down.current[provider.connectionId].error?.message).toBe(bridgeUnavailableMessage);
    }
  });

  test("a later fresh success clears the unavailability notice", () => {
    const first = mergeBridgeResult(emptyState(), bridgeProviders(), NOW);
    const down = markBridgeUnavailable(first, NOW + 60_000);
    const fresh = bridgeProviders();
    fresh[0] = { ...fresh[0], fetchedAt: new Date(NOW + 120_000).toISOString() };
    const next = mergeBridgeResult(down, fresh, NOW + 120_000);
    expect(next.current[fresh[0].connectionId].error).toBeUndefined();
    expect(next.current[fresh[0].connectionId].fetchedAt).toBe(fresh[0].fetchedAt);
  });

  test("ten-minute-old samples are historical without being dropped", () => {
    const state = mergeBridgeResult(emptyState(), bridgeProviders(), NOW);
    expect(isStaleSample(state.current["bridge-codex"], NOW + 599_999)).toBe(false);
    expect(isStaleSample(state.current["bridge-codex"], NOW + 600_000)).toBe(true);
  });

  test("service-owned providers are never touched by a bridge cycle", () => {
    const base = {
      current: {
        tavily: {
          connectionId: "tavily",
          kind: "tavily" as const,
          label: "Tavily",
          state: "ok" as const,
          windows: [],
          caps: [],
          balances: [],
          refreshing: false,
        },
      },
      lastSuccess: {},
    };
    const next = mergeBridgeResult(base, bridgeProviders(), NOW);
    expect(next.current.tavily).toBe(base.current.tavily);
  });
});
