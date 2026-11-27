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
import { bridgeProviders, bridgeSnapshotFixture } from "../fixtures/bridge.ts";
import { NOW } from "../fixtures/provider.ts";

const serverId = "c".repeat(64);

const setup = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "quota-contract-"));
  const store = new CredentialStore(dir);
  await store.load();
  const settings = new SettingsService(dir);
  await settings.load();
  const bridge = new BridgeService({ serverId, now: () => NOW });
  const snapshot = new SnapshotService({
    store,
    scheduler: new Scheduler(),
    dataDir: dir,
    now: () => NOW,
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
  const request = (method: string, route: string, body?: unknown, token = "ui"): RouteRequest => ({
    method,
    path: route,
    headers: { authorization: `Bearer ${token}` },
    body: body === undefined ? "" : JSON.stringify(body),
  });
  return { deps, request, dir, settings };
};

describe("plugin bridge contract", () => {
  test("UI and bridge tokens authenticate only their own route group", async () => {
    const { deps, request, dir } = await setup();
    try {
      expect((await handleRequest(deps, request("GET", "/bridge/state"))).status).toBe(401);
      expect(
        (await handleRequest(deps, request("GET", "/bridge/state", undefined, "wrong"))).status,
      ).toBe(401);
      expect(
        (await handleRequest(deps, request("GET", "/snapshot", undefined, "bridge-token"))).status,
      ).toBe(401);
      expect(
        (await handleRequest(deps, request("GET", "/settings", undefined, "bridge-token"))).status,
      ).toBe(401);
      expect(
        (await handleRequest(deps, request("POST", "/bridge/snapshot", {}, "ui"))).status,
      ).toBe(401);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("wrong server, undeclared provider, duplicate and loading entries are rejected", async () => {
    const { deps, request, dir } = await setup();
    try {
      const admitted = (await handleRequest(deps, request("POST", "/refresh", {}))).body as {
        requestId: string;
      };
      const wrongServer = bridgeSnapshotFixture("d".repeat(64), admitted.requestId);
      expect(
        (await handleRequest(deps, request("POST", "/bridge/snapshot", wrongServer, "bridge-token"))).status,
      ).toBe(400);

      const undeclared = bridgeProviders();
      undeclared[0] = { ...undeclared[0], kind: "tavily" };
      expect(
        (
          await handleRequest(
            deps,
            request(
              "POST",
              "/bridge/snapshot",
              bridgeSnapshotFixture(serverId, admitted.requestId, undeclared),
              "bridge-token",
            ),
          )
        ).status,
      ).toBe(400);

      const duplicate = bridgeProviders();
      duplicate[2] = { ...duplicate[1] };
      expect(
        (
          await handleRequest(
            deps,
            request(
              "POST",
              "/bridge/snapshot",
              bridgeSnapshotFixture(serverId, admitted.requestId, duplicate),
              "bridge-token",
            ),
          )
        ).status,
      ).toBe(400);

      const loading = bridgeProviders();
      loading[0] = { ...loading[0], state: "loading", refreshing: true };
      expect(
        (
          await handleRequest(
            deps,
            request(
              "POST",
              "/bridge/snapshot",
              bridgeSnapshotFixture(serverId, admitted.requestId, loading),
              "bridge-token",
            ),
          )
        ).status,
      ).toBe(400);

      expect(
        (
          await handleRequest(
            deps,
            request("POST", "/bridge/snapshot", bridgeSnapshotFixture(serverId, admitted.requestId), "bridge-token"),
          )
        ).status,
      ).toBe(200);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("rejects extra envelope fields and pending entries without acknowledging a request", async () => {
    const bridge = new BridgeService({ serverId, now: () => NOW });
    const { requestId } = bridge.admit();
    const valid = bridgeSnapshotFixture(serverId, requestId);
    expect(bridge.accept({ ...valid, extra: "ignored" }).ok).toBe(false);
    const providers = valid.providers.map((entry) => ({ ...entry, refreshing: true }));
    expect(bridge.accept({ ...valid, providers }).ok).toBe(false);
    expect(bridge.pending()).toBe(true);
    expect(bridge.accept(valid).ok).toBe(true);
  });

  test("an older solicited result cannot replace a newer autonomous publication", () => {
    const bridge = new BridgeService({ serverId, now: () => NOW });
    const { requestId } = bridge.admit();
    const old = bridgeSnapshotFixture(serverId, requestId);
    const newer = { ...old, requestId: null, generatedAt: new Date(NOW + 6_000).toISOString() };
    expect(bridge.accept(newer).ok).toBe(true);
    expect(bridge.accept(old)).toMatchObject({ ok: false, status: 409 });
    expect(bridge.pending()).toBe(true);
  });

  test("a valid merged bridge result appears in the canonical snapshot", async () => {
    const { deps, request, dir } = await setup();
    try {
      const admitted = (await handleRequest(deps, request("POST", "/refresh", {}))).body as {
        requestId: string;
      };
      const payload = bridgeSnapshotFixture(serverId, admitted.requestId);
      expect(
        (await handleRequest(deps, request("POST", "/bridge/snapshot", payload, "bridge-token"))).status,
      ).toBe(200);
      const snapshot = await handleRequest(deps, request("GET", "/snapshot"));
      expect(snapshot.status).toBe(200);
      const providers = (snapshot.body as { providers: Array<{ connectionId: string; state: string }> })
        .providers;
      for (const row of bridgeProviders()) {
        expect(providers.find((entry) => entry.connectionId === row.connectionId)?.state).toBe("ok");
      }
      expect(providers).toHaveLength(6);

      const settings = await handleRequest(deps, request("GET", "/settings"));
      expect(settings.status).toBe(200);
      expect((settings.body as { revision: number }).revision).toBeGreaterThan(0);
      expect(
        (settings.body as { selection: { initializedBridgeWindows: string[] } }).selection
          .initializedBridgeWindows,
      ).toContain("bridge-codex");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
