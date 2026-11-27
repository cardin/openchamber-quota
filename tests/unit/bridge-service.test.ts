import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { BridgeService } from "../../src/service/bridge.ts";
import { CredentialStore } from "../../src/service/credentials.ts";
import { SettingsService } from "../../src/service/settings.ts";
import { Scheduler } from "../../src/service/scheduler.ts";
import { SnapshotService } from "../../src/service/snapshot.ts";
import { handleRequest } from "../../src/service/routes.ts";
import type { RouteDeps, RouteRequest } from "../../src/service/routes.ts";
import { bridgeProviderFixture, bridgeProviders, bridgeSnapshotFixture } from "../fixtures/bridge.ts";
import { NOW } from "../fixtures/provider.ts";

const serverId = "b".repeat(64);

const setup = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "quota-bridge-"));
  let now = NOW;
  const store = new CredentialStore(dir);
  await store.load();
  const settings = new SettingsService(dir);
  await settings.load();
  const bridge = new BridgeService({ serverId, now: () => now });
  const snapshot = new SnapshotService({
    store,
    scheduler: new Scheduler(),
    dataDir: dir,
    now: () => now,
    bridge,
    settings,
  });
  await snapshot.loadCache();
  const deps: RouteDeps = {
    store,
    snapshot,
    settings,
    token: "ui",
    bridgeToken: "bridge-token",
    dataDir: dir,
  };
  return {
    dir,
    deps,
    advance: (ms: number) => {
      now += ms;
    },
    request: (
      method: string,
      route: string,
      body: unknown = undefined,
      token = method === "POST" && route === "/bridge/snapshot" ? "bridge-token" : "ui",
    ): RouteRequest => ({
      method,
      path: route,
      headers: { authorization: `Bearer ${token}` },
      body: body === undefined ? "" : JSON.stringify(body),
    }),
  };
};

describe("bridge service", () => {
  test("two UI refreshes join one admitted request", async () => {
    const { deps, request, dir } = await setup();
    try {
      const first = await handleRequest(deps, request("POST", "/refresh", {}));
      const second = await handleRequest(deps, request("POST", "/refresh", {}));
      expect(first.status).toBe(202);
      expect(second.status).toBe(202);
      const firstBody = first.body as { requestId: string; deadlineAt: number };
      const secondBody = second.body as { requestId: string; deadlineAt: number };
      expect(secondBody.requestId).toBe(firstBody.requestId);
      expect(secondBody.deadlineAt).toBe(firstBody.deadlineAt);
      const state = await handleRequest(deps, request("GET", "/bridge/state", undefined, "bridge-token"));
      expect(state.body).toMatchObject({
        refreshRequested: true,
        requestId: firstBody.requestId,
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("a complete cached result acknowledges the request", async () => {
    const { deps, request, dir } = await setup();
    try {
      const admitted = (await handleRequest(deps, request("POST", "/refresh", {}))).body as {
        requestId: string;
      };
      const cached = bridgeProviders().map((provider) => ({
        ...provider,
        fetchedAt: new Date(NOW - 60_000).toISOString(),
      }));
      const result = await handleRequest(
        deps,
        request(
          "POST",
          "/bridge/snapshot",
          bridgeSnapshotFixture(serverId, admitted.requestId, cached),
        ),
      );
      expect(result.status).toBe(200);
      expect(result.body).toEqual({ accepted: true, requestId: admitted.requestId });
      const state = await handleRequest(deps, request("GET", "/bridge/state", undefined, "bridge-token"));
      expect(state.body).toMatchObject({ refreshRequested: false, requestId: null });
      const snapshot = await handleRequest(deps, request("GET", "/snapshot"));
      const providers = (snapshot.body as { providers: Array<{ connectionId: string; fetchedAt?: string }> })
        .providers;
      expect(providers.find((entry) => entry.connectionId === "bridge-codex")?.fetchedAt).toBe(
        cached[3].fetchedAt,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("missing, duplicate and secret-bearing results are rejected without mutation", async () => {
    const { deps, request, dir } = await setup();
    try {
      const before = await handleRequest(deps, request("GET", "/snapshot"));
      const beforeProviders = (before.body as { providers: Array<Record<string, unknown>> }).providers;
      const admitted = (await handleRequest(deps, request("POST", "/refresh", {}))).body as {
        requestId: string;
      };

      const missing = bridgeSnapshotFixture(serverId, admitted.requestId, bridgeProviders().slice(0, 3));
      expect(
        (await handleRequest(deps, request("POST", "/bridge/snapshot", missing))).status,
      ).toBe(400);

      const duplicated = bridgeProviders();
      duplicated[1] = bridgeProviderFixture(0);
      expect(
        (
          await handleRequest(
            deps,
            request("POST", "/bridge/snapshot", bridgeSnapshotFixture(serverId, admitted.requestId, duplicated)),
          )
        ).status,
      ).toBe(400);

      const forbidden = bridgeProviders() as unknown as Array<Record<string, unknown>>;
      forbidden[0] = { ...forbidden[0], secret: "sentinel-secret" };
      expect(
        (
          await handleRequest(
            deps,
            request("POST", "/bridge/snapshot", bridgeSnapshotFixture(serverId, admitted.requestId, forbidden as never)),
          )
        ).status,
      ).toBe(400);

      const after = await handleRequest(deps, request("GET", "/snapshot"));
      const afterProviders = (after.body as { providers: Array<Record<string, unknown>> }).providers;
      for (const row of bridgeProviders()) {
        const oldEntry = beforeProviders.find((entry) => entry.connectionId === row.connectionId)!;
        const newEntry = afterProviders.find((entry) => entry.connectionId === row.connectionId)!;
        expect({ ...newEntry, refreshing: false }).toEqual({ ...oldEntry, refreshing: false });
      }
      const state = await handleRequest(deps, request("GET", "/bridge/state", undefined, "bridge-token"));
      expect(state.body).toMatchObject({ refreshRequested: true, requestId: admitted.requestId });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("an obsolete request id cannot clear a newer request", async () => {
    const { deps, request, advance, dir } = await setup();
    try {
      const old = (await handleRequest(deps, request("POST", "/refresh", {}))).body as {
        requestId: string;
      };
      advance(13_000);
      const current = (await handleRequest(deps, request("POST", "/refresh", {}))).body as {
        requestId: string;
      };
      expect(current.requestId).not.toBe(old.requestId);

      const late = await handleRequest(
        deps,
        request("POST", "/bridge/snapshot", bridgeSnapshotFixture(serverId, old.requestId)),
      );
      expect(late.status).toBe(409);
      const state = await handleRequest(deps, request("GET", "/bridge/state", undefined, "bridge-token"));
      expect(state.body).toMatchObject({ refreshRequested: true, requestId: current.requestId });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("a late publication also expires the request and marks the last sample historical", async () => {
    const { deps, request, advance, dir } = await setup();
    try {
      await handleRequest(deps, request("POST", "/bridge/snapshot", bridgeSnapshotFixture(serverId)));
      const admitted = await handleRequest(deps, request("POST", "/refresh", {}));
      const { requestId } = admitted.body as { requestId: string };
      advance(13_000);
      const late = await handleRequest(deps, request("POST", "/bridge/snapshot", bridgeSnapshotFixture(serverId, requestId)));
      expect(late.status).toBe(409);
      expect(deps.snapshot.getSnapshot().providers[0].error?.message).toContain("unavailable");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("a timeout keeps the last sample and its fetchedAt", async () => {
    const { deps, request, advance, dir } = await setup();
    try {
      const first = await handleRequest(
        deps,
        request("POST", "/bridge/snapshot", bridgeSnapshotFixture(serverId, null)),
      );
      expect(first.status).toBe(200);
      const before = await handleRequest(deps, request("GET", "/snapshot"));
      const beforeProviders = (before.body as { providers: Array<Record<string, unknown>> }).providers;

      await handleRequest(deps, request("POST", "/refresh", {}));
      advance(13_000);
      const state = await handleRequest(deps, request("GET", "/bridge/state", undefined, "bridge-token"));
      expect(state.body).toMatchObject({ refreshRequested: false, requestId: null });

      const after = await handleRequest(deps, request("GET", "/snapshot"));
      const afterProviders = (after.body as { providers: Array<Record<string, unknown>> }).providers;
      for (const row of bridgeProviders()) {
        const oldEntry = beforeProviders.find((entry) => entry.connectionId === row.connectionId)!;
        const newEntry = afterProviders.find((entry) => entry.connectionId === row.connectionId)!;
        expect(newEntry.fetchedAt).toBe(oldEntry.fetchedAt);
        expect(newEntry.windows).toEqual(oldEntry.windows);
        expect((newEntry.error as { message: string }).message).toContain("unavailable");
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("two UI clients read the same cached snapshot", async () => {
    const { deps, request, dir } = await setup();
    try {
      const accepted = await handleRequest(
        deps,
        request("POST", "/bridge/snapshot", bridgeSnapshotFixture(serverId, null)),
      );
      expect(accepted.status).toBe(200);
      const first = await handleRequest(deps, request("GET", "/snapshot"));
      const second = await handleRequest(deps, request("GET", "/snapshot"));
      expect(second.body).toEqual(first.body);
      const firstProviders = (first.body as { providers: Array<{ connectionId: string; fetchedAt?: string }> })
        .providers;
      const secondProviders = (second.body as { providers: Array<{ connectionId: string; fetchedAt?: string }> })
        .providers;
      expect(secondProviders.find((entry) => entry.connectionId === "bridge-codex")?.fetchedAt).toBe(
        firstProviders.find((entry) => entry.connectionId === "bridge-codex")?.fetchedAt,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("providers are declared exactly six and no /quota route exists", async () => {
    const { deps, request, dir } = await setup();
    try {
      const state = await handleRequest(deps, request("GET", "/bridge/state", undefined, "bridge-token"));
      expect((state.body as { providers: string[] }).providers).toEqual([
        "openrouter",
        "opencode-go",
        "opencode",
        "openai",
        "tavily",
        "exa",
      ]);
      expect((await handleRequest(deps, request("GET", "/quota"))).status).toBe(404);
      expect((await handleRequest(deps, request("GET", "/bridge/quota", undefined, "bridge-token"))).status).toBe(404);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
