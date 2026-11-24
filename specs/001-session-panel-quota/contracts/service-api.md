# Service API

The section calls this API through `host.serviceRequest`. The service listens on `127.0.0.1:${OPENCHAMBER_SERVICE_PORT}` and requires:

```http
Authorization: Bearer ${OPENCHAMBER_SERVICE_TOKEN}
```

Requests and responses are JSON, UTF-8, at most 64 KiB. The service never returns credentials, endpoints, account IDs, or raw upstream bodies. All routes are case-sensitive.

## Health

`GET /health` → `200 { "ok": true, "version": 1 }`

## Snapshot

`GET /snapshot` → `200` [QuotaSnapshot](../../../docs/contracts/quota-snapshot.schema.json)

Returns the current cached snapshot. It does not fetch upstream unless the cache is older than the provider's interval; the service may start a background refresh and set `refreshing`.

The service validates the snapshot before sending it and returns a sanitized `500` error envelope if the assembled snapshot does not satisfy the schema. Invalid saved snapshots are ignored on startup.

## Refresh

`POST /refresh`

```json
{ "connectionId": "tavily" }
```

`connectionId` is optional; omit it to refresh every configured provider. Returns `202 { "accepted": true }` and starts the refresh in the background. The section polls `GET /snapshot` until `refreshing` is false. A rate-limited provider is returned with `error.code = "rate_limited"` and `retryAt`; the service does not wait for the interval.

`409 { "error": { "code": "conflict", "message": "A refresh is already running." } }` when the same provider is already refreshing.

## Connections

`GET /connections` → `200`

```json
{
  "connections": [
    {
      "id": "tavily",
      "kind": "tavily",
      "label": "Tavily",
      "endpoint": null,
      "createdAt": "2026-11-23T12:00:00Z",
      "lastTestAt": "2026-11-23T12:00:00Z",
      "lastTestResult": "ok"
    }
  ]
}
```

No secret fields.

`POST /connections` creates a connection. `PUT /connections/:id` updates one. Both return `201`/`200` with the connection metadata.

```json
// API-key providers
{ "kind": "tavily", "label": "Tavily", "apiKey": "tvly-…" }
{ "kind": "openrouter", "label": "OpenRouter", "apiKey": "sk-or-…" }
{ "kind": "opencode-go", "label": "OpenCode Go", "apiKey": "oc_sk_…" }
{ "kind": "opencode-zen", "label": "OpenCode Zen", "apiKey": "…" }

// Custom provider
{ "kind": "custom", "label": "My gateway", "endpoint": "https://gateway.example/quota", "apiKey": "…" }

// Codex imports the local Codex CLI login; no secret in the request
{ "kind": "codex", "label": "Codex" }
```

Rules:

- Named providers: one connection per `kind`. A duplicate returns `409`.
- Custom providers: multiple allowed; `label` is required and unique among custom providers.
- `endpoint` is HTTPS, without credentials, query, or fragment.
- Unknown fields are rejected with `400`.
- `apiKey` is 1–4096 characters; it is never echoed.

`DELETE /connections/:id` → `{ "deleted": true }`. Removes the credential and provider data. Selection entries are retained by the section, per the data model.

`POST /connections/:id/test` → `200 { "ok": true }` or `200 { "ok": false, "error": { ... } }`. Tests one provider without refreshing the snapshot.

## Errors

```json
{ "error": { "code": "auth", "message": "OpenRouter rejected the key." } }
```

| HTTP | `code` | Meaning |
| --- | --- | --- |
| 400 | `bad_request` | Invalid shape, endpoint, or field. |
| 401 | `unauthorized` | Missing or wrong service token. The section never sees this; `host.serviceRequest` adds the token. |
| 404 | `not_found` | Unknown connection or route. |
| 409 | `conflict` | Duplicate named-provider connection or refresh already running. |
| 429 | `rate_limited` | Caller exceeded a local limit. `retryAt` is included. |
| 502 | `provider_error` | Upstream failed or returned unusable data. The message is sanitized. |
| 504 | `timeout` | Upstream exceeded the deadline. |

Provider errors inside a successful snapshot use the `QuotaError` shape in [data-model.md](../data-model.md#error-classes).
