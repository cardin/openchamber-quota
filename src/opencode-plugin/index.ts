import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { BRIDGE_PROVIDER_IDS, BRIDGE_PROVIDERS, BridgeTiming, isBridgeProviderId } from "../core/bridge.ts";
import { pluginStatePath } from "../core/bridge-path.ts";
import { bridgeWaitingMessage } from "../core/snapshot-merge.ts";
import type {
  BridgeDescriptor,
  BridgeProviderId,
  BridgeSnapshot,
  BridgeState,
  ProviderSnapshot,
} from "../core/types.ts";
import type { AdapterContext } from "../providers/types.ts";
import type { HttpOptions, HttpResult } from "../core/http-error.ts";
import { errorEntry, fetchProvider } from "./fetch.ts";
import { requestJson } from "./http.ts";
import { PluginScheduler } from "./scheduler.ts";
import type { PersistedSchedules, ScheduleReason } from "./scheduler.ts";
import { discover, fetchState, postSnapshot } from "./bridge.ts";
import { resolveSelectedCredentials } from "./credentials.ts";
import type { CredentialOutcome, OpenCodeIntegration } from "./credentials.ts";

type Transport = (url: string, options: HttpOptions) => Promise<HttpResult>;

export type LoopDeps = {
  now?: () => number;
  discover: () => Promise<Awaited<ReturnType<typeof discover>>>;
  fetchState: (descriptor: BridgeDescriptor) => Promise<BridgeState | null>;
  post: (descriptor: BridgeDescriptor, snapshot: BridgeSnapshot) => Promise<"accepted" | "obsolete" | "failed">;
  credentials: (id: BridgeProviderId) => Promise<CredentialOutcome>;
  transport?: Transport;
  loadSchedules: () => Promise<PersistedSchedules | undefined>;
  saveSchedules: (state: PersistedSchedules) => Promise<void>;
  scheduler?: PluginScheduler;
  ownsLock?: () => Promise<boolean>;
  pollMs?: number;
  intervalMs?: number;
  maxReconnectMs?: number;
};

export type CycleResult = {
  providers: ProviderSnapshot[];
  generatedAt: string;
  fetched: BridgeProviderId[];
  cached: BridgeProviderId[];
  waiting: BridgeProviderId[];
};

export class BridgeLoop {
  private readonly now: () => number;
  private readonly scheduler: PluginScheduler;
  private bound: BridgeDescriptor | null = null;
  private lastState: BridgeState | null = null;
  private lastHandledRequest: string | null = null;
  private cyclePromise: Promise<CycleResult> | null = null;
  private ticking = false;
  private stopped = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private cycleTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectMs = 1_000;
  private nextDiscoveryAt = 0;
  private schedulesLoaded = false;
  private activeController: AbortController | null = null;
  private generation = 0;

  constructor(private readonly deps: LoopDeps) {
    this.now = deps.now ?? Date.now;
    this.scheduler = deps.scheduler ?? new PluginScheduler();
    // Write timing as each provider settles, so a reload between provider
    // completions still sees its floor and Retry-After.
    this.scheduler.observe(() => {
      void this.deps.saveSchedules(this.scheduler.exportState()).catch(() => undefined);
    });
  }

  start(): void {
    if (this.pollTimer !== null) return;
    this.stopped = false;
    this.pollTimer = setInterval(() => void this.tick().catch(() => undefined), this.deps.pollMs ?? BridgeTiming.statePollMs);
    this.pollTimer.unref?.();
    this.scheduleNextCycle();
    void this.tick().catch(() => undefined);
  }

  stop(): void {
    this.stopped = true;
    this.generation++;
    this.activeController?.abort();
    this.activeController = null;
    if (this.pollTimer !== null) clearInterval(this.pollTimer);
    if (this.cycleTimer !== null) clearTimeout(this.cycleTimer);
    this.pollTimer = null;
    this.cycleTimer = null;
    this.bound = null;
    this.lastState = null;
    this.lastHandledRequest = null;
    this.schedulesLoaded = false;
  }

  /**
   * Poll at the earliest provider due time, capped at the normal interval.
   * A delayed first bind therefore does not push the next eligible fetch a
   * full five minutes past its own floor.
   */
  private scheduleNextCycle(): void {
    if (this.stopped || !this.bound) return;
    if (this.cycleTimer !== null) clearTimeout(this.cycleTimer);
    const now = this.now();
    const interval = this.deps.intervalMs ?? BridgeTiming.fetchIntervalMs;
    const delay = Math.max(1, Math.min(interval, this.scheduler.earliestDue(now) - now));
    this.cycleTimer = setTimeout(() => {
      this.cycleTimer = null;
      void this.trigger(null).catch(() => undefined);
    }, delay);
    this.cycleTimer.unref?.();
  }

  boundServerId(): string | null {
    return this.bound?.serverId ?? null;
  }

  private async stillOwnsLock(): Promise<boolean> {
    if (!this.deps.ownsLock || await this.deps.ownsLock()) return true;
    this.stop();
    return false;
  }

  /** One discovery pass; healthy it runs every second. */
  async tick(): Promise<void> {
    if (this.stopped || this.ticking) return;
    if (this.now() < this.nextDiscoveryAt) return;
    this.ticking = true;
    const startedAt = this.now();
    const generation = this.generation;
    try {
      if (this.deps.ownsLock && !await this.stillOwnsLock()) return;
      const discovery = await this.deps.discover();
      if (this.stopped || generation !== this.generation) return;
      if (discovery.kind !== "bound") {
        this.bound = null;
        this.lastState = null;
        this.reconnectMs = Math.min(
          this.reconnectMs * 2,
          this.deps.maxReconnectMs ?? BridgeTiming.fetchIntervalMs,
        );
        this.nextDiscoveryAt = this.now() + this.reconnectMs;
        return;
      }
      this.reconnectMs = 1_000;
      this.nextDiscoveryAt = startedAt + (this.deps.pollMs ?? BridgeTiming.statePollMs);
      // A service restart drops the endpoint and later reappears with the same
      // server id; that is still a new binding for this loop.
      const firstBind = this.bound === null ||
        !this.schedulesLoaded ||
        this.bound.serverId !== discovery.descriptor.serverId;
      if (firstBind) {
        const schedules = await this.deps.loadSchedules();
        if (this.stopped || generation !== this.generation) return;
        this.scheduler.reset();
        this.scheduler.importState(schedules);
        this.scheduler.clampNextAllowed(BridgeTiming.fetchIntervalMs);
        this.schedulesLoaded = true;
        this.lastHandledRequest = null;
      }
      this.bound = discovery.descriptor;
      this.lastState = discovery.state;
      if (
        discovery.state.refreshRequested &&
        discovery.state.requestId &&
        discovery.state.requestId !== this.lastHandledRequest
      ) {
        this.lastHandledRequest = discovery.state.requestId;
        // Discovery keeps its one-second cadence while provider work runs.
        void this.trigger(discovery.state.requestId, discovery.descriptor, discovery.state).catch(
          () => undefined,
        );
      } else if (firstBind) {
        void this.trigger(null).catch(() => undefined);
      }
    } finally {
      this.ticking = false;
    }
  }

  /** Startup, timer, credential event and manual requests all end here. */
  async trigger(
    requestId: string | null,
    descriptor = this.bound,
    state = this.lastState,
    reason: ScheduleReason = requestId ? "manual" : "poll",
  ): Promise<CycleResult | null> {
    if (this.stopped || !descriptor) return null;
    const generation = this.generation;
    if (this.deps.ownsLock && !await this.stillOwnsLock()) return null;
    if (this.stopped || generation !== this.generation) return null;
    const result = await this.runCycle(reason, requestId ? state?.deadlineAt ?? null : null);
    if (this.stopped || generation !== this.generation) return null;
    if (this.deps.ownsLock && !await this.stillOwnsLock()) return null;
    if (this.stopped || generation !== this.generation) return null;
    const snapshot: BridgeSnapshot = {
      version: 1,
      serverId: descriptor.serverId,
      requestId,
      generatedAt: result.generatedAt,
      providers: result.providers,
    };
    try {
      const posted = await this.deps.post(descriptor, snapshot);
      if (requestId && posted === "failed" && this.lastHandledRequest === requestId) {
        // Let the next one-second discovery retry the same pending request with
        // the cached complete result.
        this.lastHandledRequest = null;
      }
      return result;
    } finally {
      this.scheduleNextCycle();
    }
  }

  private runCycle(reason: ScheduleReason, requestDeadline: number | null): Promise<CycleResult> {
    if (this.cyclePromise) return this.cyclePromise;
    this.cyclePromise = this.cycle(reason, requestDeadline).finally(() => {
      this.cyclePromise = null;
    });
    return this.cyclePromise;
  }

  private async cycle(reason: ScheduleReason, requestDeadline: number | null): Promise<CycleResult> {
    const startedAt = this.now();
    const deadlineAt = Math.min(
      startedAt + BridgeTiming.fetchTimeoutMs,
      requestDeadline === null ? Infinity : requestDeadline - BridgeTiming.publicationAllowanceMs,
    );
    const controller = new AbortController();
    this.activeController = controller;
    const timer = setTimeout(() => controller.abort(), Math.max(0, deadlineAt - startedAt));
    timer.unref?.();
    const expired = new Promise<void>((resolve) => {
      controller.signal.addEventListener("abort", () => resolve(), { once: true });
    });
    const fetched: BridgeProviderId[] = [];
    const cached: BridgeProviderId[] = [];
    const waiting: BridgeProviderId[] = [];
    try {
      const context: AdapterContext = {
        now: this.now,
        requestJson: this.deps.transport ?? requestJson,
        dataDir: "",
        deadlineAt,
        signal: controller.signal,
      };
      const providers = await Promise.all(
        BRIDGE_PROVIDERS.map(async (row) => {
          const minimum = this.lastState?.providerMinimums?.[row.id] ?? BridgeTiming.fetchIntervalMs;
            const joined = this.scheduler.isInFlight(row.id);
            const timeout = () => errorEntry(row, {
              code: "timeout",
              message: "The operation timed out.",
            });
            const work = this.scheduler.run(
            row.id,
            minimum,
            this.now,
            () => {
              if (this.now() >= deadlineAt || controller.signal.aborted) return Promise.resolve(timeout());
              const fetch = async () => {
                const outcome = await this.deps.credentials(row.id);
                if (controller.signal.aborted || this.now() >= deadlineAt) return timeout();
                return fetchProvider(row, outcome, context);
              };
              return Promise.race([
                fetch().catch(() => errorEntry(row, { code: "provider_error", message: "The provider request failed." })),
                expired.then(timeout),
              ]);
            },
              { reason },
            );
            const decision = joined
              ? await Promise.race([
                  work,
                  expired.then(() => ({ entry: timeout(), joined: true, fetched: false })),
                ])
              : await work;
          if (!decision) {
            waiting.push(row.id);
            return errorEntry(row, {
              code: "provider_error",
                message: bridgeWaitingMessage,
            });
          }
          if (decision.joined || !decision.fetched) cached.push(row.id);
          else fetched.push(row.id);
          return decision.entry;
        }),
      );
      const result = {
        providers,
        generatedAt: new Date(this.now()).toISOString(),
        fetched,
        cached,
        waiting,
      };
      if (!this.stopped) void this.deps.saveSchedules(this.scheduler.exportState()).catch(() => undefined);
      return result;
    } finally {
      clearTimeout(timer);
      controller.abort();
      if (this.activeController === controller) this.activeController = null;
    }
  }

  /** Credential changes are picked up by the next actual fetch (T038). */
  async credentialEvent(): Promise<void> {
    await this.trigger(null, this.bound, this.lastState, "event");
  }

  /** Let queued timing writes finish before the coordinator releases its lock. */
  async flush(): Promise<void> {
    try {
      await this.deps.saveSchedules(this.scheduler.exportState());
    } catch {
      // Best effort; a reload restores the last completed write.
    }
  }
}

type LockFile = {
  version: 1;
  serverId: string;
  pid: number;
  token: string;
  heartbeatAt: number;
  providers: string[];
};

const sameProviderSet = (providers: unknown): boolean =>
  Array.isArray(providers) &&
  providers.length === BRIDGE_PROVIDER_IDS.length &&
  BRIDGE_PROVIDER_IDS.every((id) => providers.includes(id));

const isLockFile = (value: unknown): value is LockFile => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const lock = value as Record<string, unknown>;
  return (
    lock.version === 1 &&
    typeof lock.serverId === "string" &&
    Number.isSafeInteger(lock.pid) && (lock.pid as number) > 0 &&
    typeof lock.token === "string" &&
    typeof lock.heartbeatAt === "number" &&
    sameProviderSet(lock.providers)
  );
};

const processAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
};

type LockOptions = {
  env?: NodeJS.ProcessEnv;
  home?: string;
  now?: () => number;
};

const lockPath = (serverId: string, env?: NodeJS.ProcessEnv, home?: string): string =>
  pluginStatePath(serverId, env, home).replace(/\.json$/, ".lock");

type CoordinatorLock = {
  token: string;
  owns: () => Promise<boolean>;
  beat: () => Promise<void>;
  release: () => Promise<void>;
};

// The kernel serializes short lock-file mutations and releases the guard if a
// claimant dies. A local port collision just defers acquisition to the next poll.
const withLockGuard = async <T>(file: string, action: () => Promise<T>): Promise<T | null> => {
  const port = 49_152 + (createHash("sha256").update(file).digest().readUInt16BE() % 16_384);
  const guard = createServer((socket) => socket.destroy());
  const listening = await new Promise<boolean>((resolve) => {
    guard.once("error", () => resolve(false));
    guard.listen({ host: "127.0.0.1", port, exclusive: true }, () => resolve(true));
  });
  if (!listening) return null;
  try {
    return await action();
  } finally {
    await new Promise<void>((resolve) => guard.close(() => resolve()));
  }
};

export const acquireLock = async (
  serverId: string,
  options: LockOptions = {},
): Promise<CoordinatorLock | null> => {
  const now = options.now ?? Date.now;
  const file = lockPath(serverId, options.env, options.home);
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const token = randomUUID();
  const read = async (): Promise<unknown> => {
    try {
      return JSON.parse(await readFile(file, "utf8")) as unknown;
    } catch (error) {
      if (error instanceof SyntaxError || (error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  };
  const write = async (): Promise<void> => {
    const temp = `${file}.${token}.tmp`;
    try {
      await writeFile(temp, JSON.stringify({
        version: 1,
        serverId,
        pid: process.pid,
        token,
        heartbeatAt: now(),
        providers: [...BRIDGE_PROVIDER_IDS],
      } satisfies LockFile), { mode: 0o600 });
      await rename(temp, file);
    } finally {
      await unlink(temp).catch(() => undefined);
    }
  };
  const owns = async (): Promise<boolean> => {
    const existing = await read();
    return isLockFile(existing) && existing.serverId === serverId && existing.token === token;
  };
  const acquired = await withLockGuard(file, async () => {
    const existing = await read();
    if (isLockFile(existing) && existing.serverId === serverId && processAlive(existing.pid)) {
      return false;
    }
    await write();
    return true;
  });
  if (!acquired) return null;
  return {
    token,
    owns,
    beat: async () => {
      await withLockGuard(file, async () => {
        if (await owns()) await write();
      });
    },
    release: async () => {
      while (await owns()) {
        const released = await withLockGuard(file, async () => {
          if (await owns()) await unlink(file);
          return true;
        });
        if (released) return;
        await new Promise<void>((resolve) => setTimeout(resolve, 50).unref());
      }
    },
  };
};

const writeSchedule = async (serverId: string, state: PersistedSchedules): Promise<void> => {
  const file = pluginStatePath(serverId);
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(state, null, 2), { mode: 0o600 });
  await rename(temp, file);
};

const readSchedule = async (serverId: string): Promise<PersistedSchedules | undefined> => {
  try {
    const parsed = JSON.parse(await readFile(pluginStatePath(serverId), "utf8")) as PersistedSchedules;
    return parsed && parsed.version === 1 ? parsed : undefined;
  } catch {
    return undefined;
  }
};

type PluginContext = {
  options?: Record<string, unknown>;
  integration?: OpenCodeIntegration;
  event?: {
    subscribe(options: {
      types: ("credential.updated" | "credential.switched")[];
      signal: AbortSignal;
    }): AsyncIterable<{ data?: { integrationID?: string } }>;
  };
};

const optionString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export const createLoop = (context: PluginContext, lock?: CoordinatorLock): BridgeLoop => {
  const preferred = optionString(context.options?.bridgeServerId);
  let serverId: string | null = null;
  let scheduleWrites = Promise.resolve();
  return new BridgeLoop({
    ownsLock: lock?.owns,
    discover: async () => {
      const result = await discover(preferred ?? serverId ?? undefined);
      if (result.kind === "bound") serverId = result.descriptor.serverId;
      return result;
    },
    fetchState: (descriptor) => fetchState(descriptor),
    post: (descriptor, snapshot) => postSnapshot(descriptor, snapshot),
    credentials: async (id) => {
      if (!context.integration) {
        return {
          ok: false,
          state: "unconfigured",
          code: "not_configured",
          message: "OpenCode did not report this credential.",
        };
      }
      const row = BRIDGE_PROVIDERS.find((entry) => entry.id === id);
      if (!row) {
        return {
          ok: false,
          state: "unconfigured",
          code: "not_configured",
          message: "OpenCode did not report this credential.",
        };
      }
      const map = await resolveSelectedCredentials(context.integration, Date.now, [row]);
      return (
        map.get(id) ?? {
          ok: false,
          state: "unconfigured",
          code: "not_configured",
          message: "OpenCode did not report this credential.",
        }
      );
    },
    loadSchedules: async () => (serverId ? readSchedule(serverId) : undefined),
    saveSchedules: (state) => {
      const bound = serverId;
      const write = async () => {
        if (bound && (!lock || await lock.owns())) await writeSchedule(bound, state);
      };
      scheduleWrites = scheduleWrites.then(write, write);
      return scheduleWrites;
    },
  });
};

const PLUGIN_ID = "openchamber.quota-display";

const plugin = {
  id: PLUGIN_ID,
  async setup(ctx: PluginContext): Promise<(() => void) | void> {
    let serverId = optionString(ctx.options?.bridgeServerId);
    let stopped = false;
    let finding = false;
    let lock: Awaited<ReturnType<typeof acquireLock>> = null;
    let loop: BridgeLoop | null = null;
    const find = async (): Promise<void> => {
      if (stopped || finding) return;
      finding = true;
      try {
        if (lock && await lock.owns()) return;
        loop?.stop();
        lock = null;
        const discovery = await discover(serverId);
        if (stopped || discovery.kind !== "bound") return;
        serverId = discovery.descriptor.serverId;
        const acquired = await acquireLock(serverId);
        if (!acquired) return;
        if (stopped) {
          await acquired.release();
          return;
        }
        lock = acquired;
        loop = createLoop({ ...ctx, options: { ...ctx.options, bridgeServerId: serverId } }, lock);
        loop.start();
      } finally {
        finding = false;
      }
    };
    void find().catch(() => undefined);
    const timer = setInterval(() => void find().catch(() => undefined), 1_000);
    const beat = setInterval(() => void lock?.beat().catch(() => undefined), 5_000);
    timer.unref?.();
    beat.unref?.();
    const events = new AbortController();
    const refreshCredentials = (): void => {
      void loop?.credentialEvent().catch(() => undefined);
    };
    if (ctx.event) {
      const stream = ctx.event;
      void (async () => {
        for await (const event of stream.subscribe({
          types: ["credential.updated", "credential.switched"],
          signal: events.signal,
        })) {
          if (isBridgeProviderId(event.data?.integrationID)) refreshCredentials();
        }
      })().catch(() => undefined);
    }
    return () => {
      stopped = true;
      events.abort();
      clearInterval(timer);
      clearInterval(beat);
      loop?.stop();
      const flushed = loop?.flush() ?? Promise.resolve();
      void flushed
        .finally(() => lock?.release())
        .catch(() => undefined);
    };
  },
};

export default plugin;
