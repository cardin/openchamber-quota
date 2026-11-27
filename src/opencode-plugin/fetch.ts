import { HttpError } from "../core/http-error.ts";
import { sanitizeMessage } from "../core/snapshot-merge.ts";
import type { BridgeProviderRow } from "../core/bridge.ts";
import type { ProviderSnapshot, QuotaError } from "../core/types.ts";
import { ADAPTERS } from "../providers/index.ts";
import type { AdapterContext } from "../providers/types.ts";
import { assertAdapterResult } from "../providers/validate.ts";
import type { CredentialOutcome } from "./credentials.ts";

export const toProviderError = (error: unknown): QuotaError => {
  if (error instanceof HttpError) {
    const message = error.code === "auth" && error.message === "The provider rejected the credential."
      ? "The provider rejected the credential. Sign in again in OpenCode."
      : error.message;
    return {
      code: error.code,
      message: sanitizeMessage(message),
      ...(error.retryAt ? { retryAt: error.retryAt } : {}),
    };
  }
  return { code: "provider_error", message: "The provider request failed." };
};

export const missingEntry = (row: BridgeProviderRow, outcome: CredentialOutcome): ProviderSnapshot => {
  if (outcome.ok) {
    return {
      connectionId: row.connectionId,
      kind: row.kind,
      label: row.label,
      state: "error",
      windows: [],
      caps: [],
      balances: [],
      refreshing: false,
      error: { code: "provider_error", message: "No credential outcome." },
    };
  }
  return {
    connectionId: row.connectionId,
    kind: row.kind,
    label: row.label,
    state: outcome.state,
    windows: [],
    caps: [],
    balances: [],
    refreshing: false,
    error: { code: outcome.code, message: sanitizeMessage(outcome.message) },
  };
};

export const errorEntry = (row: BridgeProviderRow, error: QuotaError): ProviderSnapshot => ({
  connectionId: row.connectionId,
  kind: row.kind,
  label: row.label,
  state: "error",
  windows: [],
  caps: [],
  balances: [],
  refreshing: false,
  error: {
    code: error.code,
    message: sanitizeMessage(error.message),
    ...(error.retryAt ? { retryAt: error.retryAt } : {}),
  },
});

export const okEntry = (
  row: BridgeProviderRow,
  result: { windows: ProviderSnapshot["windows"]; caps: ProviderSnapshot["caps"]; balances: ProviderSnapshot["balances"] },
  now: number,
): ProviderSnapshot => ({
  connectionId: row.connectionId,
  kind: row.kind,
  label: row.label,
  state: "ok",
  windows: result.windows,
  caps: result.caps,
  balances: result.balances,
  fetchedAt: new Date(now).toISOString(),
  refreshing: false,
});

/**
 * Fetch one provider inside the shared cycle budget. The adapter receives the
 * same abort signal and deadline; sequential fallbacks cannot restart it.
 */
export const fetchProvider = async (
  row: BridgeProviderRow,
  outcome: CredentialOutcome,
  context: AdapterContext,
): Promise<ProviderSnapshot> => {
  if (!outcome.ok) return missingEntry(row, outcome);
  const adapter = ADAPTERS[row.kind];
  if (!adapter) return errorEntry(row, { code: "provider_error", message: "Unsupported provider." });
  if (context.signal?.aborted) {
    return errorEntry(row, { code: "timeout", message: "The operation timed out." });
  }
  try {
    const result = await adapter.fetch(outcome.connection, context);
    assertAdapterResult(result);
    return okEntry(row, result, context.now());
  } catch (error) {
    return errorEntry(row, toProviderError(error));
  }
};

export const completeResult = (entries: ProviderSnapshot[]): ProviderSnapshot[] => entries;

/** Reuse a previous in-memory sample without refreshing its fetchedAt. */
export const cachedEntry = (entry: ProviderSnapshot): ProviderSnapshot => ({
  ...structuredClone(entry),
  refreshing: false,
});
