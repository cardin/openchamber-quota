# Quickstart Validation

Prerequisites:

- OpenChamber v2.7.3 or later on web or desktop. VS Code does not load extensions.
- Bun 1.4 or later for the build.
- Keys for Tavily and OpenRouter; a custom quota endpoint; optionally an OpenCode Go or Zen key.
- For Codex, an existing `~/.codex/auth.json` from the Codex CLI.

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
3. Add a custom provider pointing at a fixture endpoint (see [custom-provider-v1](contracts/custom-provider-v1.md)).
4. Add **OpenAI / Codex**. Run `codex login` first; the service imports `~/.codex/auth.json` and no key is typed.
5. Optionally add OpenCode Go and Zen keys.
6. Choose the providers/windows to show, the danger cutoff, and the reset-time format. A newly added provider appears automatically with its current windows; a new window type for an existing provider stays opt-in.

Secrets are sent only to the local service and never returned. The section keeps only display preferences.

## Checks

| Check | Steps | Expected |
| --- | --- | --- |
| Placement | Open Work Status | A **Quotas** section, no rail icon. |
| Tavily limits | Add a Tavily key with plan/key/PAYG limits | Monthly windows with remaining/limit, a reset on the first of the month, and the even-use benchmark. |
| OpenRouter window | Add a key with a limit | Remaining bar, reset, and benchmark when the duration is known. |
| OpenRouter unlimited | Add a key without a limit | Spend or balance shown; no percentage bar. |
| Custom benchmark | Fixture window: 25% remaining, halfway through | Bar at 25%, benchmark at 50%. |
| Missing reset | Fixture window without `resetAt` | Window error replaces that bar; no invented reset. |
| Provider failure | Use a bad key for one provider | One provider error; other providers stay visible. |
| Hidden panel | Collapse the section, wait 2 minutes, reopen | No refresh while collapsed; data refreshes on reopen. |
| Restart | Restart OpenChamber | Connections and selections persist. |
| Instance isolation | Use two data directories | Selections and connections do not cross. |
| CA trust | Set `caBundlePath` to the corporate PEM, connect | Request succeeds with verification on. |
| No secrets | Inspect the snapshot and section storage | No key, token, endpoint, or raw upstream body. |

## Automated checks

```bash
bun test                 # unit and contract tests
bun run typecheck        # if configured
```

Fixtures and a controlled clock cover windows, benchmarks, caps, balances, errors, and rate limits. The host smoke test covers mount/unload, service round-trip, CA trust, and restart isolation. Live provider calls are manual and not part of CI.

See [data-model.md](data-model.md) and [contracts](contracts/service-api.md) for the expected shapes.
