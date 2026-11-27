import type { DisplaySelection, ProviderSnapshot, QuotaWindow, SettingsChanges } from "../core/types.ts";
import { DEFAULT_SELECTION } from "../core/types.ts";
import {
  isBalanceVisible,
  isProviderVisible,
  isWindowVisible,
  normalizeSelection,
  orderedConnectionIds,
  reconcileFirstSuccess,
} from "../core/selection.ts";
import { bridgeNeverReadMessage, bridgeUnavailableMessage, bridgeWaitingMessage } from "../core/snapshot-merge.ts";

export {
  isBalanceVisible,
  isProviderVisible,
  isWindowVisible,
  normalizeSelection,
  orderedConnectionIds,
  reconcileFirstSuccess,
};

type ProviderStatus = Pick<ProviderSnapshot, "state" | "error">;

/** No credential was attempted, so the provider is not listed anywhere. */
export const isProviderUnconfigured = (provider: ProviderStatus): boolean =>
  provider.state === "unconfigured" || provider.error?.code === "not_configured";

/** The bridge has never delivered a reading and the plugin is not connected. */
export const isBridgeUnavailablePlaceholder = (provider: ProviderStatus): boolean => {
  const message = provider.error?.message ?? "";
  return (
    provider.state === "error" &&
    provider.error?.code === "provider_error" &&
    (message.startsWith("The OpenCode plugin ") ||
      message === bridgeNeverReadMessage ||
      message === bridgeUnavailableMessage)
  );
};

/** A credential was attempted; invalid credentials should be shown in settings. */
export const hasAuthenticationAttempt = (provider: ProviderStatus): boolean =>
  !isProviderUnconfigured(provider) && !isBridgeUnavailablePlaceholder(provider) &&
  provider.error?.message !== bridgeWaitingMessage;

export const isProviderAuthError = (provider: ProviderStatus): boolean =>
  provider.error?.code === "auth";

/**
 * The Quotas panel lists only providers with a credential and no auth error.
 * Unconfigured providers are never listed, even when a saved selection names
 * them. Auth errors are reported in the Quota settings provider table instead.
 */
export const isProviderDisplayable = (provider: ProviderStatus): boolean =>
  hasAuthenticationAttempt(provider) && !isProviderAuthError(provider);

export const collapsedModeSupport = (
  windows: QuotaWindow[],
): { leastRemaining: boolean; earliestReset: boolean } => {
  const percentageWindows = windows.filter(
    (window) => typeof window.remainingPercent === "number" && !window.error,
  );
  const resets = new Set(
    percentageWindows.map((window) => Date.parse(window.resetAt ?? "")).filter(Number.isFinite),
  );
  return {
    leastRemaining: percentageWindows.length >= 2,
    earliestReset: resets.size >= 2,
  };
};

/** Preserve existing window choices while giving non-window readings their own keys. */
export const collapsedItemMode = (kind: "window" | "cap" | "balance", id: string): string =>
  kind === "window" && !/^(?:window:|cap:|balance:|least-remaining$|earliest-reset$)/.test(id)
    ? id
    : `${kind}:${id}`;

/** Keep a saved window mode only while it applies to this provider's windows. */
export const normalizeCollapsedMode = (mode: string, windows: QuotaWindow[]): string => {
  const support = collapsedModeSupport(windows);
  if (mode === "least-remaining" && support.leastRemaining) return mode;
  if (mode === "earliest-reset" && support.earliestReset) return mode;
  const window = windows.find((window) => collapsedItemMode("window", window.id) === mode)
    ?? windows.find((window) => window.id === mode)
    ?? windows.find((window) => typeof window.remainingPercent === "number" && !window.error);
  return window ? collapsedItemMode("window", window.id) : mode;
};

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
    windows: Object.fromEntries(
      available.map((provider) => [provider.id, [...provider.windows]]),
    ),
  };
};

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
    windows:
      selection.windows[providerId] === undefined
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

export const moveProvider = (
  selection: DisplaySelection,
  providerId: string,
  delta: -1 | 1,
  availableIds: string[],
): DisplaySelection => {
  const order = orderedConnectionIds([...availableIds, ...selection.providerOrder], selection.providerOrder);
  const visible = order.filter((id) => availableIds.includes(id));
  const position = visible.indexOf(providerId);
  const neighbor = visible[position + delta];
  if (position < 0 || neighbor === undefined) return selection;
  const index = order.indexOf(providerId);
  const next = order.indexOf(neighbor);
  [order[index], order[next]] = [order[next], order[index]];
  return { ...selection, providerOrder: order };
};

export const setCollapsedQuota = (
  selection: DisplaySelection,
  providerId: string,
  mode: string,
): DisplaySelection => ({
  ...selection,
  collapsedQuota: { ...selection.collapsedQuota, [providerId]: mode },
});

const same = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

/** Only fields the user's action touched, so unrelated concurrent edits survive. */
export const changesFor = (
  previous: DisplaySelection,
  next: DisplaySelection,
): SettingsChanges => {
  const changes: SettingsChanges = {};
  if (previous.saved !== next.saved) changes.saved = next.saved;
  if (!same(previous.providers, next.providers)) changes.providers = next.providers;
  if (!same(previous.providerOrder, next.providerOrder)) changes.providerOrder = next.providerOrder;
  if (!same(previous.collapsedQuota, next.collapsedQuota)) {
    const collapsedQuota: Record<string, string> = {};
    for (const [id, value] of Object.entries(next.collapsedQuota)) {
      if (previous.collapsedQuota[id] !== value) collapsedQuota[id] = value;
    }
    if (Object.keys(collapsedQuota).length > 0) changes.collapsedQuota = collapsedQuota;
  }
  if (!same(previous.windows, next.windows)) {
    const windows: Record<string, string[]> = {};
    for (const [id, list] of Object.entries(next.windows)) {
      if (!same(previous.windows[id], list)) windows[id] = list;
    }
    if (Object.keys(windows).length > 0) changes.windows = windows;
  }
  if (!same(previous.hiddenBalances, next.hiddenBalances)) {
    changes.hiddenBalances = next.hiddenBalances;
  }
  if (previous.cutoffPercent !== next.cutoffPercent) changes.cutoffPercent = next.cutoffPercent;
  if (previous.resetTime !== next.resetTime) changes.resetTime = next.resetTime;
  if (previous.quotaDisplay !== next.quotaDisplay) changes.quotaDisplay = next.quotaDisplay;
  return changes;
};
