import type { ProviderKind } from "./types.ts";

export type BridgeProviderId =
  | "openrouter"
  | "opencode-go"
  | "opencode"
  | "openai"
  | "tavily"
  | "exa";

export type BridgeProviderRow = {
  id: BridgeProviderId;
  connectionId: string;
  kind: ProviderKind;
  label: string;
};

/**
 * Stable selection keys for the credentials OpenCode owns. The OpenCode
 * key is what the plugin resolves; the connection id is what the Quotas
 * snapshot uses.
 */
export const BRIDGE_PROVIDERS: readonly BridgeProviderRow[] = [
  { id: "openrouter", connectionId: "bridge-openrouter", kind: "openrouter", label: "OpenRouter" },
  { id: "opencode-go", connectionId: "bridge-opencode-go", kind: "opencode-go", label: "OpenCode Go" },
  { id: "opencode", connectionId: "bridge-opencode-zen", kind: "opencode-zen", label: "OpenCode Zen" },
  { id: "openai", connectionId: "bridge-codex", kind: "codex", label: "OpenAI" },
  { id: "tavily", connectionId: "bridge-tavily", kind: "tavily", label: "Tavily" },
  { id: "exa", connectionId: "bridge-exa", kind: "exa", label: "Exa" },
];

export const BRIDGE_PROVIDER_IDS: readonly BridgeProviderId[] = BRIDGE_PROVIDERS.map(
  (provider) => provider.id,
);

export const BRIDGE_ROWS = new Map<BridgeProviderId, BridgeProviderRow>(
  BRIDGE_PROVIDERS.map((provider) => [provider.id, provider]),
);

export const BRIDGE_CONNECTION_IDS: readonly string[] = BRIDGE_PROVIDERS.map(
  (provider) => provider.connectionId,
);

export const bridgeRow = (id: string): BridgeProviderRow | undefined =>
  BRIDGE_ROWS.get(id as BridgeProviderId);

export const isBridgeConnectionId = (id: string): boolean =>
  BRIDGE_PROVIDERS.some((provider) => provider.connectionId === id);

export const isBridgeProviderId = (value: unknown): value is BridgeProviderId =>
  typeof value === "string" && (BRIDGE_PROVIDER_IDS as readonly string[]).includes(value);

/** Provider kinds whose credentials belong to OpenCode and may never be stored. */
export const MANAGED_KINDS: readonly ProviderKind[] = [
  "openrouter",
  "opencode-go",
  "opencode-zen",
  "codex",
  "tavily",
  "exa",
];

export const isManagedKind = (kind: string): boolean =>
  (MANAGED_KINDS as readonly string[]).includes(kind);

export const BridgeTiming = {
  fetchIntervalMs: 300_000,
  statePollMs: 1_000,
  fetchTimeoutMs: 10_000,
  publicationAllowanceMs: 1_000,
  refreshTimeoutMs: 12_000,
  sectionWaitMs: 15_000,
  staleAfterMs: 600_000,
} as const;

export const bridgeMinimums = (): Record<BridgeProviderId, number> => {
  const result = {} as Record<BridgeProviderId, number>;
  for (const id of BRIDGE_PROVIDER_IDS) result[id] = BridgeTiming.fetchIntervalMs;
  return result;
};

/** Service-owned provider refresh limits: five minutes for every provider. */
export const PROVIDER_MIN_INTERVAL_MS = 300_000;
/** A manual or event-like refresh may bypass the five-minute wait, but not this floor. */
export const EVENT_MIN_INTERVAL_MS = 30_000;
/** Repeated failures back off from one minute to fifteen minutes. */
export const BACKOFF_FIRST_MS = 60_000;
export const BACKOFF_MAX_MS = 15 * 60_000;
export const backoffMs = (failures: number): number =>
  failures <= 0 ? 0 : Math.min(BACKOFF_MAX_MS, BACKOFF_FIRST_MS * 2 ** (failures - 1));
/** A provider Retry-After cannot stall a provider for more than a day. */
export const RETRY_WAIT_MAX_MS = 24 * 60 * 60_000;
