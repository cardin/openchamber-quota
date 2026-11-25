import type { ProviderKind } from "../core/types.ts";
import { PROVIDER_KINDS } from "../core/types.ts";
import type { CredentialStore } from "./credentials.ts";
import type { SnapshotService } from "./snapshot.ts";
import { validateSnapshot } from "./snapshot-schema.ts";

export type RouteRequest = {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body: string;
};

export type RouteResponse = {
  status: number;
  body: unknown;
};

export type RouteDeps = {
  store: CredentialStore;
  snapshot: SnapshotService;
  token: string;
  dataDir: string;
};

const json = (status: number, body: unknown): RouteResponse => ({ status, body });

const error = (status: number, code: string, message: string, extra?: object): RouteResponse =>
  json(status, { error: { code, message, ...extra } });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isKind = (value: unknown): value is ProviderKind =>
  typeof value === "string" && (PROVIDER_KINDS as readonly string[]).includes(value);

const readBody = (body: string): Record<string, unknown> | null => {
  if (!body.trim()) return {};
  try {
    const parsed = JSON.parse(body) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const validLabel = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length >= 1 && value.trim().length <= 60
    ? value.trim()
    : null;

const validEndpoint = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
};

const validSecret = (value: unknown): string | null =>
  typeof value === "string" && value.length >= 1 && value.length <= 4096 ? value : null;

const CONNECTION_FIELDS = new Set(["kind", "label", "endpoint", "apiKey"]);

const connectionInput = (
  body: Record<string, unknown>,
  existing: boolean,
  id?: string,
): { input?: Parameters<CredentialStore["upsert"]>[0]; error?: RouteResponse } => {
  const unknown = Object.keys(body).find((key) => !CONNECTION_FIELDS.has(key));
  if (unknown) return { error: error(400, "bad_request", `Unknown field: ${unknown}.`) };
  if (!isKind(body.kind)) return { error: error(400, "bad_request", "Unknown provider kind.") };
  const label = validLabel(body.label);
  if (!label) return { error: error(400, "bad_request", "Label must be 1–60 characters.") };

  const apiKey = body.apiKey === undefined ? undefined : validSecret(body.apiKey);
  if (body.apiKey !== undefined && !apiKey) {
    return { error: error(400, "bad_request", "Key must be 1–4096 characters.") };
  }
  if (!existing && body.kind !== "codex" && body.kind !== "custom" && !apiKey) {
    return { error: error(400, "bad_request", "A key is required.") };
  }

  let endpoint: string | undefined;
  if (body.kind === "custom") {
    const parsed = validEndpoint(body.endpoint);
    if (!parsed) {
      return { error: error(400, "bad_request", "Custom endpoint must be an absolute HTTPS URL without credentials, query, or fragment.") };
    }
    endpoint = parsed;
    if (!existing && !apiKey) return { error: error(400, "bad_request", "A key is required.") };
  }

  return {
    input: {
      ...(id ? { id } : {}),
      kind: body.kind,
      label,
      ...(endpoint ? { endpoint } : {}),
      ...(apiKey ? { apiKey } : {}),
    },
  };
};

export const handleRequest = async (
  deps: RouteDeps,
  request: RouteRequest,
): Promise<RouteResponse> => {
  const authorization = request.headers.authorization;
  if (authorization !== `Bearer ${deps.token}`) {
    return error(401, "unauthorized", "Missing or wrong service token.");
  }

  const url = new URL(request.path, "http://127.0.0.1");
  const parts = url.pathname.split("/").filter(Boolean);
  const method = request.method.toUpperCase();

  if (method === "GET" && url.pathname === "/health") {
    return json(200, { ok: true, version: 1 });
  }
  if (method === "GET" && url.pathname === "/snapshot") {
    // The service can update provider state before the HTTP response is serialized.
    const snapshot = structuredClone(deps.snapshot.getSnapshot());
    if (!validateSnapshot(snapshot)) {
      return error(500, "provider_error", "Internal service error.");
    }
    return json(200, snapshot);
  }
  if (method === "POST" && url.pathname === "/refresh") {
    const body = readBody(request.body);
    if (body === null) return error(400, "bad_request", "Body must be JSON.");
    const connectionId = typeof body.connectionId === "string" ? body.connectionId : undefined;
    if (connectionId && !deps.store.get(connectionId)) {
      return error(404, "not_found", "Unknown connection.");
    }
    if (connectionId && deps.snapshot.isRefreshing(connectionId)) {
      return error(409, "conflict", "A refresh is already running.");
    }
    deps.snapshot.startRefresh(connectionId);
    return json(202, { accepted: true });
  }
  if (method === "GET" && url.pathname === "/connections") {
    return json(200, { connections: deps.store.list() });
  }
  if (method === "POST" && url.pathname === "/connections") {
    const body = readBody(request.body);
    if (body === null) return error(400, "bad_request", "Body must be JSON.");
    const parsed = connectionInput(body, false);
    if (parsed.error) return parsed.error;
    try {
      const connection = await deps.store.upsert(parsed.input!);
      return json(201, { connection });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not save the connection.";
      return error(409, "conflict", message);
    }
  }
  if (method === "PUT" && parts[0] === "connections" && parts[1]) {
    if (!deps.store.get(parts[1])) return error(404, "not_found", "Unknown connection.");
    const body = readBody(request.body);
    if (body === null) return error(400, "bad_request", "Body must be JSON.");
    const parsed = connectionInput(body, true, parts[1]);
    if (parsed.error) return parsed.error;
    try {
      const connection = await deps.store.upsert(parsed.input!);
      return json(200, { connection });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not save the connection.";
      return error(409, "conflict", message);
    }
  }
  if (method === "DELETE" && parts[0] === "connections" && parts[1]) {
    const deleted = await deps.store.remove(parts[1]);
    return deleted ? json(200, { deleted: true }) : error(404, "not_found", "Unknown connection.");
  }
  if (method === "POST" && parts[0] === "connections" && parts[2] === "test") {
    if (!deps.store.get(parts[1])) return error(404, "not_found", "Unknown connection.");
    const result = await deps.snapshot.testConnection(parts[1]);
    return json(200, result);
  }
  return error(404, "not_found", "Unknown route.");
};
