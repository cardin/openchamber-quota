import { HostRequestError } from "@openchamber/sdk";
import type { SettingsEnvelope, Snapshot } from "../core/types.ts";
import { BridgeTiming } from "../core/bridge.ts";
import type { ServiceCall } from "./host.ts";

export class SnapshotController {
  private timer: ReturnType<typeof setInterval> | null = null;
  private settingsTimer: ReturnType<typeof setInterval> | null = null;
  private refreshing = false;
  private generation = 0;
  private stopped = false;
  private refreshController: AbortController | null = null;
  private refreshDeadline: ReturnType<typeof setTimeout> | null = null;
  private cancelPollDelay: (() => void) | null = null;

  constructor(
    private readonly call: ServiceCall,
    private readonly onSnapshot: (snapshot: Snapshot) => void,
    private readonly onSettings?: (settings: SettingsEnvelope) => void,
    private readonly intervalMs = 5_000,
    private readonly onApprovalRequired?: (required: boolean) => void,
  ) {}

  async load(signal?: AbortSignal): Promise<Snapshot | null> {
    if (this.stopped) return null;
    const generation = this.generation;
    try {
      const response = await this.call({ method: "GET", path: "/snapshot" });
      if (generation !== this.generation || signal?.aborted) return null;
      if (response.status === 200 && response.body && typeof response.body === "object") {
        const snapshot = response.body as Snapshot;
        if (snapshot.version === 1) {
          this.onApprovalRequired?.(false);
          this.onSnapshot(snapshot);
          return snapshot;
        }
      }
    } catch (error) {
      this.handleRefusal(error, generation, signal);
    }
    return null;
  }

  async loadSettings(signal?: AbortSignal): Promise<SettingsEnvelope | null> {
    if (this.stopped) return null;
    const generation = this.generation;
    try {
      const response = await this.call({ method: "GET", path: "/settings" });
      if (generation !== this.generation || signal?.aborted) return null;
      if (response.status === 200 && response.body && typeof response.body === "object") {
        const envelope = response.body as SettingsEnvelope;
        if (envelope.version === 1 && envelope.selection) {
          this.onSettings?.(envelope);
          return envelope;
        }
      }
    } catch (error) {
      this.handleRefusal(error, generation, signal);
    }
    return null;
  }

  private handleRefusal(error: unknown, generation: number, signal?: AbortSignal): boolean {
    if (!(error instanceof HostRequestError) || error.code !== "NO_SERVICE") return false;
    if (generation === this.generation && !signal?.aborted) this.onApprovalRequired?.(true);
    return true;
  }

  async refresh(): Promise<void> {
    if (this.stopped || this.refreshing) return;
    const generation = this.generation;
    this.refreshing = true;
    const controller = new AbortController();
    this.refreshController = controller;
    const { signal } = controller;
    const expired = new Promise<void>((resolve) => {
      signal.addEventListener("abort", () => resolve(), { once: true });
    });
    const timer = setTimeout(() => controller.abort(), BridgeTiming.sectionWaitMs);
    this.refreshDeadline = timer;
    const run = async () => {
      try {
        await this.call({ method: "POST", path: "/refresh" });
        await this.pollUntilIdle(generation, signal);
      } catch (error) {
        if (!this.handleRefusal(error, generation, signal) && !signal.aborted) {
          await this.load(signal);
        }
      }
    };
    await Promise.race([run(), expired]);
    clearTimeout(timer);
    if (this.refreshController !== controller) return;
    this.refreshController = null;
    this.refreshDeadline = null;
    this.cancelPollDelay?.();
    this.refreshing = false;
  }

  async start(): Promise<void> {
    if (this.timer !== null) return;
    this.stopped = false;
    const settings = this.loadSettings();
    void this.load();
    void this.refresh();
    this.timer = setInterval(() => void this.load(), this.intervalMs);
    this.settingsTimer = setInterval(() => void this.loadSettings(), this.intervalMs);
    await settings;
  }

  stop(): void {
    this.stopped = true;
    this.generation++;
    this.refreshing = false;
    this.refreshController?.abort();
    this.refreshController = null;
    if (this.refreshDeadline !== null) clearTimeout(this.refreshDeadline);
    this.refreshDeadline = null;
    if (this.timer !== null) clearInterval(this.timer);
    if (this.settingsTimer !== null) clearInterval(this.settingsTimer);
    this.timer = null;
    this.settingsTimer = null;
    this.cancelPollDelay?.();
  }

  private async pollUntilIdle(generation: number, signal: AbortSignal): Promise<void> {
    while (generation === this.generation && !signal.aborted) {
      const snapshot = await this.load(signal);
      if (signal.aborted) return;
      await this.loadSettings(signal);
      if (
        generation !== this.generation ||
        signal.aborted ||
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
