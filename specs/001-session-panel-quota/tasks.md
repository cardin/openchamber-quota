---
description: "Task list for Session Panel quota display"
---

# Tasks: Session Panel Quota Display

**Input**: Design documents from `specs/001-session-panel-quota/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts](contracts/service-api.md), [quickstart.md](quickstart.md)

**Tests**: Included. The plan requires deterministic fixtures and contract checks; write the listed tests before the implementation task in the same story and confirm they fail first.

**Organization**: Tasks are grouped by user story. Phase 2 blocks all stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no incomplete dependency).
- **[Story]**: `US1`–`US4` for user-story phases only.
- Every task names an exact file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the extension package, manifest, build, and test scaffolding.

- [X] T001 Create the source tree from plan.md: `src/section/`, `src/section/view/`, `src/service/`, `src/providers/`, `src/core/`, `tests/unit/`, `tests/integration/`, `tests/contract/`, `tests/fixtures/`; add `package.json` with `name`, `version`, `type: module`, and `private: true`.
- [X] T002 [P] Add the OpenChamber manifest to `package.json`: `openchamber.apiVersion: 1`, `id: "quota-display"`, `name`, `icon`, `contributes.statusSection` with `entry: "src/section/index.html"`, `title: "Quotas"`, `height: 120`, and `contributes.service` with `entry: "src/service/main.js"` and `runtime: "host"`.
- [X] T003 [P] Add `tsconfig.json`, Bun build scripts for the section and service, a `test` script using `bun test`, a `typecheck` script, and the `ajv` dependency for runtime/contract schema validation.
- [X] T004 [P] Add `.gitignore` entries for `node_modules/`, `dist/`, and generated section/service bundles, and create `specs/001-session-panel-quota/verification.md` with a results table template for host and provider checks.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Service, shared types, normalization, and the section shell. No user story starts until T014 passes.

- [X] T005 Create `src/core/types.ts` for `ProviderConnection`, `ProviderSnapshot`, `QuotaWindow`, `Cap`, `Balance`, `QuotaError`, and `DisplaySelection`. Enforce: `remainingPercent` 0–100 after clamping; `resetAt` required; `durationSeconds` is the full duration and must be positive; cap `used >= 0` and `limit > 0`; labels 1–40 characters.
- [X] T006 Implement `src/core/normalize.ts`: benchmark `(resetAt - now) / durationSeconds * 100` clamped 0–100; cap remaining ratio `(limit - used) / limit` clamped 0–100; a missing cap limit becomes a balance; a missing window reset produces a window error; never invent a reset.
- [X] T007 Implement `src/service/main.ts` and `src/service/routes.ts`: read `OPENCHAMBER_SERVICE_PORT`, `OPENCHAMBER_SERVICE_TOKEN`, `OPENCHAMBER_SERVICE_DATA_DIR`; require `Authorization: Bearer <token>`; serve `GET /health`; return the documented JSON error envelope; bind `127.0.0.1`.
- [X] T008 [P] Implement `src/service/credentials.ts`: atomic `connections.json` in the service data directory, `0600` on POSIX and user ACL on Windows, no secrets in logs, and no secret fields in read models.
- [X] T009 Implement `src/service/scheduler.ts`: one in-flight request per connection, coalesce triggers, Tavily minimum 10 minutes, others 5 minutes, honor `Retry-After` and `retryAt`, and refresh a provider when a displayed window reaches reset.
- [X] T010 [P] Add `tests/contract/service-api.test.ts` validating `/health` and `/snapshot` against the contracts; write it before the snapshot route exists and confirm it fails.
- [X] T011 [P] Implement the section shell in `src/section/index.html` and `src/section/main.ts`: `connectHost()`, `applyHostReady()`, call `host.serviceRequest({ method: "GET", path: "/snapshot" })`, render a placeholder, and read `host.storage` without writing secrets.
- [X] T012 [P] Add a fixture provider in `tests/fixtures/provider.ts` returning one window at 25% remaining halfway through a one-day window, one zero window, one missing-reset window, one cap, one balance, and one failing provider.
- [X] T013 Implement `src/service/snapshot.ts` and wire it into `routes.ts`: `GET /snapshot`, `POST /refresh` returning `202 { accepted: true }`, `cache.json` for the next mount, and `refreshing` flags. Validate every response against `contracts/quota-snapshot.schema.json`.
- [X] T014 Host smoke test: build, install the folder in OpenChamber, confirm the service starts, `GET /health` succeeds through `host.serviceRequest`, and a fixture `/snapshot` renders in the Work Status section. Record the result in `specs/001-session-panel-quota/verification.md`.

**Checkpoint**: The service round-trip works end to end. Only now start user stories.

---

## Phase 3: User Story 1 - See Quota Remaining, Even-Use Estimate, and Reset Time (Priority: P1) 🎯 MVP

**Goal**: A selected resetting window shows actual remaining quota, a distinct even-use benchmark, and a reset time, with correct color states and error states.

**Independent Test**: Use the fixture provider. At 25% remaining halfway through, the bar shows 25% and the benchmark 50%; zero shows 0% with the benchmark; a missing reset shows the window error; a provider failure shows one provider error.

### Tests for User Story 1

- [X] T015 [P] [US1] Write failing unit tests in `tests/unit/display.test.ts` for the 25%/50% benchmark, zero quota, missing reset, missing duration (no benchmark), cutoff 9/10/11%, and warning vs default.
- [X] T016 [P] [US1] Write failing integration tests in `tests/integration/us1.test.ts` for a fixture window, an expired window showing loading, and a provider failure replacing every bar for that provider only.

### Implementation for User Story 1

- [X] T017 [US1] Implement `src/section/view/window.ts`: colored bar using `remainingPercent`, a distinct benchmark marker at the even-use estimate, and the reset time. Keep actual quota and benchmark visually distinct.
- [X] T018 [P] [US1] Implement `src/section/view/status.ts`: danger when `remainingPercent < cutoff`, warning when at/above cutoff and below the benchmark, default otherwise; default cutoff 10. Color distinguishes the states; no pattern is required.
- [X] T019 [US1] Implement `src/section/view/states.ts`: keep unexpired bars during refresh; show loading for a first fetch or an expired window; show a window error for missing quota/reset; show one provider error with no old bars for that provider.
- [X] T020 [US1] Implement `src/section/refresh.ts`: load the snapshot every 5 seconds for countdowns, attempt `POST /refresh` on mount, every 60 seconds while mounted, on manual refresh, and when a window reaches reset; poll `GET /snapshot` until `refreshing` is false; use relative time by default.
- [X] T021 [US1] Wire T017–T020 into `src/section/main.ts`; render providers in snapshot order and all reported windows. Selection filtering is added in US2.
- [X] T022 [US1] Run the US1 tests and the host fixture check; verify the 25%/50%, zero, missing-reset, expired, provider-failure, and refresh scenarios; record the result in `specs/001-session-panel-quota/verification.md`.

**Checkpoint**: US1 is independently demoable with the fixture provider.

---

## Phase 4: User Story 2 - Choose Providers and Windows to Display (Priority: P2)

**Goal**: Users choose providers and window types; choices persist per instance, newly added providers auto-enable with their current windows, and new window types stay hidden until enabled.

**Independent Test**: With two fixture providers and two windows for one, select/deselect and verify the section; restart and switch sessions and verify the same choices.

### Tests for User Story 2

- [X] T023 [P] [US2] Write failing unit tests in `tests/unit/preferences.test.ts` for first use, saved empty selection, new provider auto-enabled with its windows, new window type hidden, removed provider retained, unknown ids ignored, cutoff 0–100 default 10, and reset time relative/absolute.
- [X] T024 [P] [US2] Write failing integration tests in `tests/integration/us2.test.ts` for select/deselect, first-use defaults, new-item hiding, and persistence across a simulated restart.

### Implementation for User Story 2

- [X] T025 [US2] Implement `src/section/preferences.ts`: `quota.display.v1` in `host.storage` with `saved`, `providers`, `windows`, `cutoffPercent` default 10, and `resetTime` default `relative`; no secrets.
- [X] T026 [US2] Implement `src/section/view/selector.ts`: provider, window, and hide-balances checkboxes, saved-state indicator, and a cutoff/reset-time control; auto-enable newly added providers and keep newly reported window types opt-in.
- [X] T027 [P] [US2] Implement `src/section/view/empty.ts`: setup hint when no provider is configured, selection hint when everything is hidden, and provider-specific message when a successful response has no windows.
- [X] T028 [US2] Wire preferences and the selector into `src/settings/main.ts`: first use shows all configured providers/windows; saved selections win; a saved empty selection stays empty; a newly added provider is auto-enabled; resetting a window keeps its selection.
- [X] T029 [US2] Run the US2 tests and verify selection persistence and new-item behavior in the host; record the result in `specs/001-session-panel-quota/verification.md`.

**Checkpoint**: US1 and US2 work independently.

---

## Phase 5: User Story 3 - See Balances and Caps That Do Not Reset (Priority: P2)

**Goal**: Caps show a remaining-versus-maximum bar with no reset or benchmark; balances show a number only.

**Independent Test**: Fixture with one spend cap, one lifetime limit, and one prepaid balance; caps render bars, balance renders text, no reset or benchmark appears.

### Tests for User Story 3

- [X] T030 [P] [US3] Write failing unit tests in `tests/unit/caps-balances.test.ts` for `remaining / limit`, cap without a limit becoming a balance, zero used, used above limit, negative balance, and no reset/benchmark fields.
- [X] T031 [P] [US3] Write failing integration tests in `tests/integration/us3.test.ts` for cap and balance rows from the fixture.

### Implementation for User Story 3

- [X] T032 [US3] Implement `src/section/view/cap.ts`: remaining-versus-limit bar and value, unit label, no reset time, no benchmark; clamp the fill to 0% when `used > limit`.
- [X] T033 [US3] Implement `src/section/view/balance.ts`: label, value, and unit as text; no bar, benchmark, or reset.
- [X] T034 [US3] Update `src/core/normalize.ts` so a cap-like value with no maximum becomes a balance, never a full or empty bar.
- [X] T035 [US3] Run the US3 tests and verify the fixture in the host; record the result in `specs/001-session-panel-quota/verification.md`.

**Checkpoint**: Caps and balances are independently verifiable.

---

## Phase 6: User Story 4 - See Supported Providers (Priority: P2)

**Goal**: All REQ 2 providers can be connected and displayed: custom, Tavily, OpenRouter, OpenCode Go, Codex, and OpenCode Zen.

**Independent Test**: Compare the registered adapters with the REQ 2 list; connect one fixture/custom provider and each key-based provider; verify a window, cap, or balance from each.

### Tests for User Story 4

- [X] T036 [P] [US4] Write failing contract tests in `tests/contract/connections.test.ts` for create/update/delete/test, duplicate named providers, invalid endpoints, missing keys, and no secret fields in responses.
- [X] T037 [P] [US4] Write failing coverage test in `tests/contract/coverage.test.ts` asserting exactly the REQ 2 kinds are registered and no unlisted built-in is offered.

### Implementation for User Story 4

- [X] T038 [US4] Implement connection routes in `src/service/routes.ts`: `GET /connections`, `POST /connections`, `PUT /connections/:id`, `DELETE /connections/:id`, `POST /connections/:id/test`. Labels 1–60; custom endpoint absolute HTTPS with no credentials/query/fragment; keys 1–4096; one connection per named kind; custom may repeat.
- [X] T039 [US4] Implement `src/section/view/connections.ts`: add/update/remove forms for named and custom providers, test connection action, sanitized errors, and no format picker.
- [X] T040 [US4] Implement `src/providers/custom.ts`: `GET` HTTPS endpoint with Bearer key, `openchamber-quota-v1` validation, 64 KiB limit, 10-second timeout, no redirects, and map HTTP 401/403/429/others to the documented errors.
- [X] T041 [P] [US4] Implement `src/providers/tavily.ts`: `GET https://api.tavily.com/usage` with Bearer key; map `account.plan_usage` / `plan_limit`, `key.usage` / `limit`, and PAYG limits to monthly windows reset on the first of each month; PAYG usage without a limit to a balance; 10-minute interval.
- [X] T042 [P] [US4] Implement `src/providers/openrouter.ts`: `GET https://openrouter.ai/api/v1/key`; map `limit`, `limit_remaining`, `usage_monthly`, and `limit_reset`; unlimited keys become a spend balance; compute daily/weekly/monthly reset boundaries.
- [X] T043 [P] [US4] Implement `src/providers/opencode-go.ts`: `GET https://opencode.ai/zen/go/v1/usage` with Bearer key; map `usage.rolling`, `usage.weekly`, `usage.monthly` percentages and `resetsAt`.
- [X] T044 [P] [US4] Implement `src/providers/codex.ts`: import `~/.codex/auth.json` `tokens.access_token` and `tokens.account_id` on user action; `GET https://chatgpt.com/backend-api/wham/usage`; map primary/secondary windows and credits; surface token expiry as `auth`.
- [X] T045 [P] [US4] Implement `src/providers/opencode-zen.ts`: Console `GET /usage/models?range=…` and `/budgets/service-accounts/status` with Bearer key/token; map request counts and spend budgets; if the key path is rejected, show `auth` and do not invent data.
- [X] T046 [US4] Add adapter fixture tests in `tests/unit/providers/` for all six kinds, including Tavily monthly plan/key/PAYG resets, OpenRouter unlimited, Codex expiry, and Zen auth failure.
- [ ] T047 [US4] Run the live manual checks for custom, Tavily, OpenRouter, Go, Codex, and Zen; record dates, auth method, and any missing fields in `specs/001-session-panel-quota/verification.md`.

**Checkpoint**: The REQ 2 set is covered and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T048 [P] Keep provider requests HTTPS-only, reject redirects, and preserve hostname verification with the system trust store. Do not expose a custom CA bundle setting.
- [X] T049 [P] Add `tests/unit/secrets.test.ts` asserting snapshots, logs, errors, and section storage never contain keys, tokens, endpoints, account IDs, or raw upstream bodies.
- [X] T050 [P] Add accessibility checks in `tests/unit/a11y.test.ts` for bar roles, accessible names, and warning/danger state classes. Host theme contrast and keyboard focus order are manual checks, not unit-test coverage.
- [X] T051 [P] Add `tests/unit/scheduler.test.ts` for one in-flight request, coalescing, Tavily 10-minute minimum, 5-minute defaults, `Retry-After`, reset refresh, and no timers while unmounted.
- [X] T052 [P] Update `README.md` with install, connection setup, system TLS trust, and the no-OpenChamber-credential rule.
- [ ] T053 Run [quickstart.md](quickstart.md) end to end and record the results in `specs/001-session-panel-quota/verification.md`.
- [X] T054 Run `bun run typecheck`, `bun test`, and `bun run build`; fix failures and confirm the package installs cleanly.
- [X] T055 Make the Work Status section display-only: no Manage button, no provider/window selector, no settings forms, and a single refresh icon.
- [X] T056 Add the `Quota settings` full-screen page in `src/settings/` for connections, non-resetting usage, window selection, cutoff, and reset time; add `contributes.page` and the build step.
- [X] T057 Update README, quickstart, plan, and verification for the Pages settings surface and the display-only panel.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 first; T002–T004 can run after T001.
- **Foundational (Phase 2)**: T005 first; T006/T007/T008/T010/T011/T012 can run in parallel after T005. T009 needs T006 and T008. T013 needs T009 and T010. T014 needs T007/T011/T012/T013. **T014 is the gate for all stories.**
- **US1 (Phase 3)**: Starts after T014. T015/T016 first; T017/T018 parallel; T019 needs T017; T020 needs T013; T021 needs T017–T020; T022 last.
- **US2 (Phase 4)**: Starts after T014; depends on US1's renderer for integration but can be developed against the fixture. T023/T024 first; T025 then T026/T027 parallel; T028 then T029.
- **US3 (Phase 5)**: Starts after T014; depends on US1's row layout. T030/T031 first; T032/T033 parallel; T034 then T035.
- **US4 (Phase 6)**: Starts after T014; T036/T037 first; T038 then T039; T040–T045 parallel after T038; T046 then T047.
- **Polish (Phase 7)**: After the desired stories. T048–T052 can run in parallel; T053 then T054.

### User Story Dependencies

- **US1**: No story dependency; the MVP.
- **US2**: Uses the US1 renderer; selection is independently testable with the fixture.
- **US3**: Uses the US1 row container; caps/balances are independently testable.
- **US4**: Provides real provider data to US1/US3; adapters are independently testable.

### Parallel Opportunities

- Setup: T002, T003, T004.
- Foundational: T006, T007, T008, T011, T012.
- US1: T015 and T016; then T017 and T018.
- US2: T023 and T024; then T026 and T027.
- US3: T030 and T031; then T032 and T033.
- US4: T036 and T037; then T041–T045.
- Polish: T048–T052.

## Parallel Example: User Story 4 adapters

```text
T041 Implement Tavily adapter in src/providers/tavily.ts
T042 Implement OpenRouter adapter in src/providers/openrouter.ts
T043 Implement OpenCode Go adapter in src/providers/opencode-go.ts
T044 Implement Codex adapter in src/providers/codex.ts
T045 Implement OpenCode Zen adapter in src/providers/opencode-zen.ts
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational.
2. Complete US1 with the fixture provider.
3. **STOP and VALIDATE** the 25%/50%, zero, missing-reset, expired, and provider-failure cases.
4. Demo the bar/benchmark/reset UI before adding real providers.

### Incremental Delivery

1. US1 → UI with fixture.
2. US4 key providers (custom, Tavily, OpenRouter) → real data for the MVP.
3. US3 → caps/balances.
4. US2 → selection and persistence.
5. US4 remaining providers (Go, Codex, Zen) → full REQ 2 coverage.
6. Polish → system TLS trust, secrets, accessibility, rate limits, docs.

## Notes

- The host service round-trip (T014) passed with an isolated fixture; see `verification.md`.
- Do not read OpenChamber's credential store. Codex import is a user-triggered read of `~/.codex/auth.json` only.
- Tavily plan, key, and PAYG limits reset at 00:00 UTC on the first of each month. PAYG usage without a limit stays a balance; hide key usage without a limit.
- The status-section frame unloads when collapsed; do not run timers outside the mounted frame.
- Commit after each task or logical group.


## Pending Host Verification

T047 and T053 remain open for live provider accounts and the full quickstart. The isolated host fixture checks passed; see `verification.md`.

## Phase 8: Convergence

- [X] T058 Extend the one-time Tavily selection migration to enable `plan`, `key`, and `paygo` windows for legacy saved selections, preserve an explicitly empty Tavily window list, and use a version/flag so unchecked windows are not re-added per FR-005/FR-013 (partial)
- [X] T059 Add runtime validation of the full Snapshot against `contracts/quota-snapshot.schema.json` at the service boundary and a test using actual service output per T013 (partial)
- [X] T060 Update `plan.md`, `research.md`, and the `tasks.md` notes to describe Tavily plan, key, and PAYG monthly windows plus the PAYG balance fallback per plan: Tavily adapter decision (contradicts)
- [X] T061 Add fake-timer tests for `SnapshotController.start()` and `stop()` timer cleanup, including no timers after stop/unmount per T051 (partial)
- [X] T062 Add contrast and focus-order checks to the accessibility tests, or explicitly narrow T050 to the checks that are actually covered per T050 (partial)
