import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { BRIDGE_PROVIDERS, isBridgeConnectionId } from "../core/bridge.ts";
import {
  markExplicitProvider,
  markExplicitWindow,
  normalizeSelection,
  reconcileFirstSuccess,
} from "../core/selection.ts";
import type {
  DisplaySelection,
  ProviderSnapshot,
  SettingsEnvelope,
} from "../core/types.ts";
import { DEFAULT_SELECTION } from "../core/types.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const ALLOWED_FIELDS = new Set([
  "saved",
  "providers",
  "providerVisibility",
  "providerOrder",
  "windows",
  "windowSelection",
  "collapsedProviders",
  "collapsedQuota",
  "hiddenBalances",
  "cutoffPercent",
  "resetTime",
  "quotaDisplay",
]);

const TRACKING_FIELDS = new Set([
  "encounteredBridgeProviders",
  "initializedBridgeWindows",
  "explicitProviderSelections",
  "explicitWindowSelections",
]);

const stringList = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  if (!value.every((entry) => typeof entry === "string" && entry.length >= 1 && entry.length <= 80)) {
    return null;
  }
  return [...new Set(value as string[])];
};

const validSelectionId = (id: string): boolean => id.length > 0 && id.length <= 80;

export type SettingsPatchResult =
  | { status: 200; envelope: SettingsEnvelope }
  | { status: 409; envelope: SettingsEnvelope }
  | { status: 400; message: string };

export class SettingsService {
  private readonly file: string;
  private data: SettingsEnvelope = {
    version: 1,
    revision: 0,
    selection: structuredClone(DEFAULT_SELECTION),
  };
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private readonly dataDir: string) {
    this.file = path.join(dataDir, "display.json");
  }

  async load(): Promise<void> {
    try {
      const parsed = JSON.parse(await readFile(this.file, "utf8")) as unknown;
      if (!isRecord(parsed)) return;
      const revision =
        typeof parsed.revision === "number" &&
        Number.isInteger(parsed.revision) &&
        parsed.revision >= 0
          ? parsed.revision
          : 0;
      this.data = {
        version: 1,
        revision,
        selection: normalizeSelection(parsed.selection),
      };
    } catch {
      // No settings document yet: defaults are correct and preserved on first write.
    }
  }

  get(): SettingsEnvelope {
    return structuredClone(this.data);
  }

  async patch(input: unknown): Promise<SettingsPatchResult> {
    if (!isRecord(input)) return { status: 400, message: "Body must be a JSON object." };
    const expectedRevision = input.expectedRevision;
    if (
      typeof expectedRevision !== "number" ||
      !Number.isInteger(expectedRevision) ||
      expectedRevision < 0
    ) {
      return { status: 400, message: "expectedRevision must be a nonnegative integer." };
    }
    if (!isRecord(input.changes) || Object.keys(input.changes).length === 0) {
      return { status: 400, message: "changes must be a nonempty object." };
    }
    if (expectedRevision !== this.data.revision) {
      return { status: 409, envelope: this.get() };
    }
    const changes = input.changes;
    for (const key of Object.keys(changes)) {
      if (TRACKING_FIELDS.has(key)) {
        return { status: 400, message: "Selection tracking is maintained by the service." };
      }
      if (!ALLOWED_FIELDS.has(key)) {
        return { status: 400, message: `Unknown field: ${key}.` };
      }
    }

    const next: DisplaySelection = structuredClone(this.data.selection);
    if (changes.saved !== undefined) {
      if (typeof changes.saved !== "boolean") return { status: 400, message: "saved must be a boolean." };
      next.saved = changes.saved;
    }
    if (changes.providers !== undefined) {
      const providers = stringList(changes.providers);
      if (!providers) return { status: 400, message: "providers must be unique ids." };
      next.providers = providers;
      next.saved = true;
      const previouslyVisible = this.data.selection.saved
        ? this.data.selection.providers.filter(isBridgeConnectionId)
        : BRIDGE_PROVIDERS.map((row) => row.connectionId);
      const touched = new Set([...previouslyVisible, ...providers.filter(isBridgeConnectionId)]);
      for (const id of touched) {
        next.explicitProviderSelections = markExplicitProvider(
          next,
          id,
        ).explicitProviderSelections;
      }
    }
    if (changes.providerVisibility !== undefined) {
      if (!isRecord(changes.providerVisibility)) {
        return { status: 400, message: "providerVisibility must be an object." };
      }
      const providers = new Set(next.providers);
      for (const [id, visible] of Object.entries(changes.providerVisibility)) {
        if (!validSelectionId(id) || typeof visible !== "boolean") {
          return { status: 400, message: "Each provider visibility edit needs an id and boolean." };
        }
        if (visible) providers.add(id);
        else providers.delete(id);
        next.explicitProviderSelections = markExplicitProvider(next, id).explicitProviderSelections;
      }
      next.providers = [...providers];
    }
    for (const field of ["windows", "windowSelection"] as const) {
      if (changes[field] === undefined) continue;
      const selections = changes[field];
      if (!isRecord(selections)) return { status: 400, message: `${field} must be an object.` };
      for (const [id, list] of Object.entries(selections)) {
        const windows = stringList(list);
        if (!validSelectionId(id) || !windows) {
          return { status: 400, message: "Each window selection needs a provider id and window ids." };
        }
        next.windows = { ...next.windows, [id]: windows };
        next.explicitWindowSelections = markExplicitWindow(next, id).explicitWindowSelections;
      }
      if (field === "windows") next.saved = true;
    }
    if (changes.providerOrder !== undefined) {
      const order = stringList(changes.providerOrder);
      if (!order) return { status: 400, message: "providerOrder must contain unique ids." };
      next.providerOrder = order;
    }
    if (changes.collapsedProviders !== undefined) {
      if (!isRecord(changes.collapsedProviders)) {
        return { status: 400, message: "collapsedProviders must be an object." };
      }
      const collapsed = new Set(next.collapsedProviders);
      for (const [id, value] of Object.entries(changes.collapsedProviders)) {
        if (id.length === 0 || id.length > 80 || typeof value !== "boolean") {
          return { status: 400, message: "Each collapsed provider must have a valid id and boolean state." };
        }
        if (value) collapsed.add(id);
        else collapsed.delete(id);
      }
      next.collapsedProviders = [...collapsed];
    }
    if (changes.collapsedQuota !== undefined) {
      if (!isRecord(changes.collapsedQuota)) {
        return { status: 400, message: "collapsedQuota must be an object." };
      }
      next.collapsedQuota = { ...next.collapsedQuota };
      for (const [providerId, mode] of Object.entries(changes.collapsedQuota)) {
        // A typed summary choice can prefix an 80-character reading ID.
        if (typeof mode !== "string" || mode.length === 0 ||
          (mode.length > 80 && !/^(?:window|cap|balance):[\s\S]{1,80}$/u.test(mode))) {
          return { status: 400, message: "Each collapsed quota mode must be a short string." };
        }
        next.collapsedQuota[providerId] = mode;
      }
    }
    if (changes.hiddenBalances !== undefined) {
      const hidden = stringList(changes.hiddenBalances);
      if (!hidden) return { status: 400, message: "hiddenBalances must contain unique ids." };
      next.hiddenBalances = hidden;
    }
    if (changes.cutoffPercent !== undefined) {
      if (
        typeof changes.cutoffPercent !== "number" ||
        !Number.isFinite(changes.cutoffPercent) ||
        changes.cutoffPercent < 0 ||
        changes.cutoffPercent > 100
      ) {
        return { status: 400, message: "cutoffPercent must be between 0 and 100." };
      }
      next.cutoffPercent = changes.cutoffPercent;
    }
    if (changes.resetTime !== undefined) {
      if (changes.resetTime !== "relative" && changes.resetTime !== "absolute") {
        return { status: 400, message: "resetTime must be relative or absolute." };
      }
      next.resetTime = changes.resetTime;
    }
    if (changes.quotaDisplay !== undefined) {
      if (changes.quotaDisplay !== "remaining" && changes.quotaDisplay !== "used") {
        return { status: 400, message: "quotaDisplay must be remaining or used." };
      }
      next.quotaDisplay = changes.quotaDisplay;
    }

    this.data = { version: 1, revision: this.data.revision + 1, selection: next };
    await this.save();
    return { status: 200, envelope: this.get() };
  }

  /**
   * Service-side first-success reconciliation runs once, not per browser window.
   * Encounter alone never initializes windows.
   */
  async reconcile(providers: ProviderSnapshot[]): Promise<boolean> {
    const next = reconcileFirstSuccess(this.data.selection, providers);
    if (next === this.data.selection) return false;
    this.data = { version: 1, revision: this.data.revision + 1, selection: next };
    await this.save();
    return true;
  }

  private save(): Promise<void> {
    const write = async (): Promise<void> => {
      await mkdir(this.dataDir, { recursive: true });
      const temp = `${this.file}.${process.pid}.${randomUUID()}.tmp`;
      await writeFile(temp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
      await rename(temp, this.file);
    };
    this.writeChain = this.writeChain.then(write, write);
    return this.writeChain;
  }
}

export { ALLOWED_FIELDS, TRACKING_FIELDS };
