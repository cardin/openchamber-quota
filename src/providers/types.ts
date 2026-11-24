import type {
  Balance,
  Cap,
  ProviderKind,
  QuotaWindow,
  StoredConnection,
} from "../core/types.ts";
import type { HttpOptions, HttpResult } from "../service/http.ts";

export type AdapterContext = {
  now: () => number;
  requestJson: (url: string, options: HttpOptions) => Promise<HttpResult>;
  dataDir: string;
  caBundle?: string;
  codexHome?: string;
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
