import { BRIDGE_PROVIDERS } from "./bridge.ts";
import type { DisplaySelection, ProviderSnapshot } from "./types.ts";
import { DEFAULT_SELECTION } from "./types.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0))]
    : [];

export const normalizeSelection = (value: unknown): DisplaySelection => {
  if (!isRecord(value)) return structuredClone(DEFAULT_SELECTION);
  const providers = stringList(value.providers);
  const windows: Record<string, string[]> = {};
  if (isRecord(value.windows)) {
    for (const [id, list] of Object.entries(value.windows)) {
      if (Array.isArray(list)) windows[id] = stringList(list);
    }
  }
  const collapsedQuota: Record<string, string> = {};
  if (isRecord(value.collapsedQuota)) {
    for (const [id, mode] of Object.entries(value.collapsedQuota)) {
      if (typeof mode === "string" && mode.length > 0) collapsedQuota[id] = mode;
    }
  }
  const cutoff =
    typeof value.cutoffPercent === "number" && Number.isFinite(value.cutoffPercent)
      ? Math.min(100, Math.max(0, value.cutoffPercent))
      : DEFAULT_SELECTION.cutoffPercent;
  return {
    saved: value.saved === true,
    providers,
    providerOrder: stringList(value.providerOrder),
    windows,
    collapsedProviders: stringList(value.collapsedProviders),
    collapsedQuota,
    hiddenBalances: stringList(value.hiddenBalances),
    cutoffPercent: cutoff,
    resetTime: value.resetTime === "absolute" ? "absolute" : "relative",
    quotaDisplay: value.quotaDisplay === "used" ? "used" : "remaining",
    encounteredBridgeProviders: stringList(value.encounteredBridgeProviders),
    initializedBridgeWindows: stringList(value.initializedBridgeWindows),
    explicitProviderSelections: stringList(value.explicitProviderSelections),
    explicitWindowSelections: stringList(value.explicitWindowSelections),
  };
};

/** Stable order: ids in `order` first, then any new ids in their discovered order. */
export const orderedConnectionIds = (available: string[], order: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of order) {
    if (available.includes(id) && !seen.has(id)) {
      result.push(id);
      seen.add(id);
    }
  }
  for (const id of available) {
    if (!seen.has(id)) {
      result.push(id);
      seen.add(id);
    }
  }
  return result;
};

export const isProviderVisible = (selection: DisplaySelection, providerId: string): boolean =>
  (!selection.saved && !selection.explicitProviderSelections.includes(providerId)) ||
  selection.providers.includes(providerId);

export const isWindowVisible = (
  selection: DisplaySelection,
  providerId: string,
  windowId: string,
): boolean =>
  (!selection.saved && !selection.explicitWindowSelections.includes(providerId) &&
    !selection.initializedBridgeWindows.includes(providerId)) ||
  (selection.windows[providerId] ?? []).includes(windowId);

export const isBalanceVisible = (selection: DisplaySelection, providerId: string): boolean =>
  !selection.hiddenBalances.includes(providerId);

const addUnique = (list: string[], value: string): string[] =>
  list.includes(value) ? list : [...list, value];

/**
 * Encounter and first-success initialization are distinct. A provider seen
 * without data is encountered but keeps an empty window list; its first real
 * windows initialize once unless the user already chose windows explicitly.
 */
export const reconcileFirstSuccess = (
  selection: DisplaySelection,
  providers: ProviderSnapshot[],
): DisplaySelection => {
  const next: DisplaySelection = {
    ...selection,
    providers: [...selection.providers],
    windows: { ...selection.windows },
    encounteredBridgeProviders: [...selection.encounteredBridgeProviders],
    initializedBridgeWindows: [...selection.initializedBridgeWindows],
    explicitProviderSelections: [...selection.explicitProviderSelections],
    explicitWindowSelections: [...selection.explicitWindowSelections],
  };
  let changed = false;
  for (const row of BRIDGE_PROVIDERS) {
    const provider = providers.find((entry) => entry.connectionId === row.connectionId);
    if (!provider) continue;
    if (!next.encounteredBridgeProviders.includes(row.connectionId)) {
      next.encounteredBridgeProviders = addUnique(
        next.encounteredBridgeProviders,
        row.connectionId,
      );
      const explicitlyHidden =
        next.explicitProviderSelections.includes(row.connectionId) &&
        !next.providers.includes(row.connectionId);
      if (!explicitlyHidden && !next.providers.includes(row.connectionId)) {
        next.providers = addUnique(next.providers, row.connectionId);
      }
      changed = true;
    }
    if (provider.state !== "ok" || provider.windows.length === 0) continue;
    // An error-only window list is not a successful reading: keep waiting so
    // the first usable windows can still initialize defaults once.
    const usable = provider.windows.some(
      (window) => !window.error && typeof window.remainingPercent === "number",
    );
    if (!usable) continue;
    if (next.initializedBridgeWindows.includes(row.connectionId)) continue;
    if (!next.explicitWindowSelections.includes(row.connectionId)) {
      next.windows[row.connectionId] = provider.windows.map((window) => window.id);
    }
    next.initializedBridgeWindows = addUnique(
      next.initializedBridgeWindows,
      row.connectionId,
    );
    changed = true;
  }
  return changed ? next : selection;
};

export const markExplicitProvider = (
  selection: DisplaySelection,
  providerId: string,
): DisplaySelection =>
  ({ ...selection, explicitProviderSelections: addUnique(selection.explicitProviderSelections, providerId) });

export const markExplicitWindow = (
  selection: DisplaySelection,
  providerId: string,
): DisplaySelection =>
  ({ ...selection, explicitWindowSelections: addUnique(selection.explicitWindowSelections, providerId) });
