import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { BridgeDescriptorWriter } from "../../src/service/bridge-descriptor.ts";
import { bridgeMinimums } from "../../src/core/bridge.ts";
import { bridgesDir, descriptorPath } from "../../src/core/bridge-path.ts";
import { discover } from "../../src/opencode-plugin/bridge.ts";
import { NOW } from "../fixtures/provider.ts";

const previous = process.env.XDG_CONFIG_HOME;
let root: string;
const servers: Array<{ close: () => Promise<void> }> = [];

const stateFor = (serverId: string) => ({
  version: 1,
  serverId,
  providers: ["openrouter", "opencode-go", "opencode", "openai", "tavily", "exa"],
  refreshRequested: false,
  requestId: null,
  deadlineAt: null,
  providerMinimums: bridgeMinimums(),
  serverTime: NOW,
});

const startBridge = async (serverId: string, token: string): Promise<number> => {
  const server = createServer((request, response) => {
    if (request.headers.authorization !== `Bearer ${token}`) {
      response.writeHead(401).end("{}");
      return;
    }
    if (request.url === "/bridge/state") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(stateFor(serverId)));
      return;
    }
    response.writeHead(404).end("{}");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  servers.push({
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  });
  return (server.address() as AddressInfo).port;
};

beforeAll(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "quota-bridges-"));
  process.env.XDG_CONFIG_HOME = root;
  await mkdir(bridgesDir(), { recursive: true, mode: 0o700 });
});

afterAll(async () => {
  for (const server of servers) await server.close();
  if (previous === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = previous;
  await rm(root, { recursive: true, force: true });
});

describe("bridge descriptor and discovery", () => {
  test("two servers write distinct protected files", async () => {
    const first = "1".repeat(64);
    const second = "2".repeat(64);
    const a = new BridgeDescriptorWriter(first, 1111, () => NOW);
    const b = new BridgeDescriptorWriter(second, 2222, () => NOW);
    await a.publish();
    await b.publish();
    expect(descriptorPath(first)).not.toBe(descriptorPath(second));
    const parsed = JSON.parse(await readFile(descriptorPath(first), "utf8"));
    expect(parsed).toMatchObject({
      version: 1,
      serverId: first,
      port: 1111,
      providers: ["openrouter", "opencode-go", "opencode", "openai", "tavily", "exa"],
    });
    expect(JSON.stringify(parsed)).not.toContain("apiKey");
    expect(JSON.stringify(parsed)).not.toContain("accessToken");

    if (process.platform !== "win32") {
      expect((await stat(descriptorPath(first))).mode & 0o777).toBe(0o600);
      expect((await stat(bridgesDir())).mode & 0o777).toBe(0o700);
    }
    await a.cleanup();
    await b.cleanup();
  });

  test("publication waits for the descriptor lock", async () => {
    const serverId = "7".repeat(64);
    const writer = new BridgeDescriptorWriter(serverId, 7777, () => NOW);
    const lock = `${descriptorPath(serverId)}.lock`;
    await mkdir(lock);
    let published = false;
    const pending = writer.publish().then(() => { published = true; });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(published).toBe(false);
    await rm(lock, { recursive: true, force: true });
    await pending;
    expect(published).toBe(true);
    expect(JSON.parse(await readFile(descriptorPath(serverId), "utf8")).port).toBe(7777);
    await expect(writer.cleanup()).resolves.toBe(true);
  });

  test("cleanup rechecks ownership after waiting for the lock", async () => {
    const serverId = "8".repeat(64);
    const old = new BridgeDescriptorWriter(serverId, 8888, () => NOW);
    await old.publish();
    const lock = `${descriptorPath(serverId)}.lock`;
    await mkdir(lock);
    let cleaned: boolean | undefined;
    const pending = old.cleanup().then((result) => { cleaned = result; });
    await new Promise((resolve) => setTimeout(resolve, 30));
    const replacement = { ...old.descriptor(), token: "e".repeat(64), port: 9999 };
    await writeFile(descriptorPath(serverId), JSON.stringify(replacement), { mode: 0o600 });
    await rm(lock, { recursive: true, force: true });
    await pending;
    expect(cleaned).toBe(false);
    expect(JSON.parse(await readFile(descriptorPath(serverId), "utf8")).port).toBe(9999);
    await rm(descriptorPath(serverId));
  });

  test("cleanup never removes a replacement process's descriptor", async () => {
    const serverId = "3".repeat(64);
    const old = new BridgeDescriptorWriter(serverId, 3333, () => NOW);
    await old.publish();
    const replacement = { ...old.descriptor(), token: "f".repeat(64), port: 4444 };
    await writeFile(descriptorPath(serverId), JSON.stringify(replacement), { mode: 0o600 });
    expect(await old.cleanup()).toBe(false);
    expect(JSON.parse(await readFile(descriptorPath(serverId), "utf8")).token).toBe("f".repeat(64));
    await rm(descriptorPath(serverId));
  });

  test("binds a sole live endpoint and refuses several without a selector", async () => {
    const oneId = "4".repeat(64);
    const oneToken = "a".repeat(64);
    const onePort = await startBridge(oneId, oneToken);
    const one = new BridgeDescriptorWriter(oneId, onePort, () => NOW);
    await writeFile(
      descriptorPath(oneId),
      JSON.stringify({ ...one.descriptor(), token: oneToken }),
      { mode: 0o600 },
    );
    const bound = await discover();
    expect(bound).toMatchObject({ kind: "bound", descriptor: { serverId: oneId, port: onePort } });

    const twoId = "5".repeat(64);
    const twoToken = "b".repeat(64);
    const twoPort = await startBridge(twoId, twoToken);
    const two = new BridgeDescriptorWriter(twoId, twoPort, () => NOW);
    await writeFile(
      descriptorPath(twoId),
      JSON.stringify({ ...two.descriptor(), token: twoToken }),
      { mode: 0o600 },
    );
    expect(await discover()).toMatchObject({ kind: "ambiguous", count: 2 });
    expect(await discover(twoId)).toMatchObject({ kind: "bound", descriptor: { serverId: twoId } });

    await one.cleanup();
    await two.cleanup();
  });

  test("a missing descriptor, wrong token or refused connection is not live", async () => {
    expect(await discover("6".repeat(64))).toMatchObject({ kind: "selection-required" });

    const id = "7".repeat(64);
    const port = await startBridge(id, "c".repeat(64));
    const wrong = new BridgeDescriptorWriter(id, port, () => NOW);
    const descriptor = { ...wrong.descriptor(), token: "d".repeat(64) };
    await writeFile(descriptorPath(id), JSON.stringify(descriptor), { mode: 0o600 });
    expect(await discover(id)).toMatchObject({ kind: "missing" });
    await rm(descriptorPath(id));

    const refused = new BridgeDescriptorWriter("8".repeat(64), 9, () => NOW);
    await refused.publish();
    expect(await discover("8".repeat(64))).toMatchObject({ kind: "missing" });
    await refused.cleanup();
  });
});
