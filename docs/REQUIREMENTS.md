# Objective
Let users see how much quota they have left and when it resets without leaving OpenChamber.

# Requirements

## REQ 1
For each displayed resetting window, show a colored quota bar, the even-use estimate, and the reset time. The estimate is the share that would remain or have been used if the window's quota were used evenly, on the same scale as the bar. If quota or reset time is missing, show an error for that bar; temporary unavailability counts as missing. If only the timing is missing, omit the estimate.

A spend cap or lifetime limit with a known maximum gets a bar without a reset or estimate; a prepaid balance is a number without a bar. Never invent a reset. A provider exposing none of these is ineligible under REQ 2.

Default to showing quota remaining. Users can choose to show quota used instead in Quota settings.

When a post-upgrade reading is stale because the OpenCode plugin is unavailable, keep the last sampled bar/value with its age and an out-of-date notice, even after the old reset time. Do not recalculate an even-use estimate, invent a new reset, or claim that refreshing is running when it is not.

> Provisional — feature `002-opencode-credential-handoff`: stale-reading implementation and verification are pending.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## REQ 2
The plugin must support these providers: providers that OpenCode supports, user-defined custom providers, and Tavily. Additional providers may be added later. A provider is in scope only when it exposes quota data the plugin can retrieve.

For providers that OpenCode supports, the plugin must obtain their credentials through the extension's approved OpenCode plugin. The plugin reads only the declared providers' credentials inside OpenCode, uses them to fetch usage, and sends only usage to the service; the service never reads either credential store, and no credential reaches the panel. For providers OpenCode doesn't support, the user enters a key in Quota settings.

Custom-provider setup is hidden in this release pending verification.

The OpenCode plugin and local service require approval of the package's complete permission list. A plugin load/reachability failure after approval leaves Tavily/custom working; rejecting or disabling the package instead prevents service refresh. Credentials for the four OpenCode providers are never copied to the service. Current Tavily/custom keys remain intentionally stored only by the service.

Refresh always covers all providers. Each provider's scheduler chooses a fetch, cached result, or shared in-flight result according to its internal minimum and retry limits; manual refresh does not bypass these limits. Healthy local discovery targets one second, new provider work is bounded to ten seconds after discovery (including sequential fallbacks), and publication/timeout has a separate bounded allowance. These budgets do not promise successful fresh quota during a provider outage.

There are no external users of this pre-release extension yet, so compatibility and migration of old development records are not required. This does not add automatic wiping on install, startup or upgrade. Supported Tavily/custom connections, settings and cache persist normally; any development-data reset is separate and manual. OpenCode logins must remain untouched.

> Provisional — feature `002-opencode-credential-handoff`: the approved refresh, approval and persistence contracts are not implemented or verified yet.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## REQ 3
The plugin must display its quota UI in OpenChamber's Session Panel.

## REQ 4
Users must be able to choose which supported providers to display and, for each provider with multiple quota windows, which windows to display.

All clients connected to one OpenChamber server share Quota settings and connections. Different servers remain separate; settings are not specific to a UI window or client instance. First successful window data initializes defaults once, but an explicit provider hide or empty window choice made before data arrives is preserved.

> Provisional — feature `002-opencode-credential-handoff`: server-shared settings and first-success initialization are approved; implementation and concurrency checks are pending.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->
