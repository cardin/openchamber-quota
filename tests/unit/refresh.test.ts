import { describe, expect, jest, test } from "bun:test";
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

describe("snapshot controller", () => {
  test("refresh posts then loads the snapshot", async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const controller = new SnapshotController(
      async (input) => {
        calls.push({ method: input.method, path: input.path });
        return input.method === "POST"
          ? { status: 202, body: { accepted: true } }
          : { status: 200, body: snapshot };
      },
      () => {},
      60_000,
      60_000,
    );

    await controller.refresh();
    controller.stop();

    expect(calls).toEqual([
      { method: "POST", path: "/refresh" },
      { method: "GET", path: "/snapshot" },
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
        return { status: 200, body: snapshot };
      },
      () => {},
      60_000,
      60_000,
    );

    const first = controller.refresh();
    await Promise.resolve();
    await controller.refresh();
    expect(posts).toBe(1);
    release();
    await first;
    controller.stop();
  });

  test("start registers one set of intervals, and stop clears both before a restart", async () => {
    jest.useFakeTimers();
    let posts = 0;
    let gets = 0;
    const controller = new SnapshotController(async ({ method }) => {
      if (method === "POST") {
        posts++;
        return { status: 202, body: {} };
      }
      gets++;
      return { status: 200, body: snapshot };
    }, () => {});
    try {
      controller.start();
      controller.start();
      expect(jest.getTimerCount()).toBe(2);
      expect(posts).toBe(1);
      await Promise.resolve();
      jest.advanceTimersByTime(5_000);
      expect(gets).toBe(3);
      controller.stop();
      expect(jest.getTimerCount()).toBe(0);
      jest.advanceTimersByTime(120_000);
      expect(posts).toBe(1);
      expect(gets).toBe(3);

      controller.start();
      expect(jest.getTimerCount()).toBe(2);
      expect(posts).toBe(2);
    } finally {
      controller.stop();
      jest.useRealTimers();
    }
  });

  test("stop cancels the polling delay of a refresh already in progress", async () => {
    jest.useFakeTimers();
    let gets = 0;
    const controller = new SnapshotController(async ({ method }) => {
      if (method === "POST") return { status: 202, body: {} };
      gets++;
      return { status: 200, body: busySnapshot };
    }, () => {});
    try {
      const refresh = controller.refresh();
      await Promise.resolve(); // POST has resolved.
      await Promise.resolve(); // First snapshot has resolved.
      await Promise.resolve(); // The busy response scheduled the polling delay.
      expect(jest.getTimerCount()).toBe(1);

      controller.stop();
      expect(jest.getTimerCount()).toBe(0);
      await refresh;
      jest.advanceTimersByTime(60_000);
      expect(gets).toBe(1);
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
      async ({ method }) => method === "GET" ? response : { status: 202, body: {} },
      () => rendered++,
    );
    try {
      const refresh = controller.refresh();
      await Promise.resolve();
      controller.stop();
      release({ status: 200, body: busySnapshot });
      // Drain the response and polling continuations before asserting.
      for (let i = 0; i < 5; i++) await Promise.resolve();
      expect(rendered).toBe(0);
      expect(jest.getTimerCount()).toBe(0);
      await refresh;
    } finally {
      controller.stop();
      jest.useRealTimers();
    }
  });
});
