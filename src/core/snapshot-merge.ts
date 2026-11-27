import { BRIDGE_PROVIDERS, BridgeTiming } from "./bridge.ts";
import type { ProviderSnapshot, QuotaError } from "./types.ts";

export type MergeState = {
  current: Record<string, ProviderSnapshot>;
  lastSuccess: Record<string, ProviderSnapshot>;
};

const clone = <T>(value: T): T => structuredClone(value);

export const sanitizeMessage = (value: string, max = 200): string => {
  const text = value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [redacted]")
    .replace(/\b(sk|tvly|key|token)-[A-Za-z0-9._-]{6,}/gi, "$1-[redacted]")
    .replace(/\b[0-9a-f]{32,}\b/gi, "[redacted]")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (text || "The request failed.").slice(0, max);
};

export const notConfiguredEntry = (provider: {
  connectionId: string;
  kind: ProviderSnapshot["kind"];
  label: string;
}): ProviderSnapshot => ({
  connectionId: provider.connectionId,
  kind: provider.kind,
  label: provider.label,
  state: "unconfigured",
  windows: [],
  caps: [],
  balances: [],
  refreshing: false,
  error: {
    code: "not_configured",
    message: `Sign in to ${provider.label} in OpenCode, then refresh.`,
  },
});

export const bridgeUnavailableMessage =
  "The OpenCode plugin is unavailable; showing the last reading.";
export const bridgeNeverReadMessage =
  "The OpenCode plugin is not connected. If you just approved the extension, restart OpenCode or OpenChamber.";
export const bridgeWaitingMessage = "Waiting for the next scheduled refresh.";

const stale = (sample: ProviderSnapshot, message: string): ProviderSnapshot => ({
  ...clone(sample),
  state: "ok",
  refreshing: false,
  error: { code: "provider_error", message: sanitizeMessage(message) },
});

export const isLastSuccess = (provider: ProviderSnapshot): boolean =>
  provider.state === "ok" && Boolean(provider.fetchedAt);

const transient = (error: QuotaError | undefined): boolean =>
  !error || !["auth", "not_configured"].includes(error.code);

/** Messages the service adds when the bridge itself, not the provider, is down. */
const bridgeLevel = (error: QuotaError | undefined): boolean =>
  error?.message === bridgeWaitingMessage ||
  error?.message === bridgeUnavailableMessage ||
  error?.message === bridgeNeverReadMessage;

/**
 * Merge one complete six-provider bridge cycle. Fresh successes replace the
 * last-success sample; auth/configuration failures stay explicit; transient
 * failures keep the last sample with an out-of-date notice.
 */
export const mergeBridgeResult = (
  state: MergeState,
  incoming: ProviderSnapshot[],
  now: number,
): MergeState => {
  const current = { ...state.current };
  const lastSuccess = { ...state.lastSuccess };
  const byId = new Map(incoming.map((provider) => [provider.connectionId, provider]));
  for (const row of BRIDGE_PROVIDERS) {
    const provider = byId.get(row.connectionId);
    if (!provider) continue;
    const previous = current[row.connectionId];
    if (provider.error?.message === bridgeWaitingMessage && previous &&
      (previous.state === "unconfigured" || previous.error?.code === "auth")) {
      continue;
    }
    if (provider.state === "ok") {
      const fresh = clone(provider);
      current[row.connectionId] = fresh;
      lastSuccess[row.connectionId] = clone(fresh);
      continue;
    }
    if (provider.state === "unconfigured") {
      current[row.connectionId] = clone(provider);
      continue;
    }
    if (provider.state === "error" || provider.state === "loading") {
      const rejected = previous?.state === "unconfigured" || previous?.error?.code === "auth";
      if (rejected) {
        // A bridge-level placeholder says nothing new about the credential.
        // A real provider failure replaces the old auth notice with the new
        // connectivity outcome, without reviving rejected quota during a
        // later bridge outage.
        if (bridgeLevel(provider.error)) continue;
        delete lastSuccess[row.connectionId];
        current[row.connectionId] = clone(provider);
        continue;
      }
      const sample = lastSuccess[row.connectionId];
      if (sample && transient(provider.error)) {
        current[row.connectionId] = stale(
          sample,
          provider.error?.message ?? "The provider did not return a reading.",
        );
      } else {
        current[row.connectionId] = clone(provider);
      }
      continue;
    }
    current[row.connectionId] = clone(provider);
  }
  return { current, lastSuccess };
};

/** A bridge timeout or lost plugin keeps the last sample and labels it. */
export const markBridgeUnavailable = (
  state: MergeState,
  now: number,
  message = bridgeUnavailableMessage,
  previouslyConnected = true,
): MergeState => {
  const current = { ...state.current };
  for (const row of BRIDGE_PROVIDERS) {
    const existing = state.current[row.connectionId];
    if (existing?.error?.code === "auth" ||
      (previouslyConnected && existing?.state === "unconfigured")) continue;

    const sample = state.lastSuccess[row.connectionId];
    if (sample) {
      current[row.connectionId] = stale(sample, message);
      continue;
    }
    const attempted = existing !== undefined &&
      existing.state !== "unconfigured" &&
      existing.error?.code !== "not_configured";
    current[row.connectionId] = {
      ...(existing
        ? clone(existing)
        : notConfiguredEntry(row)),
      connectionId: row.connectionId,
      kind: row.kind,
      label: row.label,
      state: "error",
      windows: [],
      caps: [],
      balances: [],
      refreshing: false,
      error: {
        code: "provider_error",
        message: attempted ? message : bridgeNeverReadMessage,
      },
    };
  }
  return { current, lastSuccess: { ...state.lastSuccess } };
};

/** Fresh bridge work clears an earlier unavailability notice. */
export const markBridgePending = (state: MergeState, pending: boolean): MergeState => {
  const current = { ...state.current };
  for (const row of BRIDGE_PROVIDERS) {
    const existing = current[row.connectionId];
    if (!existing) continue;
    current[row.connectionId] = { ...existing, refreshing: pending };
  }
  return { current, lastSuccess: state.lastSuccess };
};

export const isStaleSample = (provider: ProviderSnapshot, now: number): boolean => {
  if (!provider.fetchedAt) return false;
  const fetched = Date.parse(provider.fetchedAt);
  return Number.isFinite(fetched) && now - fetched >= BridgeTiming.staleAfterMs;
};

export const hasStaleNotice = (provider: ProviderSnapshot): boolean =>
  provider.state === "ok" && provider.error?.code === "provider_error";
