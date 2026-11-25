export const PROVIDER_KINDS = [
  "custom",
  "codex",
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
  windows: Record<string, string[]>;
  hiddenBalances: string[];
  cutoffPercent: number;
  resetTime: "relative" | "absolute";
  quotaDisplay: "remaining" | "used";
};

export const DEFAULT_SELECTION: DisplaySelection = {
  saved: false,
  providers: [],
  windows: {},
  hiddenBalances: [],
  cutoffPercent: 10,
  resetTime: "relative",
  quotaDisplay: "remaining",
};
