# Research: OpenCode Credential Handoff

## Plugin-only quota acquisition

**Decision:** Quotas is the sole extension display. The plugin uses six selected OpenCode credentials inside OpenCode and sends quota readings only; no Usage-area contribution or manual-key fallback for those six.

**Rationale:** Users intend to hide Usage and retain Quotas. Acquisition must not depend on Usage visibility. Credentials need not cross the plugin/service channel.

**Alternatives considered:** Native quota role (visibility-dependent source and duplicate UI); second stored keys (rejected); service-side credential scans (too broad).

**Evidence boundary:** Plugin feasibility remains T001, not a completed proof. OpenCode's published server-plugin guide describes `integration.connection.active(integrationID)` and `resolve(connection)`; use these for selected integration credentials only after verifying the installed baseline and entry contract. Do not scan the entire credential store. The six intended ids are openrouter, opencode-go, opencode, openai, tavily and exa; actual Go/Zen integration sharing and the Tavily/Exa environment forms are baseline verification items.

## All-provider cycle with per-provider scheduling

**Decision:** Refresh is always all providers. Every six-provider trigger uses the same scheduler/coordinator; all results contain six entries. Eligible providers fetch, blocked providers return cache/error/missing, and running providers share their promise. No manual override of minimums or retryAt.

**Rationale:** The user rejected provider-specific requests. Fetching an entire payload does not mean making six new upstream requests. Cached entries still acknowledge the cycle and retain actual sample time.

**Alternatives considered:** Subset request/result patches (rejected scope); rejecting every refresh within a global minimum (leaves all-provider acknowledgement unclear); independent timer/manual loops (duplicate work).

## Discovery vs completion budgets

**Decision:** One-second healthy polling, ten-second total work deadline after discovery, one-second publication allowance, twelve-second service deadline and fifteen-second UI wait. Apply one abort signal across sequential provider fallbacks; timed-out/late work must not block publication or overwrite newer data.

**Rationale:** The user accepted approximately one-second discovery and ten-second completion, not a 15-second discovery interval disguised as faster pending polling. Rate-limited/cached outcomes finish without extra HTTP work; failure budgets do not guarantee fresh provider data.

**Alternatives considered:** Fifteen-second idle polling followed by two-second pending checks (cannot speed initial discovery); restarting a ten-second timeout at each endpoint (can exceed completion deadline).

## Server-shared settings and safe discovery

**Decision:** One `display.json` per OpenChamber server. Revision conflicts and keyed patches protect independent settings changes. The canonical service data-directory hash identifies the server and its ownership-checked `<serverId>.json` descriptor.

**Rationale:** User wants clients of one server to share settings. Distinct servers or plugin locations must not overwrite discovery or silently receive another server's quotas. Explicit binding or a sole verified endpoint is required. If several endpoints exist without a selector, stop instead of guessing.

**Alternatives considered:** One descriptor per user (collisions); retaining host.storage with ad-hoc synchronization (multiple competing authorities); arbitrary first endpoint selection (wrong server).

**Verification:** T001 must confirm the supported plugin option/config path for `bridgeServerId` and one coordinator per server when OpenCode loads the plugin in multiple locations. Windows privacy depends on actual inherited ACLs; do not assume `%LOCALAPPDATA%` alone proves the file is restricted. POSIX uses protected directories/files.

## First successful window selection

**Decision:** Provider encounter and successful window initialization are distinct. Record explicit provider/window choices before data arrives; first successful reading initializes windows once only when no explicit choice exists.

**Rationale:** An initial unavailable provider has no windows. Treating it as fully initialized hides real bars later; defaulting again after an explicit hide overrides the user.

**Alternatives considered:** Marking seen on encounter (empty permanent selection); re-enabling every later payload (overwrites hides).

## Zen credential identifier

**Decision:** Resolve Zen `orgID` first (accountId fallback) inside OpenCode into `Pseudo-connection.secret.accountId`; the Zen adapter reads the same secret field for x-org-id. OpenAI resolves its accountId (or the access-token `chatgpt_account_id` claim) into the same field for ChatGPT-Account-Id.

**Rationale:** Existing Zen adapter read connection.accountId while the mapping wrote secret.accountId. Cover credential mapping → adapter → actual header in one test, not isolated mocks.

## Approval semantics

**Decision:** Package approves service and full-access plugin permissions together. Plugin load/connectivity failure after approval leaves the service usable; rejection/withdrawal blocks its work. No service-only mode is added. Code/folder updates alone do not promise reapproval.

**Rationale:** Installed SDK `GUEST_SERVICES.md` requires the full requested capability list; `DOCUMENTATION.md` says adding a contribution re-prompts, changing code/folder alone does not.

**Alternatives considered:** Independent plugin decline with approved service (unsupported assumption); extra service-only package/mode (not requested).

## Historical display and pre-release compatibility

**Decision:** Cache preserves eligible last samples through outages and restarts. Show age without a live estimate or false refresh. Old development data needs no migration or automatic reset. OpenCode logins are untouched.

**Rationale:** Pre-release compatibility is optional; automatic deletion is outside scope. Supported settings and cache persist, and provider credentials stay in OpenCode.

**Alternatives considered:** Dropping old bars at expiry (loses historical sample); treating stale quota as current (misleading); legacy migration machinery (unnecessary pre-release); automatic data wipe (not requested); deleting OpenCode auth (out of scope).

## T001 feasibility findings (2026-11-25)

**Baseline inspected:** OpenCode 2.4.1 (`~/.opencode/bin/opencode`). The binary contains the V2 plugin surface (`PluginContext`, `integration.connection`); `@opencode-ai/plugin@1.18.25` types declare `setup(ctx)` with `ctx.options` and `ctx.integration.connection.active(id)` / `resolve(connection)`. A disposable self-contained bundle (`bun build --target node --format esm`) default-exporting `{ id, setup }` was executed against a fixture context: only the four originally declared ids were queried in that disposable check; the current scope adds Tavily and Exa, `key`/`oauth` credentials resolved, `fetch`/`AbortController` were present, setup cleanup ran, and an explicit option arrived in `ctx.options`.

**Credential shapes:** V2 `resolve` returns `CredentialKey { type: "key", key, metadata? }` or `CredentialOAuth { type: "oauth", access, refresh, expires, methodID, metadata? }`. The installed 2.4.1 credential store still labels key credentials `type: "api"`, so mapping accepts both `key` and `api`. Observed store keys: `openrouter`, `opencode-go`, `openai` (OAuth with top-level `accountId`); no `opencode` (Zen) credential exists on this machine, so Zen's id and org field remain unverified live. `refresh`/`expires` are never copied.

**Options and binding:** `contributes.opencodePlugin` is delivered as a folder path in OpenChamber's managed OpenCode config (SDK `DOCUMENTATION.md`). OpenCode 2.4.1 accepts `{ package, options }` plugin entries, but the host writes a plain path, so `bridgeServerId` cannot be assumed. The plugin honours `ctx.options.bridgeServerId` when present and otherwise binds only to a sole verified live descriptor; several descriptors are selection-required, never arbitrary.

**Multiple locations:** setup is per plugin instance/location; the host does not guarantee one instance per server. A server-bound lock file with heartbeat serializes one coordinator; followers fail closed and never fetch upstream.

**Credential events:** the plugin uses the V2 `credential.updated` and `credential.switched` events when available, filtered to the six integrations. Eligible timer and manual fetches also re-resolve the credential.

**Remaining live gaps:** a real OpenCode load of this extension's plugin, Zen's orgID location, live upstream calls, Windows ACLs and authorization dialogs are checked in T055. Scoped acquisition, safe sole-descriptor binding and single-coordinator ownership were available, so T001 does not stop implementation.

## Remaining verification, not open product decisions

Live all-provider refresh, actual Windows ACLs and deadline cancellation under real network stalls remain unverified until implementation and T055. No completed tests, approval dialogs or working plugin are claimed here. These are implementation gates, not user clarifications silently resolved by assumption.
