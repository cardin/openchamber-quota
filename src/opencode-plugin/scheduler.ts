import { BRIDGE_PROVIDER_IDS, EVENT_MIN_INTERVAL_MS, RETRY_WAIT_MAX_MS, backoffMs } from "../core/bridge.ts";
import type { BridgeProviderId, ProviderSnapshot } from "../core/types.ts";

export type PersistedSchedule = {
  lastAttemptAt: number | null;
  nextAllowedAt: number;
  retryAt: number | null;
  failures: number;
};

export type PersistedSchedules = {
  version: 1;
  providers: Partial<Record<BridgeProviderId, PersistedSchedule>>;
};

export type ScheduleReason = "poll" | "manual" | "event";

const emptySchedule = (): PersistedSchedule => ({
  lastAttemptAt: null,
  nextAllowedAt: 0,
  retryAt: null,
  failures: 0,
});

/**
 * One decision function for startup, timer, credential-event and manual
 * triggers: join running work, fetch when eligible, otherwise reuse the
 * in-memory outcome. Manual/event refreshes bypass the five-minute poll wait
 * but keep a 30-second floor and always honor Retry-After. Failures back off
 * from one to fifteen minutes.
 */
export class PluginScheduler {
  private readonly schedules = new Map<string, PersistedSchedule>();
  private readonly inFlight = new Map<string, Promise<ProviderSnapshot>>();
  private readonly results = new Map<string, ProviderSnapshot>();
  private observer: (() => void) | null = null;

  /** Persist timing changes as they happen so a reload cannot bypass them. */
  observe(observer: () => void): void {
    this.observer = observer;
  }

  private changed(): void {
    this.observer?.();
  }

  private schedule(id: string): PersistedSchedule {
    const current = this.schedules.get(id);
    if (current) return current;
    const next = emptySchedule();
    this.schedules.set(id, next);
    return next;
  }

  exportState(): PersistedSchedules {
    const providers: Partial<Record<BridgeProviderId, PersistedSchedule>> = {};
    for (const [id, state] of this.schedules) {
      providers[id as BridgeProviderId] = {
        lastAttemptAt: state.lastAttemptAt,
        nextAllowedAt: state.nextAllowedAt,
        retryAt: state.retryAt,
        failures: state.failures,
      };
    }
    return { version: 1, providers };
  }

  importState(state: PersistedSchedules | undefined): void {
    if (!state || state.version !== 1 || !state.providers) return;
    for (const [id, value] of Object.entries(state.providers)) {
      if (!value || typeof value !== "object") continue;
      const lastAttemptAt =
        typeof value.lastAttemptAt === "number" && Number.isFinite(value.lastAttemptAt)
          ? value.lastAttemptAt
          : null;
      const nextAllowedAt =
        typeof value.nextAllowedAt === "number" && Number.isFinite(value.nextAllowedAt)
          ? value.nextAllowedAt
          : 0;
      const retryAt =
        typeof value.retryAt === "number" && Number.isFinite(value.retryAt) ? value.retryAt : null;
      const failures =
        typeof value.failures === "number" && Number.isFinite(value.failures) && value.failures > 0
          ? Math.floor(value.failures)
          : 0;
      this.schedules.set(id, { lastAttemptAt, nextAllowedAt, retryAt, failures });
    }
  }

  clampNextAllowed(minimumMs: number): void {
    for (const state of this.schedules.values()) {
      if (state.lastAttemptAt === null) continue;
      const ceiling = state.lastAttemptAt + Math.max(minimumMs, backoffMs(state.failures));
      if (state.nextAllowedAt > ceiling) state.nextAllowedAt = ceiling;
    }
  }

  /** Earliest time any declared provider may attempt another fetch. */
  earliestDue(now: number): number {
    let earliest = Number.POSITIVE_INFINITY;
    for (const id of BRIDGE_PROVIDER_IDS) {
      const state = this.schedule(id);
      const due = Math.max(
        state.nextAllowedAt,
        state.retryAt ?? 0,
        state.lastAttemptAt === null ? now : 0,
      );
      earliest = Math.min(earliest, due);
    }
    return Number.isFinite(earliest) ? earliest : now;
  }

  eligible(id: string, now: number, reason: ScheduleReason): boolean {
    const state = this.schedule(id);
    if (state.retryAt !== null && now < state.retryAt) return false;
    if (reason !== "poll") {
      const floor = Math.max(EVENT_MIN_INTERVAL_MS, backoffMs(state.failures));
      return state.lastAttemptAt === null || now >= state.lastAttemptAt + floor;
    }
    return state.nextAllowedAt <= now;
  }

  result(id: string): ProviderSnapshot | undefined {
    const entry = this.results.get(id);
    return entry ? structuredClone(entry) : undefined;
  }

  complete(id: string, entry: ProviderSnapshot, now: number, minimumMs: number): void {
    this.results.set(id, structuredClone(entry));
    const state = this.schedule(id);
    if (entry.state !== "error") {
      state.failures = 0;
      state.retryAt = null;
      state.nextAllowedAt = now + minimumMs;
      this.changed();
      return;
    }
    state.failures += 1;
    state.nextAllowedAt = now + Math.max(minimumMs, backoffMs(state.failures));
    const retryAt = entry.error?.retryAt ? Date.parse(entry.error.retryAt) : NaN;
    if (Number.isFinite(retryAt) && retryAt > now) {
      state.retryAt = Math.min(retryAt, now + RETRY_WAIT_MAX_MS);
    }
    this.changed();
  }

  async run(
    id: string,
    minimumMs: number,
    now: () => number,
    task: () => Promise<ProviderSnapshot>,
    options: { reason?: ScheduleReason } = {},
  ): Promise<{ entry: ProviderSnapshot; joined: boolean; fetched: boolean } | null> {
    const running = this.inFlight.get(id);
    if (running) {
      return { entry: await running, joined: true, fetched: false };
    }
    const current = now();
    const reason = options.reason ?? "poll";
    if (reason === "poll") {
      const state = this.schedule(id);
      if (state.lastAttemptAt !== null) {
        const ceiling = state.lastAttemptAt + Math.max(minimumMs, backoffMs(state.failures));
        if (state.nextAllowedAt > ceiling) state.nextAllowedAt = ceiling;
      }
    }
    if (!this.eligible(id, current, reason)) {
      const cached = this.results.get(id);
      return cached ? { entry: structuredClone(cached), joined: false, fetched: false } : null;
    }
    const state = this.schedule(id);
    state.lastAttemptAt = current;
    state.nextAllowedAt = current + (reason === "poll" ? minimumMs : EVENT_MIN_INTERVAL_MS);
    this.changed();
    const work = task().then((entry) => {
      if (this.inFlight.get(id) === work) this.complete(id, entry, now(), minimumMs);
      return entry;
    });
    this.inFlight.set(id, work);
    try {
      return { entry: await work, joined: false, fetched: true };
    } finally {
      if (this.inFlight.get(id) === work) this.inFlight.delete(id);
    }
  }

  isInFlight(id: string): boolean {
    return this.inFlight.has(id);
  }

  reset(id?: string): void {
    if (id) {
      this.schedules.delete(id);
      this.results.delete(id);
      this.inFlight.delete(id);
      return;
    }
    this.schedules.clear();
    this.results.clear();
    this.inFlight.clear();
  }
}
