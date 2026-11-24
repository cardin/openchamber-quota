# Test Plan

> Provisional — feature `001-session-panel-quota`: live custom, Codex, and Zen checks and the full quickstart are pending.
> See `specs/001-session-panel-quota/spec.md`.
<!-- provisional:feature=001-session-panel-quota -->

## Automated layers

- **Unit** (`tests/unit/`): normalization, benchmark and reset formatting, renderer states, caps/balances, preferences, scheduler, refresh cleanup, secrets, accessibility, provider adapters, settings markup.
- **Contract** (`tests/contract/`): service auth, routes, connection rules, snapshot and custom-provider schemas, provider coverage.
- **Integration** (`tests/integration/`): section rendering, selection persistence, and caps/balances with fixtures.
- **Build checks**: `bun run typecheck`, `bun test`, `bun run build`, and `openchamber-guest-check .`.

Current result (2026-11-24): typecheck passes, 101 tests pass, the build succeeds, and the guest package check passes.

## Requirement coverage

| Requirement | Primary checks | Status |
| --- | --- | --- |
| REQ 1 / SC-001, SC-002 | `tests/unit/display.test.ts`, `normalize.test.ts`, `tests/integration/us1.test.ts` | Pass |
| REQ 1 / SC-006 | `tests/unit/display.test.ts`, `style.test.ts` | Pass |
| REQ 1 / SC-007 | `tests/unit/refresh.test.ts`, `scheduler.test.ts`; host collapse/refresh check | Pass |
| REQ 1 / SC-009 | `tests/unit/caps-balances.test.ts`, `display.test.ts` | Pass |
| REQ 1 / SC-010 | `tests/unit/normalize.test.ts`; host preferences check | Pass |
| REQ 1 / SC-011 | `tests/unit/display.test.ts`, `preferences.test.ts`, `settings-view.test.ts` | Pass |
| REQ 2 / SC-004 | `tests/contract/coverage.test.ts`, `tests/unit/providers.test.ts`; live checks | Partial: Tavily, OpenRouter, and OpenCode Go pass; custom, Codex, and Zen pending |
| REQ 3 / FR-001 | Manifest check and isolated host mount/collapse | Pass |
| REQ 4 / SC-003, SC-008 | `tests/unit/preferences.test.ts`, `tests/integration/us2.test.ts`, `empty.test.ts`; host preferences check | Pass |
| REQ 5 / SC-005 | `tests/contract/connections.test.ts`, `tests/unit/credentials.test.ts`, `providers.test.ts` | Pass for add/edit/remove; live custom endpoint pending |

## Manual verification

`specs/001-session-panel-quota/verification.md` records the host fixture checks, live Tavily/OpenRouter/OpenCode Go results, and the remaining gaps. The quickstart covers provider connection, refresh, restart, instance isolation, and secret-free output.

## Known gaps

- Live custom, Codex, and Zen provider checks (T047).
- Full quickstart and a separate session-switch check (T053).
- Windows credential-file permissions.
- Keyboard focus order and host-theme contrast are spot-checked, not automated.
