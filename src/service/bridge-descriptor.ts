import { randomBytes } from "node:crypto";
import { chmod, mkdir, readFile, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import {
  bridgesDir,
  descriptorPath,
  isBridgeDescriptor,
} from "../core/bridge-path.ts";
import { BRIDGE_PROVIDER_IDS } from "../core/bridge.ts";
import type { BridgeDescriptor as Descriptor } from "../core/types.ts";

const LOCK_STALE_MS = 2_000;
const LOCK_WAIT_MS = 3_000;

const pause = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    (timer as { unref?: () => void }).unref?.();
  });

/**
 * Serialize publication and cleanup across processes. The atomic mkdir is the
 * guard; a lock left by a dead process is reclaimed after a short age.
 */
const withDescriptorLock = async <T>(file: string, action: () => Promise<T>): Promise<T> => {
  const lock = `${file}.lock`;
  const startedAt = Date.now();
  for (;;) {
    try {
      await mkdir(lock);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try {
        const info = await stat(lock);
        if (Date.now() - info.mtimeMs > LOCK_STALE_MS) {
          await rm(lock, { recursive: true, force: true });
          continue;
        }
      } catch {
        continue;
      }
      if (Date.now() - startedAt > LOCK_WAIT_MS) {
        throw new Error("Timed out waiting for the bridge descriptor lock.");
      }
      await pause(5);
    }
  }
  try {
    return await action();
  } finally {
    await rm(lock, { recursive: true, force: true }).catch(() => undefined);
  }
};

export class BridgeDescriptorWriter {
  private readonly directory: string;
  private readonly file: string;
  private readonly data: Descriptor;

  constructor(
    serverId: string,
    port: number,
    private readonly now: () => number = Date.now,
  ) {
    this.directory = bridgesDir();
    this.file = descriptorPath(serverId);
    this.data = {
      version: 1,
      serverId,
      port,
      token: randomBytes(32).toString("hex"),
      providers: [...BRIDGE_PROVIDER_IDS],
      createdAt: new Date(now()).toISOString(),
    };
  }

  descriptor(): Descriptor {
    return structuredClone(this.data);
  }

  async publish(): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    try {
      await chmod(this.directory, 0o700);
    } catch {
      // Windows inherits the actual per-user ACL; prepare denies by default.
    }
    await withDescriptorLock(this.file, async () => {
      const temp = `${this.file}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`;
      await writeFile(temp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
      await rename(temp, this.file);
    });
  }

  /**
   * Remove only this process's descriptor. A replacement process with another
   * token or server id owns the file and is left alone.
   */
  async cleanup(): Promise<boolean> {
    try {
      return await withDescriptorLock(this.file, async () => {
        const parsed = JSON.parse(await readFile(this.file, "utf8")) as unknown;
        if (!isBridgeDescriptor(parsed)) return false;
        if (parsed.serverId !== this.data.serverId || parsed.token !== this.data.token) return false;
        await unlink(this.file);
        return true;
      });
    } catch {
      return false;
    }
  }
}
