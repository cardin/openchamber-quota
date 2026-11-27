import { randomUUID } from "node:crypto";
import {
  BRIDGE_PROVIDER_IDS,
  BRIDGE_PROVIDERS,
  BridgeTiming,
  bridgeMinimums,
} from "../core/bridge.ts";
import type {
  BridgeProviderId,
  BridgeSnapshot,
  BridgeState,
  ProviderSnapshot,
} from "../core/types.ts";
import { validateSnapshot } from "./snapshot-schema.ts";
import { sanitizeMessage } from "../core/snapshot-merge.ts";

export type BridgeAccepted = { ok: true; snapshot: BridgeSnapshot };
export type BridgeRejected = { ok: false; status: number; message: string };

export type BridgeDeps = {
  serverId: string;
  now?: () => number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

const bridgeFields = new Set(["version", "serverId", "requestId", "generatedAt", "providers"]);

export class BridgeService {
  private requestId: string | null = null;
  private deadlineAt: number | null = null;
  private lastAcceptedGeneratedAt = 0;
  private expired = false;
  private readonly now: () => number;

  constructor(private readonly deps: BridgeDeps) {
    this.now = deps.now ?? Date.now;
  }

  admit(): { requestId: string; deadlineAt: number } {
    const now = this.now();
    this.expire(now);
    if (this.requestId && this.deadlineAt && now < this.deadlineAt) {
      return { requestId: this.requestId, deadlineAt: this.deadlineAt };
    }
    this.requestId = `refresh-${randomUUID()}`;
    this.deadlineAt = now + BridgeTiming.refreshTimeoutMs;
    return { requestId: this.requestId, deadlineAt: this.deadlineAt };
  }

  pending(): boolean {
    return this.requestId !== null;
  }

  lastPublication(): number {
    return this.lastAcceptedGeneratedAt;
  }

  restorePublication(value: unknown): void {
    if (typeof value === "number" && Number.isFinite(value)) {
      this.lastAcceptedGeneratedAt = Math.max(this.lastAcceptedGeneratedAt, value);
    }
  }

  isExpired(): boolean {
    this.expire(this.now());
    const expired = this.expired;
    this.expired = false;
    return expired;
  }

  expire(now = this.now()): boolean {
    if (this.requestId && this.deadlineAt !== null && now >= this.deadlineAt) {
      this.requestId = null;
      this.deadlineAt = null;
      this.expired = true;
      return true;
    }
    return false;
  }

  state(): BridgeState {
    const now = this.now();
    this.expire(now);
    return {
      version: 1,
      serverId: this.deps.serverId,
      providers: [...BRIDGE_PROVIDER_IDS],
      refreshRequested: this.requestId !== null,
      requestId: this.requestId,
      deadlineAt: this.deadlineAt,
      providerMinimums: bridgeMinimums(),
      serverTime: now,
    };
  }

  accept(input: unknown): BridgeAccepted | BridgeRejected {
    const now = this.now();
    this.expire(now);
    if (!isRecord(input)) return { ok: false, status: 400, message: "Body must be a JSON object." };
    if (Object.keys(input).some((key) => !bridgeFields.has(key))) {
      return { ok: false, status: 400, message: "Unknown bridge snapshot field." };
    }
    if (input.version !== 1) return { ok: false, status: 400, message: "Unsupported bridge version." };
    if (input.serverId !== this.deps.serverId) {
      return { ok: false, status: 400, message: "Bridge snapshot belongs to another server." };
    }
    if (input.requestId !== null && (typeof input.requestId !== "string" || !input.requestId || input.requestId.length > 200)) {
      return { ok: false, status: 400, message: "requestId must be a string or null." };
    }
    if (!isIsoDate(input.generatedAt)) {
      return { ok: false, status: 400, message: "generatedAt must be a date-time." };
    }
    if (!Array.isArray(input.providers)) {
      return { ok: false, status: 400, message: "providers must be an array." };
    }
    const providers = input.providers as ProviderSnapshot[];
    if (providers.length !== BRIDGE_PROVIDERS.length) {
      return { ok: false, status: 400, message: "A bridge result needs exactly six providers." };
    }
    const seenIds = new Set<string>();
    const seenKinds = new Set<string>();
    for (const provider of providers) {
      if (!isRecord(provider)) return { ok: false, status: 400, message: "Invalid provider entry." };
      const row = BRIDGE_PROVIDERS.find((candidate) => candidate.connectionId === provider.connectionId);
      if (!row || row.kind !== provider.kind || row.label !== provider.label) {
        return { ok: false, status: 400, message: "A bridge result has an undeclared provider." };
      }
      if (seenIds.has(provider.connectionId) || seenKinds.has(provider.kind)) {
        return { ok: false, status: 400, message: "A bridge result has duplicate providers." };
      }
      if (provider.state === "loading" || provider.refreshing !== false) {
        return { ok: false, status: 400, message: "A completed bridge result cannot still be refreshing." };
      }
      if (
        provider.state === "unconfigured" &&
        ((Array.isArray(provider.windows) && provider.windows.length > 0) ||
          (Array.isArray(provider.caps) && provider.caps.length > 0) ||
          (Array.isArray(provider.balances) && provider.balances.length > 0) ||
          provider.error?.code !== "not_configured")
      ) {
        return {
          ok: false,
          status: 400,
          message: "An unconfigured provider cannot report usage.",
        };
      }
      seenIds.add(provider.connectionId);
      seenKinds.add(provider.kind);
    }
    if (
      !validateSnapshot({
        version: 1,
        generatedAt: input.generatedAt,
        providers,
      })
    ) {
      return { ok: false, status: 400, message: "Invalid bridge snapshot." };
    }

    const generatedAt = Date.parse(input.generatedAt);
    const requestId = input.requestId as string | null;
    if (requestId !== null) {
      if (this.requestId !== requestId) {
        return {
          ok: false,
          status: 409,
          message: "The request is no longer pending; the result was not applied.",
        };
      }
    }
    if (generatedAt < this.lastAcceptedGeneratedAt) {
      return {
        ok: false,
        status: 409,
        message: "An older result cannot replace newer data.",
      };
    }

    const snapshot: BridgeSnapshot = {
      version: 1,
      serverId: this.deps.serverId,
      requestId,
      generatedAt: input.generatedAt,
      providers: providers.map((provider) => ({
        ...provider,
        windows: provider.windows.map((window) =>
          window.error
            ? { ...window, error: { ...window.error, message: sanitizeMessage(window.error.message) } }
            : window,
        ),
        ...(provider.error
          ? { error: { ...provider.error, message: sanitizeMessage(provider.error.message) } }
          : {}),
      })),
    };
    this.lastAcceptedGeneratedAt = Math.max(this.lastAcceptedGeneratedAt, generatedAt);
    if (requestId !== null) {
      this.requestId = null;
      this.deadlineAt = null;
    }
    return { ok: true, snapshot };
  }
}

export const bridgeProviderMinimum = (id: BridgeProviderId): number =>
  bridgeMinimums()[id];
