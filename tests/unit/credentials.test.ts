import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CredentialStore } from "../../src/service/credentials.ts";

const temp = () => mkdtemp(path.join(os.tmpdir(), "quota-store-"));

describe("credential store", () => {
  test("stores secrets without returning them", async () => {
    const dir = await temp();
    const store = new CredentialStore(dir);
    await store.load();
    const connection = await store.upsert({
      kind: "custom",
      label: "My gateway",
      endpoint: "https://example.com/quota",
      apiKey: "secret-key",
    });
    expect(connection.id).toStartWith("custom-");
    expect(connection).not.toHaveProperty("secret");
    const list = store.list();
    expect(JSON.stringify(list)).not.toContain("secret-key");
    expect(store.get(connection.id)?.secret.apiKey).toBe("secret-key");
    const file = await readFile(path.join(dir, "connections.json"), "utf8");
    expect(file).toContain("secret-key");
  });

  test("rejects duplicate custom labels and removes entries", async () => {
    const dir = await temp();
    const store = new CredentialStore(dir);
    await store.load();
    const first = await store.upsert({
      kind: "custom",
      label: "Gateway",
      endpoint: "https://one.example/quota",
      apiKey: "key-1",
    });
    await expect(
      store.upsert({
        kind: "custom",
        label: "Gateway",
        endpoint: "https://two.example/quota",
        apiKey: "key-2",
      }),
    ).rejects.toThrow("already exists");
    expect(await store.remove(first.id)).toBe(true);
    expect(await store.remove(first.id)).toBe(false);
  });

  test("keeps a custom provider id across updates", async () => {
    const dir = await temp();
    const store = new CredentialStore(dir);
    await store.load();
    const first = await store.upsert({
      kind: "custom",
      label: "Gateway",
      endpoint: "https://example.com/quota",
      apiKey: "one",
    });
    const second = await store.upsert({
      id: first.id,
      kind: "custom",
      label: "Gateway renamed",
      endpoint: "https://example.com/quota",
      apiKey: "two",
    });
    expect(second.id).toBe(first.id);
    expect(store.get(first.id)?.secret.apiKey).toBe("two");
  });

  test("rejects stored OpenCode keys and leaves old development records untouched", async () => {
    const dir = await temp();
    await writeFile(
      path.join(dir, "connections.json"),
      JSON.stringify({
        version: 1,
        connections: [
          {
            id: "openrouter",
            kind: "openrouter",
            label: "OpenRouter",
            createdAt: "2026-01-01T00:00:00Z",
            secret: { apiKey: "legacy-development-key" },
          },
          {
            id: "tavily",
            kind: "tavily",
            label: "Tavily",
            createdAt: "2026-01-01T00:00:00Z",
            secret: { apiKey: "legacy-tavily-key" },
          },
        ],
      }),
    );
    const store = new CredentialStore(dir);
    await store.load();
    expect(store.list()).toEqual([]);
    expect(store.entries()).toEqual([]);
    expect(store.get("openrouter")).toBeUndefined();
    expect(store.get("tavily")).toBeUndefined();
    for (const kind of ["openrouter", "tavily", "exa"] as const) {
      await expect(
        store.upsert({ kind, label: kind, apiKey: "new" }),
      ).rejects.toThrow("signs in through OpenCode");
    }

    const custom = await store.upsert({
      kind: "custom",
      label: "Gateway",
      endpoint: "https://example.com/quota",
      apiKey: "custom-key",
    });
    const file = JSON.parse(await readFile(path.join(dir, "connections.json"), "utf8"));
    expect(file.connections.some((entry: { kind: string }) => entry.kind === "openrouter")).toBe(
      true,
    );
    expect(file.connections.some((entry: { kind: string }) => entry.kind === "tavily")).toBe(
      true,
    );

    const reloaded = new CredentialStore(dir);
    await reloaded.load();
    expect(reloaded.list().map((entry) => entry.kind)).toEqual(["custom"]);
    expect(reloaded.get(custom.id)?.secret.apiKey).toBe("custom-key");
  });
});
