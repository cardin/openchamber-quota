---
description: "Executable task list for the plugin-only, server-shared Quotas design"
---

# Tasks: OpenCode Credential Handoff

**Input:** [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/plugin-bridge.md](contracts/plugin-bridge.md), [quickstart.md](quickstart.md).

All active tasks are pending. Task ids are preserved; T068–T069 are retired because automatic reset is not required. Execution follows explicit dependencies, not ascending ids. Tests are included because the spec/plan request contract, secrecy, timing and independent story checks. `[P]` denotes independent work only after its named prerequisites; it does not authorize concurrent edits to the same file.

## Phase 1: Setup and feasibility gate

**Goal:** Prove the selected OpenCode plugin API, credentials, server binding and lifecycle before implementation.

- [ ] T001 In a disposable plugin, verify selected integration credential resolution for the four ids, setup/cleanup, fetch/AbortController/filesystem availability in a self-contained bundle, explicit `bridgeServerId` option delivery through the supported OpenChamber configuration, and whether multiple OpenCode locations instantiate the plugin; record exact API/version and how one server-bound coordinator avoids duplicate loops in specs/002-opencode-credential-handoff/research.md. Never log real credentials. Stop if scoped acquisition or safe binding/coordinator is unavailable.
- [ ] T002 Add the plugin contribution and build:plugin in package.json; include it in build, retain status/page/service, and add no quota-role contribution. Use the self-contained entry contract actually verified by T001.
- [ ] T003 [P] Scaffold setup/cleanup in src/opencode-plugin/index.ts after T001, with dependency injection for scheduler, clock, transport and descriptor selection.
- [ ] T004 [P] Define the data-model.md `BridgeProviderId` rows and exact `BridgeTiming.fetchIntervalMs`, `BridgeTiming.statePollMs`, `BridgeTiming.fetchTimeoutMs`, `BridgeTiming.publicationAllowanceMs`, `BridgeTiming.refreshTimeoutMs`, `BridgeTiming.sectionWaitMs`, `BridgeTiming.staleAfterMs` in src/core/bridge.ts; use `OpenAI Codex` in src/core/labels.ts. No pendingPollMs or per-provider request filter.

## Phase 2: Foundation

**Goal:** Server-shared settings, safe discovery, authenticated complete cycles and preserved cache. This blocks story implementation. Integrate T060–T062, T065–T067 and T070 as described under Dependencies.

- [ ] T005 [P] Write tests/contract/plugin-bridge.test.ts for route-group auth isolation, server binding, exactly four unique id/kind result entries, invalid/secret/subset payload rejection without mutation, obsolete request id rejection, full cached-result acknowledgement, and `/quota` absence; valid merged usage must satisfy docs/contracts/quota-snapshot.schema.json.
- [ ] T006 [P] Write tests/unit/snapshot-merge.test.ts for complete four-entry cycles retaining service-owned Tavily/custom, cached last-success after restart, unavailable notice with unchanged fetchedAt, never-read notice alone, missing credentials, and rejection of stale/partial publications.
- [ ] T007 Define separate bridge/settings types in src/core/types.ts using data-model.md `ProviderSnapshot.connectionId`, `ProviderSnapshot.kind`, `ProviderSnapshot.state` and BridgeProviderId pairing without narrowing service-owned Tavily/custom types. Keep settings metadata outside the canonical usage wire; no upgrade-epoch model is needed.
- [ ] T008 [P] Implement src/core/bridge-path.ts using data-model.md `ServerIdentity.serverId` and the BridgeDescriptor protected `bridges/<serverId>.json` paths. Hash the canonical service data directory, not a client window id; require explicit binding or a sole verified endpoint, never arbitrary multi-server selection (after T001/T004).
- [ ] T009 Implement src/service/bridge-descriptor.ts from data-model.md `BridgeDescriptor.version`, `BridgeDescriptor.serverId`, `BridgeDescriptor.port`, `BridgeDescriptor.token`, `BridgeDescriptor.providers`, `BridgeDescriptor.createdAt`; atomic protected writes and cleanup only when serverId/token still match this process. Preserve another server/replacement descriptor (after T008).
- [ ] T010 Implement src/service/bridge.ts validating data-model.md `BridgeSnapshot.version`, `BridgeSnapshot.serverId`, `BridgeSnapshot.requestId`, `BridgeSnapshot.generatedAt`, `BridgeSnapshot.providers` atomically; require all four pairs once, no loading terminal entries/secrets, and freshness/request-id checks before mutation. Produce data-model.md `BridgeState.version`, `BridgeState.serverId`, `BridgeState.providers`, `BridgeState.refreshRequested`, `BridgeState.requestId`, `BridgeState.deadlineAt`, `BridgeState.providerMinimums`, `BridgeState.serverTime`. All-cached/error results acknowledge the matching cycle; autonomous reports do not clear unrelated requests (after T007).
- [ ] T011 Implement src/core/snapshot-merge.ts per data-model.md Snapshot merge/Historical rendering: keep a separate last-success sample, preserve actual fetchedAt on cache reuse, attach unavailable notice without invented values, restore post-upgrade history, and keep missing/auth/timeout states distinct (after T007).
- [ ] T012 Wire bridge-token-only `/bridge/state` and `/bridge/snapshot` in src/service/routes.ts; authenticate other routes only with the UI service token; add no `/quota` or provider-targeted refresh (after T010).
- [ ] T013 Update src/service/snapshot.ts to assemble and validate data-model.md `Snapshot.version`, `Snapshot.generatedAt`, `Snapshot.providers`; preserve supported last-success samples without credentials, restoring them before bridge availability is known. Exclude stored-key acquisition for the four without deleting development records. Route one all-provider refresh through T060 and service schedulers for Tavily/custom, reusing cache within limits (after T010/T011/T060).
- [ ] T014 Wire src/service/main.ts: load server-owned settings/connections/cache without wiping, publish bound identity/descriptor after listening, and use ownership-safe shutdown cleanup; supply settings/bridge dependencies to routes (after T009/T012/T013/T065/T066).

## Phase 3: US1 — All quotas in Quotas (P1, MVP)

**Independent Test:** Show all configured sources in Quotas with no key entry for the four and Usage hidden. Requests always cover all providers; caches count as completion. Window initialization after first success preserves explicit prior hides.

- [ ] T015 [P] [US1] Test selected four-only credential resolution in tests/unit/plugin-credentials.test.ts, API/OAuth mapping, no copied refresh/expires, missing credentials, Zen orgID precedence/accountId fallback and unsupported API-key Codex state (after T001).
- [ ] T016 [P] [US1] Update tests/unit/providers.test.ts with a mapping-to-Zen-adapter-to-request-header test for x-org-id from `secret.accountId`, Codex ChatGPT-Account-Id/access-token-only, and Go/Zen API/OAuth sources; no CLI file fallback (after T062).
- [ ] T017 [P] [US1] Update tests/integration/us1.test.ts to show the four plus configured Tavily/custom using one merged snapshot and shared server settings, independent of Usage visibility; cover missing then successful readings and explicit pre-data hide/empty-window choice.
- [ ] T018 [P] [US1] Update tests/contract/coverage.test.ts for the plugin contribution, unchanged Quotas/page/service contributions, absent quota role and self-contained built plugin.
- [ ] T019 [P] [US1] Update src/providers/codex.ts to require supplied accessToken and secret.accountId, remove CLI auth reader and node filesystem/os/path imports, and use OpenCode sign-in guidance. Respect the shared operation signal/deadline from T063 (after T062).
- [ ] T020 [P] [US1] Update src/providers/opencode-go.ts and src/providers/opencode-zen.ts for API/OAuth Bearer inputs and Zen x-org-id from `connection.secret.accountId`; sequential fallback calls share the remaining operation budget, not fresh per-call 15-second limits. Preserve validated normalization (after T062).
- [ ] T021 [US1] Update src/providers/types.ts and src/service/snapshot.ts to remove codexHome and provide cancellable/deadline-aware AdapterContext while retaining the service-owned transport path for Tavily/custom (after T019/T020/T062).
- [ ] T022 [US1] Implement src/opencode-plugin/credentials.ts via T001: explicitly map data-model.md `OpenCodeCredential.type`, `OpenCodeCredential.key`, `OpenCodeCredential.access`, `OpenCodeCredential.accountId`, `OpenCodeCredential.orgID` into data-model.md `Pseudo-connection.id`, `Pseudo-connection.kind`, `Pseudo-connection.label`, `Pseudo-connection.createdAt`, `Pseudo-connection.secret`; Zen prefers orgID, Codex accountId. Never copy data-model.md `OpenCodeCredential.refresh` or `OpenCodeCredential.expires` into the pseudo-connection or outside OpenCode.
- [ ] T023 [US1] Implement src/opencode-plugin/fetch.ts using T063 and the T025 scheduler decision for every trigger: fresh work only if eligible, join in-flight work or return cache otherwise. Construct data-model.md `ProviderSnapshot.connectionId`, `ProviderSnapshot.kind`, `ProviderSnapshot.label`, `ProviderSnapshot.state`, `ProviderSnapshot.windows`, `ProviderSnapshot.caps`, `ProviderSnapshot.balances`, `ProviderSnapshot.fetchedAt`, `ProviderSnapshot.refreshing`, `ProviderSnapshot.error`; always publish exactly four entries, no secrets, preserving sample time on reuse and timeout publication (after T021/T022/T063; integrate T025 before checkpoint).
- [ ] T024 [US1] Implement src/opencode-plugin/bridge.ts: bound server discovery, one-second healthy state poll, request admission identity and complete result POST; authenticate with descriptor token. Use data-model.md `BridgeSnapshot.serverId`, `BridgeSnapshot.requestId`; reject ambiguous endpoints and late replies, with one-second publication allowance and no provider-filter requests (after T008/T009/T010).
- [ ] T025 [US1] Implement the one-coordinator per-server plugin loop in src/opencode-plugin/index.ts from T001; all startup/timer/credential-event/manual triggers share data-model.md `ProviderSchedule.providerId`, `ProviderSchedule.lastAttemptAt`, `ProviderSchedule.nextAllowedAt`, `ProviderSchedule.retryAt`, `ProviderSchedule.inFlight`. Persist only nonsecret times in server-bound storage; no manual bypass. Apply data-model.md BridgeTiming budgets across credential read, sequential fetch and publication; abort/ignore late work and stop timers/calls on teardown (after T023/T024/T059/T063/T070).
- [ ] T026 [US1] Implement first-success selection reconciliation in src/service/settings.ts and pure operations in src/section/preferences.ts using data-model.md `DisplaySelection.encounteredBridgeProviders`, `DisplaySelection.initializedBridgeWindows`, `DisplaySelection.explicitProviderSelections`, `DisplaySelection.explicitWindowSelections`; encounter does not initialize windows. First successful reading initializes once only absent explicit window choice; preserve prior explicit hide or empty list, with subsequent new windows opt-in. Test transitions in tests/unit/preferences.test.ts (after T065/T066).
- [ ] T027 [US1] Build/check plugin in package.json and src/opencode-plugin/index.js: no external installed-package imports or node:https after T062/T063, use only runtime builtin access permitted by T001; test actual installed/bundled entry, not source alone.

## Phase 4: US2 — Credentials stay inside OpenCode (P1)

**Independent Test:** Whole-package approval is accurately disclosed, four credentials never copied out, current Tavily/custom key storage allowed only where intended. Rejected package differs from plugin failure after approval.

- [ ] T028 [P] [US2] Extend tests/unit/secrets.test.ts: newly resolved four-provider credential sentinels never appear in bridge payload/descriptor, cache, shared settings, logs or UI; supported Tavily/custom keys may exist only in connections.json and never outputs. Do not require legacy-record migration or deletion. Allow bridge token only in protected descriptor/auth requests, not logs/UI.
- [ ] T029 [P] [US2] Extend tests/unit/plugin-credentials.test.ts to assert extra integrations such as anthropic are never resolved/read by the plugin; include source errors without raw token messages.
- [ ] T030 [US2] Extend tests/unit/settings-view.test.ts for four-provider scope/full-access disclosure and package approval-required vs post-approval plugin load failure (after T040; same file).
- [ ] T031 [US2] Put permission disclosures before installation in README.md and after approval in src/section/view/connections.ts; describe complete package approval, no separate plugin opt-out/reapproval on code-only updates, and post-approval failure guidance (after T043; same file).
- [ ] T032 [US2] Enforce allow-listed credential resolution and explicit safe output construction in src/opencode-plugin/credentials.ts and src/opencode-plugin/fetch.ts; never forward credential-shaped or raw upstream fields.
- [ ] T033 [US2] Sanitize data-model.md `ProviderSnapshot.error` messages in src/opencode-plugin/fetch.ts and src/service/bridge.ts; no credential, endpoint, account id or raw response content reaches log/cache/UI.

## Phase 5: US3 — Expired sign-in recovery (P2)

**Independent Test:** Named auth failure clears on a later valid reading; no false zero quota or cross-provider mutation.

- [ ] T034 [P] [US3] Write tests/unit/plugin-errors.test.ts for 401/403 auth, network vs timeout, operation-budget exhaustion, retryAt and next success clearing errors without replacing other providers; old successful sample retained separately.
- [ ] T035 [P] [US3] Extend tests/unit/snapshot-merge.test.ts for one provider error alongside unchanged other five sources, cache sample age preserved.
- [ ] T036 [US3] Implement data-model.md `ProviderSnapshot.state`/`ProviderSnapshot.error` mapping in src/opencode-plugin/fetch.ts; preserve missing vs auth vs transport/deadline failure distinctions and sanitized OpenCode guidance.
- [ ] T037 [US3] Integrate provider error retryAt into the shared T025 scheduler in src/opencode-plugin/index.ts; timer, credential event and manual requests all respect backoff and reuse/acknowledge cached outcomes, never independently fetch.
- [ ] T038 [US3] Re-resolve only eligible providers' credentials for each actual fetch in src/opencode-plugin/credentials.ts; do not cache raw credentials, and do not reset rate limits merely because a cycle returns cached data.

## Phase 6: US4 — Tavily/custom persistence without legacy migration (P2)

**Independent Test:** Configure supported Tavily/custom connections and shared settings, restart/reload, and verify data persists without automatic clearing or changes to OpenCode logins. Old development formats need no migration.

- [ ] T039 [P] [US4] Update tests/contract/service-api.test.ts for supported Tavily/custom-only CRUD/test and persistence across restart/reload with no automatic clearing; reject stored-key writes for the four and every provider/connectionId filter on `/refresh`. All-provider requests acknowledge cached outcomes; no legacy migration test is needed.
- [ ] T040 [P] [US4] Update tests/unit/settings-view.test.ts and tests/unit/a11y.test.ts for Tavily-only add list (Custom setup remains deferred), shared display selector and existing key eye tab order (before T030 in same file).
- [ ] T041 [P] [US4] Update tests/a11y/accessibility.pw.ts for hidden unverified custom setup/four key forms, current shared controls and stale/missing-provider status accessibility.
- [ ] T042 [US4] Enforce MANAGED_KINDS in src/core/bridge.ts and src/service/routes.ts for key connection writes/test; permit all four sources through the single all-provider `/refresh` without connection filters. Old development records are not a credential source and need no migration; do not add automatic deletion.
- [ ] T043 [US4] Update src/section/view/connections.ts and src/settings/main.ts to remove four-provider key forms and Codex CLI hints; retain current Tavily/custom operations and shared settings mutations (before T031).
- [ ] T044 [US4] Update src/section/view/selector.ts for all sources using server-authoritative settings/revision, preserving explicit pre-data empty/hide choices without instance-local storage.

## Phase 7: US5 — Unavailable plugin and historical values (P3)

**Independent Test:** After package approval, lost plugin connection preserves historical last-success values including past resetAt; restore bridge and clear notice. Rejected package blocks service work.

- [ ] T045 [P] [US5] Write tests/unit/bridge-service.test.ts for missing bridge, data-model.md `BridgeTiming.refreshTimeoutMs` and `BridgeTiming.staleAfterMs`, full cached/error acknowledgements, timeout with unchanged last-success sample and fresh publication clearing notice (after T061; same file).
- [ ] T046 [P] [US5] Extend tests/unit/plugin-bridge.test.ts for missing descriptor, 401, connection refusal, replacement token, ambiguous multi-server discovery and restart rebind without uncaught exceptions (after T059; same file).
- [ ] T047 [P] [US5] Extend tests/integration/us3.test.ts for historical bars after resetAt with sample age/no live estimate/no endless refreshing, never-read notice alone, working Tavily/custom, and approval-required package rejection.
- [ ] T048 [US5] Apply data-model.md `BridgeTiming.refreshTimeoutMs`, `BridgeTiming.staleAfterMs` and last-success rules in src/service/bridge.ts and src/core/snapshot-merge.ts; late results must not falsely clear newer requests or age caches as fresh.
- [ ] T049 [US5] Implement descriptor reread and bounded exponential reconnect backoff in src/opencode-plugin/bridge.ts, capped by fetchIntervalMs, with normal healthy discovery every one second; do not poll another server as fallback.
- [ ] T050 [US5] Add explicit historical mode to src/section/view/window.ts and src/core/normalize.ts: render sampled bar/value after resetAt with age and out-of-date notice, suppress live even-use calculation/marker and invented next reset, show refreshing only for actual pending work. Add expired-stale-window tests in tests/unit/display.test.ts; preserve auth/never-read notices (after T058/T057).

## Phase 8: Documentation and verification

- [ ] T051 [P] Update README.md with whole-package approval, shared server settings, optional explicit server binding, pre-release compatibility scope (no migration requirement and no automatic wipe), supported key storage and plugin-only Quotas; remove obsolete instance/CLI guidance (after T031).
- [ ] T052 [P] Update docs/DESIGN.md, docs/INTERFACES.md and docs/TESTPLAN.md with verified implemented behavior and evidence; do not remove intended/provisional markers or claim complete until the reconciliation gate passes.
- [ ] T053 [P] Update docs/BACKLOG.md only for verified resolved gaps; keep live Codex/Zen/Windows/binding gaps explicitly outstanding if not checked.
- [ ] T054 Run final typecheck/Bun tests/four builds/guest check/Playwright suite from package.json; use related test groups first and fix only verified failures.
- [ ] T055 Run specs/002-opencode-credential-handoff/quickstart.md on the T001-confirmed baseline with disposable persistence/discovery fixtures; record actual results and unavailable live-account checks in docs/TESTPLAN.md.
- [ ] T056 Run living-docs-reconcile using specs/002-opencode-credential-handoff/reconciliation.md and AGENTS.md with the verified complete/partial outcome before feature-ending MR; do not delete specs or publish without the positive gate and approval.

## Added tasks (ids retained; execute in assigned phase)

- [ ] T057 [P] [US1] Write tests/unit/display.test.ts for unconfigured provider status using data-model.md `ProviderSnapshot.error`, no bars and no misleading empty-window message (Phase 3; before T058, complete before T050 edits same test file).
- [ ] T058 [US1] Render unconfigured title/status in src/section/view/window.ts using data-model.md `ProviderSnapshot.state`, `ProviderSnapshot.error`; no live quota claimed (Phase 3; after T023/T057, before T050).
- [ ] T059 [P] [US1] Test the loop in tests/unit/plugin-bridge.test.ts with fake clock/transport: one-second discovery independently of fetch duration, shared timer/manual/credential-event work, cached result acknowledgement, ten-second total deadline across sequential calls, twelve-second service boundary, fifteen-second UI wait and teardown; manual requests cannot bypass minimum/retryAt (Phase 3; before T025, before T046 same file).
- [ ] T060 Implement all-provider request admission/join in src/service/bridge.ts from data-model.md `BridgeState.requestId`, `BridgeState.deadlineAt`, `BridgeState.refreshRequested`, `BridgeState.providerMinimums`; signal all four even when some/all return cache, do not add a provider-targeted filter. Every matching complete cached/error response settles the request; service-owned Tavily/custom still use Scheduler minimums (Phase 2; after T010/T061, before T013).
- [ ] T061 [P] Test all-provider requests in tests/unit/bridge-service.test.ts: two UI refreshes share a request id, all-cache result clears it, incomplete result rejected, old request cannot clear new, provider-filter request returns 400; plugin scheduler/minimum tests are T059/T070 (Phase 2; before T060 and before T045 same file).
- [ ] T062 Extract pure HttpError/HTTP types into src/core/http-error.ts and re-export from src/service/http.ts; adapters/parse/validate/types import the pure module so the plugin does not bundle node:https. Verify typecheck and relevant existing tests (Phase 2; before T019/T020/T063).
- [ ] T063 [US1] Implement src/opencode-plugin/http.ts with HTTPS-only fetch, manual redirect rejection, bounded streamed body/JSON parsing, existing error/Retry-After mapping and shared cycle AbortSignal; effective per-call timeout never exceeds remaining data-model.md `BridgeTiming.fetchTimeoutMs`. Do not restart the total deadline on fallback; return timeout and cancel or disregard late results (Phase 3; after T062/T064, before T023).
- [ ] T064 [P] [US1] Write tests/unit/plugin-http.test.ts for transport parity and abort of delayed headers/body, oversized responses and sequential fallback exhausting one shared ten-second budget; no key-bearing redirect request (Phase 3; before T063).
- [ ] T065 Implement src/service/settings.ts and settings types in src/core/types.ts from data-model.md `DisplaySelection.saved`, `DisplaySelection.providers`, `DisplaySelection.windows`, `DisplaySelection.hiddenBalances`, `DisplaySelection.cutoffPercent`, `DisplaySelection.resetTime`, `DisplaySelection.quotaDisplay`, `DisplaySelection.encounteredBridgeProviders`, `DisplaySelection.initializedBridgeWindows`, `DisplaySelection.explicitProviderSelections`, `DisplaySelection.explicitWindowSelections` and `SettingsEnvelope.version`, `SettingsEnvelope.revision`, `SettingsEnvelope.selection`; one atomic server-owned display.json, serialized keyed edits and no host.storage authority, preserving supported state on startup (Phase 2; after T007/T067, before T026).
- [ ] T066 Add shared GET/PATCH `/settings` in src/service/routes.ts and revision-aware field edits/reload in src/section/preferences.ts, src/section/main.ts, src/settings/main.ts using data-model.md `SettingsEnvelope.revision`, `SettingsEnvelope.selection`, `SettingsPatch.expectedRevision`, `SettingsPatch.changes`. On 409 reapply user intent to latest envelope, never overwrite unrelated maps; reload connected clients within five seconds and stop reading old browser-local preference keys without deleting them. Update explicit-choice tracking atomically on user edits; clients cannot mutate service tracking directly (Phase 2; after T065/T012, before T026/T043).
- [ ] T067 [P] Write tests/contract/settings.test.ts and tests/integration/shared-settings.test.ts for shared two-client state, revision conflict preserving independent field edits, explicit empty selections, separate server data directories, no local-storage migration and first-success initialization barriers (Phase 2; before T065/T066).
**T068 — Retired:** automatic upgrade-reset implementation removed. No upgrade.ts or storage-epoch wipe is required.

**T069 — Retired:** automatic-reset tests removed. Supported-state persistence is covered by T039/T067; no legacy migration test is required.
- [ ] T070 [P] [US1] Write tests/unit/plugin-scheduler.test.ts and tests/unit/bridge-descriptor.test.ts for shared per-server coordinator across plugin locations, all-trigger cache/in-flight/minimum/retryAt decisions and nonsecret restart state; verify two server descriptors, owned cleanup, explicit/ambiguous server selection. Cite data-model.md ProviderSchedule and BridgeDescriptor policies; no duplicate upstream reads (Phase 3; coordinator evidence in T001 and implementation T025; descriptor implementation T008/T009).

## Dependencies and execution order

- T001 gates everything. T003/T004 can follow it independently; run descriptor/coordinator design checks before assuming plugin deployment works.
- Foundation: tests T005/T006/T061/T067 first; load supported settings/connections/cache without automatic clearing; T007 → T010 → T060 → T013; T008 → T009; T065 → T066; T014 integrates all. T062 precedes edits to adapters. T068/T069 are retired and are not dependencies.
- US1: tests before related code. T019/T020 may run independently after T062; T021/T022/T063 feed T023; T024 plus T023 feed T025 after T059/T070. T026 follows shared settings T065/T066; T058 follows T057. Validate MVP only after coordinator/complete result paths work.
- US2 after US1; US4 may overlap US1/US3 only on independent files. T040 precedes T030 and T043 precedes T031. T066 must finish before T026/T043 modify client settings files.
- US3 follows core fetch/scheduler work; it refines error outcomes, not a second scheduling loop.
- US5 after US1 foundation; T059 before T046, T061 before T045, T057/T058 before T050. Same-file tasks must not run concurrently.
- Polish after all stories. T052/ADR updates are evidence-led; no automatic complete reconciliation.

## Parallel examples

- Foundation tests T005, T006, T061, T067 are separate files and may run together.
- After T062, T019 (Codex) and T020 (Go/Zen) edit different adapters.
- US1 tests T015, T017, T018, T057, T059, T064, T070 use independent files. Do not overlap later tasks editing those tests.
- US2 T028/T029 can run together; T030 waits for T040.
- US5 T045/T046/T047 use different files, after their earlier same-file tests finish.

## Field citations and coverage

Only implementing tasks count. Data-model.md is canonical for new field constraints; canonical usage fields also link to docs/contracts/quota-snapshot.schema.json.

- BridgeTiming fields → T004/T025/T063.
- OpenCodeCredential and Pseudo-connection fields → T022; identifier-to-adapter integration T016/T020.
- ServerIdentity.serverId and BridgeDescriptor fields → T008/T009/T024.
- BridgeState and BridgeSnapshot fields → T010/T060/T024; exactly four results via T023/T025.
- ProviderSnapshot fields → T023/T036; historical state/display T011/T050.
- ProviderSchedule fields → T025/T037.
- Snapshot.version, Snapshot.generatedAt, Snapshot.providers → T013.
- DisplaySelection, SettingsEnvelope and SettingsPatch fields → T065/T066/T026.

## Implementation strategy

Prove T001, then foundation, then all-provider MVP. The ten-second deadline and scheduler are foundation of correctness, not optional post-MVP optimizations. Reject package approval and plugin failure are separate test paths. Keep credentials inside OpenCode and supported Tavily/custom in their dedicated key store. There is no legacy migration or automatic-wipe machinery. Changes here are task definitions only; no runtime data has been changed and no implementation task is marked done.
