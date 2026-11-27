# Design

## Surface

Quotas remains a separate Session/Work Status panel section, with Quota settings under Pages. It is the sole extension quota display; the extension adds no provider item inside the built-in Usage area. Existing code uses a section iframe, settings iframe, local service and an OpenCode plugin. Manifest minimum is 2.7.3; prior installation verification used OpenChamber 2.8.0. T001 verified the V2 plugin API surface on OpenCode 2.4.1; a live plugin load remains a check. Both iframes are server-rendered HTML with shared CSS custom properties and no component framework ([ADR-016](ADR.md#adr-016-keep-the-settings-ui-framework-free)). The provider header swaps its logo for a hover/focus chevron, its hit area covers the full logo-to-name span, and a collapsed summary stays on the provider-name row. The panel lists only providers with a valid attempted credential; Quota settings shows an attempted-provider status table with setup and error details, and omits providers that were never configured ([ADR-017](ADR.md#adr-017-hide-unauthenticated-providers-and-report-problems-in-settings)).

## Implemented baseline

`src/section/` renders a secret-free service snapshot, polls the snapshot/settings every five seconds, asks for one refresh on mount and on manual action, and rechecks at reset. The service and plugin each refresh their providers every five minutes. `src/settings/` edits revisioned server-shared display settings. `src/service/` uses an HTTPS adapter for hidden custom connections, coalesces stored-key requests, caches snapshots, publishes a server-bound bridge descriptor, admits all-provider cycles, merges complete bridge results and keeps credentials out of UI responses. `src/opencode-plugin/` resolves only the six declared OpenCode-backed credentials, schedules each provider once, fetches inside OpenCode and posts secret-free complete results over the bridge.

The self-contained OpenCode bundle imports only runtime built-ins. Standalone OpenCode 2.4.2 loaded it and published six-provider cycles without credentials; managed OpenChamber delivery and account checks remain open. Binding starts an all-provider cycle. Supported credential events use the same scheduler. The provider-set lock and loopback guard serialize takeover ([ADR-018](ADR.md#adr-018-make-the-plugin-coordinator-lock-provider-set-aware), [ADR-019](ADR.md#adr-019-serialize-quota-coordinator-takeover)).

## Intended acquisition and scheduling

An OpenCode plugin reads OpenRouter, Go, Zen, OpenAI, Tavily and Exa credentials inside OpenCode and sends complete six-provider readings to the service. Package approval covers the service and plugin together. Custom connections remain in the implemented baseline but are outside the feature scope ([ADR-021](ADR.md#adr-021-scope-quota-requirements-to-opencode-providers)).

All refreshes cover all sources. Per-provider schedulers shared by every trigger decide fetch, cached result or in-flight reuse. Normal polls wait five minutes and align to the earliest provider due time; manual/event refreshes bypass that wait but keep a 30-second floor and honor `Retry-After` on 429 and 503. Timing changes persist immediately so a reload cannot bypass them. Repeated failures back off from one to fifteen minutes. Complete cached/error cycles still acknowledge their request id. Healthy one-second discovery is separate from the ten-second whole provider-operation budget; sequential fallback calls share one deadline. Allow one second for publication, twelve seconds from service admission and fifteen seconds for UI waiting. Timeout outcomes do not guarantee fresh quota.

The Quotas section shows all sources independently of Usage visibility. Preserve last-success samples with age and an out-of-date notice through plugin outages and post-upgrade service restarts. Expired historical windows keep the sampled value, not an invented next reset/live even-use marker/endless refreshing message.

> Provisional — feature `002-opencode-credential-handoff`: acquisition, deadline and historical display are implemented and fixture-tested; live OpenCode/provider checks remain.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## Intended settings and discovery

`display.json` in the extension service data directory is authoritative for clients of that server. Clients use revisioned field changes and retry conflicts without overwriting unrelated fields. The old host.storage keys are neither read nor deleted.

Record provider encounter separately from first successful window initialization, preserving explicit provider hides and empty window lists made before quota arrives. Automatic defaults reconcile once on the server. Provider order, collapse/expand state, and the choice of collapsed summary are independent saved display settings. Quota settings stacks Providers and Display; all quota readings stay in Quotas and healthy provider status rows leave Details blank. Different servers have separate data and `<serverId>.json` discovery entries, with ownership-checked cleanup and explicit binding (or sole verified live endpoint). A server-bound lock file with heartbeat prevents duplicate plugin contexts for one server from creating independent polling/fetch loops. One server cache and snapshot are shared by every UI window of that server.

Old development formats need no migration. Supported settings and cache persist through normal operation. There is no automatic wipe, and OpenCode logins are untouched (ADR-013).

> Provisional — feature `002-opencode-credential-handoff`: server persistence, binding and the single-coordinator lock are implemented and tested; live host and Windows checks remain.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## Provider adapters and trust

Retain existing canonical window/cap/balance normalization; resetting windows use actual resets and estimates only for current valid data. Caps have no invented reset; balances have no bar. OpenRouter uses key or OAuth usage, Go precise Console meters with Go fallback, Zen Console usage/budget, OpenAI ChatGPT usage, Tavily usage limits and Exa team credits. The OpenAI CLI auth-file import is retired: the plugin supplies an OpenCode OAuth token and account id (ADR-014). Zen's resolved org identifier belongs in secret.accountId and its adapter reads that location. Live OAuth route/account correctness remains a verification gap.

Upstream requests require HTTPS, reject redirects, and use system trust. Shared HTTP errors keep node:https out of the plugin bundle. The quota cache and outputs contain no provider credentials. The bridge descriptor contains a separate token; its inherited Windows ACL still needs verification. See [interfaces](INTERFACES.md) and [verification](TESTPLAN.md).
