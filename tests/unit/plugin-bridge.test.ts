import { describe, expect, jest, test } from "bun:test";
import { BridgeLoop } from "../../src/opencode-plugin/index.ts";
import type { CredentialOutcome } from "../../src/opencode-plugin/credentials.ts";
import { PluginScheduler } from "../../src/opencode-plugin/scheduler.ts";
import { BRIDGE_PROVIDERS } from "../../src/core/bridge.ts";
import type { BridgeDescriptor, BridgeState } from "../../src/core/types.ts";
import { NOW, RESET } from "../fixtures/provider.ts";

const serverId = "e".repeat(64);
const descriptor: BridgeDescriptor = {
  version: 1,
  serverId,
  port: 9,
  token: "f".repeat(64),
  providers: ["openrouter", "opencode-go", "opencode", "openai", "tavily", "exa"],
  createdAt: new Date(NOW).toISOString(),
};

const state = (requestId: string | null = null): BridgeState => ({
  version: 1,
  serverId,
  providers: ["openrouter", "opencode-go", "opencode", "openai", "tavily", "exa"],
  refreshRequested: requestId !== null,
  requestId,
  deadlineAt: requestId ? NOW + 12_000 : null,
  providerMinimums: {
    openrouter: 300_000,
    "opencode-go": 300_000,
    opencode: 300_000,
    openai: 300_000,
    tavily: 300_000,
    exa: 300_000,
  },
  serverTime: NOW,
});

const outcomes = (id: string): CredentialOutcome => {
  const row = BRIDGE_PROVIDERS.find((entry) => entry.id === id)!;
  return {
    ok: true,
    credentialType: row.kind === "codex" || row.kind === "opencode-zen" ? "oauth" : "api",
    connection: {
      id: row.connectionId,
      kind: row.kind,
      label: row.label,
      createdAt: new Date(NOW).toISOString(),
      secret:
        row.kind === "codex" || row.kind === "opencode-zen"
          ? { accessToken: "token", ...(row.kind === "codex" ? { accountId: "acct" } : {}) }
          : { apiKey: "key" },
    },
  };
};

const payloadFor = (url: string): unknown => {
  if (url.includes("openrouter")) {
    return { data: { limit: 100, limit_remaining: 40, limit_reset: "monthly" } };
  }
  if (url.includes("/console/api/go/status")) {
    return {
      product: "go",
      access: {
        meters: {
          fiveHour: { usedMicroCents: 10, limitMicroCents: 100, resetsAt: RESET },
          week: { usedMicroCents: 20, limitMicroCents: 100, resetsAt: RESET },
          month: { usedMicroCents: 30, limitMicroCents: 100, resetsAt: RESET },
        },
      },
    };
  }
  if (url.includes("/usage/models")) return { requests: 12 };
  if (url.includes("/budgets/")) return [];
  if (url.includes("api.tavily.com")) {
    return { account: { plan_usage: 20, plan_limit: 100 } };
  }
  if (url.includes("admin-api.exa.ai")) {
    return { credits_usd: 42.5, expiring_credits: [] };
  }
  return {
    rate_limit: {
      primary_window: { used_percent: 20, limit_window_seconds: 18_000, reset_at: RESET },
    },
  };
};

const setup = (
  lookup: (id: string) => Promise<CredentialOutcome> = async (id) => outcomes(id),
  ownsLock?: () => Promise<boolean>,
) => {
  let now = NOW;
  let currentState = state();
  const posts: Array<{ requestId: string | null; providers: unknown[] }> = [];
  const fetches: string[] = [];
  let gate: Promise<void> | null = null;
  let discoverCalls = 0;
  let credentialCalls = 0;
  let missing = false;
  const scheduler = new PluginScheduler();
  const loop = new BridgeLoop({
    now: () => now,
    discover: async () => {
      discoverCalls += 1;
      return missing
        ? { kind: "missing" as const }
        : { kind: "bound" as const, descriptor, state: currentState };
    },
    fetchState: async () => currentState,
    post: async (_descriptor, snapshot) => {
      posts.push({
        requestId: snapshot.requestId,
        providers: snapshot.providers,
      });
      return "accepted";
    },
    credentials: async (id) => {
      credentialCalls += 1;
      return lookup(id);
    },
    transport: async (url) => {
      fetches.push(url);
      if (gate) await gate;
      return { status: 200, body: payloadFor(url) };
    },
    loadSchedules: async () => undefined,
    saveSchedules: async () => undefined,
    scheduler,
    ownsLock,
    pollMs: 1_000,
    intervalMs: 300_000,
  });
  return {
    loop,
    posts,
    fetches,
    scheduler,
    advance: (ms: number) => {
      now += ms;
    },
    discoverCount: () => discoverCalls,
    credentialCount: () => credentialCalls,
    setState: (next: BridgeState) => {
      currentState = next;
    },
    setMissing: (next: boolean) => {
      missing = next;
    },
    setGate: (next: Promise<void> | null) => {
      gate = next;
    },
  };
};

describe("plugin bridge loop", () => {
  test("a hung credential lookup times out and does not hold the next cycle", async () => {
    jest.useFakeTimers();
    const { loop, posts, advance } = setup(async () => new Promise<CredentialOutcome>(() => {}));
    try {
      const first = loop.trigger("first", descriptor, state("first"));
      advance(10_000);
      jest.advanceTimersByTime(10_000);
      const result = await first;
      expect(result?.providers).toHaveLength(6);
      expect(result?.providers.every((entry) => entry.error?.code === "timeout")).toBe(true);
      const second = await loop.trigger("second", descriptor, state("second"));
      expect(second?.providers).toHaveLength(6);
      expect(posts.map((post) => post.requestId)).toEqual(["first", "second"]);
    } finally {
      loop.stop();
      jest.useRealTimers();
    }
  }, 1_000);

  test("first bind starts an autonomous cycle even with no pending request", async () => {
    const { loop, credentialCount } = setup();
    await loop.tick();
    expect(credentialCount()).toBe(6);
    await loop.trigger(null);
  });

  test("a displaced coordinator cannot finish publishing or start another cycle", async () => {
    let owns = true;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const { loop, credentialCount, posts } = setup(async (id) => {
      await gate;
      return outcomes(id);
    }, async () => owns);
    const pending = loop.trigger("first", descriptor, state("first"));
    await Promise.resolve();
    await Promise.resolve();
    expect(credentialCount()).toBe(6);
    owns = false;
    await loop.tick();
    expect(await pending).toBeNull();
    release();
    expect(await loop.trigger("second", descriptor, state("second"))).toBeNull();
    expect(posts).toHaveLength(0);
  });

  test("a manual request produces one complete six-entry result and no secrets", async () => {
    const { loop, posts, fetches } = setup();
    const result = await loop.trigger("req-1", descriptor, state("req-1"));
    expect(result?.providers).toHaveLength(6);
    expect(result?.fetched).toHaveLength(6);
    expect(posts).toHaveLength(1);
    expect(posts[0].requestId).toBe("req-1");
    expect(fetches).toHaveLength(7);
    const text = JSON.stringify(posts[0]);
    expect(text).not.toContain('"secret"');
    expect(text).not.toContain("Bearer");
    expect(text).not.toContain('"key"');
    expect(posts[0].providers.every((provider: unknown) => (provider as { state: string }).state === "ok")).toBe(true);
  });

  test("a second trigger inside the minimum acknowledges with cached entries", async () => {
    const { loop, posts, fetches, advance, credentialCount } = setup();
    await loop.trigger("req-1", descriptor, state("req-1"));
    expect(credentialCount()).toBe(6);
    advance(1_000);
    await loop.trigger("req-2", descriptor, state("req-2"));
    expect(fetches).toHaveLength(7);
    expect(credentialCount()).toBe(6);
    expect(posts).toHaveLength(2);
    expect(posts[1].requestId).toBe("req-2");
    expect(posts[1].providers).toHaveLength(6);
    const first = posts[0].providers[0] as { fetchedAt?: string };
    const second = posts[1].providers[0] as { fetchedAt?: string };
    expect(second.fetchedAt).toBe(first.fetchedAt);
  });

  test("a timer and a manual trigger share one provider cycle", async () => {
    const { loop, posts, fetches } = setup();
    const manual = loop.trigger("req-1", descriptor, state("req-1"));
    const timer = loop.trigger(null, descriptor, state());
    await Promise.all([manual, timer]);
    expect(fetches).toHaveLength(7);
    expect(posts).toHaveLength(2);
    expect(posts.map((post) => post.requestId).sort()).toEqual([null, "req-1"]);
  });

  test("discovery keeps polling while provider work is still running", async () => {
    const { loop, setState, setGate, discoverCount, posts, advance } = setup();
    let release!: () => void;
    setGate(new Promise<void>((resolve) => {
      release = resolve;
    }));
    setState(state("req-9"));
    await loop.tick();
    const afterFirst = discoverCount();
    advance(1_000);
    await loop.tick();
    expect(discoverCount()).toBeGreaterThan(afterFirst);
    release();
    const deadline = Date.now() + 2_000;
    while (posts.length === 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(posts.map((post) => post.requestId)).toContain("req-9");
  });

  test("starts a new cycle after the bridge reappears", async () => {
    const { loop, advance, setMissing, credentialCount } = setup();
    await loop.tick();
    await loop.trigger(null);
    const before = credentialCount();
    setMissing(true);
    advance(2_000);
    await loop.tick();
    expect(loop.boundServerId()).toBeNull();
    setMissing(false);
    advance(5_000);
    await loop.tick();
    await loop.trigger(null);
    expect(loop.boundServerId()).toBe(serverId);
    expect(credentialCount()).toBeGreaterThan(before);
  });

  test("schedules the next cycle from the provider due time, not from bind", async () => {
    const { loop, advance } = setup();
    await loop.tick();
    await loop.trigger(null);
    const spy = jest.spyOn(globalThis, "setTimeout");
    try {
      advance(4_000);
      await loop.trigger(null);
      const delays = spy.mock.calls
        .map((call) => call[1])
        .filter((delay): delay is number => typeof delay === "number");
      expect(delays).toContain(296_000);
    } finally {
      spy.mockRestore();
      loop.stop();
    }
  });

  test("teardown clears timers and can start again", () => {
    jest.useFakeTimers();
    const { loop } = setup();
    try {
      loop.start();
      expect(jest.getTimerCount()).toBe(1);
      loop.stop();
      expect(jest.getTimerCount()).toBe(0);
      loop.start();
      expect(jest.getTimerCount()).toBe(1);
      loop.stop();
    } finally {
      jest.useRealTimers();
    }
  });
});
