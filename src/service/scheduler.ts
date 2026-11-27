import { EVENT_MIN_INTERVAL_MS, backoffMs } from "../core/bridge.ts";

type SchedulerState = {
  inFlight: boolean;
  lastAttempt: number;
  retryAt: number;
  failures: number;
};

export type SchedulerSnapshot = Record<
  string,
  { lastAttempt: number; retryAt: number; failures?: number }
>;

export class Scheduler {
  private readonly states = new Map<string, SchedulerState>();

  exportState(): SchedulerSnapshot {
    const result: SchedulerSnapshot = {};
    for (const [id, state] of this.states) {
      result[id] = {
        lastAttempt: state.lastAttempt,
        retryAt: state.retryAt,
        failures: state.failures,
      };
    }
    return result;
  }

  importState(state: SchedulerSnapshot | undefined): void {
    if (!state || typeof state !== "object") return;
    for (const [id, value] of Object.entries(state)) {
      if (!value || typeof value !== "object") continue;
      const lastAttempt = Number(value.lastAttempt);
      const retryAt = Number(value.retryAt);
      const failures = Number(value.failures);
      this.states.set(id, {
        inFlight: false,
        lastAttempt: Number.isFinite(lastAttempt) && lastAttempt > 0 ? lastAttempt : 0,
        retryAt: Number.isFinite(retryAt) && retryAt > 0 ? retryAt : 0,
        failures: Number.isFinite(failures) && failures > 0 ? Math.floor(failures) : 0,
      });
    }
  }

  private state(id: string): SchedulerState {
    const current = this.states.get(id);
    if (current) return current;
    const next = { inFlight: false, lastAttempt: 0, retryAt: 0, failures: 0 };
    this.states.set(id, next);
    return next;
  }

  isRefreshing(id: string): boolean {
    return this.state(id).inFlight;
  }

  private waitUntil(state: SchedulerState, minIntervalMs: number): number {
    const intervalAt = state.lastAttempt
      ? state.lastAttempt + Math.max(minIntervalMs, backoffMs(state.failures))
      : 0;
    return Math.max(intervalAt, state.retryAt);
  }

  nextAllowedAt(id: string, minIntervalMs: number, now: number): number {
    return Math.max(now, this.waitUntil(this.state(id), minIntervalMs));
  }

  begin(id: string, minIntervalMs: number, now: number, options: { manual?: boolean } = {}): boolean {
    const state = this.state(id);
    if (state.inFlight) return false;
    const floor =
      options.manual && state.lastAttempt
        ? state.lastAttempt + Math.max(EVENT_MIN_INTERVAL_MS, backoffMs(state.failures))
        : this.waitUntil(state, minIntervalMs);
    if (now < Math.max(floor, state.retryAt)) return false;
    state.inFlight = true;
    state.lastAttempt = now;
    return true;
  }

  finish(id: string, retryAt?: number, failed = false): void {
    const state = this.state(id);
    state.inFlight = false;
    state.failures = failed ? state.failures + 1 : 0;
    if (retryAt) state.retryAt = retryAt;
    else if (!failed) state.retryAt = 0;
  }

  reset(id: string): void {
    this.states.delete(id);
  }
}
