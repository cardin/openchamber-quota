import { describe, expect, test } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CredentialStore } from "../../src/service/credentials.ts";
import type { SnapshotService } from "../../src/service/snapshot.ts";
import { handleRequest } from "../../src/service/routes.ts";
import type { RouteDeps } from "../../src/service/routes.ts";
import { fixtureSnapshot } from "../fixtures/provider.ts";

const setup = async (): Promise<RouteDeps> => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "quota-conn-"));
  const store = new CredentialStore(dir);
  await store.load();
  return {
    store,
    snapshot: {
      getSnapshot: () => fixtureSnapshot(),
      startRefresh: () => {},
      isRefreshing: () => false,
      testConnection: async () => ({ ok: true }),
    } as unknown as SnapshotService,
    token: "token",
    dataDir: dir,
  };
};

const post = (deps: RouteDeps, body: unknown, method = "POST", path = "/connections") =>
  handleRequest(deps, {
    method,
    path,
    headers: { authorization: "Bearer token" },
    body: JSON.stringify(body),
  });

describe("connection contracts", () => {
  test("requires a key for named providers and never returns it", async () => {
    const deps = await setup();
    const missing = await post(deps, { kind: "tavily", label: "Tavily" });
    expect(missing.status).toBe(400);

    const created = await post(deps, { kind: "tavily", label: "Tavily", apiKey: "tvly-1" });
    expect(created.status).toBe(201);
    expect(JSON.stringify(created.body)).not.toContain("tvly-1");
  });

  test("accepts Codex without a key and rejects non-HTTPS custom endpoints", async () => {
    const deps = await setup();
    const codex = await post(deps, { kind: "codex", label: "Codex" });
    expect(codex.status).toBe(201);

    const bad = await post(deps, {
      kind: "custom",
      label: "Bad",
      endpoint: "http://example.com/quota",
      apiKey: "key",
    });
    expect(bad.status).toBe(400);
  });

  test("rejects unknown connection fields", async () => {
    const deps = await setup();
    const result = await post(deps, {
      kind: "tavily",
      label: "Tavily",
      apiKey: "tvly-1",
      unexpected: true,
    });
    expect(result.status).toBe(400);
  });

  test("keeps custom labels unique", async () => {
    const deps = await setup();
    const first = await post(deps, {
      kind: "custom",
      label: "Gateway",
      endpoint: "https://one.example/quota",
      apiKey: "key",
    });
    expect(first.status).toBe(201);
    const second = await post(deps, {
      kind: "custom",
      label: "Gateway",
      endpoint: "https://two.example/quota",
      apiKey: "key",
    });
    expect(second.status).toBe(409);
  });

  test("updates a custom provider without requiring the key again", async () => {
    const deps = await setup();
    const created = await post(deps, {
      kind: "custom",
      label: "Gateway",
      endpoint: "https://one.example/quota",
      apiKey: "secret-key",
    });
    const id = (created.body as { connection: { id: string } }).connection.id;
    const updated = await post(
      deps,
      {
        kind: "custom",
        label: "Gateway renamed",
        endpoint: "https://two.example/quota",
      },
      "PUT",
      `/connections/${id}`,
    );
    expect(updated.status).toBe(200);
    expect((updated.body as { connection: { label: string; endpoint: string } }).connection.label).toBe(
      "Gateway renamed",
    );
    expect((updated.body as { connection: { endpoint: string } }).connection.endpoint).toBe(
      "https://two.example/quota",
    );
    expect(JSON.stringify(updated.body)).not.toContain("secret-key");
  });

  test("tests a connection through the snapshot service", async () => {
    const deps = await setup();
    await post(deps, { kind: "tavily", label: "Tavily", apiKey: "tvly-1" });
    const testResult = await post(deps, {}, "POST", "/connections/tavily/test");
    expect(testResult.status).toBe(200);
    expect((testResult.body as { ok: boolean }).ok).toBe(true);
  });
});
