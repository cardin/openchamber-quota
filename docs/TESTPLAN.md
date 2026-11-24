# Test Plan

> Provisional — feature `001-session-panel-quota`: Codex and Zen setup is deferred pending OAuth and live checks.
> See `specs/001-session-panel-quota/spec.md`.
<!-- provisional:feature=001-session-panel-quota -->

## Automated layers

- **Unit** (`tests/unit/`): normalization, benchmark and reset formatting, renderer states, caps/balances, preferences, scheduler, refresh cleanup, secrets, accessibility, provider adapters, settings markup.
- **Contract** (`tests/contract/`): service auth, routes, connection rules, snapshot and custom-provider schemas, provider coverage.
- **Integration** (`tests/integration/`): section rendering, selection persistence, and caps/balances with fixtures.
- **Accessibility** (`tests/a11y/accessibility.pw.ts`): Playwright contrast and tab-order checks in light and dark fixture themes. Run with `bun run test:a11y`; it uses Chrome by default (`PW_CHANNEL` overrides).
- **Build checks**: `bun run typecheck`, `bun test`, `bun run build`, and `openchamber-guest-check .`.

Current result (2026-11-24): typecheck passes, 105 tests pass, 4 Playwright accessibility tests pass, the build succeeds, the guest package check passes, and the full quickstart and session switch are confirmed.

## Requirement coverage

| Requirement | Primary checks | Status |
| --- | --- | --- |
| REQ 1 / SC-001, SC-002 | `tests/unit/display.test.ts`, `normalize.test.ts`, `tests/integration/us1.test.ts` | Pass |
| REQ 1 / SC-006 | `tests/unit/display.test.ts`, `style.test.ts` | Pass |
| REQ 1 / SC-007 | `tests/unit/refresh.test.ts`, `scheduler.test.ts`; host collapse/refresh check | Pass |
| REQ 1 / SC-009 | `tests/unit/caps-balances.test.ts`, `display.test.ts` | Pass |
| REQ 1 / SC-010 | `tests/unit/normalize.test.ts`; host preferences check | Pass |
| REQ 1 / SC-011 | `tests/unit/display.test.ts`, `preferences.test.ts`, `settings-view.test.ts` | Pass |
| REQ 2 / SC-004 | `tests/contract/coverage.test.ts`, `tests/unit/providers.test.ts`; live checks | Partial: Tavily, OpenRouter, and OpenCode Go pass; Codex, Zen, and custom setup hidden; OAuth/live work deferred |
| REQ 3 / FR-001 | Manifest check and isolated host mount/collapse | Pass |
| REQ 4 / SC-003, SC-008 | `tests/unit/preferences.test.ts`, `tests/integration/us2.test.ts`, `empty.test.ts`; host preferences check | Pass |
| REQ 5 / SC-005 | `tests/contract/connections.test.ts`, `tests/unit/credentials.test.ts`, `providers.test.ts` | Adapter and existing connections retained; setup hidden; live endpoint deferred |

## Manual verification

`specs/001-session-panel-quota/verification.md` records the host fixture checks, live Tavily/OpenRouter/OpenCode Go results, and the remaining gaps. The quickstart covers provider connection, refresh, restart, instance isolation, and secret-free output.

## Accessibility checks

`bun run test:a11y` runs Playwright against a generated page using the real section/settings CSS and light/dark host tokens. It asserts:

- text contrast at least 4.5:1 and bar-fill contrast at least 3:1 in both themes;
- warning, danger, and default bars with the benchmark marker;
- settings tab order Provider → Label → Key → eye toggle → Add provider;
- Custom, Codex, and Zen are absent from the add-provider list.

Live host checks on 2026-11-24 measured settings text **4.95:1 / 5.99:1**, status text **5.27:1 / 6.68:1**, bar fill vs track **4.18:1 / 5.55:1**, and fill vs panel **4.89:1 / 6.46:1** (light/dark). Other host themes and higher zoom levels are not covered.

## Known gaps

- Codex and Zen setup is hidden; OAuth login support and live verification are future work (T047, T067).
- Custom setup is hidden pending a live endpoint.
- Zen's current API-key and route path is unverified. The reference implementation uses an OpenCode Console OAuth token with an optional org ID and different billing routes.
- Windows credential-file permissions.
