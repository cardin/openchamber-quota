# Interfaces

## Implemented service transport

The section uses `host.serviceRequest`. The service listens on `127.0.0.1:${OPENCHAMBER_SERVICE_PORT}` and requires the host-injected bearer on UI routes; JSON bodies are capped at 64 KiB. Implemented routes are `/health`, `/snapshot`, `/refresh`, `/settings`, connection CRUD/test, `/bridge/state` and `/bridge/snapshot`. `/refresh` accepts an empty body only; connection filters return 400. A `/quota` route does not exist.

## Implemented refresh and plugin bridge (ADR-010/012)

The plugin retains the six OpenCode-backed credentials inside OpenCode and publishes quota only through bridge-token-authenticated `/bridge/state` and `/bridge/snapshot`. UI requests retain the separate service bearer; neither token authenticates the other route group, and unknown `/bridge/*` routes still require the bridge token before returning 404.

`POST /refresh` takes no query parameters or nonempty body fields and returns `202 { accepted: true, requestId, deadlineAt }`. Concurrent requests join one all-provider cycle. `/bridge/state` reports the server, the six provider IDs, the pending request ID and deadline (null while idle), whether refresh is requested, provider minimums, and server time.

`POST /bridge/snapshot` contains version, bound serverId, requestId (null for autonomous results), generatedAt and exactly six unique provider entries. The service rejects unknown fields, pending entries, wrong servers, undeclared or duplicate providers, stale results and obsolete request IDs before applying readings. Cached/error cycles acknowledge matching requests without changing sample timestamps. Manual and credential-event refreshes bypass the five-minute poll interval but preserve the 30-second floor. All triggers honor the 1–15 minute failure backoff and `Retry-After` (capped at 24 hours).

Healthy request polling targets one second. Provider work is bounded to ten seconds after discovery, including sequential endpoints/body parsing. Publication allowance one second; service deadline twelve seconds; UI wait fifteen seconds. Deadline cancellation/late response checks prevent stale completions replacing newer readings. Provider failures return cache/timeout, not guaranteed new readings.

> Provisional — feature `002-opencode-credential-handoff`: the bridge and all-provider refresh are implemented; live plugin/provider timing remains unverified.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## Implemented server settings and discovery (ADR-011)

Clients of one server share `display.json` under `OPENCHAMBER_SERVICE_DATA_DIR`. `GET /settings` returns `{ version: 1, revision, selection }`. `PATCH /settings` takes expectedRevision and allow-listed field changes; writes serialize atomically. A 409 returns the latest envelope so the client reapplies its intended edit, not an old whole record. Connected clients reload on the five-second poll.

Settings writes use `providerVisibility: { [providerId]: boolean }` and `windowSelection: { [providerId]: windowIds }` to record explicit choices without activating a replacement selection for other providers. An empty window list is explicit. Existing `providers` and `windows` patches retain their replacement-selection semantics.

Selection fields: saved, providers, providerOrder, windows, collapsedProviders, collapsedQuota, hiddenBalances, cutoffPercent (0..100, default 10), resetTime (relative/absolute), quotaDisplay (remaining/used), encounteredBridgeProviders, initializedBridgeWindows, explicitProviderSelections and explicitWindowSelections. Encounter alone does not initialize windows. A newly encountered bridge provider is default-enabled unless a saved provider list explicitly omitted it; its current windows initialize once only absent an explicit choice, including a saved empty list. Clients cannot write the service tracking fields. No browser-instance preference key is authoritative.

`collapsedProviders` is the list of collapsed provider IDs in settings reads; absent values in older settings default to an empty list. A `PATCH /settings` sends a keyed `changes.collapsedProviders` object: `true` collapses a provider and `false` expands it. Unmentioned providers and their summary choices are unchanged.

`providerOrder` controls panel order. `collapsedQuota` stores a window ID, `cap:<id>`, `balance:<id>`, or an applicable comparison per provider. Window IDs that look like another mode use `window:<id>`. `least-remaining` needs at least two percentage windows; `earliest-reset` needs two distinct reset times. Hidden balances aren't offered; a choice that no longer applies falls back to an available reading without changing the saved choice.

The panel lists only attempted providers without an authentication error. Quota settings derives an attempted-provider status table from the same snapshot; unconfigured providers are omitted from both surfaces. Authentication errors appear only in that table ([ADR-017](ADR.md#adr-017-hide-unauthenticated-providers-and-report-problems-in-settings)).

The service owns the cache and settings. UI windows of one OpenChamber server share one snapshot, cache, and admitted refresh cycle.

serverId is a stable SHA-256 hex hash of the canonical extension data directory, not a UI client id. Discovery entry is `<serverId>.json` under POSIX `$XDG_CONFIG_HOME/openchamber-quota/bridges/` (default ~/.config) or Windows `%LOCALAPPDATA%\openchamber-quota\bridges\`. Fields are version, serverId, loopback port, per-start bridge token, providers and createdAt. POSIX directory/file modes 0700/0600; actual Windows inherited ACLs still require inspection. Cleanup unlinks only an entry still owned by the matching serverId/token. The plugin binds an explicit option or a sole verified endpoint; several unselected servers are selection-required. A server-bound lock file with heartbeat admits one coordinator; followers do not fetch.

> Provisional — feature `002-opencode-credential-handoff`: shared settings and discovery are implemented; live two-client and Windows ACL checks remain.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## Snapshot

Canonical [quota-snapshot.schema.json](contracts/quota-snapshot.schema.json): `{ version: 1, generatedAt, providers }`. Provider entries contain connectionId, kind, label, state, refreshing, windows, caps, balances and optional fetchedAt/error (error required in error state). Six implemented bridge ids: bridge-openrouter, bridge-opencode-go, bridge-opencode-zen, bridge-codex, bridge-tavily, bridge-exa. They are not stored-key connections.

Windows carry remainingPercent/resetAt and optional durationSeconds/amounts/error. Caps carry used/limit/unit without reset; balances value/unit without bars. Invalid assembled snapshots return sanitized errors, never upstream details. Settings/scheduler metadata are outside the strict usage response shape; no upgrade epoch is needed.

Bridge failure keeps last-success usage/fetchedAt with an out-of-date notice on ok state; a restarted service labels restored samples the same way until a new bridge result arrives. When no bridge reading was ever received, the panel and settings show one restart notice instead of provider rows. After old resetAt, render the sampled history with age, without live even-use estimation or fictitious refreshing. Actual pending work is distinct. Missing OpenCode credentials remain `unconfigured` in the snapshot and are never listed in the panel or Quota settings; when none are signed in, the panel shows sign-in guidance. Auth failures are omitted from the panel, shown in the settings provider status table, and never cached as successes.

> Provisional — feature `002-opencode-credential-handoff`: bridge merge and historical rendering are implemented and schema-checked with fixtures; live provider data remains.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## Compatibility and secrecy

Old development data need not be migrated and is not wiped automatically. Settings and cache persist across normal starts and reloads. The six providers’ credentials stay in OpenCode and out of the service, logs, and UI.

> Provisional — feature `002-opencode-credential-handoff`: persistence and credential boundaries are fixture-tested; live restart and Windows bridge ACL checks remain.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## Existing custom-provider implementation

Custom connections are outside the acceptance scope ([ADR-021](ADR.md#adr-021-scope-quota-requirements-to-opencode-providers)). The current service still stores custom keys in `connections.json`; public metadata omits keys and account IDs.

The existing adapter reads [custom-provider-v1.schema.json](contracts/custom-provider-v1.schema.json) data from a configured HTTPS endpoint. The settings page has no new-connection form.

## Errors

Sanitized error envelope `{ error: { code, message, retryAt? } }`; codes: not_configured, auth, rate_limited, timeout, network, bad_response, provider_error. Refresh-budget expiry is timeout; connection loss is bridge-unavailable history, not fabricated auth success.
