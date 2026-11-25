# Interfaces

## Implemented service transport

The section uses `host.serviceRequest`. The service listens on `127.0.0.1:${OPENCHAMBER_SERVICE_PORT}` and requires the host-injected bearer on existing UI routes; JSON bodies are capped at 64 KiB. Existing routes are `/health`, `/snapshot`, `/refresh`, connection CRUD and connection test. The baseline `/refresh` accepts optional connectionId; the intended replacement below deliberately removes it.

## Intended refresh and plugin bridge (ADR-010/012)

No quota-provider role or `/quota` route. The plugin retains the four OpenCode credentials inside OpenCode and publishes quota only through bridge-token-authenticated `/bridge/state` and `/bridge/snapshot`. UI requests retain the separate service bearer; tokens cannot authenticate the other route group.

`POST /refresh` accepts empty body/`{}` only, returning `202 { accepted: true, requestId, deadlineAt }`; any provider/connectionId filter returns 400. Concurrent requests join one all-provider cycle. `/bridge/state` contains version, serverId, the four provider ids, pending requestId/deadlineAt (null while idle), refreshRequested, providerMinimums and serverTime. No requestedProviders field exists.

`POST /bridge/snapshot` contains version, bound serverId, requestId (null for autonomous results), generatedAt and exactly four unique provider entries. Each may be fresh/cached/missing/error. Validate the entire payload atomically; reject missing/duplicate/undeclared sources, secrets and wrong/obsolete request ids. Cached/error cycles still acknowledge matching requests without aging sample timestamps. Manual/timer/credential triggers share the same per-provider scheduler and cannot bypass minimums/retryAt.

Healthy request polling targets one second. Provider work is bounded to ten seconds after discovery, including sequential endpoints/body parsing. Publication allowance one second; service deadline twelve seconds; UI wait fifteen seconds. Deadline cancellation/late response checks prevent stale completions replacing newer readings. Provider failures return cache/timeout, not guaranteed new readings.

> Provisional — feature `002-opencode-credential-handoff`: intended bridge and all-provider refresh wire is not implemented yet.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## Intended server settings and discovery (ADR-011)

One server-owned `display.json` and current `connections.json` under `OPENCHAMBER_SERVICE_DATA_DIR`; all clients of that server share them. `GET /settings` returns `{ version: 1, revision, selection }`. `PATCH /settings` takes expectedRevision and allow-listed field changes; serialize atomic writes. A 409 returns latest selection/revision so the client reapplies its intended edit, not an old whole record. Connected clients reload within five seconds.

Selection fields: saved, providers, windows, hiddenBalances, cutoffPercent (0..100, default 10), resetTime (relative/absolute), quotaDisplay (remaining/used), encounteredBridgeProviders, initializedBridgeWindows, explicitProviderSelections and explicitWindowSelections. Encounter alone does not initialize windows. First successful quota defaults windows once only absent an explicit choice, including a saved empty list. No browser-instance preference key is authoritative.

serverId is a stable hash of the canonical extension data directory, not a UI client id. Discovery entry is `<serverId>.json` under POSIX `$XDG_CONFIG_HOME/openchamber-quota/bridges/` (default ~/.config) or Windows `%LOCALAPPDATA%\openchamber-quota\bridges\`. Fields are version, serverId, loopback port, per-start bridge token, providers and createdAt. POSIX directory/file modes 0700/0600; inspect actual Windows inherited ACLs. Cleanup unlinks only an entry still owned by the matching serverId/token. Bind the plugin explicitly or to a sole verified endpoint; multiple unselected servers cannot be guessed. Binding/options and duplicate plugin contexts are feasibility checks, not verified guarantees.

> Provisional — feature `002-opencode-credential-handoff`: shared settings, concurrency and safe discovery contracts are not implemented yet.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## Snapshot

Canonical [quota-snapshot.schema.json](contracts/quota-snapshot.schema.json): `{ version: 1, generatedAt, providers }`. Provider entries contain connectionId, kind, label, state, refreshing, windows, caps, balances and optional fetchedAt/error (error required in error state). Four intended bridge ids: bridge-openrouter, bridge-opencode-go, bridge-opencode-zen, bridge-codex. They are not stored-key connections.

Windows carry remainingPercent/resetAt and optional durationSeconds/amounts/error. Caps carry used/limit/unit without reset; balances value/unit without bars. Invalid assembled snapshots return sanitized errors, never upstream details. Settings/scheduler metadata are outside the strict usage response shape; no upgrade epoch is needed.

Intended stale bridge failure keeps last-success usage/fetchedAt with an optional notice on ok state; never-read entries show error alone. After old resetAt, render history/age without live even-use estimation or fictitious refreshing. Actual pending work is distinct. Missing OpenCode credentials use unconfigured plus not_configured guidance and empty arrays.

> Provisional — feature `002-opencode-credential-handoff`: bridge merge and historical rendering require implementation and schema-conformance verification.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## Connections, compatibility and secrecy

Current baseline `connections.json` has version 1 and stored connections (id/kind/label/endpoint?/accountId?/createdAt/test metadata?/service-only secret). Public metadata omits secrets/account ids. Files are 0600 POSIX; Windows inherits the service data directory ACL.

Old development records need no migration because there are no external users yet. No storage epoch, automatic upgrade reset or data wipe is implemented. Supported Tavily/custom keys, settings and cache persist across normal starts/reloads; old browser preferences are no longer authoritative but are not automatically deleted. Any developer cleanup is a separate manual action. OpenCode credential storage is untouched. Four-provider key writes are rejected. Supported Tavily/custom keys are allowed only in their intended store; zero new OpenCode credential copies leave OpenCode and outputs/logs/UI contain no secrets.

> Provisional — feature `002-opencode-credential-handoff`: supported-state persistence and credential boundaries are not implemented or verified yet.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## Custom provider format and errors

Canonical [custom-provider-v1.schema.json](contracts/custom-provider-v1.schema.json). GET configured HTTPS endpoint with Bearer key, Accept application/json, no redirects or endpoint credential/query/fragment; 64 KiB response/ten-second timeout and version 1 with at least one usable window/cap/balance. No mappings/scripts/custom headers. New Custom setup remains hidden until verified; supported configured connections remain usable and are not automatically cleared.

Sanitized error envelope `{ error: { code, message, retryAt? } }`; codes: not_configured, auth, rate_limited, timeout, network, bad_response, provider_error. Refresh-budget expiry is timeout; connection loss is bridge-unavailable history, not fabricated auth success.
