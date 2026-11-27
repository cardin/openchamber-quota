# Objective
Let users see how much quota they have left and when it resets without leaving OpenChamber.

# Requirements

## REQ 1
For each displayed resetting window, show a colored quota bar, the even-use estimate, and the reset time. The estimate is the share that would remain or have been used if the window's quota were used evenly, on the same scale as the bar. If quota or reset time is missing, show an error for that bar; temporary unavailability counts as missing. If only the timing is missing, omit the estimate.

A spend cap or lifetime limit with a known maximum gets a bar without a reset or estimate; a prepaid balance is a number without a bar. Never invent a reset. A provider exposing none of these is ineligible under REQ 2.

Default to showing quota remaining. Users can choose to show quota used instead in Quota settings.

When a post-upgrade reading is stale because the OpenCode plugin is unavailable, keep the last sampled bar/value with its age and an out-of-date notice, even after the old reset time. Do not recalculate an even-use estimate, invent a new reset, or claim that refreshing is running when it is not.

> Provisional — feature `002-opencode-credential-handoff`: stale-reading behavior is implemented and fixture-tested; live plugin-outage verification remains.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## REQ 2
The plugin must support OpenRouter, OpenCode Go, OpenCode Zen, OpenAI, Tavily and Exa through OpenCode. A provider is in scope only when it exposes quota data the plugin can retrieve. Exa credit data requires a Team Management service key.

The approved plugin reads only the declared providers’ credentials inside OpenCode, including Tavily and Exa environment credentials. It sends only usage to the service. Quota settings accepts no keys for the six providers.

A provider with no attempted credential is never listed in the Quotas section or in Quota settings; when none are signed in, the panel shows a sign-in hint. A provider whose credential fails authentication is also omitted from the panel. Its error is shown only in the Quota settings provider status table, which lists attempted providers, their setup source, their status, and any message. A plugin that has never connected shows one restart notice instead of provider rows.

OpenChamber’s Extensions settings disclose the local service and the plugin’s full OpenCode access before approval. If the plugin has not connected after approval, the panel and settings ask for an OpenCode or OpenChamber restart. A plugin outage keeps eligible last readings; rejecting or disabling the package prevents service refresh.

Refresh always covers all providers. Each provider's scheduler chooses a fetch, cached result, or shared in-flight result according to its normal five-minute poll interval and retry limits. A manual refresh may bypass the normal poll wait but keeps a 30-second floor and honors the provider's `Retry-After`; repeated failures back off from one to fifteen minutes. Healthy local discovery targets one second, new provider work is bounded to ten seconds after discovery (including sequential fallbacks), and publication/timeout has a separate bounded allowance. These budgets do not promise successful fresh quota during a provider outage.

Old development data need not be migrated and must not be wiped automatically. Supported settings and usage cache persist across normal restarts and reloads. OpenCode logins must remain untouched.

> Provisional — feature `002-opencode-credential-handoff`: refresh, approval and persistence behavior is implemented and automated checks pass; live plugin/provider checks remain.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## REQ 3
The plugin must display its quota UI in OpenChamber's Session Panel.

## REQ 4
Users must be able to choose which supported providers to display and, for each provider with multiple quota windows, which windows to display. They must be able to reorder and collapse providers in Quotas. A collapsed row shows one configured reading, including Tavily's reported pay-as-you-go usage, or an applicable window comparison (least remaining or earliest reset). Quota settings saves that choice.

Quotas remembers which providers are collapsed or expanded when the panel or OpenChamber is reopened.

All clients connected to one OpenChamber server share Quota settings. Different servers remain separate. First successful window data initializes defaults once and preserves explicit hides and empty window selections.

> Provisional — feature `002-opencode-credential-handoff`: server-shared settings and first-success initialization are implemented and tested; live two-client verification remains.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->
