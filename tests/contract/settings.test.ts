import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SettingsService } from "../../src/service/settings.ts";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";
import { bridgeProviderFixture, bridgeProviders } from "../fixtures/bridge.ts";

const setup = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "quota-settings-"));
  const settings = new SettingsService(dir);
  await settings.load();
  return { dir, settings };
};

describe("shared settings contract", () => {
  test("starts at revision zero with all defaults and persists changes", async () => {
    const { dir, settings } = await setup();
    try {
      expect(settings.get()).toEqual({
        version: 1,
        revision: 0,
        selection: DEFAULT_SELECTION,
      });
      const result = await settings.patch({
        expectedRevision: 0,
        changes: { quotaDisplay: "used", cutoffPercent: 25 },
      });
      expect(result.status).toBe(200);
      if (result.status !== 200) return;
      expect(result.envelope.revision).toBe(1);
      expect(result.envelope.selection.quotaDisplay).toBe("used");
      expect(result.envelope.selection.cutoffPercent).toBe(25);

      const reloaded = new SettingsService(dir);
      await reloaded.load();
      expect(reloaded.get()).toEqual(result.envelope);

      const raw = JSON.parse(await readFile(path.join(dir, "display.json"), "utf8"));
      expect(JSON.stringify(raw)).not.toContain("apiKey");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("a conflict returns the latest envelope and does not overwrite unrelated edits", async () => {
    const { dir, settings } = await setup();
    try {
      const first = await settings.patch({
        expectedRevision: 0,
        changes: { quotaDisplay: "used" },
      });
      expect(first.status).toBe(200);

      const second = await settings.patch({
        expectedRevision: 0,
        changes: { cutoffPercent: 40 },
      });
      expect(second.status).toBe(409);
      if (second.status !== 409) return;
      expect(second.envelope.selection.quotaDisplay).toBe("used");

      const retried = await settings.patch({
        expectedRevision: second.envelope.revision,
        changes: { cutoffPercent: 40 },
      });
      expect(retried.status).toBe(200);
      if (retried.status !== 200) return;
      expect(retried.envelope.selection.quotaDisplay).toBe("used");
      expect(retried.envelope.selection.cutoffPercent).toBe(40);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("saved empty selections stay empty and keyed window patches preserve other providers", async () => {
    const { dir, settings } = await setup();
    try {
      const empty = await settings.patch({
        expectedRevision: 0,
        changes: {
          providers: [],
          windows: { "bridge-codex": [] },
          hiddenBalances: [],
        },
      });
      expect(empty.status).toBe(200);
      if (empty.status !== 200) return;
      expect(empty.envelope.selection.saved).toBe(true);
      expect(empty.envelope.selection.providers).toEqual([]);
      expect(empty.envelope.selection.windows["bridge-codex"]).toEqual([]);
      expect(empty.envelope.selection.explicitWindowSelections).toContain("bridge-codex");

      const keyed = await settings.patch({
        expectedRevision: empty.envelope.revision,
        changes: { windows: { "bridge-openrouter": ["limit"] } },
      });
      expect(keyed.status).toBe(200);
      if (keyed.status !== 200) return;
      expect(keyed.envelope.selection.windows["bridge-codex"]).toEqual([]);
      expect(keyed.envelope.selection.windows["bridge-openrouter"]).toEqual(["limit"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("provider order and collapsed quota settings persist and merge by provider", async () => {
    const { dir, settings } = await setup();
    try {
      const first = await settings.patch({
        expectedRevision: 0,
        changes: {
          providerOrder: ["bridge-codex", "bridge-openrouter"],
          collapsedQuota: { "bridge-codex": "earliest-reset" },
        },
      });
      expect(first.status).toBe(200);
      if (first.status !== 200) return;
      expect(first.envelope.selection.providerOrder).toEqual([
        "bridge-codex",
        "bridge-openrouter",
      ]);

      const second = await settings.patch({
        expectedRevision: first.envelope.revision,
        changes: { collapsedQuota: {
          "bridge-openrouter": "least-remaining",
          "bridge-tavily": "balance:paygo-used",
          "custom-fixture": `balance:${"x".repeat(80)}`,
        } },
      });
      expect(second.status).toBe(200);
      if (second.status !== 200) return;
      expect(second.envelope.selection.collapsedQuota).toEqual({
        "bridge-codex": "earliest-reset",
        "bridge-openrouter": "least-remaining",
        "bridge-tavily": "balance:paygo-used",
        "custom-fixture": `balance:${"x".repeat(80)}`,
      });

      const reloaded = new SettingsService(dir);
      await reloaded.load();
      expect(reloaded.get().selection.providerOrder).toEqual([
        "bridge-codex",
        "bridge-openrouter",
      ]);
      expect(reloaded.get().selection.collapsedQuota["bridge-codex"]).toBe("earliest-reset");
      expect(reloaded.get().selection.collapsedQuota["bridge-tavily"]).toBe("balance:paygo-used");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("collapse state survives reopening, and expansion removes only the selected provider", async () => {
    const { dir, settings } = await setup();
    try {
      const first = await settings.patch({
        expectedRevision: 0,
        changes: { collapsedProviders: { "bridge-tavily": true }, quotaDisplay: "used" },
      });
      expect(first.status).toBe(200);
      const conflict = await settings.patch({
        expectedRevision: 0,
        changes: { collapsedProviders: { "bridge-codex": true } },
      });
      expect(conflict.status).toBe(409);
      if (conflict.status !== 409) return;
      const both = await settings.patch({
        expectedRevision: conflict.envelope.revision,
        changes: { collapsedProviders: { "bridge-codex": true } },
      });
      expect(both.status).toBe(200);

      const reloaded = new SettingsService(dir);
      await reloaded.load();
      const { revision, selection } = reloaded.get();
      expect(selection.collapsedProviders).toEqual(["bridge-tavily", "bridge-codex"]);
      expect(selection.collapsedQuota).toEqual({});
      expect(selection.saved).toBe(false);
      expect(selection.quotaDisplay).toBe("used");
      const expanded = await reloaded.patch({
        expectedRevision: revision,
        changes: { collapsedProviders: { "bridge-tavily": false } },
      });
      expect(expanded.status).toBe(200);

      const reopened = new SettingsService(dir);
      await reopened.load();
      expect(reopened.get().selection.collapsedProviders).toEqual(["bridge-codex"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("rejects service tracking, unknown fields and invalid changes", async () => {
    const { dir, settings } = await setup();
    try {
      for (const changes of [
        { encounteredBridgeProviders: ["bridge-codex"] },
        { initializedBridgeWindows: ["bridge-codex"] },
        { unknown: true },
        { providers: [1] },
        { cutoffPercent: 101 },
        { quotaDisplay: "other" },
        { windows: { x: "nope" } },
        { providerOrder: [1] },
        { collapsedProviders: ["bridge-tavily"] },
        { collapsedProviders: { "bridge-tavily": "true" } },
        { collapsedProviders: { "": true } },
        { collapsedQuota: { x: 2 } },
        { collapsedQuota: { x: `balance:${"x".repeat(81)}` } },
      ]) {
        const result = await settings.patch({ expectedRevision: 0, changes });
        expect(result.status).toBe(400);
      }
      expect(settings.get().revision).toBe(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("saving a provider list marks omitted bridge providers as explicit hides", async () => {
    const { dir, settings } = await setup();
    try {
      const saved = await settings.patch({
        expectedRevision: 0,
        changes: {
          providers: [
            "bridge-openrouter",
            "bridge-opencode-go",
            "bridge-opencode-zen",
          ],
        },
      });
      expect(saved.status).toBe(200);
      if (saved.status !== 200) return;
      expect(saved.envelope.selection.explicitProviderSelections).toContain("bridge-codex");
      await settings.reconcile(bridgeProviders());
      expect(settings.get().selection.providers).not.toContain("bridge-codex");
      expect(settings.get().selection.providers).toContain("bridge-openrouter");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("keyed edits leave unrelated default selections alone across clients", async () => {
    const { dir, settings } = await setup();
    const [first, second, recovered] = bridgeProviders();
    try {
      await settings.reconcile([first, second, bridgeProviderFixture(2, "error")]);
      const previous = settings.get().revision;
      expect((await settings.patch({
        expectedRevision: previous,
        changes: { providerVisibility: { [first.connectionId]: false } },
      })).status).toBe(200);
      const windowChange = { windowSelection: { [second.connectionId]: [] } };
      const conflict = await settings.patch({ expectedRevision: previous, changes: windowChange });
      expect(conflict.status).toBe(409);
      expect((await settings.patch({
        expectedRevision: settings.get().revision, changes: windowChange,
      })).status).toBe(200);
      await settings.reconcile([first, second, recovered]);
      const { selection } = settings.get();
      expect(selection.explicitProviderSelections).toEqual([first.connectionId]);
      expect(selection.explicitWindowSelections).toEqual([second.connectionId]);
      expect(selection.providers).not.toContain(first.connectionId);
      expect(selection.windows[second.connectionId]).toEqual([]);
      expect(selection.windows[recovered.connectionId]).toEqual(recovered.windows.map((window) => window.id));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("encounter alone does not initialize windows; first success does once", async () => {
    const { dir, settings } = await setup();
    try {
      await settings.reconcile([bridgeProviderFixture(0, "error"), bridgeProviderFixture(1, "unconfigured")]);
      expect(settings.get().selection.encounteredBridgeProviders).toContain("bridge-openrouter");
      expect(settings.get().selection.initializedBridgeWindows).toEqual([]);

      await settings.reconcile([bridgeProviderFixture(0), bridgeProviderFixture(1)]);
      expect(settings.get().selection.windows["bridge-openrouter"]).toEqual(["primary"]);
      expect(settings.get().selection.initializedBridgeWindows).toContain("bridge-openrouter");

      const windows = { ...bridgeProviderFixture(0), windows: [
        ...bridgeProviderFixture(0).windows,
        { id: "extra", label: "Extra", remainingPercent: 1, resetAt: bridgeProviderFixture(0).windows[0].resetAt },
      ] };
      await settings.reconcile([windows, bridgeProviderFixture(1)]);
      expect(settings.get().selection.windows["bridge-openrouter"]).toEqual(["primary"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("two service instances on one data directory share one document", async () => {
    const { dir, settings } = await setup();
    try {
      const other = new SettingsService(dir);
      await other.load();
      const changed = await settings.patch({
        expectedRevision: 0,
        changes: { resetTime: "absolute" },
      });
      expect(changed.status).toBe(200);
      await other.load();
      expect(other.get().selection.resetTime).toBe("absolute");
      expect(other.get().revision).toBe(settings.get().revision);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("different data directories do not share settings", async () => {
    const { dir, settings } = await setup();
    const second = await setup();
    try {
      await settings.patch({ expectedRevision: 0, changes: { quotaDisplay: "used" } });
      expect(second.settings.get().selection.quotaDisplay).toBe("remaining");
    } finally {
      await rm(dir, { recursive: true, force: true });
      await rm(second.dir, { recursive: true, force: true });
    }
  });

  test("a complete bridge cycle initializes only successful providers", async () => {
    const { dir, settings } = await setup();
    try {
      const providers = bridgeProviders();
      providers[3] = bridgeProviderFixture(3, "unconfigured");
      await settings.reconcile(providers);
      expect(settings.get().selection.initializedBridgeWindows).toContain("bridge-openrouter");
      expect(settings.get().selection.initializedBridgeWindows).not.toContain("bridge-codex");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
