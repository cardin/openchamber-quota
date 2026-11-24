# Verification

| Date | Check | Result | Notes |
| --- | --- | --- | --- |
| 2026-11-24 | TypeScript typecheck | Pass | `bun run typecheck` |
| 2026-11-24 | Unit, contract, integration tests | Pass | 101 tests, 0 failures |
| 2026-11-24 | Section, settings, and service build | Pass | `bun run build` |
| 2026-11-24 | Manifest validation | Pass | `openchamber-guest-check .` |
| 2026-11-24 | Section is display-only (simulated) | Pass | No Manage/selector; header refresh control registered |
| 2026-11-24 | Quota settings page render (simulated) | Pass | Connections, usage, selector, and cutoff/reset; no TLS card |
| 2026-11-24 | Section render in a simulated host | Pass | Fixture provider rendered a bar and refresh icon |
| 2026-11-24 | Selection first-use and provider auto-enable | Pass | Unit/integration tests cover unchecking from the default and adding a provider without overwriting retained windows |
| 2026-11-24 | Caps show remaining | Pass | `821 / 1000` with an 82% remaining bar; used-over-limit clamps to zero |
| 2026-11-24 | Tavily usage display | Pass | Key-usage counter hidden; PAYG usage shown in the panel and in the settings Usage section |
| 2026-11-24 | Tavily monthly reset | Pass | Plan, key, and PAYG limits render as monthly windows with remaining/limit, a first-of-month reset, and the even-use benchmark |
| 2026-11-24 | Hide non-reporting balances | Pass | Display offers a per-provider `non-reporting balances` checkbox, checked by default; hidden balances are filtered from the panel |
| 2026-11-24 | Absolute reset format | Pass | Within 24 hours shows time only; 1–6 days shows weekday and time; 7+ days shows date only |
| 2026-11-24 | Warning and danger colors | Pass | Warning and danger fills use the host warning/error colors; no pattern is required |
| 2026-11-24 | Window status alignment | Pass | The `5h` label stays in the label column and `refreshing…` starts at the bar column |
| 2026-11-24 | Custom provider edit | Pass | `PUT` keeps the existing key when the field is blank; settings exposes Edit and Cancel |
| 2026-11-24 | Contract enforcement | Pass | Runtime Snapshot validation checks actual service output, rejects invalid timestamps, and discards corrupt cache; response stays valid if provider state changes before serialization |
| 2026-11-24 | Periodic refresh, retry, and cleanup | Pass | Scheduler next-allowed tests; fake timers verify duplicate start, stop, restart, and late responses |
| 2026-11-24 | Tavily legacy selection | Pass | All three former limits migrate once when the window list is absent; existing lists and later opt-outs persist |
| 2026-11-24 | Service health and auth | Pass | Local service: `/health` 200 with token, 401 without |
| 2026-11-24 | Connection create/list | Pass | Local service returned metadata without secrets |
| 2026-11-24 | Install and guest round-trip (T014) | Pass | Local folder install in OpenChamber 2.8.0 with extension 0.1.9; guest `/health` returned 200 and `/snapshot` rendered in Work Status |
| 2026-11-24 | Host quota, errors, and refresh (T022) | Pass | 25% and 0% bars with 50% benchmark, staged missing-reset window, expired/loading and isolated auth error. Mount, manual, periodic, and controlled reset refresh checked |
| 2026-11-24 | Collapse/unload behavior | Pass | Host removed the iframe; no guest service calls over two minutes on the browser clock; reopen triggered refresh |
| 2026-11-24 | Host preferences (T029) | Pass | Deselect a window, auto-enable a new provider, leave a staged new window type opt-in, and restore choices and absolute reset format after restarting the host |
| 2026-11-24 | Host caps and balances (T035) | Pass | Two no-reset caps displayed remaining vs maximum with no benchmark; the balance rendered as a number |
| 2026-11-24 | Instance isolation and secret-free views | Pass | Separate OpenChamber data directories; the second instance had no connections or display preference. Snapshot and display storage omitted fixture key and endpoint |
| 2026-11-24 | Keyboard focus (spot check) | Pass | Tab moved from the fixture provider checkbox to its first window. Broader focus order and host-theme contrast are not covered by automated accessibility checks |
| 2026-11-24 | Empty-state outcomes | Pass | Unit tests cover no provider, all quotas hidden, and a provider reporting no windows; provider failures remain errors |
| — | Live custom provider | Pending | Requires a live HTTPS endpoint |
| 2026-11-24 | Live Tavily | Pass | API key; quotas displayed |
| 2026-11-24 | Live OpenRouter | Pass | API key; quotas displayed |
| 2026-11-24 | Live OpenCode Go | Pass | API key; quotas displayed |
| — | Live Codex | Pending | Needs `~/.codex/auth.json` |
| — | Live OpenCode Zen | Pending | Needs a key/token; verify key acceptance |
| 2026-11-24 | Remaining/Used display mode | Pass | Extension 0.2.0; settings choice persisted; simulated settings→section round trip switched a 25%-remaining window to 75% used with a 25% benchmark, kept warning color, and showed a cap as 10 / 50; 97 tests, typecheck, build |
| 2026-11-24 | Custom TLS setting removed | Pass | Quota settings has no TLS/CA control; live service returns 404 for GET and PUT `/config`; 97 tests, typecheck, build, package check |
| 2026-11-24 | API key visibility toggle | Pass | Live settings: the eye button reveals the pasted key and switches to an eye-off icon, Enter toggles without saving, and Codex hides the control; 98 tests, typecheck, build |
| — | Full quickstart (T053) | Partial | Isolated fixture checks passed; Tavily, OpenRouter, and OpenCode Go live checks passed. Custom, Codex, Zen, and a separate session-switch check remain |

## Local service smoke command

```bash
OPENCHAMBER_SERVICE_PORT=47999 \
OPENCHAMBER_SERVICE_TOKEN=test-token \
OPENCHAMBER_SERVICE_DATA_DIR=/tmp/openchamber-quota-smoke \
bun src/service/main.js
```

Then call `GET /health` with `Authorization: Bearer test-token`.
