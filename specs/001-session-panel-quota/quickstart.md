# Quickstart Validation

Prerequisites:

- OpenChamber v2.7.3 or later on web or desktop. VS Code does not load extensions.
- Bun 1.4 or later for the build.
- Keys for Tavily and OpenRouter; optionally an OpenCode Go key.

## Build and install

```bash
bun install
bun run build
```

Install the package folder from **Settings → Extensions → Install from folder**, then open **Work Status** beside the chat. The **Quotas** section appears there, not in the right rail. It is display-only.

## Connect providers

Open **Quota settings** from the sidebar's **Pages** section, then:

1. Add Tavily with a `tvly-…` key.
2. Add OpenRouter with an `sk-or-…` key.
3. Optionally add an OpenCode Go key.
4. Choose the providers/windows to show, Remaining or Used, the danger cutoff, and the reset-time format. A newly added provider appears automatically with its current windows; a new window type for an existing provider stays opt-in.

Custom, Codex, and Zen setup is hidden until OAuth or a live endpoint can be verified; existing connections remain supported.

Secrets are sent only to the local service and never returned. The section keeps only display preferences.

## Checks

| Check | Steps | Expected |
| --- | --- | --- |
| Placement | Open Work Status | A **Quotas** section, no rail icon. |
| Tavily limits | Add a Tavily key with plan/key/PAYG limits | Monthly windows with remaining/limit, a reset on the first of the month, and the even-use benchmark. |
| OpenRouter window | Add a key with a limit | Remaining bar, reset, and benchmark when the duration is known. |
| OpenRouter unlimited | Add a key without a limit | Spend or balance shown; no percentage bar. |
| Custom provider | Review the add-provider list | Custom is hidden; existing custom connections remain supported. |
| Quota display mode | Switch to Used with a 25%-remaining window one-quarter through its duration and a `$12.50 / $50.00` used cap | Window at 75%, benchmark at 25%, warning unchanged; cap at 25%. Reopen the panel and check that Used is still selected. |
| Missing reset | Fixture window without `resetAt` | Window error replaces that bar; no invented reset. |
| Provider failure | Use a bad key for one provider | One provider error; other providers stay visible. |
| Hidden panel | Collapse the section, wait 2 minutes, reopen | No refresh while collapsed; data refreshes on reopen. |
| Restart | Restart OpenChamber | Connections and selections persist. |
| Instance isolation | Use two data directories | Selections and connections do not cross. |
| No custom TLS | Review Quota settings | No certificate or CA bundle control is offered; HTTPS uses the system trust store. |
| No secrets | Inspect the snapshot and section storage | No key, token, endpoint, or raw upstream body. |

## Automated checks

```bash
bun test                 # unit and contract tests
bun run typecheck        # if configured
```

Fixtures and a controlled clock cover windows, benchmarks, caps, balances, errors, and rate limits. The host smoke test covers mount/unload, service round-trip, and restart isolation. Live provider calls are manual and not part of CI.

See [data-model.md](data-model.md) and [contracts](contracts/service-api.md) for the expected shapes.
