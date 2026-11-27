import { readdir, readFile } from "node:fs/promises";
import {
  bridgesDir,
  descriptorPath,
  descriptorUrl,
  isBridgeDescriptor,
} from "../core/bridge-path.ts";
import { BRIDGE_PROVIDER_IDS } from "../core/bridge.ts";
import type { BridgeDescriptor, BridgeSnapshot, BridgeState } from "../core/types.ts";

export type Discovery =
  | { kind: "bound"; descriptor: BridgeDescriptor; state: BridgeState }
  | { kind: "missing" }
  | { kind: "ambiguous"; count: number }
  | { kind: "selection-required" };

export const isBridgeState = (value: unknown): value is BridgeState => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as Record<string, unknown>;
  if (state.version !== 1 || typeof state.serverId !== "string") return false;
  if (!Array.isArray(state.providers) || state.providers.length !== BRIDGE_PROVIDER_IDS.length) {
    return false;
  }
  if (!state.providers.every((id) => BRIDGE_PROVIDER_IDS.includes(id as never))) return false;
  if (typeof state.refreshRequested !== "boolean") return false;
  if (state.requestId !== null && typeof state.requestId !== "string") return false;
  if (state.deadlineAt !== null && typeof state.deadlineAt !== "number") return false;
  if (typeof state.serverTime !== "number") return false;
  const minimums = state.providerMinimums;
  if (!minimums || typeof minimums !== "object" || Array.isArray(minimums)) return false;
  return BRIDGE_PROVIDER_IDS.every((id) => {
    const value = (minimums as Record<string, unknown>)[id];
    return typeof value === "number" && Number.isFinite(value) && value > 0;
  });
};

const request = async <T>(
  descriptor: BridgeDescriptor,
  route: string,
  init: RequestInit,
  timeoutMs: number,
  read: (response: Response) => T | Promise<T>,
): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(descriptorUrl(descriptor, route), {
      ...init,
      redirect: "error",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${descriptor.token}`,
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    return await read(response);
  } finally {
    clearTimeout(timer);
  }
};

export const readDescriptor = async (serverId: string): Promise<BridgeDescriptor | null> => {
  try {
    const parsed = JSON.parse(await readFile(descriptorPath(serverId), "utf8")) as unknown;
    return isBridgeDescriptor(parsed) && parsed.serverId === serverId ? parsed : null;
  } catch {
    return null;
  }
};

export const listDescriptors = async (): Promise<BridgeDescriptor[]> => {
  let names: string[];
  try {
    names = await readdir(bridgesDir());
  } catch {
    return [];
  }
  const descriptors: BridgeDescriptor[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    try {
      const parsed = JSON.parse(await readFile(`${bridgesDir()}/${name}`, "utf8")) as unknown;
      if (isBridgeDescriptor(parsed)) descriptors.push(parsed);
    } catch {
      // Ignore unreadable foreign files.
    }
  }
  return descriptors;
};

export const fetchState = async (
  descriptor: BridgeDescriptor,
  timeoutMs = 2_000,
): Promise<BridgeState | null> => {
  try {
    const body = await request(descriptor, "/bridge/state", { method: "GET" }, timeoutMs,
      (response) => response.status === 200 ? response.json() as Promise<unknown> : null);
    if (!isBridgeState(body) || body.serverId !== descriptor.serverId) return null;
    return body;
  } catch {
    return null;
  }
};

const probe = async (descriptor: BridgeDescriptor): Promise<Discovery | null> => {
  const state = await fetchState(descriptor, 1_000);
  return state ? { kind: "bound", descriptor, state } : null;
};

/**
 * Explicit option first, then a sole verified live endpoint. Several live
 * endpoints without a selector are selection-required, never an arbitrary pick.
 */
export const discover = async (preferredServerId?: string): Promise<Discovery> => {
  if (preferredServerId) {
    const descriptor = await readDescriptor(preferredServerId);
    if (!descriptor) return { kind: "selection-required" };
    const state = await fetchState(descriptor, 1_000);
    return state ? { kind: "bound", descriptor, state } : { kind: "missing" };
  }
  const descriptors = await listDescriptors();
  if (descriptors.length === 0) return { kind: "missing" };
  const probed = await Promise.all(descriptors.map((descriptor) => probe(descriptor)));
  const live = probed.filter((entry): entry is Discovery => entry !== null);
  if (live.length === 0) return { kind: "missing" };
  if (live.length > 1) return { kind: "ambiguous", count: live.length };
  return live[0];
};

export const postSnapshot = async (
  descriptor: BridgeDescriptor,
  snapshot: BridgeSnapshot,
  timeoutMs = 1_000,
): Promise<"accepted" | "obsolete" | "failed"> => {
  try {
    const status = await request(
      descriptor,
      "/bridge/snapshot",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      },
      timeoutMs,
      (response) => response.status,
    );
    if (status === 200) return "accepted";
    if (status === 409) return "obsolete";
    return "failed";
  } catch {
    return "failed";
  }
};
