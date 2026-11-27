import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  BRIDGE_PROVIDERS,
  BridgeTiming,
  RETRY_WAIT_MAX_MS,
  isBridgeConnectionId,
} from "../core/bridge.ts";
import { serverIdFor } from "../core/bridge-path.ts";
import {
  bridgeUnavailableMessage,
  isStaleSample,
  markBridgePending,
  markBridgeUnavailable,
  mergeBridgeResult,
  notConfiguredEntry,
  sanitizeMessage,
} from "../core/snapshot-merge.ts";
import type {
  BridgeSnapshot,
  BridgeState,
  Connection,
  ProviderSnapshot,
  QuotaError,
  Snapshot,
  StoredConnection,
} from "../core/types.ts";
import { ADAPTERS } from "../providers/index.ts";
import { assertAdapterResult } from "../providers/validate.ts";
import type { AdapterContext } from "../providers/types.ts";
import { HttpError, requestJson } from "./http.ts";
import type { CredentialStore } from "./credentials.ts";
import type { Scheduler } from "./scheduler.ts";
import type { SettingsService } from "./settings.ts";
import { BridgeService } from "./bridge.ts";
import { validateSnapshot } from "./snapshot-schema.ts";

type Deps = {
  store: CredentialStore;
  scheduler: Scheduler;
  dataDir: string;
  now?: () => number;
  requestJson?: typeof requestJson;
  bridge?: BridgeService;
  settings?: SettingsService;
};

type CacheFile = Snapshot & {
  bridgeConnected?: boolean;
  bridgePublication?: number;
  lastSuccess?: Record<string, ProviderSnapshot>;
  scheduler?: ReturnType<Scheduler["exportState"]>;
};

const emptyProvider = (connection: Connection): ProviderSnapshot => ({
  connectionId: connection.id,
  kind: connection.kind,
  label: connection.label,
  state: "loading",
  windows: [],
  caps: [],
  balances: [],
  refreshing: false,
});

const toQuotaError = (error: unknown): QuotaError => {
  if (error instanceof HttpError) {
    return {
      code: error.code,
      message: sanitizeMessage(error.message),
      ...(error.retryAt ? { retryAt: error.retryAt } : {}),
    };
  }
  return { code: "provider_error", message: "The provider request failed." };
};

const transient = (error: QuotaError): boolean =>
  !["auth", "not_configured"].includes(error.code);

export class SnapshotService {
  private readonly providers = new Map<string, ProviderSnapshot>();
  private readonly lastSuccess = new Map<string, ProviderSnapshot>();
  private readonly retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private generatedAt = new Date(0).toISOString();
  private readonly now: () => number;
  private readonly bridge: BridgeService;
  private bridgeConnected = false;
  private cacheWrites = Promise.resolve();
  private serviceTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly deps: Deps) {
    this.now = deps.now ?? Date.now;
    this.bridge =
      deps.bridge ??
      new BridgeService({ serverId: serverIdFor(deps.dataDir), now: this.now });
  }

  private get settings(): SettingsService | undefined {
    return this.deps.settings;
  }

  start(): void {
    if (this.serviceTimer !== null) return;
    this.serviceTimer = setInterval(
      () => void this.refreshServiceProviders().catch(() => undefined),
      BridgeTiming.fetchIntervalMs,
    );
    this.serviceTimer.unref?.();
  }

  stop(): void {
    if (this.serviceTimer !== null) clearInterval(this.serviceTimer);
    this.serviceTimer = null;
  }

  async loadCache(): Promise<void> {
    try {
      const cached = JSON.parse(
        await readFile(path.join(this.deps.dataDir, "cache.json"), "utf8"),
      ) as CacheFile;
      if (
        !validateSnapshot({
          version: cached.version,
          generatedAt: cached.generatedAt,
          providers: cached.providers,
        })
      ) {
        return;
      }
      this.generatedAt = cached.generatedAt;
      this.bridgeConnected = cached.bridgeConnected === true ||
        Object.keys(cached.lastSuccess ?? {}).some(isBridgeConnectionId) ||
        cached.providers.some((provider) => isBridgeConnectionId(provider.connectionId) && provider.fetchedAt);
      this.bridge.restorePublication(cached.bridgePublication);
      for (const provider of cached.providers) {
        // Until this process receives a bridge result, a restored sample is
        // historical rather than a current reading.
        this.providers.set(
          provider.connectionId,
          isBridgeConnectionId(provider.connectionId) &&
            provider.state === "ok" &&
            provider.fetchedAt
            ? {
                ...provider,
                error: { code: "provider_error", message: bridgeUnavailableMessage },
              }
            : provider,
        );
      }
      const success = (provider: ProviderSnapshot): ProviderSnapshot => ({
        ...structuredClone(provider),
        error: undefined,
      });
      if (cached.lastSuccess && typeof cached.lastSuccess === "object") {
        for (const [id, provider] of Object.entries(cached.lastSuccess)) {
          this.lastSuccess.set(id, success(provider));
        }
      } else {
        for (const provider of cached.providers) {
          if (provider.state === "ok" && provider.fetchedAt) {
            this.lastSuccess.set(provider.connectionId, success(provider));
          }
        }
      }
      this.deps.scheduler.importState(cached.scheduler);
      this.ensureBridgeProviders();
    } catch {
      // No cache is fine.
    }
  }

  private ensureBridgeProviders(): void {
    for (const row of BRIDGE_PROVIDERS) {
      if (this.providers.has(row.connectionId)) continue;
      const success = this.lastSuccess.get(row.connectionId);
      this.providers.set(
        row.connectionId,
        success ? structuredClone(success) : notConfiguredEntry(row),
      );
    }
  }

  private context(deadlineAt: number, signal: AbortSignal): AdapterContext {
    return {
      now: this.now,
      requestJson: this.deps.requestJson ?? requestJson,
      dataDir: this.deps.dataDir,
      deadlineAt,
      signal,
    };
  }

  private snapshotFor(connection: Connection): ProviderSnapshot {
    const current = this.providers.get(connection.id);
    if (current) {
      current.kind = connection.kind;
      current.label = connection.label;
      return current;
    }
    const created = emptyProvider(connection);
    this.providers.set(connection.id, created);
    return created;
  }

  bridgeProviders(): ProviderSnapshot[] {
    this.ensureBridgeProviders();
    return BRIDGE_PROVIDERS.map((row) =>
      structuredClone(this.providers.get(row.connectionId)!),
    );
  }

  getSnapshot(): Snapshot {
    this.ensureBridgeProviders();
    if (this.bridge.isExpired()) {
      this.markUnavailable(bridgeUnavailableMessage);
    }
    const connections = this.deps.store.list();
    const ids = new Set(connections.map((connection) => connection.id));
    for (const id of this.providers.keys()) {
      if (ids.has(id) || BRIDGE_PROVIDERS.some((row) => row.connectionId === id)) continue;
      this.providers.delete(id);
      this.lastSuccess.delete(id);
      this.clearRetry(id);
    }
    const pending = this.bridge.pending();
    const bridgeEntries = BRIDGE_PROVIDERS.map((row) => {
      const entry = this.providers.get(row.connectionId)!;
      const current = entry.refreshing === pending ? entry : { ...entry, refreshing: pending };
      if (current.state === "ok" && !current.error && isStaleSample(current, this.now())) {
        return {
          ...current,
          error: {
            code: "provider_error" as const,
            message: "The last reading is more than ten minutes old.",
          },
        };
      }
      return current;
    });
    const serviceEntries = connections.map((connection) => {
      const entry = this.snapshotFor(connection);
      if (entry.state === "loading") this.startRefresh(connection.id);
      return entry;
    });
    return {
      version: 1,
      generatedAt: this.generatedAt,
      providers: [...serviceEntries, ...bridgeEntries],
    };
  }

  async refreshAll(): Promise<{ requestId: string; deadlineAt: number }> {
    const request = this.bridge.admit();
    if (this.bridge.isExpired()) this.markUnavailable(bridgeUnavailableMessage);
    this.markPending(true);
    void this.refreshServiceProviders(true).catch(() => undefined);
    return request;
  }

  /** Test/helper path: admit one cycle and wait for service-owned work. */
  async refreshAllAndWait(): Promise<{ requestId: string; deadlineAt: number }> {
    const request = this.bridge.admit();
    if (this.bridge.isExpired()) this.markUnavailable(bridgeUnavailableMessage);
    this.markPending(true);
    await this.refreshServiceProviders(true);
    return request;
  }

  async refreshServiceProviders(manual = false): Promise<void> {
    await Promise.all(this.deps.store.entries().map((entry) => this.refreshOne(entry, manual)));
    this.generatedAt = new Date(this.now()).toISOString();
    await this.saveCache();
  }

  isRefreshing(connectionId?: string): boolean {
    if (connectionId) return this.deps.scheduler.isRefreshing(connectionId);
    return this.bridge.pending() || this.deps.store.entries().some((entry) =>
      this.deps.scheduler.isRefreshing(entry.id),
    );
  }

  startRefresh(connectionId?: string): void {
    if (connectionId) {
      const entry = this.deps.store.get(connectionId);
      if (entry) void this.refreshOne(entry).catch(() => undefined);
      return;
    }
    void this.refreshAll().catch(() => undefined);
  }

  async refresh(connectionId?: string): Promise<Snapshot> {
    if (connectionId) {
      const entry = this.deps.store.get(connectionId);
      if (entry) await this.refreshOne(entry, true);
    } else {
      await this.refreshAllAndWait();
    }
    return this.getSnapshot();
  }

  async refreshOne(entry: StoredConnection, manual = false): Promise<void> {
    const provider = this.snapshotFor(entry);
    const adapter = ADAPTERS[entry.kind];
    if (!adapter) {
      provider.state = "error";
      provider.error = { code: "provider_error", message: "Unsupported provider." };
      provider.refreshing = false;
      return;
    }

    const now = this.now();
    if (!this.deps.scheduler.begin(entry.id, adapter.minIntervalMs, now, { manual })) {
      provider.refreshing = this.deps.scheduler.isRefreshing(entry.id);
      if (!provider.refreshing) this.scheduleRetry(entry, adapter.minIntervalMs);
      return;
    }
    this.clearRetry(entry.id);

    provider.refreshing = true;
    const controller = new AbortController();
    const deadlineAt = now + BridgeTiming.fetchTimeoutMs;
    const timer = setTimeout(() => controller.abort(), BridgeTiming.fetchTimeoutMs);
    timer.unref?.();
    try {
      const result = await adapter.fetch(entry, this.context(deadlineAt, controller.signal));
      assertAdapterResult(result);
      const fresh: ProviderSnapshot = {
        ...provider,
        state: "ok",
        windows: result.windows,
        caps: result.caps,
        balances: result.balances,
        fetchedAt: new Date(this.now()).toISOString(),
        refreshing: false,
        error: undefined,
      };
      this.providers.set(entry.id, fresh);
      this.lastSuccess.set(entry.id, structuredClone(fresh));
      this.deps.scheduler.finish(entry.id);
    } catch (error) {
      const quotaError = toQuotaError(error);
      const sample = this.lastSuccess.get(entry.id);
      if (sample && transient(quotaError)) {
        this.providers.set(entry.id, {
          ...structuredClone(sample),
          state: "ok",
          refreshing: false,
          error: { code: "provider_error", message: quotaError.message },
        });
      } else {
        this.providers.set(entry.id, {
          ...provider,
          state: "error",
          windows: [],
          caps: [],
          balances: [],
          refreshing: false,
          error: quotaError,
        });
      }
      const retryAt = quotaError.retryAt ? Date.parse(quotaError.retryAt) : undefined;
      this.deps.scheduler.finish(
        entry.id,
        retryAt && Number.isFinite(retryAt)
          ? Math.min(retryAt, this.now() + RETRY_WAIT_MAX_MS)
          : undefined,
        true,
      );
    } finally {
      clearTimeout(timer);
      const current = this.providers.get(entry.id);
      if (current) current.refreshing = false;
    }
  }

  private markPending(pending: boolean): void {
    const state = {
      current: Object.fromEntries(this.providers),
      lastSuccess: Object.fromEntries(this.lastSuccess),
    };
    const merged = markBridgePending(state, pending);
    for (const row of BRIDGE_PROVIDERS) {
      const entry = merged.current[row.connectionId];
      if (entry) this.providers.set(row.connectionId, entry);
    }
  }

  private markUnavailable(message: string): void {
    const state = markBridgeUnavailable(
      {
        current: Object.fromEntries(this.providers),
        lastSuccess: Object.fromEntries(this.lastSuccess),
      },
      this.now(),
      message,
      this.bridgeConnected,
    );
    for (const row of BRIDGE_PROVIDERS) {
      const entry = state.current[row.connectionId];
      if (entry) this.providers.set(row.connectionId, entry);
    }
    this.generatedAt = new Date(this.now()).toISOString();
  }

  async acceptBridge(snapshot: BridgeSnapshot): Promise<void> {
    this.bridgeConnected = true;
    const merged = mergeBridgeResult(
      {
        current: Object.fromEntries(this.providers),
        lastSuccess: Object.fromEntries(this.lastSuccess),
      },
      snapshot.providers,
      this.now(),
    );
    for (const row of BRIDGE_PROVIDERS) {
      const entry = merged.current[row.connectionId];
      if (entry) {
        entry.refreshing = false;
        this.providers.set(row.connectionId, entry);
      }
      const success = merged.lastSuccess[row.connectionId];
      if (success) this.lastSuccess.set(row.connectionId, success);
      else this.lastSuccess.delete(row.connectionId);
    }
    this.generatedAt = new Date(this.now()).toISOString();
    await this.settings?.reconcile(this.bridgeProviders());
    await this.saveCache();
  }

  async acceptBridgeInput(
    input: unknown,
  ): Promise<{ ok: true; requestId: string | null } | { ok: false; status: number; message: string }> {
    const accepted = this.bridge.accept(input);
    if (this.bridge.isExpired()) this.markUnavailable(bridgeUnavailableMessage);
    if (!accepted.ok) return accepted;
    await this.acceptBridge(accepted.snapshot);
    return { ok: true, requestId: accepted.snapshot.requestId };
  }

  async bridgeState(): Promise<BridgeState> {
    if (this.bridge.isExpired()) {
      this.markUnavailable(bridgeUnavailableMessage);
      await this.saveCache();
    }
    return this.bridge.state();
  }

  private scheduleRetry(entry: StoredConnection, minIntervalMs: number): void {
    if (this.retryTimers.has(entry.id)) return;
    const now = this.now();
    const at = this.deps.scheduler.nextAllowedAt(entry.id, minIntervalMs, now);
    const delay = Math.max(500, at - now + 250);
    if (delay > 24 * 60 * 60 * 1000) return;
    const timer = setTimeout(() => {
      this.retryTimers.delete(entry.id);
      void this.refreshServiceProviders().catch(() => undefined);
    }, delay);
    timer.unref?.();
    this.retryTimers.set(entry.id, timer);
  }

  private clearRetry(id: string): void {
    const timer = this.retryTimers.get(id);
    if (!timer) return;
    clearTimeout(timer);
    this.retryTimers.delete(id);
  }

  async testConnection(id: string): Promise<{ ok: boolean; error?: QuotaError }> {
    const entry = this.deps.store.get(id);
    if (!entry) return { ok: false, error: { code: "not_configured", message: "No connection." } };
    const adapter = ADAPTERS[entry.kind];
    if (!adapter) return { ok: false, error: { code: "provider_error", message: "Unsupported provider." } };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), BridgeTiming.fetchTimeoutMs);
    timer.unref?.();
    try {
      assertAdapterResult(
        await adapter.fetch(
          entry,
          this.context(this.now() + BridgeTiming.fetchTimeoutMs, controller.signal),
        ),
      );
      await this.deps.store.setTestResult(id, "ok");
      return { ok: true };
    } catch (error) {
      const quotaError = toQuotaError(error);
      const result =
        quotaError.code === "auth"
          ? "auth"
          : quotaError.code === "network" || quotaError.code === "timeout"
            ? "network"
            : quotaError.code === "bad_response"
              ? "bad_response"
              : "provider_error";
      await this.deps.store.setTestResult(id, result);
      return { ok: false, error: quotaError };
    } finally {
      clearTimeout(timer);
    }
  }

  private saveCache(): Promise<void> {
    const write = async () => {
      await mkdir(this.deps.dataDir, { recursive: true });
      const file = path.join(this.deps.dataDir, "cache.json");
      const temp = `${file}.${process.pid}.${randomUUID()}.tmp`;
      const payload = {
        ...this.getSnapshot(),
        bridgeConnected: this.bridgeConnected,
        bridgePublication: this.bridge.lastPublication(),
        lastSuccess: Object.fromEntries(this.lastSuccess),
        scheduler: this.deps.scheduler.exportState(),
      };
      await writeFile(temp, JSON.stringify(payload, null, 2), { mode: 0o600 });
      await rename(temp, file);
    };
    this.cacheWrites = this.cacheWrites.then(write, write);
    return this.cacheWrites;
  }
}
