import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
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
import { validateSnapshot } from "./snapshot-schema.ts";

type Deps = {
  store: CredentialStore;
  scheduler: Scheduler;
  dataDir: string;
  caBundle?: string;
  now?: () => number;
  codexHome?: string;
  requestJson?: typeof requestJson;
};

const emptyProvider = (connection: Connection): ProviderSnapshot => ({
  connectionId: connection.id,
  kind: connection.kind,
  label: connection.label,
  state: "loading",
  windows: [],
  caps: [],
  balances: [],
  refreshing: true,
});

const toQuotaError = (error: unknown): QuotaError => {
  if (error instanceof HttpError) {
    return {
      code: error.code,
      message: error.message,
      ...(error.retryAt ? { retryAt: error.retryAt } : {}),
    };
  }
  return { code: "provider_error", message: "The provider request failed." };
};

export class SnapshotService {
  private readonly providers = new Map<string, ProviderSnapshot>();
  private readonly retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private generatedAt = new Date(0).toISOString();
  private readonly now: () => number;

  constructor(private readonly deps: Deps) {
    this.now = deps.now ?? Date.now;
  }

  setCaBundle(caBundle?: string): void {
    this.deps.caBundle = caBundle;
  }

  async loadCache(): Promise<void> {
    try {
      const { scheduler, ...cached } = JSON.parse(
        await readFile(path.join(this.deps.dataDir, "cache.json"), "utf8"),
      ) as Snapshot & { scheduler?: ReturnType<Scheduler["exportState"]> };
      if (!validateSnapshot(cached)) return;
      this.generatedAt = cached.generatedAt;
      for (const provider of cached.providers) this.providers.set(provider.connectionId, provider);
      this.deps.scheduler.importState(scheduler);
    } catch {
      // No cache is fine.
    }
  }

  private context(): AdapterContext {
    return {
      now: this.now,
      requestJson: this.deps.requestJson ?? requestJson,
      dataDir: this.deps.dataDir,
      caBundle: this.deps.caBundle,
      codexHome: this.deps.codexHome,
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
    this.startRefresh(connection.id);
    return created;
  }

  getSnapshot(): Snapshot {
    const connections = this.deps.store.list();
    const ids = new Set(connections.map((connection) => connection.id));
    for (const id of this.providers.keys()) {
      if (!ids.has(id)) {
        this.providers.delete(id);
        this.clearRetry(id);
      }
    }
    return {
      version: 1,
      generatedAt: this.generatedAt,
      providers: connections.map((connection) => this.snapshotFor(connection)),
    };
  }

  isRefreshing(connectionId?: string): boolean {
    if (connectionId) return this.deps.scheduler.isRefreshing(connectionId);
    return this.deps.store.list().some((connection) =>
      this.deps.scheduler.isRefreshing(connection.id),
    );
  }

  startRefresh(connectionId?: string): void {
    void this.refresh(connectionId).catch(() => undefined);
  }

  async refresh(connectionId?: string): Promise<Snapshot> {
    const entries = connectionId
      ? this.deps.store.get(connectionId)
        ? [this.deps.store.get(connectionId)!]
        : []
      : this.deps.store.entries();
    await Promise.all(entries.map((entry) => this.refreshOne(entry)));
    this.generatedAt = new Date(this.now()).toISOString();
    await this.saveCache();
    return this.getSnapshot();
  }

  async refreshOne(entry: StoredConnection): Promise<void> {
    const provider = this.snapshotFor(entry);
    const adapter = ADAPTERS[entry.kind];
    if (!adapter) {
      provider.state = "error";
      provider.error = { code: "provider_error", message: "Unsupported provider." };
      provider.refreshing = false;
      return;
    }

    const now = this.now();
    if (!this.deps.scheduler.begin(entry.id, adapter.minIntervalMs, now)) {
      provider.refreshing = this.deps.scheduler.isRefreshing(entry.id);
      if (!provider.refreshing) this.scheduleRetry(entry, adapter.minIntervalMs);
      return;
    }
    this.clearRetry(entry.id);

    provider.refreshing = true;
    try {
      const result = await adapter.fetch(entry, this.context());
      assertAdapterResult(result);
      provider.state = "ok";
      provider.windows = result.windows;
      provider.caps = result.caps;
      provider.balances = result.balances;
      provider.fetchedAt = new Date(now).toISOString();
      provider.error = undefined;
      this.deps.scheduler.finish(entry.id);
    } catch (error) {
      const quotaError = toQuotaError(error);
      provider.state = "error";
      provider.windows = [];
      provider.caps = [];
      provider.balances = [];
      provider.error = quotaError;
      const retryAt = quotaError.retryAt ? Date.parse(quotaError.retryAt) : undefined;
      this.deps.scheduler.finish(entry.id, retryAt);
    } finally {
      provider.refreshing = false;
    }
  }

  private scheduleRetry(entry: StoredConnection, minIntervalMs: number): void {
    if (this.retryTimers.has(entry.id)) return;
    const now = this.now();
    const at = this.deps.scheduler.nextAllowedAt(entry.id, minIntervalMs, now);
    const delay = Math.max(500, at - now + 250);
    if (delay > 24 * 60 * 60 * 1000) return;
    const timer = setTimeout(() => {
      this.retryTimers.delete(entry.id);
      void this.refresh(entry.id).catch(() => undefined);
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
    try {
      assertAdapterResult(await adapter.fetch(entry, this.context()));
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
    }
  }

  private async saveCache(): Promise<void> {
    await mkdir(this.deps.dataDir, { recursive: true });
    const file = path.join(this.deps.dataDir, "cache.json");
    const temp = `${file}.${process.pid}.tmp`;
    await writeFile(
      temp,
      JSON.stringify({ ...this.getSnapshot(), scheduler: this.deps.scheduler.exportState() }, null, 2),
      { mode: 0o600 },
    );
    await rename(temp, file);
  }
}
