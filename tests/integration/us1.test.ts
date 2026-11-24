import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CredentialStore } from "../../src/service/credentials.ts";
import { Scheduler } from "../../src/service/scheduler.ts";
import { SnapshotService } from "../../src/service/snapshot.ts";
import { HttpError } from "../../src/service/http.ts";
import { customPayload, NOW } from "../fixtures/provider.ts";

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
    expect(cache.providers).toHaveLength(1);
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
});
