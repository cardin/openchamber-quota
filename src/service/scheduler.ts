type SchedulerState = {
  inFlight: boolean;
  lastAttempt: number;
  retryAt: number;
};

export type SchedulerSnapshot = Record<string, { lastAttempt: number; retryAt: number }>;

export class Scheduler {
  private readonly states = new Map<string, SchedulerState>();

  exportState(): SchedulerSnapshot {
    const result: SchedulerSnapshot = {};
    for (const [id, state] of this.states) {
      result[id] = { lastAttempt: state.lastAttempt, retryAt: state.retryAt };
    }
    return result;
  }

  importState(state: SchedulerSnapshot | undefined): void {
    if (!state || typeof state !== "object") return;
    for (const [id, value] of Object.entries(state)) {
      if (!value || typeof value !== "object") continue;
      const lastAttempt = Number(value.lastAttempt);
      const retryAt = Number(value.retryAt);
      this.states.set(id, {
        inFlight: false,
        lastAttempt: Number.isFinite(lastAttempt) && lastAttempt > 0 ? lastAttempt : 0,
        retryAt: Number.isFinite(retryAt) && retryAt > 0 ? retryAt : 0,
      });
    }
  }

  private state(id: string): SchedulerState {
    const current = this.states.get(id);
    if (current) return current;
    const next = { inFlight: false, lastAttempt: 0, retryAt: 0 };
    this.states.set(id, next);
    return next;
  }

  isRefreshing(id: string): boolean {
    return this.state(id).inFlight;
  }

  nextAllowedAt(id: string, minIntervalMs: number, now: number): number {
    const state = this.state(id);
    const intervalAt = state.lastAttempt ? state.lastAttempt + minIntervalMs : 0;
    return Math.max(now, intervalAt, state.retryAt);
  }

  begin(id: string, minIntervalMs: number, now: number): boolean {
    const state = this.state(id);
    if (state.inFlight) return false;
    if (state.retryAt && now < state.retryAt) return false;
    if (state.lastAttempt && now - state.lastAttempt < minIntervalMs) return false;
    state.inFlight = true;
    state.lastAttempt = now;
    return true;
  }

  finish(id: string, retryAt?: number): void {
    const state = this.state(id);
    state.inFlight = false;
    if (retryAt) state.retryAt = retryAt;
  }

  reset(id: string): void {
    this.states.delete(id);
  }
}
