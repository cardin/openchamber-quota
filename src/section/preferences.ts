import type { DisplaySelection } from "../core/types.ts";
import { DEFAULT_SELECTION } from "../core/types.ts";

export const SELECTION_KEY = "quota.display.v1";

type Storage = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: any) => Promise<void>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const normalizeSelection = (value: unknown): DisplaySelection => {
  if (!isRecord(value)) return { ...DEFAULT_SELECTION };
  const providers = Array.isArray(value.providers)
    ? value.providers.filter((id): id is string => typeof id === "string")
    : [];
  const windows: Record<string, string[]> = {};
  if (isRecord(value.windows)) {
    for (const [id, list] of Object.entries(value.windows)) {
      if (Array.isArray(list)) {
        windows[id] = list.filter((key): key is string => typeof key === "string");
      }
    }
  }
  const hiddenBalances = Array.isArray(value.hiddenBalances)
    ? value.hiddenBalances.filter((id): id is string => typeof id === "string")
    : [];
  const cutoff = typeof value.cutoffPercent === "number" && Number.isFinite(value.cutoffPercent)
    ? Math.min(100, Math.max(0, value.cutoffPercent))
    : DEFAULT_SELECTION.cutoffPercent;
  return {
    saved: value.saved === true,
    providers,
    windows,
    hiddenBalances,
    cutoffPercent: cutoff,
    resetTime: value.resetTime === "absolute" ? "absolute" : "relative",
    quotaDisplay: value.quotaDisplay === "used" ? "used" : DEFAULT_SELECTION.quotaDisplay,
  };
};

const migrateSelection = (selection: DisplaySelection): DisplaySelection => {
  // Legacy Tavily limits were caps and had no window selection.
  if (
    selection.saved &&
    selection.providers.includes("tavily") &&
    selection.windows.tavily === undefined
  ) {
    return {
      ...selection,
      windows: { ...selection.windows, tavily: ["plan", "key", "paygo"] },
    };
  }
  return selection;
};

export const loadSelection = async (storage: Storage): Promise<DisplaySelection> => {
  try {
    const raw = await storage.get(SELECTION_KEY);
    const normalized = normalizeSelection(raw);
    if (!isRecord(raw) || raw.tavilyMonthlyWindowsMigrated === true) return normalized;
    const migrated = migrateSelection(normalized);
    try {
      await saveSelection(storage, migrated);
    } catch {
      // Keep the migrated in-memory selection even if the write is refused.
    }
    return migrated;
  } catch {
    return { ...DEFAULT_SELECTION };
  }
};

export const saveSelection = async (
  storage: Storage,
  selection: DisplaySelection,
): Promise<void> => {
  await storage.set(SELECTION_KEY, { ...selection, tavilyMonthlyWindowsMigrated: true });
};

export const isProviderVisible = (selection: DisplaySelection, providerId: string): boolean =>
  !selection.saved || selection.providers.includes(providerId);

export const isWindowVisible = (
  selection: DisplaySelection,
  providerId: string,
  windowId: string,
): boolean =>
  !selection.saved || (selection.windows[providerId] ?? []).includes(windowId);

export const isBalanceVisible = (
  selection: DisplaySelection,
  providerId: string,
): boolean => !selection.hiddenBalances.includes(providerId);

export const setBalancesHidden = (
  selection: DisplaySelection,
  providerId: string,
  hidden: boolean,
): DisplaySelection => ({
  ...selection,
  hiddenBalances: hidden
    ? [...new Set([...selection.hiddenBalances, providerId])]
    : selection.hiddenBalances.filter((id) => id !== providerId),
});

export type AvailableProvider = {
  id: string;
  windows: string[];
};

const firstUseSelection = (
  selection: DisplaySelection,
  available: AvailableProvider[],
): DisplaySelection => {
  if (selection.saved) return selection;
  return {
    ...selection,
    saved: true,
    providers: available.map((provider) => provider.id),
    windows: Object.fromEntries(available.map((provider) => [provider.id, [...provider.windows]])),
  };
};

export const toggleProvider = (
  selection: DisplaySelection,
  providerId: string,
  available: AvailableProvider[] = [],
): DisplaySelection => {
  const base = firstUseSelection(selection, available);
  const adding = !base.providers.includes(providerId);
  const providers = adding
    ? [...base.providers, providerId]
    : base.providers.filter((id) => id !== providerId);
  const providerWindows = available.find((provider) => provider.id === providerId)?.windows;
  const windows =
    adding && base.windows[providerId] === undefined && providerWindows !== undefined
      ? { ...base.windows, [providerId]: [...providerWindows] }
      : base.windows;
  return { ...base, saved: true, providers, windows };
};

export const toggleWindow = (
  selection: DisplaySelection,
  providerId: string,
  windowId: string,
  available: AvailableProvider[] = [],
): DisplaySelection => {
  const base = firstUseSelection(selection, available);
  const current = base.windows[providerId] ?? [];
  const next = current.includes(windowId)
    ? current.filter((id) => id !== windowId)
    : [...current, windowId];
  return {
    ...base,
    saved: true,
    windows: { ...base.windows, [providerId]: next },
  };
};

export const addProvider = (
  selection: DisplaySelection,
  providerId: string,
  windowIds: string[],
): DisplaySelection => {
  const providers = selection.providers.includes(providerId)
    ? selection.providers
    : [...selection.providers, providerId];
  return {
    ...selection,
    saved: true,
    providers,
    windows: selection.windows[providerId] === undefined
      ? { ...selection.windows, [providerId]: [...windowIds] }
      : selection.windows,
  };
};

export const setCutoff = (
  selection: DisplaySelection,
  cutoffPercent: number,
): DisplaySelection => ({
  ...selection,
  cutoffPercent: Number.isFinite(cutoffPercent)
    ? Math.min(100, Math.max(0, cutoffPercent))
    : DEFAULT_SELECTION.cutoffPercent,
});

export const setResetTime = (
  selection: DisplaySelection,
  resetTime: DisplaySelection["resetTime"],
): DisplaySelection => ({ ...selection, resetTime });

export const setQuotaDisplay = (
  selection: DisplaySelection,
  quotaDisplay: DisplaySelection["quotaDisplay"],
): DisplaySelection => ({ ...selection, quotaDisplay });
