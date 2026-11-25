# Research: OpenCode Credential Handoff

## Plugin-only quota acquisition

**Decision:** Quotas is the sole extension display. The plugin uses four selected OpenCode credentials inside OpenCode and sends quota readings only; no Usage-area contribution or manual-key fallback for the four.

**Rationale:** Users intend to hide Usage and retain Quotas. Acquisition must not depend on Usage visibility. Credentials need not cross the plugin/service channel.

**Alternatives considered:** Native quota role (visibility-dependent source and duplicate UI); second stored keys (rejected); service-side credential scans (too broad).

**Evidence boundary:** Plugin feasibility remains T001, not a completed proof. OpenCode's published server-plugin guide describes `integration.connection.active(integrationID)` and `resolve(connection)`; use these for selected integration credentials only after verifying the installed baseline and entry contract. Do not scan the entire credential store. The four intended ids are openrouter, opencode-go, opencode and openai; actual Go/Zen integration sharing is a baseline verification item.

## All-provider cycle with per-provider scheduling

**Decision:** Refresh is always all providers. Every four-provider trigger uses the same scheduler/coordinator; all results contain four entries. Eligible providers fetch, blocked providers return cache/error/missing, and running providers share their promise. No manual override of minimums or retryAt.

**Rationale:** The user rejected provider-specific requests. Fetching an entire payload does not mean making four new upstream requests. Cached entries still acknowledge the cycle and retain actual sample time.

**Alternatives considered:** Subset request/result patches (rejected scope); rejecting every refresh within a global minimum (leaves all-provider acknowledgement unclear); independent timer/manual loops (duplicate work).

## Discovery vs completion budgets

**Decision:** One-second healthy polling, ten-second total work deadline after discovery, one-second publication allowance, twelve-second service deadline and fifteen-second UI wait. Apply one abort signal across sequential provider fallbacks; timed-out/late work must not block publication or overwrite newer data.

**Rationale:** The user accepted approximately one-second discovery and ten-second completion, not a 15-second discovery interval disguised as faster pending polling. Rate-limited/cached outcomes finish without extra HTTP work; failure budgets do not guarantee fresh provider data.

**Alternatives considered:** Fifteen-second idle polling followed by two-second pending checks (cannot speed initial discovery); restarting a ten-second timeout at each endpoint (can exceed completion deadline).

## Server-shared settings and safe discovery

**Decision:** One `display.json` and Tavily/custom connection store per OpenChamber server's extension data directory. Clients read/persist through the service, with revision conflicts and keyed patches preventing lost unrelated changes. No authoritative browser instance selection. Canonical service data-directory hash is serverId; discovery file is `<serverId>.json`, ownership-checked on cleanup.

**Rationale:** User wants clients of one server to share settings. Distinct servers or plugin locations must not overwrite discovery or silently receive another server's quotas. Explicit binding or a sole verified endpoint is required. If several endpoints exist without a selector, stop instead of guessing.

**Alternatives considered:** One descriptor per user (collisions); retaining host.storage with ad-hoc synchronization (multiple competing authorities); arbitrary first endpoint selection (wrong server).

**Verification:** T001 must confirm the supported plugin option/config path for `bridgeServerId` and one coordinator per server when OpenCode loads the plugin in multiple locations. Windows privacy depends on actual inherited ACLs; do not assume `%LOCALAPPDATA%` alone proves the file is restricted. POSIX uses protected directories/files.

## First successful window selection

**Decision:** Provider encounter and successful window initialization are distinct. Record explicit provider/window choices before data arrives; first successful reading initializes windows once only when no explicit choice exists.

**Rationale:** An initial unavailable provider has no windows. Treating it as fully initialized hides real bars later; defaulting again after an explicit hide overrides the user.

**Alternatives considered:** Marking seen on encounter (empty permanent selection); re-enabling every later payload (overwrites hides).

## Zen credential identifier

**Decision:** Resolve Zen `orgID` first (accountId fallback) inside OpenCode into `Pseudo-connection.secret.accountId`; the Zen adapter reads the same secret field for x-org-id. Codex resolves its accountId into the same field for ChatGPT-Account-Id.

**Rationale:** Existing Zen adapter read connection.accountId while the mapping wrote secret.accountId. Cover credential mapping → adapter → actual header in one test, not isolated mocks.

## Approval semantics

**Decision:** Package approves service and full-access plugin permissions together. Plugin load/connectivity failure after approval leaves the service usable; rejection/withdrawal blocks its work. No service-only mode is added. Code/folder updates alone do not promise reapproval.

**Rationale:** Installed SDK `GUEST_SERVICES.md` requires the full requested capability list; `DOCUMENTATION.md` says adding a contribution re-prompts, changing code/folder alone does not.

**Alternatives considered:** Independent plugin decline with approved service (unsupported assumption); extra service-only package/mode (not requested).

## Historical display and pre-release compatibility

**Decision:** Supported cache preserves last successful samples across outages/restarts. Render them with age, even after old resetAt, without live estimate or false refreshing. Because there are no external users, old development records need no compatibility or migration path. Do not implement automatic wiping, startup reset or a storage epoch. Any developer cleanup is separate and manual; OpenCode logins are untouched. Supported Tavily/custom keys remain intentionally stored in the service.

**Rationale:** The user clarified that the earlier legacy comment meant no backward-compatibility obligation, not a product requirement to wipe data. Secret checks forbid new OpenCode credential copies and all secrets in outputs, not the intentional Tavily/custom key file. Normal startup/reload must preserve supported state.

**Alternatives considered:** Dropping old bars at expiry (loses historical sample); treating stale quota as current (misleading); legacy migration machinery (unnecessary pre-release); automatic data wipe (not requested); deleting OpenCode auth (out of scope).

## Remaining verification, not open product decisions

T001 feasibility/server binding, correct OAuth/API provider endpoints and org mapping, actual Windows ACLs, deadline cancellation, and live all-provider refresh remain unverified until implementation. No completed tests, approval dialogs or working plugin are claimed here. These are implementation gates, not user clarifications silently resolved by assumption.
