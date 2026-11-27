import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { acquireLock } from "../../src/opencode-plugin/index.ts";
import { pluginStatePath } from "../../src/core/bridge-path.ts";

const NOW = Date.parse("2026-11-25T12:00:00Z");
const serverId = "a".repeat(64);

describe("plugin coordinator lock", () => {
  test("takes over a live lock from an older provider set", async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), "quota-lock-"));
    const env = { XDG_CONFIG_HOME: home } as NodeJS.ProcessEnv;
    const file = pluginStatePath(serverId, env, home).replace(/\.json$/, ".lock");
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(
      file,
      JSON.stringify({
        version: 1,
        serverId,
        pid: process.pid,
        token: "old-build",
        heartbeatAt: NOW,
        providers: ["openrouter", "opencode-go", "opencode", "openai"],
      }),
    );
    try {
      const contenders = await Promise.all(
        Array.from({ length: 8 }, () => acquireLock(serverId, { env, home, now: () => NOW })),
      );
      const owners = contenders.filter((entry) => entry !== null);
      expect(owners).toHaveLength(1);
      const [lock] = owners;
      expect(lock).not.toBeNull();
      expect(lock?.token).not.toBe("old-build");
      const second = await acquireLock(serverId, { env, home, now: () => NOW });
      expect(second).toBeNull();
      await lock?.release();
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  });

  test("takes over a legacy lock that has no provider fingerprint", async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), "quota-lock-"));
    const env = { XDG_CONFIG_HOME: home } as NodeJS.ProcessEnv;
    const file = pluginStatePath(serverId, env, home).replace(/\.json$/, ".lock");
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(
      file,
      JSON.stringify({
        version: 1,
        serverId,
        pid: process.pid,
        token: "legacy",
        heartbeatAt: NOW,
      }),
    );
    try {
      const lock = await acquireLock(serverId, { env, home, now: () => NOW });
      expect(lock).not.toBeNull();
      await lock?.release();
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  });
});
