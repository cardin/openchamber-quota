import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { BRIDGE_PROVIDER_IDS } from "./bridge.ts";
import type { BridgeDescriptor, BridgeProviderId } from "./types.ts";

const PLATFORM = process.platform;

export const canonicalDataDir = (dataDir: string): string =>
  path.resolve(dataDir).replace(/[\\/]+$/, "") || path.parse(path.resolve(dataDir)).root;

/**
 * Stable server identity: the canonical extension service data directory.
 * Clients of one server share this directory; another server has another id.
 */
export const serverIdFor = (dataDir: string): string =>
  createHash("sha256").update(canonicalDataDir(dataDir)).digest("hex");

export const bridgesDir = (env: NodeJS.ProcessEnv = process.env, home = os.homedir()): string => {
  if (PLATFORM === "win32") {
    const local = env.LOCALAPPDATA ?? path.join(home, "AppData", "Local");
    return path.join(local, "openchamber-quota", "bridges");
  }
  const configHome = env.XDG_CONFIG_HOME ?? path.join(home, ".config");
  return path.join(configHome, "openchamber-quota", "bridges");
};

export const descriptorPath = (
  serverId: string,
  env: NodeJS.ProcessEnv = process.env,
  home = os.homedir(),
): string => path.join(bridgesDir(env, home), `${serverId}.json`);

export const pluginStatePath = (
  serverId: string,
  env: NodeJS.ProcessEnv = process.env,
  home = os.homedir(),
): string =>
  path.join(path.dirname(bridgesDir(env, home)), "plugin-state", `${serverId}.json`);

export const isBridgeDescriptor = (value: unknown): value is BridgeDescriptor => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Record<string, unknown>;
  if (entry.version !== 1) return false;
  if (typeof entry.serverId !== "string" || !/^[0-9a-f]{64}$/.test(entry.serverId)) return false;
  if (typeof entry.port !== "number" || !Number.isInteger(entry.port)) return false;
  if (entry.port < 1 || entry.port > 65_535) return false;
  if (typeof entry.token !== "string" || entry.token.length < 16 || entry.token.length > 256) {
    return false;
  }
  if (!Array.isArray(entry.providers) || entry.providers.length !== BRIDGE_PROVIDER_IDS.length) {
    return false;
  }
  const ids = new Set<BridgeProviderId>();
  for (const provider of entry.providers) {
    if (!(BRIDGE_PROVIDER_IDS as readonly unknown[]).includes(provider)) return false;
    ids.add(provider as BridgeProviderId);
  }
  if (ids.size !== BRIDGE_PROVIDER_IDS.length) return false;
  return typeof entry.createdAt === "string" && Number.isFinite(Date.parse(entry.createdAt));
};

export const descriptorUrl = (descriptor: Pick<BridgeDescriptor, "port">, route: string): string =>
  `http://127.0.0.1:${descriptor.port}${route}`;
