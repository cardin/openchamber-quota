# Test Plan

## Automated layers

- **Unit** (`tests/unit/`): normalization, benchmark and reset formatting, renderer states, caps/balances, preferences, scheduler, refresh cleanup, secrets, accessibility, provider adapters, settings markup.
- **Contract** (`tests/contract/`): service auth, routes, connection rules, snapshot and custom-provider schemas, provider coverage.
- **Integration** (`tests/integration/`): section rendering, selection persistence, and caps/balances with fixtures.
- **Accessibility** (`tests/a11y/accessibility.pw.ts`): Playwright contrast and tab-order checks in light and dark fixture themes. Run with `bun run test:a11y`; it uses Chrome by default (`PW_CHANNEL` overrides).
- **Build checks**: `bun run typecheck`, `bun test`, `bun run build`, and `openchamber-guest-check .`.

Rechecked on 2026-11-25 at `7d4757d`: typecheck, 107 Bun tests, 4 Playwright accessibility tests, and all three bundles passed. Manifest entry files exist, and the bundled service passed authenticated health, unauthenticated rejection, and empty snapshot requests on loopback.

## Requirement coverage

| Requirement | Primary checks | Status |
| --- | --- | --- |
| REQ 1 / SC-001, SC-002 | `tests/unit/display.test.ts`, `normalize.test.ts`, `tests/integration/us1.test.ts` | Pass |
| REQ 1 / SC-006 | `tests/unit/display.test.ts`, `style.test.ts` | Pass |
| REQ 1 / SC-007 | `tests/unit/refresh.test.ts`, `scheduler.test.ts`; host collapse/refresh check | Pass |
| REQ 1 / SC-009 | `tests/unit/caps-balances.test.ts`, `display.test.ts` | Pass |
| REQ 1 / SC-010 | `tests/unit/normalize.test.ts`; host preferences check | Pass |
| REQ 1 / SC-011 | `tests/unit/display.test.ts`, `preferences.test.ts`, `settings-view.test.ts` | Pass |
| REQ 2 / SC-004 | `tests/contract/coverage.test.ts`, `tests/unit/providers.test.ts`; live checks | Adapters cover the full set. Live API-key checks passed for Tavily, OpenRouter, and OpenCode Go; Codex, Zen, and Custom setup is deferred by ADR-007/008 and their live checks are outstanding. |
| REQ 3 / FR-001 | Manifest check and isolated host mount/collapse | Pass |
| REQ 4 / SC-003, SC-008 | `tests/unit/preferences.test.ts`, `tests/integration/us2.test.ts`, `empty.test.ts`; host preferences check | Pass |
| REQ 5 / SC-005 | `tests/contract/connections.test.ts`, `tests/unit/credentials.test.ts`, `providers.test.ts` | Adapter, schema, and existing connections retained; setup hidden by ADR-007 |

The Go adapter regression test checks that a missing Console 5h reset is recovered from the Go usage API without rounding the valid Console weekly or monthly meters. Live verification on 2026-11-25 confirmed the fallback supplies the missing 5h window.

## Manual verification

The 2026-11-24 OpenChamber 2.8.0 baseline passed the guest package check and the host round-trip. Host fixtures checked missing and expired windows, isolated provider errors, mount/manual/periodic/reset refresh, and no refresh while collapsed. Preference and quota checks covered session switch, restart, instance isolation, caps and balances, and secret-free snapshots. The 0.2.x checks covered Remaining/Used, removal of the TLS setting, the key visibility eye, and hidden unverified providers. Live checks passed for the three setup options listed in the [README](../README.md#supported-providers), including the OpenCode Go missing-5h fallback on 2026-11-25; the user confirmed the full quickstart and session switch.

To repeat the smoke check, follow [install](../README.md#install) and [configuration](../README.md#configure). Confirm that Quotas is in Work Status and the settings page is under Pages. Test connections, refresh and collapse/reopen, verify settings persist after restarting, and check that a separate data directory has no shared connections or selections. Use fixtures for malformed windows and whole-provider failures.

## Accessibility checks

`bun run test:a11y` runs Playwright against a generated page using the real section/settings CSS and light/dark host tokens. It asserts:

- text contrast at least 4.5:1 and bar-fill contrast at least 3:1 in both themes;
- warning, danger, and default bars with the benchmark marker;
- settings tab order Provider → Label → Key → eye toggle → Add provider;
- Custom, Codex, and Zen are absent from the add-provider list.

Live host checks on 2026-11-24 measured settings text **4.95:1 / 5.99:1**, status text **5.27:1 / 6.68:1**, bar fill vs track **4.18:1 / 5.55:1**, and fill vs panel **4.89:1 / 6.46:1** (light/dark). Other host themes and higher zoom levels are not covered.

## Known gaps

See [outstanding work](outstanding.md) for deferred providers and remaining verification.
