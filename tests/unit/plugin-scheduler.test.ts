import { describe, expect, test } from "bun:test";
import { PluginScheduler } from "../../src/opencode-plugin/scheduler.ts";
import type { PersistedSchedules } from "../../src/opencode-plugin/scheduler.ts";
import { BRIDGE_PROVIDER_IDS } from "../../src/core/bridge.ts";
import type { ProviderSnapshot } from "../../src/core/types.ts";
import { NOW } from "../fixtures/provider.ts";

const entry = (state: "ok" | "error" = "ok", retryAt?: string): ProviderSnapshot => ({
  connectionId: "bridge-openrouter",
  kind: "openrouter",
  label: "OpenRouter",
  state,
  windows: state === "ok"
    ? [{ id: "limit", label: "30d", remainingPercent: 50, resetAt: "2026-11-24T00:00:00Z" }]
    : [],
  caps: [],
  balances: [],
  fetchedAt: state === "ok" ? new Date(NOW).toISOString() : undefined,
  refreshing: false,
  ...(state === "error"
    ? { error: { code: "rate_limited" as const, message: "Rate limited.", ...(retryAt ? { retryAt } : {}) } }
    : {}),
});

describe("plugin scheduler", () => {
  test("concurrent triggers share one in-flight provider fetch", async () => {
    let now = NOW;
    let resolve!: (value: ProviderSnapshot) => void;
    const task = () =>
      new Promise<ProviderSnapshot>((done) => {
        resolve = done;
      });
    const scheduler = new PluginScheduler();
    const first = scheduler.run("openrouter", 300_000, () => now, task);
    const second = scheduler.run("openrouter", 300_000, () => now, task);
    resolve(entry());
    const [a, b] = await Promise.all([first, second]);
    expect(a?.joined).toBe(false);
    expect(b?.joined).toBe(true);
    expect(a?.entry.state).toBe("ok");
    expect(b?.entry.state).toBe("ok");
  });

  test("a second poll within the five-minute minimum reuses the cached outcome", async () => {
    let now = NOW;
    let calls = 0;
    const scheduler = new PluginScheduler();
    const first = await scheduler.run("openrouter", 300_000, () => now, async () => {
      calls += 1;
      return entry();
    });
    now += 1_000;
    const second = await scheduler.run("openrouter", 300_000, () => now, async () => {
      calls += 1;
      return entry();
    });
    expect(first?.fetched).toBe(true);
    expect(second?.fetched).toBe(false);
    expect(second?.entry.fetchedAt).toBe(first?.entry.fetchedAt);
    expect(calls).toBe(1);
  });

  test("manual refresh bypasses the five-minute wait but keeps the 30-second floor", async () => {
    let now = NOW;
    let calls = 0;
    const scheduler = new PluginScheduler();
    await scheduler.run("openrouter", 300_000, () => now, async () => {
      calls += 1;
      return entry();
    });
    now += 10_000;
    const floored = await scheduler.run(
      "openrouter",
      300_000,
      () => now,
      async () => {
        calls += 1;
        return entry();
      },
      { reason: "manual" },
    );
    expect(floored?.fetched).toBe(false);
    expect(calls).toBe(1);

    now += 21_000;
    const manual = await scheduler.run(
      "openrouter",
      300_000,
      () => now,
      async () => {
        calls += 1;
        return entry();
      },
      { reason: "manual" },
    );
    expect(manual?.fetched).toBe(true);
    expect(calls).toBe(2);
  });

  test("manual refresh still honors Retry-After", async () => {
    let now = NOW;
    let calls = 0;
    const scheduler = new PluginScheduler();
    const retryAt = new Date(NOW + 60_000).toISOString();
    await scheduler.run("openrouter", 300_000, () => now, async () => {
      calls += 1;
      return entry("error", retryAt);
    });
    now += 31_000;
    const blocked = await scheduler.run(
      "openrouter",
      300_000,
      () => now,
      async () => {
        calls += 1;
        return entry();
      },
      { reason: "manual" },
    );
    expect(blocked?.fetched).toBe(false);
    expect(blocked?.entry.state).toBe("error");
    expect(calls).toBe(1);

    now = NOW + 61_000;
    const allowed = await scheduler.run(
      "openrouter",
      300_000,
      () => now,
      async () => {
        calls += 1;
        return entry();
      },
      { reason: "manual" },
    );
    expect(allowed?.fetched).toBe(true);
    expect(calls).toBe(2);
  });

  test("repeated failures back off from one minute to fifteen minutes", async () => {
    let now = NOW;
    const scheduler = new PluginScheduler();
    for (let failure = 1; failure <= 5; failure++) {
      now += 1_000;
      await scheduler.run("openrouter", 300_000, () => now, async () => entry("error"));
      const state = scheduler.exportState().providers.openrouter!;
      expect(state.failures).toBe(failure);
      expect(state.nextAllowedAt).toBe(now + Math.max(300_000, Math.min(900_000, 60_000 * 2 ** (failure - 1))));
      now = state.nextAllowedAt;
    }
  });

  test("manual and event triggers honor failure backoff without a Retry-After", async () => {
    const scheduler = new PluginScheduler();
    await scheduler.run("openrouter", 300_000, () => NOW, async () => entry("error"));
    expect(scheduler.eligible("openrouter", NOW + 30_000, "manual")).toBe(false);
    expect(scheduler.eligible("openrouter", NOW + 30_000, "event")).toBe(false);
    expect(scheduler.eligible("openrouter", NOW + 60_000, "manual")).toBe(true);
  });

  test("persists only nonsecret schedule times and restores them", async () => {
    let now = NOW;
    const scheduler = new PluginScheduler();
    await scheduler.run("openai", 300_000, () => now, async () => entry());
    const state = scheduler.exportState();
    expect(state).toEqual({
      version: 1,
      providers: {
        openai: {
          lastAttemptAt: NOW,
          nextAllowedAt: NOW + 300_000,
          retryAt: null,
          failures: 0,
        },
      },
    });
    expect(JSON.stringify(state)).not.toContain("Bearer");
    expect(JSON.stringify(state)).not.toContain("token");

    const restored = new PluginScheduler();
    restored.importState(state);
    now += 1_000;
    const cached = await restored.run("openai", 300_000, () => now, async () => entry());
    expect(cached).toBeNull();
  });

  test("a persisted schedule longer than the current minimum is clamped", async () => {
    let now = NOW;
    const scheduler = new PluginScheduler();
    scheduler.importState({
      version: 1,
      providers: {
        openrouter: {
          lastAttemptAt: NOW,
          nextAllowedAt: NOW + 600_000,
          retryAt: null,
          failures: 0,
        },
      },
    });
    now += 301_000;
    let calls = 0;
    const result = await scheduler.run("openrouter", 300_000, () => now, async () => {
      calls += 1;
      return entry();
    });
    expect(result?.fetched).toBe(true);
    expect(calls).toBe(1);
  });

  test("a far Retry-After is capped at one day", async () => {
    let now = NOW;
    const scheduler = new PluginScheduler();
    const far = new Date(NOW + 48 * 60 * 60_000).toISOString();
    await scheduler.run("openrouter", 300_000, () => now, async () => entry("error", far));
    const state = scheduler.exportState().providers.openrouter!;
    expect(state.retryAt).toBe(NOW + 24 * 60 * 60_000);
  });

  test("no cached outcome and no eligibility returns nothing rather than fetching", async () => {
    let now = NOW;
    const scheduler = new PluginScheduler();
    await scheduler.run("openrouter", 300_000, () => now, async () => entry());
    const fresh = new PluginScheduler();
    fresh.importState(scheduler.exportState());
    now += 1_000;
    expect(await fresh.run("openrouter", 300_000, () => now, async () => entry())).toBeNull();
  });

  test("writes the attempt and Retry-After as each provider settles", async () => {
    let now = NOW;
    let saved: PersistedSchedules | undefined;
    const retryAt = new Date(NOW + 600_000).toISOString();
    const scheduler = new PluginScheduler();
    scheduler.observe(() => { saved = scheduler.exportState(); });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const pending = scheduler.run("openrouter", 300_000, () => now, async () => {
      await gate;
      return entry("error", retryAt);
    });
    await Promise.resolve();
    expect(saved?.providers.openrouter?.lastAttemptAt).toBe(NOW);
    release();
    await pending;
    expect(saved?.providers.openrouter?.retryAt).toBe(NOW + 600_000);

    // A replacement coordinator inside Retry-After cannot fetch again.
    const restored = new PluginScheduler();
    restored.importState(saved);
    now += 31_000;
    let calls = 0;
    const blocked = await restored.run("openrouter", 300_000, () => now, async () => {
      calls += 1;
      return entry();
    }, { reason: "manual" });
    expect(blocked).toBeNull();
    expect(calls).toBe(0);

    now = NOW + 601_000;
    const allowed = await restored.run("openrouter", 300_000, () => now, async () => {
      calls += 1;
      return entry();
    }, { reason: "manual" });
    expect(allowed?.fetched).toBe(true);
    expect(calls).toBe(1);
  });

  test("reports the earliest provider due time for the next autonomous cycle", () => {
    const scheduler = new PluginScheduler();
    const providers = Object.fromEntries(
      BRIDGE_PROVIDER_IDS.map((id) => [
        id,
        id === "openai"
          ? { lastAttemptAt: NOW, nextAllowedAt: NOW + 120_000, retryAt: NOW + 120_000, failures: 1 }
          : { lastAttemptAt: NOW, nextAllowedAt: NOW + 300_000, retryAt: null, failures: 0 },
      ]),
    );
    scheduler.importState({ version: 1, providers });
    expect(scheduler.earliestDue(NOW + 1_000)).toBe(NOW + 120_000);
  });
});
