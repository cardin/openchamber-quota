import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CredentialStore } from "../../src/service/credentials.ts";
import { Scheduler } from "../../src/service/scheduler.ts";
import { SnapshotService } from "../../src/service/snapshot.ts";
import { SettingsService } from "../../src/service/settings.ts";
import { BridgeService } from "../../src/service/bridge.ts";
import { HttpError } from "../../src/service/http.ts";
import { customPayload, NOW } from "../fixtures/provider.ts";
import { bridgeProviderFixture, bridgeProviders, bridgeSnapshotFixture } from "../fixtures/bridge.ts";
import { bridgeUnavailableMessage } from "../../src/core/snapshot-merge.ts";

const setup = async (fail = false) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "quota-int-"));
  const store = new CredentialStore(dir);
  await store.load();
  const connection = await store.upsert({
    kind: "custom",
    label: "Fixture",
    endpoint: "https://example.com/quota",
    apiKey: "key",
  });
  let shouldFail = fail;
  const scheduler = new Scheduler();
  const service = new SnapshotService({
    store,
    scheduler,
    dataDir: dir,
    now: () => NOW,
    requestJson: async () => {
      if (shouldFail) throw new HttpError("auth", "Provider rejected the key.");
      return { status: 200, body: customPayload };
    },
  });
  return { dir, store, service, scheduler, connection, fail: () => { shouldFail = true; } };
};

describe("US1 integration", () => {
  test("concurrent refreshes write one valid cache without temp-file collisions", async () => {
    const { service, dir } = await setup();
    await Promise.all([service.refresh(), service.refresh()]);
    const cache = JSON.parse(await readFile(path.join(dir, "cache.json"), "utf8")) as {
      version: number;
      providers: unknown[];
    };
    expect(cache.version).toBe(1);
    expect(cache.providers).toHaveLength(7);
  });

  test("renders a successful snapshot and a provider-level error", async () => {
    const { service, scheduler, connection, fail } = await setup();
    const ok = await service.refresh();
    const provider = ok.providers.find((entry) => entry.connectionId === connection.id)!;
    expect(provider.state).toBe("ok");
    expect(provider.windows[0].remainingPercent).toBe(25);
    expect(provider.caps).toHaveLength(1);

    fail();
    scheduler.reset(connection.id);
    const failed = await service.refresh();
    const broken = failed.providers.find((entry) => entry.connectionId === connection.id)!;
    expect(broken.state).toBe("error");
    expect(broken.windows).toHaveLength(0);
    expect(broken.error?.code).toBe("auth");
  });

  test("a transient provider failure keeps the last-success sample", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "quota-int-stale-"));
    const store = new CredentialStore(dir);
    await store.load();
    const connection = await store.upsert({
      kind: "custom",
      label: "Gateway",
      endpoint: "https://example.com/quota",
      apiKey: "key",
    });
    let fail = false;
    const scheduler = new Scheduler();
    const service = new SnapshotService({
      store,
      scheduler,
      dataDir: dir,
      now: () => NOW,
      requestJson: async () => {
        if (fail) throw new HttpError("network", "offline");
        return { status: 200, body: customPayload };
      },
    });
    try {
      const first = await service.refresh(connection.id);
      const sample = first.providers.find((entry) => entry.connectionId === connection.id)!;
      expect(sample.state).toBe("ok");
      const fetchedAt = sample.fetchedAt;

      fail = true;
      scheduler.reset(connection.id);
      const second = await service.refresh(connection.id);
      const kept = second.providers.find((entry) => entry.connectionId === connection.id)!;
      expect(kept.state).toBe("ok");
      expect(kept.fetchedAt).toBe(fetchedAt);
      expect(kept.windows).toEqual(sample.windows);
      expect(kept.error?.code).toBe("provider_error");
      expect(kept.error?.message).toContain("offline");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("restores post-upgrade last-success bridge samples from cache metadata", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "quota-int-cache-"));
    const serverId = "a".repeat(64);
    const store = new CredentialStore(dir);
    await store.load();
    const settings = new SettingsService(dir);
    await settings.load();
    const first = new SnapshotService({
      store,
      scheduler: new Scheduler(),
      dataDir: dir,
      now: () => NOW,
      bridge: new BridgeService({ serverId, now: () => NOW }),
      settings,
    });
    await first.loadCache();
    const accepted = bridgeProviders();
    await first.acceptBridge(bridgeSnapshotFixture(serverId, null, accepted));
    const cachedAt = accepted[3].fetchedAt;

    const restored = new SnapshotService({
      store,
      scheduler: new Scheduler(),
      dataDir: dir,
      now: () => NOW + 60_000,
      bridge: new BridgeService({ serverId, now: () => NOW + 60_000 }),
      settings,
    });
    await restored.loadCache();
    const providers = restored.getSnapshot().providers;
    const codex = providers.find((entry) => entry.connectionId === "bridge-codex")!;
    expect(codex.state).toBe("ok");
    expect(codex.fetchedAt).toBe(cachedAt);
    expect(codex.windows).toHaveLength(1);
    expect(codex.error?.message).toBe(bridgeUnavailableMessage);

    const request = await restored.refreshAll();
    const pending = restored.getSnapshot().providers
      .find((entry) => entry.connectionId === "bridge-codex")!;
    expect(pending.error?.message).toBe(bridgeUnavailableMessage);
    expect(pending.refreshing).toBe(true);

    await restored.acceptBridge(bridgeSnapshotFixture(serverId, request.requestId, bridgeProviders()));
    const fresh = restored.getSnapshot().providers
      .find((entry) => entry.connectionId === "bridge-codex")!;
    expect(fresh.error).toBeUndefined();
    await rm(dir, { recursive: true, force: true });
  });

  test("shows the six OpenCode sources plus custom and shares pre-data choices", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "quota-int-shared-"));
    const store = new CredentialStore(dir);
    await store.load();
    const custom = await store.upsert({
      kind: "custom",
      label: "Gateway",
      endpoint: "https://example.com/quota",
      apiKey: "key",
    });
    const settings = new SettingsService(dir);
    await settings.load();
    const serverId = "9".repeat(64);
    const bridge = new BridgeService({ serverId, now: () => NOW });
    const service = new SnapshotService({
      store,
      scheduler: new Scheduler(),
      dataDir: dir,
      now: () => NOW,
      requestJson: async () => ({ status: 200, body: customPayload }),
      bridge,
      settings,
    });
    await service.loadCache();
    try {
      const before = service.getSnapshot();
      expect(before.providers.map((entry) => entry.connectionId)).toEqual([
        custom.id,
        "bridge-openrouter",
        "bridge-opencode-go",
        "bridge-opencode-zen",
        "bridge-codex",
        "bridge-tavily",
        "bridge-exa",
      ]);
      expect(before.providers.find((entry) => entry.connectionId === "bridge-codex")?.state).toBe(
        "unconfigured",
      );

      const hidden = await settings.patch({
        expectedRevision: 0,
        changes: {
          providers: [
            custom.id,
            "bridge-openrouter",
            "bridge-opencode-go",
            "bridge-opencode-zen",
            "bridge-tavily",
            "bridge-exa",
          ],
          windows: { "bridge-openrouter": [] },
        },
      });
      expect(hidden.status).toBe(200);

      const missing = bridgeProviders();
      missing[3] = bridgeProviderFixture(3, "unconfigured");
      await service.acceptBridge(bridgeSnapshotFixture(serverId, null, missing));
      expect(
        service.getSnapshot().providers.find((entry) => entry.connectionId === "bridge-codex")?.state,
      ).toBe("unconfigured");

      await service.acceptBridge(bridgeSnapshotFixture(serverId, null, bridgeProviders()));
      const after = service.getSnapshot();
      expect(after.providers.find((entry) => entry.connectionId === "bridge-codex")?.state).toBe("ok");
      const selection = settings.get().selection;
      expect(selection.providers).not.toContain("bridge-codex");
      expect(selection.windows["bridge-openrouter"]).toEqual([]);
      expect(selection.initializedBridgeWindows).toContain("bridge-openrouter");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
