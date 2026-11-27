import { describe, expect, jest, test } from "bun:test";
import { HostRequestError } from "@openchamber/sdk";
import type { Snapshot } from "../../src/core/types.ts";
import { SnapshotController } from "../../src/section/refresh.ts";

const snapshot: Snapshot = {
  version: 1,
  generatedAt: "2026-11-24T00:00:00Z",
  providers: [],
};

const busySnapshot: Snapshot = {
  ...snapshot,
  providers: [{
    connectionId: "tavily",
    kind: "tavily",
    label: "Tavily",
    state: "loading",
    refreshing: true,
    windows: [],
    caps: [],
    balances: [],
  }],
};

const envelope = {
  version: 1 as const,
  revision: 1,
  selection: {
    saved: false,
    providers: [],
    windows: {},
    hiddenBalances: [],
    cutoffPercent: 10,
    resetTime: "relative" as const,
    quotaDisplay: "remaining" as const,
    encounteredBridgeProviders: [],
    initializedBridgeWindows: [],
    explicitProviderSelections: [],
    explicitWindowSelections: [],
  },
};

describe("snapshot controller", () => {
  test("a stalled read cannot outlive the refresh deadline or render late", async () => {
    jest.useFakeTimers();
    let rendered = 0;
    let release!: (value: { status: number; body: Snapshot }) => void;
    const response = new Promise<{ status: number; body: Snapshot }>((resolve) => { release = resolve; });
    const controller = new SnapshotController(
      async ({ method }) => method === "POST" ? { status: 202, body: {} } : response,
      () => rendered++,
    );
    try {
      const running = controller.refresh();
      await Promise.resolve();
      jest.advanceTimersByTime(15_000);
      await running;
      release({ status: 200, body: snapshot });
      await Promise.resolve();
      expect(rendered).toBe(0);
    } finally {
      controller.stop();
      jest.useRealTimers();
    }
  }, 1_000);

  test("reports package refusal or withdrawal as approval required", async () => {
    const approval: boolean[] = [];
    const controller = new SnapshotController(async () => {
      throw new HostRequestError("NO_SERVICE", "Not granted.");
    }, () => {}, undefined, 5_000, (required) => approval.push(required));
    await controller.start();
    controller.stop();
    expect(approval).toContain(true);
  });

  test("refresh posts then loads the snapshot and shared settings", async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const controller = new SnapshotController(
      async (input) => {
        calls.push({ method: input.method, path: input.path });
        if (input.method === "POST") return { status: 202, body: { accepted: true } };
        if (input.path === "/settings") return { status: 200, body: envelope };
        return { status: 200, body: snapshot };
      },
      () => {},
    );

    await controller.refresh();
    controller.stop();

    expect(calls).toEqual([
      { method: "POST", path: "/refresh" },
      { method: "GET", path: "/snapshot" },
      { method: "GET", path: "/settings" },
    ]);
  });

  test("ignores a refresh while one is already in flight", async () => {
    let posts = 0;
    let release = (): void => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const controller = new SnapshotController(
      async (input) => {
        if (input.method === "POST") {
          posts += 1;
          await gate;
          return { status: 202, body: { accepted: true } };
        }
        if (input.path === "/settings") return { status: 200, body: envelope };
        return { status: 200, body: snapshot };
      },
      () => {},
    );

    const first = controller.refresh();
    await Promise.resolve();
    await controller.refresh();
    expect(posts).toBe(1);
    release();
    await first;
    controller.stop();
  });

  test("start registers one set of intervals, and stop clears them before a restart", async () => {
    jest.useFakeTimers();
    let posts = 0;
    const controller = new SnapshotController(async ({ method, path }) => {
      if (method === "POST") {
        posts++;
        return { status: 202, body: {} };
      }
      if (path === "/settings") return { status: 200, body: envelope };
      return { status: 200, body: snapshot };
    }, () => {});
    try {
      controller.start();
      controller.start();
      expect(jest.getTimerCount()).toBe(3);
      expect(posts).toBe(1);
      await Promise.resolve();
      controller.stop();
      expect(jest.getTimerCount()).toBe(0);
      jest.advanceTimersByTime(6 * 60_000);
      expect(posts).toBe(1);

      controller.start();
      expect(jest.getTimerCount()).toBe(3);
      expect(posts).toBe(2);
    } finally {
      controller.stop();
      jest.useRealTimers();
    }
  });

  test("stop cancels the polling delay of a refresh already in progress", async () => {
    jest.useFakeTimers();
    const controller = new SnapshotController(async ({ method, path }) => {
      if (method === "POST") return { status: 202, body: {} };
      if (path === "/settings") return { status: 200, body: envelope };
      return { status: 200, body: busySnapshot };
    }, () => {});
    try {
      const refresh = controller.refresh();
      for (let i = 0; i < 12; i++) await Promise.resolve();
      expect(jest.getTimerCount()).toBe(2);

      controller.stop();
      expect(jest.getTimerCount()).toBe(0);
      await refresh;
      jest.advanceTimersByTime(60_000);
    } finally {
      controller.stop();
      jest.useRealTimers();
    }
  });

  test("a snapshot that resolves after stop cannot render or schedule a poll", async () => {
    jest.useFakeTimers();
    let rendered = 0;
    let release!: (value: { status: number; body: Snapshot }) => void;
    const response = new Promise<{ status: number; body: Snapshot }>((resolve) => {
      release = resolve;
    });
    const controller = new SnapshotController(
      async ({ method, path }) => {
        if (method === "GET" && path === "/settings") return { status: 200, body: envelope };
        return method === "GET" ? response : { status: 202, body: {} };
      },
      () => rendered++,
    );
    try {
      const refresh = controller.refresh();
      await Promise.resolve();
      controller.stop();
      release({ status: 200, body: busySnapshot });
      // Drain the response and polling continuations before asserting.
      for (let i = 0; i < 8; i++) await Promise.resolve();
      expect(rendered).toBe(0);
      expect(jest.getTimerCount()).toBe(0);
      await refresh;
    } finally {
      controller.stop();
      jest.useRealTimers();
    }
  });
});
