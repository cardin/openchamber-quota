# Data Model: OpenCode Credential Handoff

All models below are intended, not implemented. The existing canonical usage shape remains `docs/contracts/quota-snapshot.schema.json`; new bridge/settings fields are not added to that wire silently.

## BridgeProviderId

| OpenCode key | Display name | Snapshot connectionId | Kind |
| --- | --- | --- | --- |
| `openrouter` | OpenRouter | `bridge-openrouter` | `openrouter` |
| `opencode-go` | OpenCode Go | `bridge-opencode-go` | `opencode-go` |
| `opencode` | OpenCode Zen | `bridge-opencode-zen` | `opencode-zen` |
| `openai` | OpenAI Codex | `bridge-codex` | `codex` |

Ids are stable selection keys, not stored-key connections. Use `OpenAI Codex` consistently. T001 must verify the keys against the actual supported OpenCode credential API.

## BridgeTiming

| Field | Value and meaning |
| --- | --- |
| `fetchIntervalMs` | `300000`: autonomous all-provider cycle; each scheduler may reuse cache |
| `statePollMs` | `1000`: healthy bridge polling; discovery delay target is one second plus local transport |
| `fetchTimeoutMs` | `10000`: total per-provider work budget after discovery, including credential resolution, sequential HTTP/fallback calls and body parsing |
| `publicationAllowanceMs` | `1000`: allowance to serialize and publish the complete result |
| `refreshTimeoutMs` | `12000`: service deadline from admission (discovery + fetch + publication); clear pending state on timeout |
| `sectionWaitMs` | `15000`: UI wait budget, including final snapshot reload; not a network-success guarantee |
| `staleAfterMs` | `600000`: successful reading older than ten minutes is historical |

Discovery and fetching are different stages. No pending-only poll is used. The ten-second fetch budget is not renewed by a fallback request. Schedule aborts and ignore late results; an uncooperative underlying call must not hold publication forever. Cache-only cycles can complete immediately. In-flight work is shared, not restarted; if it cannot finish by a cycle deadline, acknowledge with cache/timeout. Provider outages and retry waits are not promised fresh values within these budgets.

## OpenCodeCredential

- `type`: `"api" | "oauth"`.
- `key`: required string for `api`; maps to `secret.apiKey`.
- `access`: required string for `oauth`; maps to `secret.accessToken`.
- `accountId`, `orgID`: optional strings; inside OpenCode only. Codex uses `accountId`; Zen prefers `orgID`, falling back to `accountId`.
- `refresh`, `expires`: optional source fields; never copied into a pseudo-connection or sent out of OpenCode. This feature does not refresh OAuth credentials.

Read only the four selected integration credentials using the API established by T001. No credential field enters the bridge, cache, settings response, logs or UI.

## Pseudo-connection

Ephemeral input to existing adapters:

- `id`: one of the four stable bridge ids.
- `kind`: matching kind from BridgeProviderId.
- `label`: matching display name.
- `createdAt`: ISO date-time for the temporary object.
- `secret`: only `apiKey?`, `accessToken?`, `accountId?`. Zen's resolved org id is placed in `secret.accountId`, and its adapter reads that exact location for `x-org-id`; Codex reads it for `ChatGPT-Account-Id`.

Never persists. API-key-only Codex accounts do not fabricate ChatGPT quota; report the unsupported credential type explicitly.

## ServerIdentity

- `serverId`: stable identifier derived from the canonical `OPENCHAMBER_SERVICE_DATA_DIR` path (SHA-256 hex). Clients using the same OpenChamber server use its single extension service/data directory; different directories have different ids. This identifies a server, not an individual UI window or login.

## BridgeDescriptor

Required fields:

- `version`: literal `1`.
- `serverId`: ServerIdentity.serverId.
- `port`: integer in `1..65535`, allocated service loopback port.
- `token`: random 32-byte token regenerated each service start; bridge routes only.
- `providers`: exactly the four OpenCode keys, unique.
- `createdAt`: ISO date-time.

Discovery directory: `$XDG_CONFIG_HOME/openchamber-quota/bridges/` (default `~/.config/...`) on POSIX; `%LOCALAPPDATA%\openchamber-quota\bridges\` on Windows. File: `<serverId>.json`. POSIX directory `0700` and file `0600`; Windows inherits the actual per-user ACL (administrators/SYSTEM may have access), with live permissions verification required rather than assuming privacy.

Write atomically. On shutdown remove only a descriptor whose serverId/token still match this process; never unlink a replacement process's file. Multiple servers cannot overwrite one file. Plugin selection must be bound to a server: explicit `bridgeServerId` plugin option, or a sole verified live descriptor when only one exists. If several exist without a selector, do not choose arbitrarily; show selection-required/unavailable. T001 verifies option delivery/configuration on the supported baseline; unsupported automatic binding is not assumed. No OpenCode credentials are in discovery files.

## ProviderSnapshot

Canonical field constraints: `docs/contracts/quota-snapshot.schema.json#/$defs/provider`.

- `connectionId`, `kind`, `label`: required, fixed matching values from BridgeProviderId in bridge results.
- `state`: required `"ok" | "error" | "unconfigured" | "loading"`; completed bridge results cannot remain `loading`.
- `windows`, `caps`, `balances`: required arrays following canonical usage schemas.
- `fetchedAt`: optional ISO date-time of the actual successful sample; cache reuse never makes it newer.
- `refreshing`: required boolean; false on completed bridge results.
- `error`: optional sanitized `{ code, message, retryAt? }`; required for `state: "error"`. Missing credentials use `state: "unconfigured"`, `error.code: "not_configured"`, and no usage arrays.

Bridge failure preserves the last successful windows/caps/balances/fetchedAt with an out-of-date notice. A provider never successfully read instead shows notice/error alone. Fresh provider authentication failure remains an auth error, not a successful zero reading. Preserve a separate last-success sample if later errors would otherwise erase it.

## BridgeState

- `version`: literal `1`.
- `serverId`: bound server identifier.
- `providers`: exactly the four keys.
- `refreshRequested`: boolean; true while one all-provider request is pending.
- `requestId`: nonempty opaque string while pending, otherwise null. Concurrent manual/UI refreshes join the current request.
- `deadlineAt`: epoch milliseconds while pending, otherwise null; admission time + BridgeTiming.refreshTimeoutMs.
- `providerMinimums`: record containing a positive millisecond minimum for every declared provider; initial minimum is `300000` for each. No per-provider request filter exists.
- `serverTime`: epoch milliseconds.

An authenticated `/refresh` admits or joins one all-provider cycle. Cached responses still acknowledge that request. The service gates its own Tavily/custom HTTP calls with their schedulers; the plugin gates the four with its schedulers. Returning cache is not a reason to leave a request pending. Report times are not treated as new HTTP-attempt times.

## ProviderSchedule

One plugin scheduler per server/provider, shared by startup, autonomous timer, credential-event and manual triggers:

- `providerId`: one declared OpenCode key.
- `lastAttemptAt`: epoch milliseconds or null, updated only when actual upstream work begins.
- `nextAllowedAt`: epoch milliseconds, at least lastAttemptAt + that provider's minimum; honors later Retry-After.
- `retryAt`: epoch milliseconds or null, provider-requested backoff.
- `inFlight`: runtime-only shared promise, never persisted.

Every trigger calls the same decision function: join running work; fetch if eligible; otherwise return the cached/error/unconfigured state. Manual requests never bypass minimums or retryAt. Persist only lastAttemptAt/nextAllowedAt/retryAt in a server-bound nonsecret scheduling file/storage and restore on plugin restart. Do not persist credentials. T001/T025 ensure duplicate plugin contexts for one server do not create independent upstream loops; serialize ownership or fail closed until a single coordinator is selected.

## BridgeSnapshot

- `version`: literal `1`.
- `serverId`: matching selected server.
- `requestId`: current request id for solicited results; null for autonomous results.
- `generatedAt`: ISO date-time of assembly, not a replacement for sample timestamps.
- `providers`: exactly four unique ProviderSnapshot entries, with every declared id/kind pair once. Each entry can be freshly fetched, cached, missing or failed. No subset payloads or credential fields are accepted.

Validate atomically. Reject missing/duplicate/undeclared providers and mismatched serverId before replacing any data. A solicited result acknowledges its matching request even when all entries are cached or errors. A late old request must not clear a newer pending request or overwrite newer samples. Autonomous results do not accidentally acknowledge a manual request.

## Snapshot

- `version`: literal `1`.
- `generatedAt`: required ISO date-time.
- `providers`: required ordered ProviderSnapshot array, containing the four bridge entries plus configured Tavily/custom entries. Not necessarily six configured accounts; multiple custom connections remain allowed.

Canonical schema: `docs/contracts/quota-snapshot.schema.json`. Cache is service-owned and contains usage only; scheduling/cache metadata stays outside the strict response shape.

Merge: validated complete bridge cycles update the four; service-owned Tavily/custom remain unchanged. After a service restart, restore post-upgrade last-success samples. Preserve stale values with `state: "ok"` and an optional sanitized notice error; never change fetchedAt on reuse. Fresh results clear stale notices. On missing credentials show `unconfigured`, not invented values.

### Historical rendering

Render historical windows even after their old resetAt, but visibly label the sample as out of date with sample age. Do not show an endless "refreshing" line unless actual work is pending. Suppress the even-use estimate and its live warning comparison; do not advance stale values into a new window or invent a new reset. The original expired reset can be labeled as past. Caps/balances remain last sampled numbers with the same notice.

## DisplaySelection

One server-owned JSON document, `display.json` under `OPENCHAMBER_SERVICE_DATA_DIR`; no authoritative `host.storage` preferences.

- `saved`: boolean, false until a user selection is saved; saved empty selections stay empty.
- `providers`: unique selected stable provider/connection ids.
- `windows`: provider id → unique selected window ids; an explicit empty list is intentional.
- `hiddenBalances`: unique provider ids.
- `cutoffPercent`: finite number in `0..100`, default `10`.
- `resetTime`: `"relative" | "absolute"`, default `relative`.
- `quotaDisplay`: `"remaining" | "used"`, default `remaining`.
- `encounteredBridgeProviders`: unique bridge ids already encountered; does not mean windows initialized.
- `initializedBridgeWindows`: unique bridge ids whose first successful window selection was initialized.
- `explicitProviderSelections`: unique bridge ids with an explicit user show/hide choice.
- `explicitWindowSelections`: unique bridge ids with an explicit window choice, including an empty list.

A first unavailable/missing entry can be encountered and default-enabled without initializing windows. On first successful reading, initialize its current windows once only if explicitWindowSelections does not contain that provider. Preserve explicitProviderSelections, including a hide before data arrived. After initialization, new window types stay opt-in. Perform automatic reconciliation at the service once, not independently in each browser window.

## SettingsEnvelope

- `version`: literal `1` for this new settings wire.
- `revision`: nonnegative integer increasing on committed settings changes.
- `selection`: DisplaySelection.

`GET /settings` returns this envelope. `PATCH /settings` accepts `{ expectedRevision, changes }` where expectedRevision is a nonnegative integer and changes is an allow-listed field update. Provider/window toggles update only the affected keyed selection rather than replacing unrelated maps. Serialize mutations and writes atomically. On revision conflict return 409 with the latest secret-free envelope; clients reapply the user's intended field edit, never an old whole-document save. Connected clients reload within the normal five-second UI poll.

## SettingsPatch

- `expectedRevision`: required nonnegative integer matching the SettingsEnvelope revision being edited.
- `changes`: required nonempty object of allow-listed DisplaySelection field edits. Provider/window keyed changes preserve unrelated keys. Reject secrets, unknown fields and client edits to service-maintained encounter/initialization tracking.

Validate both fields before writes. An explicit provider/window choice also updates its service-maintained explicit-choice tracking atomically; the client cannot spoof that tracking directly.

## Pre-release compatibility scope

There are no external users, so migration of old development records or browser-local settings is out of scope. Do not add an upgrade epoch, automatic wipe, reset module or deletion of old local preference keys. Read/write supported server-owned state and preserve it across normal startups/reloads. Incompatible old development data can be ignored/reported without deletion; any cleanup the developer needs is a separate manual action. OpenCode credential storage is never touched.

## Lifecycle

1. Package permissions approved together → load supported server settings/cache without automatic clearing → publish owned server descriptor.
2. Plugin binds to that server → all-provider cycle → one scheduler decision per provider → full four-entry result.
3. UI refresh admits/joins one request → plugin discovers it on one-second poll → provider work completes or times out within ten seconds → complete result published → pending state cleared by twelve-second deadline.
4. Plugin failure after approval → historical readings + notice, or notice alone; Tavily/custom continue. Package rejection/withdrawal → no service refresh until approval.
5. Shutdown → remove only owned discovery entry. Another server remains independent; clients of this same server share settings.
