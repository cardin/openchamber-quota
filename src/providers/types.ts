import type {
  Balance,
  Cap,
  ProviderKind,
  QuotaWindow,
  StoredConnection,
} from "../core/types.ts";
import type { HttpOptions, HttpResult } from "../core/http-error.ts";

export type AdapterContext = {
  now: () => number;
  requestJson: (url: string, options: HttpOptions) => Promise<HttpResult>;
  dataDir: string;
  /** Shared cycle budget: sequential fallback calls must not restart it. */
  deadlineAt?: number;
  signal?: AbortSignal;
};

export type AdapterResult = {
  windows: QuotaWindow[];
  caps: Cap[];
  balances: Balance[];
};

export type Adapter = {
  kind: ProviderKind;
  minIntervalMs: number;
  fetch: (connection: StoredConnection, context: AdapterContext) => Promise<AdapterResult>;
};

export const emptyResult = (): AdapterResult => ({ windows: [], caps: [], balances: [] });
