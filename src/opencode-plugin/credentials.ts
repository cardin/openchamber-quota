import { BRIDGE_PROVIDERS } from "../core/bridge.ts";
import type { BridgeProviderRow } from "../core/bridge.ts";
import type { ProviderKind, Secret, StoredConnection } from "../core/types.ts";

/**
 * The subset of the OpenCode V2 plugin context this plugin uses. It is
 * structural on purpose: the plugin is bundled without installed packages.
 */
export type OpenCodeIntegration = {
  connection: {
    active: (integrationID: string) =>
      | Promise<{ type: "credential"; id: string; label: string } | { type: "env"; name: string } | undefined>
      | { type: "credential"; id: string; label: string }
      | { type: "env"; name: string }
      | undefined;
    resolve: (connection: unknown) =>
      | Promise<OpenCodeCredential | undefined>
      | OpenCodeCredential
      | undefined;
  };
};

export type OpenCodeCredential = {
  type?: "api" | "key" | "oauth" | string;
  key?: string;
  access?: string;
  accountId?: string;
  orgID?: string;
  metadata?: Record<string, unknown>;
  refresh?: string;
  expires?: number;
};

export type CredentialOutcome =
  | { ok: true; connection: StoredConnection; credentialType: "api" | "oauth" }
  | {
      ok: false;
      state: "unconfigured" | "error";
      code: "not_configured" | "auth" | "bad_response";
      message: string;
    };

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const metaString = (credential: OpenCodeCredential, keys: string[]): string | undefined => {
  const meta = credential.metadata;
  if (!meta || typeof meta !== "object") return undefined;
  for (const key of keys) {
    const value = stringValue(meta[key]);
    if (value) return value;
  }
  return undefined;
};

/**
 * OpenCode's stored OpenAI OAuth record can expose the ChatGPT account id only
 * inside the access token. Decode the claim in memory; never copy the token.
 */
export const accountIdFromToken = (token: string): string | undefined => {
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    const auth = payload["https://api.openai.com/auth"];
    const nested =
      auth && typeof auth === "object" ? (auth as Record<string, unknown>).chatgpt_account_id : undefined;
    return (
      stringValue(payload.chatgpt_account_id) ??
      stringValue(nested) ??
      stringValue(payload.account_id) ??
      stringValue(payload.accountId)
    );
  } catch {
    return undefined;
  }
};

const unconfigured = (message: string): CredentialOutcome => ({
  ok: false,
  state: "unconfigured",
  code: "not_configured",
  message,
});

const failed = (message: string): CredentialOutcome => ({
  ok: false,
  state: "error",
  code: "bad_response",
  message,
});

const ENV_FALLBACK: Partial<Record<string, string>> = {
  tavily: "TAVILY_API_KEY",
  exa: "EXA_API_KEY",
};

const envCredential = (name: string): OpenCodeCredential | undefined => {
  const value = process.env[name];
  return typeof value === "string" && value.length > 0
    ? { type: "key", key: value }
    : undefined;
};

/**
 * Map one resolved OpenCode credential into the ephemeral pseudo-connection the
 * shared adapters already understand. `refresh`/`expires` are deliberately not
 * copied, and no credential is cached or logged.
 */
export const credentialToConnection = (
  row: BridgeProviderRow,
  credential: OpenCodeCredential,
  now: () => number = Date.now,
): CredentialOutcome => {
  const type = credential.type === "api" ? "api" : credential.type === "key" ? "api" : credential.type;
  if (type === undefined) {
    return unconfigured("Sign in again in OpenCode, then refresh.");
  }
  if (type !== "api" && type !== "oauth") {
    return failed("OpenCode returned an unsupported credential type.");
  }
  if (row.kind === "codex" && type !== "oauth") {
    return unconfigured(
      "OpenAI needs a ChatGPT sign-in in OpenCode. An API key cannot read ChatGPT quota.",
    );
  }

  const secret: Secret = {};
  if (type === "api") {
    const apiKey = stringValue(credential.key);
    if (!apiKey) return failed("OpenCode did not return a usable API key.");
    secret.apiKey = apiKey;
  } else {
    const accessToken = stringValue(credential.access);
    if (!accessToken) return unconfigured("Sign in again in OpenCode, then refresh.");
    secret.accessToken = accessToken;
  }

  const accountId =
    stringValue(credential.accountId) ??
    metaString(credential, [
      "accountId",
      "account_id",
      "accountID",
      "chatgpt_account_id",
      "chatgptAccountId",
    ]) ??
    (type === "oauth" ? accountIdFromToken(stringValue(credential.access) ?? "") : undefined);
  const orgId =
    stringValue(credential.orgID) ??
    metaString(credential, [
      "orgID",
      "orgId",
      "organizationID",
      "organizationId",
      "organization_id",
    ]);
  if (row.kind === "codex") {
    if (!accountId) {
      return unconfigured("OpenAI needs an account id. Sign in again in OpenCode.");
    }
    secret.accountId = accountId;
  } else if (row.kind === "opencode-zen") {
    const org = orgId ?? accountId;
    if (org) secret.accountId = org;
  }

  return {
    ok: true,
    credentialType: type,
    connection: {
      id: row.connectionId,
      kind: row.kind as ProviderKind,
      label: row.label,
      createdAt: new Date(now()).toISOString(),
      secret,
    },
  };
};

export const resolveSelectedCredentials = async (
  integration: OpenCodeIntegration,
  now: () => number = Date.now,
  ids?: readonly BridgeProviderRow[],
): Promise<Map<string, CredentialOutcome>> => {
  const outcomes = new Map<string, CredentialOutcome>();
  for (const row of ids ?? BRIDGE_PROVIDERS) {
    try {
      const active = await integration.connection.active(row.id);
      if (!active) {
        const fallback = ENV_FALLBACK[row.id] ? envCredential(ENV_FALLBACK[row.id]!) : undefined;
        if (fallback) {
          outcomes.set(row.id, credentialToConnection(row, fallback, now));
          continue;
        }
        outcomes.set(row.id, unconfigured(`Sign in to ${row.label} in OpenCode, then refresh.`));
        continue;
      }
      if (active.type !== "credential") {
        const env = envCredential(active.name);
        if (env) {
          outcomes.set(row.id, credentialToConnection(row, env, now));
          continue;
        }
        const fallback = ENV_FALLBACK[row.id] ? envCredential(ENV_FALLBACK[row.id]!) : undefined;
        if (fallback) {
          outcomes.set(row.id, credentialToConnection(row, fallback, now));
          continue;
        }
        outcomes.set(
          row.id,
          unconfigured(`${row.label} is configured through the environment in OpenCode.`),
        );
        continue;
      }
      const credential = await integration.connection.resolve(active);
      if (!credential) {
        outcomes.set(row.id, unconfigured(`Sign in to ${row.label} in OpenCode, then refresh.`));
        continue;
      }
      outcomes.set(row.id, credentialToConnection(row, credential, now));
    } catch {
      const fallback = ENV_FALLBACK[row.id] ? envCredential(ENV_FALLBACK[row.id]!) : undefined;
      if (fallback) {
        outcomes.set(row.id, credentialToConnection(row, fallback, now));
        continue;
      }
      outcomes.set(row.id, {
        ok: false,
        state: "error",
        code: "auth",
        message: `OpenCode could not read the ${row.label} credential.`,
      });
    }
  }
  return outcomes;
};
