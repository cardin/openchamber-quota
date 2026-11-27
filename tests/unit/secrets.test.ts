import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fixtureSnapshot } from "../fixtures/provider.ts";
import { toPublic } from "../../src/service/credentials.ts";
import { bridgeProviderFixture, bridgeProviders, bridgeSnapshotFixture } from "../fixtures/bridge.ts";
import { BridgeService } from "../../src/service/bridge.ts";
import { CredentialStore } from "../../src/service/credentials.ts";
import { SettingsService } from "../../src/service/settings.ts";
import { Scheduler } from "../../src/service/scheduler.ts";
import { SnapshotService } from "../../src/service/snapshot.ts";
import { BridgeDescriptorWriter } from "../../src/service/bridge-descriptor.ts";
import { NOW } from "../fixtures/provider.ts";

describe("secrets", () => {
  test("snapshots and public connections never contain secrets", () => {
    const snapshot = fixtureSnapshot();
    const text = JSON.stringify(snapshot);
    expect(text).not.toContain("secret");
    expect(text).not.toContain("apiKey");
    expect(text).not.toContain("accessToken");

    const pub = toPublic({
      id: "tavily",
      kind: "tavily",
      label: "Tavily",
      createdAt: "2026-11-23T12:00:00Z",
      secret: { apiKey: "tvly-secret" },
    });
    expect(JSON.stringify(pub)).not.toContain("tvly-secret");
    expect(pub).not.toHaveProperty("secret");
  });

  test("bridge payload, cache, settings and snapshot contain no credential or bridge token", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "quota-secrets-"));
    const config = await mkdtemp(path.join(os.tmpdir(), "quota-secrets-config-"));
    const previous = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = config;
    const serverId = "f".repeat(64);
    const store = new CredentialStore(dir);
    await store.load();
    await store.upsert({
      kind: "custom",
      label: "Gateway",
      endpoint: "https://example.com/quota",
      apiKey: "custom-service-secret",
    });
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
    const writer = new BridgeDescriptorWriter(serverId, 1234, () => NOW);
    await writer.publish();
    try {
      const providers = bridgeProviders();
      providers[0] = {
        ...bridgeProviderFixture(0, "error"),
        error: {
          code: "auth",
          message: "Bearer sentinel-credential-1234567890 sk-live-abcdef123456",
        },
      };
      const accepted = await snapshot.acceptBridgeInput(
        bridgeSnapshotFixture(serverId, null, providers),
      );
      expect(accepted.ok).toBe(true);

      const publicSnapshot = JSON.stringify(snapshot.getSnapshot());
      const cache = await readFile(path.join(dir, "cache.json"), "utf8");
      const settingsText = JSON.stringify(settings.get());
      const descriptorText = await readFile(
        path.join(config, "openchamber-quota", "bridges", `${serverId}.json`),
        "utf8",
      );
      for (const text of [publicSnapshot, cache, settingsText]) {
        expect(text).not.toContain("sentinel-credential");
        expect(text).not.toContain("sk-live");
        expect(text).not.toContain("custom-service-secret");
        expect(text).not.toContain(writer.descriptor().token);
      }
      expect(publicSnapshot).toContain("[redacted]");
      expect(descriptorText).toContain(writer.descriptor().token);
      expect(descriptorText).not.toContain("custom-service-secret");
    } finally {
      await writer.cleanup();
      if (previous === undefined) delete process.env.XDG_CONFIG_HOME;
      else process.env.XDG_CONFIG_HOME = previous;
      await rm(dir, { recursive: true, force: true });
      await rm(config, { recursive: true, force: true });
    }
  });
});
