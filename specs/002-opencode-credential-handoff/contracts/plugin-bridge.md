# Contract: OpenCode Plugin Bridge

Intended, not implemented. Models and exact field constraints are in [data-model.md](../data-model.md).

## Manifest and approval

Keep `statusSection`, `page`, and the existing `service`. Add `contributes.opencodePlugin: "src/opencode-plugin"`; no `service.provides: ["quota"]`, no `contributes.quota`, no `/quota` route. The bundle uses the plugin lifecycle verified by T001 and carries no installed-package dependency at runtime.

OpenChamber’s Extensions settings discloses the service and the plugin’s full access before whole-package approval. Code-only and folder-only changes do not require reapproval; added permissions do. Quota settings shows setup guidance and status. Refusal blocks refresh; a plugin outage preserves eligible last readings.

## Server binding and descriptor

One `<serverId>.json` discovery entry per service data directory in the platform-specific `bridges/` directory; fields and permissions follow `BridgeDescriptor`. Bind with an explicit `bridgeServerId` plugin option, or a sole verified live descriptor. Multiple descriptors without a selector are selection-required, not an arbitrary match. T001 verifies actual option/config delivery before relying on it. Remove a descriptor only if its token/serverId are still owned by the stopping process.

The descriptor contains a bridge-only token and loopback port, never OpenCode credentials. It is not a UI-instance preference store. Clients of one OpenChamber server share one settings document; distinct servers have distinct discovery entries.

## Authentication

UI routes use the existing host-injected service bearer through `host.serviceRequest`. Bridge routes require the separate descriptor token. Neither token authenticates the other route group. Existing 64 KiB JSON body bound and sanitized error envelopes apply.

## All-provider refresh

`POST /refresh` accepts an empty body or `{}` and no query parameters. Options return 400. It starts or joins a cycle and returns `202 { accepted: true, requestId, deadlineAt }`. Cached results can acknowledge the request.

`GET /bridge/state` returns BridgeState:

```json
{
  "version": 1,
  "serverId": "server-data-directory-hash",
  "providers": ["openrouter", "opencode-go", "opencode", "openai", "tavily", "exa"],
  "refreshRequested": true,
  "requestId": "refresh-opaque-id",
  "deadlineAt": 1790000012000,
  "providerMinimums": {"openrouter": 300000, "opencode-go": 300000, "opencode": 300000, "openai": 300000, "tavily": 300000, "exa": 300000},
  "serverTime": 1790000000000
}
```

Idle requestId/deadlineAt are null. No requestedProviders field exists. Poll every one second while healthy. Discovery budget is about one second plus transport; fetch budget is ten seconds after discovery for each provider's entire operation, not ten seconds per endpoint. Allow one second for publication; service admission deadline is twelve seconds and UI wait is fifteen seconds. These are timeout budgets, not promises that provider requests succeed.

All triggers use the same plugin scheduler per server/provider. Join in-flight work; return cache when not eligible; otherwise fetch. Retry-After and minimums cannot be bypassed by a manual request. A cached or joined cycle still acknowledges the pending request; its timestamps retain the actual sample time. Deadline expiration publishes cached stale/timeout entries and does not wait for an abandoned underlying request.

## `POST /bridge/snapshot`

Body is BridgeSnapshot: `{ version: 1, serverId, requestId, generatedAt, providers }`. `providers` must contain exactly six unique entries matching BridgeProviderId. Solicited requestId matches the request being answered; autonomous publication uses null. Accept or reject the complete payload atomically.

Entries use canonical ProviderSnapshot fields. Each entry may be freshly fetched, cached, unconfigured or error. A missing credential gives `state: "unconfigured"`, empty usage arrays and sanitized not_configured guidance. Provider errors do not invent zero values. Cached entries retain fetchedAt. Payloads cannot include a secret, credential, endpoint, account id or raw upstream body.

Return `200 { accepted: true, requestId }` for a valid payload. Wrong auth → 401; invalid/missing/duplicate provider or wrong server → 400. A late solicited request cannot clear a later request or overwrite newer samples; reject obsolete publication without changing current state. Completing all six as cached/error still clears the matching pending flag. Autonomous reports do not clear unrelated pending requests.

## Shared settings

`GET /settings` returns SettingsEnvelope. `PATCH /settings` accepts expectedRevision plus allow-listed changes, including keyed `providerVisibility` and `windowSelection`. A 409 returns the current envelope so the client can reapply the intended edit. The server initializes windows on first success without overwriting explicit choices.

## Historical data

Cache post-upgrade last-success usage only. A bridge outage retains eligible samples with their age and a notice. After resetAt, show the historical reading without a fabricated reset, live estimate or false refreshing claim. If the bridge never connected, show a notice alone. Package refusal requires approval.

## Pre-release compatibility and secret checks

Old development data need not be migrated. Preserve server settings and usage cache through restarts and reloads; do not wipe data automatically or modify OpenCode logins.

The six provider credentials stay in OpenCode. Usage payloads, responses, logs and UI contain no secrets. The bridge token appears only in its protected descriptor and authenticated requests.

## Route inventory

- UI bearer: `/health`, `/snapshot`, `/refresh`, `/settings`.
- Bridge bearer: `/bridge/state`, `/bridge/snapshot`.
- No `/quota`, no provider-targeted refresh, no old OpenCode-key connection CRUD. New writes for the six OpenCode-backed providers are rejected rather than silently stored.
