# Test Plan

## Automated layers

- **Unit** (`tests/unit/`): normalization, benchmark and reset formatting, renderer states including historical expiry and unconfigured providers, caps/balances, preferences and first-success reconciliation, service scheduler, plugin scheduler, refresh cleanup, plugin HTTP/credentials/errors/loop/lock takeover, bridge service and descriptor discovery, snapshot merge, secrets, accessibility, provider adapters, provider status and settings markup.
- **Contract** (`tests/contract/`): service auth, bridge auth isolation and complete-result validation, settings concurrency/persistence, all-provider refresh, and snapshot/provider/plugin coverage.
- **Integration** (`tests/integration/`): six-source rendering, shared pre-data choices, selection persistence, historical and caps/balances with fixtures.
- **Accessibility** (`tests/a11y/accessibility.pw.ts`): Playwright contrast, tab-order, shared display controls and unconfigured/stale/historical status checks in light and dark fixture themes. Run with `bun run test:a11y`; it uses Chrome by default (`PW_CHANNEL` overrides).
- **Build checks**: `bun run typecheck`, `bun test`, `bun run build`, and `openchamber-guest-check .`.

Rechecked on 2026-11-25: typecheck, 221 Bun tests, 7 Playwright accessibility tests, four bundles and `openchamber-guest-check .` passed. Manifest entry files exist, and the bundled service previously passed authenticated health, unauthenticated rejection, empty snapshot requests and a full bridge/persistence smoke on loopback.

### Feature 002 verification evidence (2026-11-25)

- `bun run typecheck` passed.
- `bun test` passed 221 tests across 33 files.
- `bun run build` produced the section, settings, service and self-contained plugin bundles.
- `openchamber-guest-check .` reported the package ready to add.
- `bun run test:a11y` passed 7 Playwright checks.
- A browser fixture using the bundled pages verified the full-width settings layout, no Usage card, blank Details for connected providers, and Tavily's PAYG choice in both the settings picker and the collapsed quota row. The README screenshots use this fixture.
- Loopback smoke on the built service: descriptor published under the server hash; UI bearer and bridge bearer cannot authenticate each other's routes; empty `POST /refresh` returned 202 with a request id; a complete six-entry `/bridge/snapshot` returned 200, cleared the pending request and yielded six unconfigured provider entries; `/settings` advanced to revision 1 with six encountered providers; `/quota` returned 404; the descriptor was removed on shutdown.
- The built plugin bundle imports only runtime builtins (no installed packages or `node:https`), default-exports `{ id: "openchamber.quota-display", setup }`, and loads from a folder with no `node_modules`.

The managed OpenChamber load and live provider checks were not run in this pass. See the convergence evidence below.

**Collapse persistence (2026-11-26):** The browser test closes and reopens the bundled Quotas section against settings reloaded from disk. It checks collapse and re-expansion, independent provider state, and retrying a revision conflict without dropping another setting. This uses a fixture host rather than a live OpenChamber process.

**Convergence (2026-11-27):** Typecheck, 238 Bun tests, 8 Playwright checks, four bundles, and the guest check passed. A bundled browser fixture verified approval refusal, guidance next to custom quotas, and custom removal independent of refresh. Standalone OpenCode 2.4.2 loaded the built plugin with disposable data, replaced a four-provider fixture lock, and published autonomous and solicited six-provider cycles without credentials. This did not exercise a running four-provider plugin, OpenChamber-managed delivery, real provider accounts, Windows ACLs, or a live remote topology.

**Convergence (2026-11-28):** Typecheck, 250 Bun tests, 10 Playwright checks, four bundles, and the guest check passed. New fixtures cover timing persistence across reload, HTTP 503 `Retry-After`, provider-aligned autonomous polling, restored-history labeling, error-only window initialization, auth-to-connectivity changes, hidden-window collapsed choices, descriptor-lock serialization, transient settings recovery, and two connected settings clients. These remain fixture checks; T080 live acceptance is unchanged.

## Requirement coverage

| Requirement | Primary checks | Status |
| --- | --- | --- |
| REQ 1 / SC-001, SC-002 | `tests/unit/display.test.ts`, `normalize.test.ts`, `tests/integration/us1.test.ts` | Pass |
| REQ 1 / SC-006 | `tests/unit/display.test.ts`, `style.test.ts` | Pass; hover swaps the logo for the collapse chevron and the collapsed summary shares the provider row. |
| REQ 1 / SC-007 | `tests/unit/refresh.test.ts`, `scheduler.test.ts`; host collapse/refresh check | Pass |
| REQ 1 / SC-009 | `tests/unit/caps-balances.test.ts`, `display.test.ts` | Pass |
| REQ 1 / SC-010 | `tests/unit/normalize.test.ts`; host preferences check | Pass |
| REQ 1 / SC-011 | `tests/unit/display.test.ts`, `preferences.test.ts`, `settings-view.test.ts` | Pass |
| REQ 2 / SC-004 | `tests/contract/coverage.test.ts`, `tests/contract/plugin-bridge.test.ts`, `tests/unit/plugin-credentials.test.ts`, `tests/unit/providers.test.ts`, `tests/unit/plugin-lock.test.ts`; live checks | Plugin manifest/bundle, six-credential scope, complete bridge payload, auth group isolation, adapter normalization and provider-set-aware lock takeover are covered. A live OpenCode plugin load and live Zen/OpenAI/Tavily/Exa checks remain T055. |
| REQ 2 / SC-012 | `tests/unit/plugin-scheduler.test.ts`, `tests/unit/plugin-bridge.test.ts`, `tests/unit/plugin-http.test.ts`, `tests/unit/bridge-service.test.ts` | Five-minute polls, 30-second manual/event floor, 429/503 Retry-After, reload-persisted floors, 1–15 minute failure backoff, joined work, cached acknowledgement, shared deadline and twelve-second service expiry are covered. |
| REQ 2 / SC-011 | `tests/contract/settings.test.ts`, `tests/a11y/settings-sync.pw.ts` | Revision conflicts, keyed window patches, empty selections, separate data dirs, first-success initialization, transient recovery and two connected clients pass. |
| REQ 1 / SC-006 | `tests/unit/snapshot-merge.test.ts`, `tests/integration/us1.test.ts`, `tests/integration/us3.test.ts`, `tests/unit/display.test.ts` | Last-success retention, restored-history labeling, never-read notices, stale notices and historical expired windows pass. |
| REQ 3 / FR-001 | Manifest check and isolated host mount/collapse | Pass |
| REQ 4 / SC-003, SC-008 | `tests/unit/preferences.test.ts`, `settings-view.test.ts`, `display.test.ts`, `tests/integration/us2.test.ts`, `tests/contract/settings.test.ts`, `empty.test.ts`; host preferences check | Provider order, collapsed PAYG (including zero usage and hidden-balance fallback), status table, and shared settings/cache are covered; live host preference removal is a T055 check. |

The Go adapter regression test checks that a missing Console 5h reset is recovered from the Go usage API without rounding the valid Console weekly or monthly meters. Live verification on 2026-11-25 confirmed the fallback supplies the missing 5h window.

## Manual verification

The 2026-11-24 OpenChamber 2.8.0 baseline passed the guest package check and the host round-trip. Host fixtures checked missing and expired windows, isolated provider errors, mount/manual/periodic/reset refresh, and no refresh while collapsed. Preference and quota checks covered session switch, restart, instance isolation, caps and balances, and secret-free snapshots. The 0.2.x checks covered Remaining/Used, removal of the TLS setting, the key visibility eye, and hidden unverified providers. Live checks passed for the three setup options listed in the [README](../README.md#supported-providers), including the OpenCode Go missing-5h fallback on 2026-11-25; the user confirmed the full quickstart and session switch.

The historical smoke procedure above describes the implemented baseline. The intended upgrade changes settings scope to one OpenChamber server (ADR-011); do not treat old instance-isolation checks as proof of the new behavior. Verify two clients sharing one server, revision conflicts preserving independent edits, and separate server discovery/data remaining independent. Use disposable data to verify supported-state persistence, not an automatic reset; never modify OpenCode logins.

## Accessibility checks

`bun run test:a11y` runs Playwright against a generated page using the real section/settings CSS and light/dark host tokens. It asserts:

- text contrast at least 4.5:1 and bar-fill contrast at least 3:1 in both themes;
- warning, danger, and default bars with the benchmark marker;
- the settings page offers no manual provider key form;
- authentication errors appear in the provider status table while unconfigured providers appear nowhere;
- the provider header hit area covers the logo-to-name gap and swaps the logo for the chevron;
- status text wraps inside a 320px panel without horizontal overflow;
- shared display controls, reorder controls, applicable collapsed-summary selectors and provider toggle state are accessible.

Live host checks on 2026-11-24 measured settings text **4.95:1 / 5.99:1**, status text **5.27:1 / 6.68:1**, bar fill vs track **4.18:1 / 5.55:1**, and fill vs panel **4.89:1 / 6.46:1** (light/dark). Other host themes and higher zoom levels are not covered.

## Known gaps

See the [backlog](BACKLOG.md) for deferred providers and remaining verification.

- **ADR-010/011/012 (accepted, implemented; live checks pending):** verify on a real OpenChamber/OpenCode baseline: scoped plugin credential resolution (especially Zen orgID), whole-package approval vs post-approval plugin failure, Usage-hidden Quotas refresh, complete six-source results including cached/error acknowledgement, one-second discovery vs ten-second operation/twelve-second admission deadline, and historical values after expired resetAt. Verify first-success windows preserve pre-data hide/empty choice, settings shared across clients of one server with conflict-safe patches, multiple-server discovery ownership, and single-coordinator plugin contexts.
- **Persistence/secrets (ADR-013):** inspect Windows ACLs on the token-bearing bridge descriptor and its directory. Run the live restart/reload check for settings and quota cache with OpenCode logins untouched.

> Provisional — feature `002-opencode-credential-handoff`: implementation is automated-tested; live provider and host checks remain.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->
