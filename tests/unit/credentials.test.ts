import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile } from "node:fs/promises";
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

  test("rejects duplicate named providers and removes entries", async () => {
    const dir = await temp();
    const store = new CredentialStore(dir);
    await store.load();
    await store.upsert({ kind: "tavily", label: "Tavily", apiKey: "tvly-1" });
    await expect(
      store.upsert({ kind: "tavily", label: "Tavily 2", apiKey: "tvly-2" }),
    ).rejects.toThrow("already exists");
    expect(await store.remove("tavily")).toBe(true);
    expect(await store.remove("tavily")).toBe(false);
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
});
