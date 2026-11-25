# Contract: OpenCode Plugin Bridge

Intended, not implemented. Models and exact field constraints are in [data-model.md](../data-model.md).

## Manifest and approval

Keep `statusSection`, `page`, and the existing `service`. Add `contributes.opencodePlugin: "src/opencode-plugin"`; no `service.provides: ["quota"]`, no `contributes.quota`, no `/quota` route. The bundle uses the plugin lifecycle verified by T001 and carries no installed-package dependency at runtime.

OpenChamber asks for the package's whole permission list, including service and full-access plugin execution. Plugin code or folder changes alone do not trigger reapproval; additions to permissions do. README discloses the four providers before approval; Quota settings repeats that after approval. Rejecting the package blocks service refresh. A plugin load/connectivity failure after approval leaves Tavily/custom usable.

## Server binding and descriptor

One `<serverId>.json` discovery entry per service data directory in the platform-specific `bridges/` directory; fields and permissions follow `BridgeDescriptor`. Bind with an explicit `bridgeServerId` plugin option, or a sole verified live descriptor. Multiple descriptors without a selector are selection-required, not an arbitrary match. T001 verifies actual option/config delivery before relying on it. Remove a descriptor only if its token/serverId are still owned by the stopping process.

The descriptor contains a bridge-only token and loopback port, never OpenCode credentials. It is not a UI-instance preference store. Clients of one OpenChamber server share one settings document; distinct servers have distinct discovery entries.

## Authentication

UI routes use the existing host-injected service bearer through `host.serviceRequest`. Bridge routes require the separate descriptor token. Neither token authenticates the other route group. Existing 64 KiB JSON body bound and sanitized error envelopes apply.

## All-provider refresh

`POST /refresh` accepts no provider id, connectionId or provider filter. Empty body/`{}` starts or joins an all-provider cycle; filter fields return 400. The response is `202 { accepted: true, requestId, deadlineAt }`. Concurrent UI refreshes share requestId. Service-owned Tavily/custom and plugin-owned four each apply their internal per-provider limits. Cached data is a valid result, not a forced HTTP fetch.

`GET /bridge/state` returns BridgeState:

```json
{
  "version": 1,
  "serverId": "server-data-directory-hash",
  "providers": ["openrouter", "opencode-go", "opencode", "openai"],
  "refreshRequested": true,
  "requestId": "refresh-opaque-id",
  "deadlineAt": 1790000012000,
  "providerMinimums": {"openrouter": 300000, "opencode-go": 300000, "opencode": 300000, "openai": 300000},
  "serverTime": 1790000000000
}
```

Idle requestId/deadlineAt are null. No requestedProviders field exists. Poll every one second while healthy. Discovery budget is about one second plus transport; fetch budget is ten seconds after discovery for each provider's entire operation, not ten seconds per endpoint. Allow one second for publication; service admission deadline is twelve seconds and UI wait is fifteen seconds. These are timeout budgets, not promises that provider requests succeed.

All triggers use the same plugin scheduler per server/provider. Join in-flight work; return cache when not eligible; otherwise fetch. Retry-After and minimums cannot be bypassed by a manual request. A cached or joined cycle still acknowledges the pending request; its timestamps retain the actual sample time. Deadline expiration publishes cached stale/timeout entries and does not wait for an abandoned underlying request.

## `POST /bridge/snapshot`

Body is BridgeSnapshot: `{ version: 1, serverId, requestId, generatedAt, providers }`. `providers` must contain exactly four unique entries matching BridgeProviderId; no subset payloads. Solicited requestId matches the request being answered; autonomous publication uses null. Accept/reject the complete payload atomically, then update the four and retain service-owned Tavily/custom.

Entries use canonical ProviderSnapshot fields. Each entry may be freshly fetched, cached, unconfigured or error. A missing credential gives `state: "unconfigured"`, empty usage arrays and sanitized not_configured guidance. Provider errors do not invent zero values. Cached entries retain fetchedAt. Payloads cannot include a secret, credential, endpoint, account id or raw upstream body.

Return `200 { accepted: true, requestId }` for a valid payload. Wrong auth → 401; invalid/missing/duplicate provider or wrong server → 400. A late solicited request cannot clear a later request or overwrite newer samples; reject obsolete publication without changing current state. Completing all four as cached/error still clears the matching pending flag. Autonomous reports do not clear unrelated pending requests.

## Shared settings

`GET /settings` returns SettingsEnvelope. `PATCH /settings` accepts expectedRevision plus allow-listed field changes; no secret fields. Serialize writes. Conflicts return 409 with current envelope so the UI reapplies the intended edit rather than an outdated whole selection. Preferences, provider/window selection and current Tavily/custom connections are shared by all clients of the same server; different servers retain separate data. Service performs first-success window initialization once while preserving prior explicit choices.

## Historical data

Cache post-upgrade last-success usage only. Bridge timeout/unavailability retains that sample with its age and an out-of-date notice. Even after resetAt passes, render the historical number/bar, not endless "refreshing", a fabricated new reset or a recalculated even-use estimate. A never-read provider shows notice alone. Package rejection is approval-required, not an independently functioning Tavily/custom service.

## Pre-release compatibility and secret checks

Old development formats need no migration because there are no external users yet. There is no automatic wipe, storage-epoch reset or startup deletion. Preserve supported Tavily/custom connections, server settings and cache across normal restarts/reloads. Old local preferences are no longer authoritative but are not deleted automatically. Manual developer cleanup is separate from this feature; OpenCode logins are never touched.

Tavily/custom keys are allowed only in connections.json. New copies of the four OpenCode credentials are forbidden anywhere outside OpenCode. Usage payloads, responses, logs and UI contain no secrets. Bridge tokens are allowed only in the protected descriptor and authenticated requests, never displayed or logged.

## Route inventory

- UI bearer: `/health`, `/snapshot`, `/refresh`, `/settings`, existing Tavily/custom connection CRUD/test.
- Bridge bearer: `/bridge/state`, `/bridge/snapshot`.
- No `/quota`, no provider-targeted refresh, no old OpenCode-key connection CRUD. New writes for the four are rejected rather than silently stored.
