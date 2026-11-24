import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { CredentialStore } from "../../src/service/credentials.ts";
import { SnapshotService } from "../../src/service/snapshot.ts";
import { Scheduler } from "../../src/service/scheduler.ts";
import { handleRequest } from "../../src/service/routes.ts";
import type { RouteDeps } from "../../src/service/routes.ts";
import { customPayload, fixtureSnapshot, NOW, RESET } from "../fixtures/provider.ts";

const schema = (name: string) =>
  addFormats(new Ajv2020({ allErrors: true, strictTypes: false }), ["date-time"]).compile(
    JSON.parse(readFileSync(new URL(`../../specs/001-session-panel-quota/contracts/${name}`, import.meta.url), "utf8")),
  );

const contractFixture = () => {
  const fixture = fixtureSnapshot();
  fixture.providers[0].windows[2] = {
    id: "broken",
    label: "Broken",
    error: { code: "bad_response", message: "Usage unavailable." },
  };
  return fixture;
};

const deps = async (): Promise<{ deps: RouteDeps; dir: string; refreshed: string[] }> => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "quota-routes-"));
  const store = new CredentialStore(dir);
  await store.load();
  const refreshed: string[] = [];
  const snapshot = {
    getSnapshot: contractFixture,
    startRefresh: (id?: string) => refreshed.push(id ?? "all"),
    isRefreshing: () => false,
    testConnection: async () => ({ ok: true }),
  } as unknown as SnapshotService;
  return {
    dir,
    refreshed,
    deps: {
      store,
      snapshot,
      token: "token",
      dataDir: dir,
      config: {},
      saveConfig: async () => {},
    },
  };
};

const request = (method: string, path: string, body = "", token = "token") => ({
  method,
  path,
  headers: { authorization: `Bearer ${token}` },
  body,
});

class TestSnapshotService extends SnapshotService {
  pending?: ReturnType<SnapshotService["refresh"]>;
  override startRefresh(id?: string): void {
    this.pending = this.refresh(id);
  }
}

describe("service contracts", () => {
  test("rejects an invalid assembled Snapshot without exposing validation details", async () => {
    const { deps: routeDeps, dir } = await deps();
    try {
      const invalid = contractFixture();
      invalid.providers[0].windows[0].resetAt = "2026-02-30T00:00:00Z";
      routeDeps.snapshot.getSnapshot = () => invalid;
      expect(await handleRequest(routeDeps, request("GET", "/snapshot"))).toEqual({
        status: 500,
        body: { error: { code: "provider_error", message: "Internal service error." } },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("sends the validated snapshot even if a refresh changes the provider before serialization", async () => {
    const { deps: routeDeps, dir } = await deps();
    try {
      const fixture = contractFixture();
      routeDeps.snapshot.getSnapshot = () => {
        queueMicrotask(() => { fixture.providers[0].windows[0].resetAt = "not-a-date"; });
        return fixture;
      };
      const result = await handleRequest(routeDeps, request("GET", "/snapshot"));
      expect(result.status).toBe(200);
      expect(schema("quota-snapshot.schema.json")(JSON.parse(JSON.stringify(result.body)))).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("actual loading and refreshed Snapshots match the contract and ignore an invalid cache", async () => {
    const { deps: routeDeps, dir } = await deps();
    const validate = schema("quota-snapshot.schema.json");
    await routeDeps.store.upsert({
      kind: "custom",
      label: "Gateway",
      endpoint: "https://example.com/quota",
      apiKey: "fixture-secret",
    });
    const id = routeDeps.store.list()[0].id;
    await writeFile(path.join(dir, "cache.json"), JSON.stringify({
      ...fixtureSnapshot(),
      providers: [{ connectionId: id, secret: "cache-secret" }],
    }));
    let fetched = false;
    const snapshot = new TestSnapshotService({
      store: routeDeps.store,
      scheduler: new Scheduler(),
      dataDir: dir,
      now: () => NOW,
      requestJson: async () => {
        fetched = true;
        return { status: 200, contentType: "application/json", body: customPayload };
      },
    });
    routeDeps.snapshot = snapshot;
    try {
      await snapshot.loadCache();
      const loading = await handleRequest(routeDeps, request("GET", "/snapshot"));
      expect(loading.status).toBe(200);
      expect(validate(loading.body)).toBe(true);
      expect(loading.body).toMatchObject({ providers: [{ state: "loading", refreshing: true }] });
      await snapshot.pending;
      const ready = await handleRequest(routeDeps, request("GET", "/snapshot"));
      expect(fetched).toBe(true);
      expect(ready.status).toBe(200);
      expect(validate(JSON.parse(JSON.stringify(ready.body)))).toBe(true);
      expect(ready.body).toMatchObject({
        providers: [{
          state: "ok",
          refreshing: false,
          windows: [{ resetAt: new Date(RESET).toISOString(), remainingPercent: 25 }],
        }],
      });
      expect(JSON.stringify(ready.body)).not.toContain("fixture-secret");
    } finally {
      await snapshot.pending;
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("snapshot schema accepts a window error and rejects a provider error without an error object", () => {
    const validate = schema("quota-snapshot.schema.json");
    expect(validate(contractFixture())).toBe(true);
    const invalid = contractFixture();
    invalid.providers[1].error = undefined;
    expect(validate(invalid)).toBe(false);
  });

  test("custom provider schema accepts a valid payload and rejects an empty one", () => {
    const validate = schema("custom-provider-v1.schema.json");
    expect(validate(customPayload)).toBe(true);
    expect(validate({ version: 1 })).toBe(false);
  });

  test("rejects a wrong service token", async () => {
    const { deps: routeDeps } = await deps();
    const result = await handleRequest(routeDeps, request("GET", "/health", "", "wrong"));
    expect(result.status).toBe(401);
  });

  test("creates, lists, and removes a connection without exposing secrets", async () => {
    const { deps: routeDeps } = await deps();
    const created = await handleRequest(
      routeDeps,
      request(
        "POST",
        "/connections",
        JSON.stringify({
          kind: "custom",
          label: "Gateway",
          endpoint: "https://example.com/quota",
          apiKey: "secret-key",
        }),
      ),
    );
    expect(created.status).toBe(201);
    expect(JSON.stringify(created.body)).not.toContain("secret-key");

    const list = await handleRequest(routeDeps, request("GET", "/connections"));
    expect(list.status).toBe(200);
    expect(JSON.stringify(list.body)).not.toContain("secret-key");
    expect((list.body as { connections: unknown[] }).connections).toHaveLength(1);
  });

  test("rejects invalid custom endpoints and duplicate named providers", async () => {
    const { deps: routeDeps } = await deps();
    const invalid = await handleRequest(
      routeDeps,
      request(
        "POST",
        "/connections",
        JSON.stringify({
          kind: "custom",
          label: "Bad",
          endpoint: "http://example.com/quota",
          apiKey: "key",
        }),
      ),
    );
    expect(invalid.status).toBe(400);

    const first = await handleRequest(
      routeDeps,
      request("POST", "/connections", JSON.stringify({ kind: "tavily", label: "Tavily", apiKey: "tvly-1" })),
    );
    expect(first.status).toBe(201);
    const second = await handleRequest(
      routeDeps,
      request("POST", "/connections", JSON.stringify({ kind: "tavily", label: "Tavily 2", apiKey: "tvly-2" })),
    );
    expect(second.status).toBe(409);
  });

  test("refresh accepts and starts a background refresh", async () => {
    const { deps: routeDeps, refreshed } = await deps();
    const result = await handleRequest(routeDeps, request("POST", "/refresh", JSON.stringify({})));
    expect(result.status).toBe(202);
    expect(refreshed).toEqual(["all"]);
  });

  test("refresh reports an already-running provider", async () => {
    const { deps: routeDeps } = await deps();
    await handleRequest(
      routeDeps,
      request("POST", "/connections", JSON.stringify({ kind: "tavily", label: "Tavily", apiKey: "tvly-1" })),
    );
    (routeDeps.snapshot as unknown as { isRefreshing: () => boolean }).isRefreshing = () => true;
    const result = await handleRequest(
      routeDeps,
      request("POST", "/refresh", JSON.stringify({ connectionId: "tavily" })),
    );
    expect(result.status).toBe(409);
  });

  test("config round-trips the CA path", async () => {
    const { deps: routeDeps } = await deps();
    const put = await handleRequest(
      routeDeps,
      request("PUT", "/config", JSON.stringify({ caBundlePath: "/tmp/ca.pem" })),
    );
    expect(put.status).toBe(200);
    expect((put.body as { caBundlePath: string }).caBundlePath).toBe("/tmp/ca.pem");
    const get = await handleRequest(routeDeps, request("GET", "/config"));
    expect((get.body as { caBundlePath: string }).caBundlePath).toBe("/tmp/ca.pem");
  });
});
