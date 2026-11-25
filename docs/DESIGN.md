# Design

## Surface

Quotas remains a separate Session/Work Status panel section, with Quota settings under Pages. It is the sole extension quota display; the intended design adds no provider item inside the built-in Usage area. Existing code still uses a section iframe, settings iframe and local service. Manifest minimum is 2.7.3; prior installation verification used OpenChamber 2.8.0. New plugin capabilities remain a baseline verification gate.

## Implemented baseline

`src/section/` renders a secret-free service snapshot, polls every five seconds and asks for refresh on mount, every 60 seconds, manually and at reset. `src/settings/` edits locally stored provider connections and instance-scoped host.storage preferences. `src/service/` uses HTTPS adapters, coalesces stored-key requests, caches snapshots and keeps credentials out of UI responses. This baseline is not yet the plugin/server-shared design below.

## Intended acquisition and scheduling

An OpenCode plugin reads only selected OpenRouter, Go, Zen and Codex credentials inside OpenCode, fetches through shared adapters and sends complete four-provider readings to the service. Current Tavily/custom keys stay in the service. Package service/plugin permissions are approved together; plugin failure after approval is different from rejecting or disabling the whole package.

All refreshes cover all sources. Per-provider schedulers shared by every trigger decide fetch, cached result or in-flight reuse; manual refresh does not bypass minimums or Retry-After. Complete cached/error cycles still acknowledge their request id. Healthy one-second discovery is separate from the ten-second whole provider-operation budget; sequential fallback calls share one deadline. Allow one second for publication, twelve seconds from service admission and fifteen seconds for UI waiting. Timeout outcomes do not guarantee fresh quota.

The Quotas section shows all sources independently of Usage visibility. Preserve last-success samples with age and an out-of-date notice through plugin outages and post-upgrade service restarts. Expired historical windows keep the sampled value, not an invented next reset/live even-use marker/endless refreshing message.

> Provisional — feature `002-opencode-credential-handoff`: acquisition, deadline and historical-display implementation is pending.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## Intended settings and discovery

`display.json` and current `connections.json` in the extension service data directory are authoritative for everyone using that OpenChamber server. Clients read/reload and submit revisioned field changes through the service; conflicting updates reapply user intent without overwriting unrelated fields. host.storage is no longer authoritative.

Record provider encounter separately from first successful window initialization, preserving explicit provider hides and empty window lists made before quota arrives. Automatic defaults reconcile once on the server. Different servers have separate data and `<serverId>.json` discovery entries, with ownership-checked cleanup and explicit binding (or sole verified live endpoint). Multiple plugin contexts for one server cannot create independent polling/fetch loops.

The pre-release extension has no external users, so old development formats need no migration or compatibility path. No automatic wipe, startup reset or storage epoch is introduced. Preserve supported Tavily/custom keys, shared settings and cache during normal operation; any developer cleanup is separate and manual. OpenCode logins are untouched (ADR-013).

> Provisional — feature `002-opencode-credential-handoff`: server persistence and binding/coordinator checks remain unverified.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## Provider adapters and trust

Retain existing canonical window/cap/balance normalization; resetting windows use actual resets and estimates only for current valid data. Caps have no invented reset; balances have no bar. OpenRouter uses key usage, Go precise Console meters with Go fallback, Zen Console usage/budget, and Codex ChatGPT usage. Intended Codex path retires CLI auth-file import. Zen's resolved org identifier belongs in secret.accountId and its adapter must read that location. OAuth route/account correctness needs live verification.

All upstream requests are HTTPS-only, reject redirects and use system trust; no custom CA setting. Shared pure HTTP errors avoid bundling node:https into the plugin. Service-owned key files are atomic and 0600 on POSIX; Windows uses actual inherited ACLs requiring inspection. Usage cache/outputs contain no secrets. Current key storage is intentional and not confused with forbidden new OpenCode credential copies. See [interfaces](INTERFACES.md), [verification](TESTPLAN.md) and [backlog](BACKLOG.md).
