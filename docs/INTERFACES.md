# Interfaces

> Provisional — feature `001-session-panel-quota`: provider coverage and final interface acceptance are pending Codex/Zen OAuth work.
> See `specs/001-session-panel-quota/spec.md`.
<!-- provisional:feature=001-session-panel-quota -->

## Service transport

The section reaches the service only through `host.serviceRequest`. The service listens on `127.0.0.1:${OPENCHAMBER_SERVICE_PORT}` and requires `Authorization: Bearer ${OPENCHAMBER_SERVICE_TOKEN}`. Requests and responses are JSON; request bodies are capped at 64 KiB. Requests without the token return `401`.

## Service routes

| Method and path | Result |
| --- | --- |
| `GET /health` | `{ "ok": true, "version": 1 }` |
| `GET /snapshot` | [QuotaSnapshot](contracts/quota-snapshot.schema.json) |
| `POST /refresh` | `202 { "accepted": true }`; optional `{ "connectionId": "..." }`; `409` while that provider is already refreshing |
| `GET /connections` | `{ "connections": Connection[] }` without secrets |
| `POST /connections` | Creates a connection; `201` with metadata |
| `PUT /connections/:id` | Updates a connection; `200` with metadata |
| `DELETE /connections/:id` | `{ "deleted": true }` |
| `POST /connections/:id/test` | `{ "ok": true }` or `{ "ok": false, "error": {...} }` |

There is no custom TLS configuration route. Unknown routes return `404`.

## Snapshot

The canonical schema is [quota-snapshot.schema.json](contracts/quota-snapshot.schema.json). A snapshot has `version: 1`, `generatedAt`, and ordered `providers`. Each provider has `connectionId`, `kind`, `label`, `state`, `refreshing`, and arrays of windows, caps, and balances; `error` is required when `state` is `error`.

- A resetting window carries `remainingPercent` and `resetAt`; `durationSeconds` enables the even-use benchmark. A window error replaces only that window.
- A cap carries `used`, `limit`, and `unit`; it has no reset or benchmark.
- A balance carries `value` and `unit`; it has no bar, reset, or benchmark.
- The service validates the assembled snapshot before returning it. An invalid request or assembled snapshot returns a sanitized error envelope, never upstream details.

## Custom provider format

The canonical schema is [custom-provider-v1.schema.json](contracts/custom-provider-v1.schema.json). A custom endpoint is HTTPS, has no credentials/query/fragment, returns `application/json` within 64 KiB and 10 seconds, and returns `version: 1` with at least one window, cap, or balance. No field mappings, scripts, custom headers, or format picker are supported. The settings add-provider list currently hides Custom until a live endpoint can be verified; existing custom connections remain supported. See [the format](../specs/001-session-panel-quota/contracts/custom-provider-v1.md) for field rules.

## Connections

`connections.json` stores `version: 1` and a list of connections. Each connection has `id`, `kind`, `label`, optional `endpoint` and `accountId`, `createdAt`, optional test metadata, and a service-only `secret`. Named providers have one connection per kind; custom providers may repeat with unique labels. Public reads omit secrets and account IDs. The file is `0600` on POSIX; on Windows it inherits the OpenChamber data directory ACL and is not explicitly restricted.

## Display storage

Instance-scoped `host.storage` key `quota.display.v1` holds:

| Field | Default and rules |
| --- | --- |
| `saved` | `false` until the user changes a selection; a saved empty selection stays empty |
| `providers` | Selected connection IDs; a newly added provider is enabled with its current windows |
| `windows` | Connection ID → selected window IDs; new window types stay hidden until enabled |
| `hiddenBalances` | Connection IDs whose non-reporting balances are hidden; shown by default |
| `cutoffPercent` | `10`; danger when remaining is strictly below |
| `resetTime` | `relative`; absolute uses time within 24 hours, weekday and time within 7 days, date at 7+ days |
| `quotaDisplay` | `remaining`; or `used`, applied to windows and caps |
| `tavilyMonthlyWindowsMigrated` | Optional one-time migration marker |

## Errors

Service envelopes use `{ "error": { "code", "message", "retryAt"? } }`. Provider snapshot errors use the same codes inside a successful snapshot: `not_configured`, `auth`, `rate_limited`, `timeout`, `network`, `bad_response`, and `provider_error`.
