# Design

## Surface

The extension adds a **Quotas** status section to OpenChamber's Work Status panel. The section is display-only: it renders the snapshot plus a refresh control and stores only display preferences. Configuration lives in a separate **Quota settings** page under the sidebar's **Pages** entry. No OpenChamber source or credential store is used.

The manifest contributes `statusSection`, `page`, and a host-runtime `service`. The manifest minimum is OpenChamber 2.7.3; the [install instructions](../README.md#install) use the verified 2.8.0 baseline. Web and desktop load the extension; VS Code does not.

## Components

- **Status section** (`src/section/`): the host mounts it only while Work Status is visible and Quotas is expanded. It renders providers, windows, caps, and balances, polls the snapshot every five seconds for countdowns, and requests a refresh on mount, every 60 seconds, manually, and at reset. The manual control is in the header when supported, with a body fallback. Timers stop when the frame unloads.
- **Settings page** (`src/settings/`): creates, tests, edits, and removes the currently offered provider connections; exposes display selection, Remaining/Used mode, danger cutoff, reset-time format, and usage balances. Codex, Zen, and custom setup are hidden but existing connections remain editable. The key field is masked by default and has an in-field show/hide eye.
- **Local service** (`src/service/`): a loopback HTTP service started by OpenChamber. It validates the host token, owns credentials, fetches provider APIs through adapters, coalesces refreshes, caches the last snapshot, and returns a secret-free snapshot.
- **Normalization** (`src/core/`): clamps percentages, computes the even-use benchmark, formats reset times, and keeps caps and balances distinct from resetting windows.

## Data flow

`status section → host.serviceRequest → local service → provider HTTPS API`

Display preferences use instance-scoped `host.storage`. Credentials and the snapshot cache stay in `OPENCHAMBER_SERVICE_DATA_DIR`. Snapshots contain no raw upstream bodies, endpoints, account IDs, or secrets. The separate connection metadata response includes a custom endpoint so the settings page can edit it, but no keys or account IDs.

## Refresh and failure states

One refresh per provider may run at a time. Minimum intervals are five minutes by default and ten minutes for Tavily; `Retry-After` and `retryAt` delay retries. The section keeps unexpired bars during a refresh, shows loading for a first fetch or an expired window, replaces a single malformed window with a window error, and replaces a failed provider with one provider-level error while other providers stay visible. No configured providers, everything hidden by selection, and a successful provider response with no quota data have distinct messages.

For resetting windows, danger takes precedence below the shared remaining-quota cutoff (10% by default). Otherwise, warning applies below a known even-use benchmark; the bar uses its default colour in other cases. Remaining and Used show the same data on opposite scales without changing the warning state.

## Provider adapters

| Kind | Source | Normalization |
| --- | --- | --- |
| Custom | User-supplied HTTPS endpoint | `openchamber-quota-v1` windows, caps, and balances; no mapping UI. Setup is hidden until a live endpoint can be verified. |
| Tavily | `GET https://api.tavily.com/usage` | Plan, key, and PAYG limits as monthly windows reset at 00:00 UTC on the first; PAYG without a limit becomes a balance; key usage without a limit is hidden |
| OpenRouter | `GET https://openrouter.ai/api/v1/key` | Limited key becomes a window; unlimited key becomes a spend balance |
| OpenCode Go | Console `/console/api/go/status`, falling back per window to [Go usage](https://opencode.ai/docs/console/go) (`/zen/go/v1/usage`) | Prefer precise Console used/limit meters. Use whole-percent Go usage for missing or incomplete Console meters, including a 5h meter with no reset before the window starts. |
| OpenCode Zen | Console usage and budget endpoints | Request counts and spend budgets; an unaccepted key is an auth error. Setup hidden; unverified: the reference implementation uses a Console OAuth token and different billing routes |
| Codex | `GET https://chatgpt.com/backend-api/wham/usage` | Imports the Codex CLI login; primary/secondary windows and credits; no OAuth flow. Setup hidden pending live verification |

## Trust and storage

All provider requests are HTTPS-only, reject redirects, and use the runtime trust store. Custom CA bundles are not supported. Connections are written atomically to `connections.json` with `0600` on POSIX. On Windows the mode is ignored and the file inherits the OpenChamber data directory ACL; the service does not set an explicit DACL. The file is not encrypted in this release. The cache holds the last normalized snapshot and is ignored when it fails schema validation.

## Boundaries and gaps

The plugin duplicates provider reads that OpenChamber renders from its own quota readers; the host does not expose those values to a guest. See [verification and coverage](TESTPLAN.md) and [outstanding work](outstanding.md).
