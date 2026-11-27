export const PROVIDER_KINDS = [
  "custom",
  "codex",
  "exa",
  "opencode-go",
  "openrouter",
  "tavily",
  "opencode-zen",
] as const;

export type ProviderKind = (typeof PROVIDER_KINDS)[number];

export type Amount = { value: number; unit: string };

export type QuotaWindow = {
  id: string;
  label: string;
  remainingPercent?: number;
  resetAt?: string;
  durationSeconds?: number;
  used?: Amount;
  limit?: Amount;
  error?: QuotaError;
};

export type Cap = {
  id: string;
  label: string;
  used: number;
  limit: number;
  unit: string;
};

export type Balance = {
  id: string;
  label: string;
  value: number;
  unit: string;
};

export type QuotaErrorCode =
  | "not_configured"
  | "auth"
  | "rate_limited"
  | "timeout"
  | "network"
  | "bad_response"
  | "provider_error";

export type QuotaError = {
  code: QuotaErrorCode;
  message: string;
  retryAt?: string;
};

export type ProviderState = "ok" | "error" | "unconfigured" | "loading";

export type ProviderSnapshot = {
  connectionId: string;
  kind: ProviderKind;
  label: string;
  state: ProviderState;
  windows: QuotaWindow[];
  caps: Cap[];
  balances: Balance[];
  fetchedAt?: string;
  refreshing: boolean;
  error?: QuotaError;
};

export type Snapshot = {
  version: 1;
  generatedAt: string;
  providers: ProviderSnapshot[];
};

export type Connection = {
  id: string;
  kind: ProviderKind;
  label: string;
  endpoint?: string;
  accountId?: string;
  createdAt: string;
  lastTestAt?: string;
  lastTestResult?: "ok" | "auth" | "network" | "bad_response" | "provider_error";
};

export type Secret = {
  apiKey?: string;
  accessToken?: string;
  accountId?: string;
};

export type StoredConnection = Connection & { secret: Secret };

export type DisplaySelection = {
  saved: boolean;
  providers: string[];
  providerOrder: string[];
  windows: Record<string, string[]>;
  collapsedProviders: string[];
  collapsedQuota: Record<string, string>;
  hiddenBalances: string[];
  cutoffPercent: number;
  resetTime: "relative" | "absolute";
  quotaDisplay: "remaining" | "used";
  /** Bridge ids already encountered; this alone does not initialize windows. */
  encounteredBridgeProviders: string[];
  /** Bridge ids whose first successful window choice was initialized. */
  initializedBridgeWindows: string[];
  /** Bridge ids with an explicit user show/hide choice. */
  explicitProviderSelections: string[];
  /** Bridge ids with an explicit window choice, including an empty list. */
  explicitWindowSelections: string[];
};

export const DEFAULT_SELECTION: DisplaySelection = {
  saved: false,
  providers: [],
  providerOrder: [],
  windows: {},
  collapsedProviders: [],
  collapsedQuota: {},
  hiddenBalances: [],
  cutoffPercent: 10,
  resetTime: "relative",
  quotaDisplay: "remaining",
  encounteredBridgeProviders: [],
  initializedBridgeWindows: [],
  explicitProviderSelections: [],
  explicitWindowSelections: [],
};

export type SettingsEnvelope = {
  version: 1;
  revision: number;
  selection: DisplaySelection;
};

export type SettingsChanges = Partial<
  Pick<
    DisplaySelection,
    | "saved"
    | "providers"
    | "providerOrder"
    | "windows"
    | "collapsedQuota"
    | "hiddenBalances"
    | "cutoffPercent"
    | "resetTime"
    | "quotaDisplay"
  >
> & {
  providerVisibility?: Record<string, boolean>;
  windowSelection?: Record<string, string[]>;
  /** Per-provider patch: true collapses the provider, false expands it. */
  collapsedProviders?: Record<string, boolean>;
};

export type SettingsPatch = {
  expectedRevision: number;
  changes: SettingsChanges;
};

export type BridgeProviderId =
  | "openrouter"
  | "opencode-go"
  | "opencode"
  | "openai"
  | "tavily"
  | "exa";

export type BridgeDescriptor = {
  version: 1;
  serverId: string;
  port: number;
  token: string;
  providers: BridgeProviderId[];
  createdAt: string;
};

export type BridgeState = {
  version: 1;
  serverId: string;
  providers: BridgeProviderId[];
  refreshRequested: boolean;
  requestId: string | null;
  deadlineAt: number | null;
  providerMinimums: Record<BridgeProviderId, number>;
  serverTime: number;
};

export type BridgeSnapshot = {
  version: 1;
  serverId: string;
  requestId: string | null;
  generatedAt: string;
  providers: ProviderSnapshot[];
};
