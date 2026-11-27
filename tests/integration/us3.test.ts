import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";
import { renderBalance, renderCap, renderProvider } from "../../src/section/view/window.ts";
import { CredentialStore } from "../../src/service/credentials.ts";
import { Scheduler } from "../../src/service/scheduler.ts";
import { SnapshotService } from "../../src/service/snapshot.ts";
import { BridgeService } from "../../src/service/bridge.ts";
import { bridgeUnavailableMessage } from "../../src/core/snapshot-merge.ts";
import { bridgeProviderFixture, bridgeProviders, bridgeSnapshotFixture } from "../fixtures/bridge.ts";
import { NOW } from "../fixtures/provider.ts";

const staleProvider = {
  connectionId: "bridge-codex",
  kind: "codex" as const,
  label: "OpenAI",
  state: "ok" as const,
  windows: [
    {
      id: "primary",
      label: "5h",
      remainingPercent: 35,
      resetAt: "2026-11-23T11:59:00Z",
      durationSeconds: 18_000,
    },
  ],
  caps: [],
  balances: [],
  fetchedAt: "2026-11-23T11:00:00Z",
  refreshing: false,
  error: {
    code: "provider_error" as const,
    message: "The OpenCode plugin is unavailable; showing the last reading.",
  },
};

describe("US3 integration", () => {
  test("cap is a bar, balance is a number, neither invents a reset", () => {
    const cap = renderCap({ id: "c", label: "Monthly spend", used: 12.5, limit: 50, unit: "USD" });
    expect(cap).toContain("quota-bar");
    expect(cap).toContain("no reset");
    expect(cap).not.toContain("resets");

    const balance = renderBalance({ id: "b", label: "Credit", value: 25, unit: "USD" });
    expect(balance).not.toContain("quota-bar");
    expect(balance).not.toContain("resets");
    expect(balance).not.toContain("benchmark");
  });

  test("an expired historical window keeps the sampled bar and age without a live claim", () => {
    const html = renderProvider(staleProvider, DEFAULT_SELECTION, NOW);
    expect(html).toContain("quota-historical");
    expect(html).toContain("width:35.00%");
    expect(html).toContain("past");
    expect(html).toContain("Sampled 1h ago; the reset time has passed.");
    expect(html).toContain("Last sampled 1h ago.");
    expect(html).not.toContain("quota-benchmark");
    expect(html).not.toContain("Refreshing…");
    expect(html).not.toContain("next reset");
  });

  test("a connectivity failure after auth stays visible through an outage", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "quota-int-auth-"));
    const serverId = "b".repeat(64);
    let now = NOW;
    const store = new CredentialStore(dir);
    await store.load();
    const bridge = new BridgeService({ serverId, now: () => now });
    const service = new SnapshotService({
      store,
      scheduler: new Scheduler(),
      dataDir: dir,
      now: () => now,
      bridge,
    });
    try {
      await service.acceptBridge(bridgeSnapshotFixture(serverId, null, bridgeProviders()));
      const auth = bridgeProviders();
      auth[3] = bridgeProviderFixture(3, "error");
      await service.acceptBridge(bridgeSnapshotFixture(serverId, null, auth));
      const timeout = bridgeProviders();
      timeout[3] = {
        ...bridgeProviderFixture(3, "error"),
        error: { code: "timeout", message: "The provider did not answer in time." },
      };
      await service.acceptBridge(bridgeSnapshotFixture(serverId, null, timeout));
      const fresh = service.getSnapshot().providers
        .find((entry) => entry.connectionId === "bridge-codex")!;
      expect(fresh.error?.code).toBe("timeout");
      expect(fresh.windows).toEqual([]);

      await service.refreshAll();
      now += 12_001;
      await service.bridgeState();
      const codex = service.getSnapshot().providers
        .find((entry) => entry.connectionId === "bridge-codex")!;
      expect(codex.error?.message).toBe(bridgeUnavailableMessage);
      expect(codex.windows).toEqual([]);

      await service.acceptBridge(bridgeSnapshotFixture(serverId, null, bridgeProviders()));
      const recovered = service.getSnapshot().providers
        .find((entry) => entry.connectionId === "bridge-codex")!;
      expect(recovered.state).toBe("ok");
      expect(recovered.error).toBeUndefined();
      expect(recovered.windows).toHaveLength(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("a never-read provider shows the notice alone while another source still renders", () => {
    const never = {
      ...staleProvider,
      connectionId: "bridge-openrouter",
      kind: "openrouter" as const,
      label: "OpenRouter",
      windows: [],
      fetchedAt: undefined,
      state: "error" as const,
      error: {
        code: "provider_error" as const,
        message: "The OpenCode plugin is not connected. If you just approved the extension, restart OpenCode or OpenChamber.",
      },
    };
    const html = renderProvider(never, DEFAULT_SELECTION, NOW);
    expect(html).toContain("restart OpenCode or OpenChamber");
    expect(html).not.toContain("quota-bar");
    expect(html).not.toContain("No quota windows reported.");

    const tavily = renderProvider(
      {
        ...never,
        connectionId: "tavily",
        kind: "tavily" as const,
        label: "Tavily",
        state: "ok" as const,
        error: undefined,
        fetchedAt: new Date(NOW).toISOString(),
        windows: [{ id: "plan", label: "Credits", remainingPercent: 80, resetAt: "2026-12-01T00:00:00Z" }],
      },
      DEFAULT_SELECTION,
      NOW,
    );
    expect(tavily).toContain("quota-bar");
  });
});
