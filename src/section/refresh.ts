import type { Snapshot } from "../core/types.ts";
import type { ServiceCall } from "./host.ts";

export class SnapshotController {
  private timer: ReturnType<typeof setInterval> | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private refreshing = false;
  private generation = 0;
  private stopped = false;
  private cancelPollDelay: (() => void) | null = null;

  constructor(
    private readonly call: ServiceCall,
    private readonly onSnapshot: (snapshot: Snapshot) => void,
    private readonly intervalMs = 5_000,
    private readonly refreshIntervalMs = 60_000,
  ) {}

  async load(): Promise<Snapshot | null> {
    if (this.stopped) return null;
    const generation = this.generation;
    try {
      const response = await this.call({ method: "GET", path: "/snapshot" });
      if (generation !== this.generation) return null;
      if (response.status === 200 && response.body && typeof response.body === "object") {
        const snapshot = response.body as Snapshot;
        if (snapshot.version === 1) {
          this.onSnapshot(snapshot);
          return snapshot;
        }
      }
    } catch {
      // Keep the last render; the section shows the service error on refresh.
    }
    return null;
  }

  async refresh(connectionId?: string): Promise<void> {
    if (this.stopped || this.refreshing) return;
    const generation = this.generation;
    this.refreshing = true;
    try {
      await this.call({
        method: "POST",
        path: "/refresh",
        ...(connectionId ? { body: { connectionId } } : {}),
      });
      await this.pollUntilIdle(generation);
    } catch {
      if (generation === this.generation) await this.load();
    } finally {
      if (generation === this.generation) this.refreshing = false;
    }
  }

  start(): void {
    if (this.timer !== null) return;
    this.stopped = false;
    void this.load();
    void this.refresh();
    this.timer = setInterval(() => void this.load(), this.intervalMs);
    this.refreshTimer = setInterval(
      () => void this.refresh(),
      this.refreshIntervalMs,
    );
  }

  stop(): void {
    this.stopped = true;
    this.generation++;
    this.refreshing = false;
    if (this.timer !== null) clearInterval(this.timer);
    if (this.refreshTimer !== null) clearInterval(this.refreshTimer);
    this.timer = null;
    this.refreshTimer = null;
    this.cancelPollDelay?.();
  }

  private async pollUntilIdle(generation: number): Promise<void> {
    const deadline = Date.now() + 15_000;
    while (generation === this.generation && Date.now() < deadline) {
      const snapshot = await this.load();
      if (
        generation !== this.generation ||
        !snapshot ||
        snapshot.providers.every((provider) => !provider.refreshing)
      ) return;
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          this.cancelPollDelay = null;
          resolve();
        }, 500);
        this.cancelPollDelay = () => {
          clearTimeout(timer);
          this.cancelPollDelay = null;
          resolve();
        };
      });
    }
  }
}
