# Phase 0 Research: Session Panel Quota Display

**Verification baseline:** OpenChamber [v2.7.3](https://github.com/openchamber/openchamber/releases/tag/v2.7.3), commit `cf18602cc77146f35e26e103dbee1ab8e218b663`, the latest stable release checked on 2026-11-20. Provider behavior was read from pinned host source and vendor docs on 2026-11-23.

## Surface: Work Status section

- **Decision:** Use `contributes.statusSection` for a new **Quotas** section. A rail tab does not satisfy REQ 3.
- **Evidence:** The [SDK](https://github.com/openchamber/openchamber/blob/cf18602cc77146f35e26e103dbee1ab8e218b663/packages/sdk/API.md#L270-L299) supports a section-only package with its own HTML entry. The host loads it only while the panel is visible and the section is expanded, and unloads it when collapsed. Web, desktop, and phone support it; VS Code does not.
- **Probe:** A status probe (since removed) reported `surface=status` and an instance-scoped mount counter that survived a restart (#2 → #5). It did not prove unload timing; removing an iframe does not reliably fire `pagehide`. The host documentation is the authority for unload.
- **Pages surface:** A `contributes.page` entry opens from the sidebar's Pages section; the Work Status section stays display-only.
- **Header refresh:** The host renders a status-section control in the section header. Its button label is text only, so the header uses `↻`; the Lucide `rotate-cw` SVG is the fallback inside the body when status controls are unavailable.
- **Alternatives:** Native panel or Work Status extension (requires a host change; rejected); rail tab (wrong surface).

## Data path: local guest service

- **Decision:** The extension ships a local service. The section calls `host.serviceRequest`, and the service owns provider requests, credentials, caching, and scheduling. No OpenChamber host change.
- **Rationale:** The probe confirmed the stock guest cannot read quota data: `host.request` returned `HOST_REJECTED: not-found`, page `fetch` was blocked, and no service existed. The host refuses browser access to its credential list, and reading OpenCode's raw credential store is out of bounds.
- **Alternatives considered:**
  - Host bridge (rejected: no rights to OpenChamber, no code changes).
  - Depend on `slkiser/opencode-quota` (limited to its provider list; extra install; stale-on-error behavior).
  - Vendor CLI for every provider (heavy; uneven output).
- **Service contract:** `GET /snapshot`, `POST /refresh`, `GET/POST /connections`, `DELETE /connections/:id`, `POST /connections/:id/test`, `GET /health`. The host injects `OPENCHAMBER_SERVICE_PORT` and `OPENCHAMBER_SERVICE_TOKEN`; the service verifies the token. See [contracts](contracts/service-api.md).

## Provider adapters

| Provider | Endpoint | Auth | Data and reset | Limits |
| --- | --- | --- | --- | --- |
| Custom | User-supplied HTTPS URL | Bearer key | `openchamber-quota-v1` windows, caps, balance | 5 min default |
| Tavily | `GET https://api.tavily.com/usage` | Bearer `tvly-…` | Plan, key, and PAYG limits use derived monthly resets; PAYG usage without a limit is a balance | 10 requests / 10 min |
| OpenRouter | `GET https://openrouter.ai/api/v1/key` | Bearer key | `limit`, `limit_remaining`, `usage_monthly`, `limit_reset` daily/weekly/monthly | 5 min |
| OpenCode Go | `GET https://opencode.ai/console/api/go/status`, fallback `/zen/go/v1/usage` | Bearer API key | Prefer precise used/limit meters as in built-in Usage; fallback reports whole used percentages. Both report reset times. | 5 min |
| OpenCode Zen | `GET https://opencode.ai/console/api/usage/models?range=…`, `/budgets/service-accounts/status` | Bearer API key or Console token | Request counts, spend budgets with `resetsAt` | 5 min; verify key path |
| Codex | `GET https://chatgpt.com/backend-api/wham/usage` | Bearer access token + optional `ChatGPT-Account-Id` | `rate_limit.primary_window` / `secondary_window`: `used_percent`, `limit_window_seconds`, `reset_at`; credits | 5 min |

- **Tavily** provides `account.plan_usage` / `plan_limit`, `key.usage` / `limit`, and `account.paygo_usage` / `paygo_limit`. Derive the next 00:00 UTC on the first of the month for each reported limit. Show raw remaining/limit and the benchmark for each window. Without a limit, hide the key-usage counter and show PAYG usage as a balance.
- **OpenRouter** without a limit is a spend value, not a percentage. `limit_reset` is a documented period; compute the next UTC boundary and label the reset as derived.
- **Codex** has no API-key quota path. Import `~/.codex/auth.json` (`tokens.access_token`, `tokens.account_id`) with explicit user action; never read OpenChamber's store. Token expiry surfaces as an auth error.
- **Zen** API-key support must be confirmed with a live key; if it fails, show an auth error and reassess the connection method with approval. No OAuth flow is planned for the first release.

## Credentials, storage, and trust

- **Credentials:** Stored in `OPENCHAMBER_SERVICE_DATA_DIR` with `0600` on POSIX (user ACL on Windows), atomic writes, no logs, and no return in any response. The section sends secrets only to the service via the host proxy. Codex imports a vendor CLI login on user action; no host credential store.
- **OpenCode credentials are not a service input.** OpenChamber does not give the guest service the OpenCode endpoint or its connection token. A local process could try `opencode api`, read OpenCode's database, or call the credential route, but that is not a supported service contract, couples the plugin to OpenCode internals, and reads another application's secret store. The plan keeps per-provider connections instead.
- **The built-in Usage values are host-owned.** The Codex and OpenCode Go rows in Work Status are rendered by the host from its own quota readers. A guest section is a sandboxed iframe: it cannot read that DOM, and the host's `/api/quota` routes are not exposed to guests (the probe's `fetch` failed). Seeing the values there proves the host has the data, not that a plugin can read it. The service must fetch the same provider data itself.
- **Preferences:** Instance-scoped `host.storage`; no secrets. Saved empty selections are distinct from first use.
- **TLS trust:** HTTPS only, redirects rejected, and hostname verification preserved. The service uses the runtime's trust store. Custom CA bundles are not supported.
- **Custom endpoints:** Reject credentials in URLs and fragments. Allow private destinations only with an explicit opt-in. Bound timeout and response size.

## Custom provider format

One versioned, read-only JSON format, `openchamber-quota-v1`, with optional windows, caps, and a balance. Windows require `id`, `label`, `remainingPercent`, and `resetsAt`; `durationSeconds` is optional and controls the benchmark. Caps require `id`, `label`, `used`, `limit`, and `unit`. No field mapping, scripts, custom headers, or endpoint discovery. See [the schema](contracts/custom-provider-v1.schema.json).

## Normalization and refresh

- **Windows:** A resetting window needs `remainingPercent` and `resetsAt`. Missing either shows the window error. The benchmark is computed only from a verified full duration; otherwise omit it.
- **Caps and balances:** No reset, no benchmark. Caps show remaining vs maximum; balances show a number. Zero is valid, not missing.
- **Refresh:** The service coalesces one request per provider/account and enforces minimum intervals. The section loads the snapshot every 5 seconds for countdowns, attempts a refresh on mount and every 60 seconds while mounted, and refreshes at reset; the service enforces provider limits and schedules a retry when an attempt is blocked. Manual refresh uses the same limits. Expired windows show loading until the next allowed fetch.
- **Errors:** `not_configured`, `auth`, `rate_limited` (with retry time), `timeout`, `network`, `bad_response`, `provider_error`. A failed provider hides its old values; other providers remain visible.
- **Verification:** Fixtures and a controlled clock for unit/contract tests; host smoke test for section mount, service round-trip, and restart isolation. No live-provider calls in CI.

## Residual unknowns

- The original probe ran without a service; the later isolated host verified the service round-trip and unload behavior. See [verification.md](verification.md).
- Zen API-key acceptance for usage endpoints.
- Codex token lifetime and the exact `auth.json` variants.
- Guest service data-directory permissions on Windows.
- Provider-specific rate limits beyond Tavily's documented usage limit.
