# Architecture Decisions

## ADR-001: Use a Work Status section and a Pages settings page

**Status:** Accepted (2026-11-23)

**Context:** OpenChamber exposes extension status sections and full-screen pages. The quota UI must appear beside the chat, not in the right rail, and configuration needs a durable home.

**Decision:** Contribute a `statusSection` titled **Quotas** for display and a `page` titled **Quota settings** under the sidebar's **Pages** entry. The status section stays display-only.

**Alternatives rejected:** A rail tab (wrong surface); extending the built-in Usage card (host-owned); a native host panel (requires changing OpenChamber).

## ADR-002: Own provider I/O in a local guest service

**Status:** Accepted (2026-11-23); the credential-source clause is superseded in part by [ADR-010](#adr-010-use-an-opencode-plugin-as-the-sole-credential-path). The local service and secret-free snapshot stand.

**Context:** The stock guest cannot read OpenChamber's quota data or credential store, and the host will not be changed. The extension still needs provider credentials, rate limiting, caching, and normalized data.

**Decision:** Ship a host-runtime service on loopback, authenticated with the host-injected token. The section calls it through `host.serviceRequest`. Credentials stay in the service data directory; the service returns a secret-free snapshot.

**Alternatives rejected:** A host bridge (requires host changes); reading OpenCode or OpenChamber credentials (unsupported and out of bounds); depending on an external quota plugin (limited coverage); vendor CLIs for every provider (heavy, uneven output).

## ADR-003: Support one fixed custom provider format

**Status:** Accepted (2026-11-20)

**Decision:** A custom provider is a label, HTTPS endpoint, and key returning the versioned `openchamber-quota-v1` document. The plugin validates windows, caps, and balances and offers no format picker, mappings, scripts, or custom headers.

**Alternatives rejected:** User-defined field mappings (unbounded validation and support burden); per-provider code in the settings page (not portable or testable).

## ADR-004: Use the system trust store only

**Status:** Accepted (2026-11-24)

**Context:** The service runs in a restricted guest environment where runtime CA overrides are not dependable. A user-facing CA path was implemented, then removed by product decision.

**Decision:** Provider requests are HTTPS-only, reject redirects, and use the runtime trust store. No custom CA bundle or certificate setting is offered.

**Alternatives rejected:** A configurable PEM path (extra secret-handling and no reliable guest-environment behavior); disabling verification (unsafe).

## ADR-005: Normalize provider-specific quota shapes

**Status:** Accepted (2026-11-23); the Codex CLI-login clause is superseded by [ADR-014](#adr-014-source-openai-and-zen-from-opencode-credentials).

**Decision:** Provider adapters convert each API into the common snapshot:

- **Tavily:** plan, key, and PAYG limits become monthly windows reset at 00:00 UTC on the first; PAYG usage without a limit becomes a balance; key usage without a limit is hidden.
- **OpenRouter:** a limited key becomes a window; an unlimited key becomes a spend balance.
- **OpenCode Go:** prefer precise Console used/limit meters; fall back to whole-percent usage from the Go API. This matches the built-in Usage percentages.
- **OpenAI:** use the plugin-supplied OpenCode OAuth token and account id; no OAuth flow or OpenAI API-key quota path in the extension.
- **OpenCode Zen:** use Console usage and budget endpoints; an unaccepted credential is an auth error rather than invented data.

**Consequences:** Tavily and OpenCode Go have provider-specific reset and precision rules. ADR-014 replaces the earlier Codex CLI import and Zen stored-key path. The reference quota implementation uses a Console OAuth token and different billing routes for Zen; the current API-key/route path remains unverified live.

## ADR-006: Keep selection and display preferences instance-scoped

**Status:** Accepted (2026-11-23); storage scope is superseded by [ADR-011](#adr-011-share-quota-settings-per-openchamber-server). Explicit choices and opt-in newly discovered window types still stand; first-success initialization is clarified by ADR-011.

**Context:** Users need stable choices across sessions and restarts, but instances must not share selections. Providers and window types appear over time.

**Decision:** Store `quota.display.v1` in `host.storage`. First use shows every configured provider and its windows; an explicitly saved empty selection stays empty. A newly added provider is enabled with its current windows; a newly reported window type stays opt-in. Remaining is the default display mode; Used is a persisted presentation choice. Non-reporting balances are shown unless the user hides them per provider.

**Alternatives rejected:** Host-owned preferences (not exposed to guests); per-session preferences (lose choices); auto-enabling every new window type (unexpected rows).

## ADR-007: Hide custom-provider setup until it can be verified

**Status:** Accepted (2026-11-24)

**Context:** No live custom endpoint is available to validate the setup flow end to end. Offering an unverified connection path would invite failures that look like plugin bugs.

**Decision:** Remove Custom from the add-provider list. Keep the adapter, schema, and existing connections so the path can be restored once a live endpoint is available. Custom-provider setup is deferred, not retired.

**Alternatives rejected:** Leaving the option visible with a warning (still untestable); deleting the adapter (loses completed work and existing connections).

## ADR-008: Defer Codex and Zen setup; investigate OAuth logins

**Status:** Superseded for setup by [ADR-010](#adr-010-use-an-opencode-plugin-as-the-sole-credential-path) and [ADR-014](#adr-014-source-openai-and-zen-from-opencode-credentials). The adapters and live-verification caution stand.

**Context:** No live Codex or Zen accounts are available for verification. The reference quota implementation reads OpenCode OAuth logins (with Console org metadata for Zen) and refreshes tokens; our extension currently imports a Codex CLI login and uses a key-based Zen path.

**Decision:** Hide Codex and Zen from the add-provider list while no verified login exists. Keep their adapters and existing connections. Future work is to evaluate OAuth login support and Console token refresh, then re-enable setup only after live verification.

**Alternatives rejected:** Shipping unverified key flows (users get avoidable failures); deleting the adapters (loses provider work and leaves REQ 2 coverage permanently reduced).

## ADR-009: Reuse OpenCode-held credentials through the quota-provider role

**Status:** Superseded by [ADR-010](#adr-010-use-an-opencode-plugin-as-the-sole-credential-path) for credential sourcing. The service architecture and secret-free snapshot stand.

**Context:** Users enter provider keys into Quota settings, so the service keeps a second copy of credentials OpenCode already holds. That blocks OAuth logins, forces re-entry, and duplicates secret storage. ADR-002 rejected reading either credential store directly.

**Decision:** Reuse OpenCode-held credentials only through OpenChamber's approved usage-provider contract, which supplies credentials for the providers the extension declares after the user approves that exact list. Providers OpenCode holds no credential for keep keys entered in Quota settings. No component reads the OpenChamber or OpenCode credential store directly, and no credential reaches the panel. Handed credentials are per-read: never logged, persisted, or returned. An expired OAuth credential is reported as an auth error; refreshing it inside the service remains out of scope.

**Alternatives rejected:** An OpenCode plugin that fetches and publishes quota (runs with the user's full OpenCode access, and guest access blocks the return path); direct store reads (ADR-002; unsupported internals); manual keys only (no OAuth, duplicate secrets).

**Consequences:** Approval names the providers and is asked again when that list changes. Existing stored keys for those providers become redundant; this pre-release upgrade does not migrate them (ADR-010). The role also changes which surface owns display and refresh cadence; the implementation spec resolves that. Remote topologies must be verified: the extension service runs on the OpenChamber server, which brokers credentials over its OpenCode connection. Not implemented yet; the key-entry flow remains authoritative.

## ADR-010: Use an OpenCode plugin as the sole credential path

**Status:** Accepted (2026-11-25); provider scope extended by [ADR-015](#adr-015-source-tavily-and-exa-through-opencode).

**Context:** ADR-009's quota-provider role only hands credentials while one of OpenChamber's own usage readouts is visible. The extension's Quotas section must stay current when the built-in Usage area is hidden, and it must not keep a second copy of the four providers' credentials. The Quotas section is also the extension's own UI, so it can show each signed-in provider without adding a duplicate row to OpenChamber's Usage area.

**Decision:** Do not declare OpenChamber's quota-provider role. Ship an OpenCode plugin as part of the extension. The plugin uses only OpenRouter, OpenCode Go, Zen and Codex credentials inside OpenCode, fetches quota there and sends readings only to the service. The service never receives these four credentials; current Tavily/custom keys stay service-owned. Quotas is the only extension display, independent of Usage visibility. Package approval includes service and full-access plugin permissions together.

**Alternatives rejected:** The quota-provider role with the four providers (requires the Usage area visible, adds a duplicate row, hands credentials to the service); a stored-key fallback (duplicates the secret this work removes); service-side store reads (ADR-002/009); manual refresh only (does not keep the four current while Usage is hidden).

**Consequences:** Full-access plugin execution is trusted to obey the four-provider limit; it is not host-enforced. After approval, plugin load/connectivity failure leaves historical quota with a notice and Tavily/custom usable. Package rejection or withdrawal blocks service operation instead. Code/folder-only updates do not promise reapproval; new permissions do. Remote bridging remains unsupported. ADR-011 defines shared settings, ADR-012 defines refresh budgets, and ADR-013 clarifies pre-release compatibility without automatic wiping. This supersedes ADR-009 for credential sourcing; the local service and secret-free snapshot stand. Implementation is complete in automated checks; live baseline checks remain.

> Provisional — feature `002-opencode-credential-handoff`: plugin acquisition is implemented; a live OpenCode load and live Codex/Zen checks remain.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## ADR-011: Share Quota settings per OpenChamber server

**Status:** Accepted (2026-11-25); supersedes ADR-006's instance-specific storage scope.

**Context:** The developer wants all clients of one OpenChamber server to use the same Quota settings, not independent selections.

**Decision:** Keep one authoritative server-owned settings document and connection store. Clients apply field changes through the service with revision/conflict handling. Preserve explicit choices, and distinguish provider encounter from first successful window initialization. Separate servers remain distinct; their plugin discovery must not overwrite or ambiguously select another server.

**Alternatives rejected:** Browser instance storage (competing settings); one global descriptor per user (cross-server collisions); defaulting windows on first unavailable entry (permanently empty selections); overriding an explicit hide when data arrives.

> Provisional — feature `002-opencode-credential-handoff`: shared settings and server-safe discovery are implemented; live two-client and Windows ACL checks remain.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## ADR-012: Refresh all providers through bounded, cache-aware cycles

**Status:** Accepted (2026-11-25); the automatic legacy-wipe clause is superseded by [ADR-013](#adr-013-no-pre-release-migration-obligation-or-automatic-wipe), and the provider count is extended to six by [ADR-015](#adr-015-source-tavily-and-exa-through-opencode). Refresh and historical-display decisions stand. The original decision below is retained as history, not the current wiping contract.

**Context:** The developer wants one refresh covering all providers, approximately one-second request discovery and ten-second fetch completion. This pre-release upgrade may break the only existing user, the developer.

**Decision:** All triggers share each provider's internal scheduler; rate/retry limits decide fetch, cache or joining running work. Every bridge cycle returns all four entries and acknowledges even cached/error results. Separate discovery, total operation and publication budgets. Historical samples remain visible with age after expiry, without live estimates. Wipe old extension state once instead of migration; never wipe OpenCode logins, and preserve newly configured keys/settings thereafter.

**Alternatives rejected:** Provider-targeted refresh (not desired); manual rate-limit bypass and parallel timer/request loops (duplicate calls); per-endpoint renewed timeouts (unbounded completion); endless refreshing for expired cached windows (misleading); legacy credential migration/backups (rejected).

> Provisional — feature `002-opencode-credential-handoff`: scheduling, timing and historical rendering are implemented in automated checks; live provider and host checks remain.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## ADR-013: No pre-release migration obligation or automatic wipe

**Status:** Accepted (2026-11-25); supersedes ADR-012's automatic legacy-wipe clause.

**Context:** The developer clarified that no one else uses the extension yet. The earlier legacy comment removed the need for backward compatibility; it did not request automatic data-clearing behavior.

**Decision:** Do not build legacy migration or an automatic upgrade-reset mechanism. Preserve supported connections, settings and cache during normal operation. Incompatible development data may be manually cleared in a separate developer action, never automatically as part of this feature. OpenCode logins remain untouched.

**Alternatives rejected:** A storage-epoch wipe on startup/upgrade (unrequested destructive behavior); migration of old development formats (no users require it).

> Provisional — feature `002-opencode-credential-handoff`: supported-state persistence is implemented and tested; live restart/host checks remain.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## ADR-014: Source OpenAI and Zen from OpenCode credentials

**Status:** Accepted (2026-11-25); supersedes ADR-005's Codex CLI-login clause and ADR-008's deferral of OpenAI/Zen setup; provider scope extended by [ADR-015](#adr-015-source-tavily-and-exa-through-opencode).

**Context:** T001 verified OpenCode 2.4.1's V2 plugin surface: `integration.connection.active(id)` and `resolve(connection)` return key or OAuth credentials for the declared ids. The four-provider plugin design (ADR-010) requires the extension to fetch OpenAI and Zen usage from those credentials, not from a local CLI file or a stored key. ADR-005's `~/.codex/auth.json` import couples the service to a machine-local file outside the approved plugin path; ADR-008 hid the providers because no verified login path existed.

**Decision:** Resolve only the four integration ids inside OpenCode. Map a key credential to `secret.apiKey` and an OAuth credential to `secret.accessToken`. OpenAI requires an OAuth access token plus an account id and sends `ChatGPT-Account-Id`; API-key-only OpenAI accounts are explicitly unsupported. Zen prefers `orgID`, falls back to `accountId`, stores the result in `secret.accountId`, and its adapter sends `x-org-id`. Never copy `refresh` or `expires`. No CLI auth-file reader and no service-side credential scan remain. The four key-entry forms are absent; their setup is the OpenCode sign-in.

**Alternatives rejected:** Keep the Codex CLI import (bypasses the plugin approval path, reads a machine-local file, does not work for a remote OpenCode); store keys for OpenAI/Zen (ADR-010's rejected fallback); read the OpenCode credential store directly from the service (ADR-002/009).

**Consequences:** OpenAI and Zen appear only when OpenCode has a usable credential; a missing credential is omitted from the panel. Zen's live `orgID` field name and OpenAI's live ChatGPT account behavior remain unverified until T055. The plugin grant, not a host list, is the limit on which providers are read.

> Provisional — feature `002-opencode-credential-handoff`: the mapping is implemented and fixture-tested; live Zen/OpenAI acceptance remains.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## ADR-015: Source Tavily and Exa through OpenCode

**Status:** Accepted (2026-11-25); extends ADR-010/014's provider scope and removes manual Tavily keys.

**Context:** The developer wants Tavily authenticated by the OpenCode server and Exa added as a supported provider. OpenCode exposes Tavily as an environment/key connection and ships an Exa integration with `EXA_API_KEY`. Keeping a second Tavily key in Quota settings would duplicate the credential the plugin handoff is meant to remove.

**Decision:** Treat Tavily and Exa as OpenCode-backed bridge providers alongside OpenRouter, Go, Zen and OpenAI. The plugin resolves each declared id; for an `env` connection it reads only the named environment variable inside OpenCode, and for Tavily/Exa it falls back to `TAVILY_API_KEY`/`EXA_API_KEY` when the integration is absent. No manual Tavily or Exa key form is offered. The service stores custom connections only. Exa's adapter reads the Team Management credit balance with the resolved key; a regular search key is reported as an auth error because Exa exposes that balance only to a team service key.

**Alternatives rejected:** Keep Tavily keys in the extension service (duplicate secret, violates the handoff); have the service read OpenCode env/auth (unsafe and outside the plugin scope); show Exa search counts without a quota API (invented data).

**Consequences:** Existing development Tavily connections are ignored rather than deleted. The bridge now requires six unique provider entries. Exa credit data depends on a Team Management service key and the team feature; a normal `EXA_API_KEY` shows a named sign-in/credential error. Live Tavily/Exa acceptance remains unverified.

> Provisional — feature `002-opencode-credential-handoff`: six-provider acquisition is implemented and fixture-tested; live Tavily/Exa checks remain.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## ADR-016: Keep the settings UI framework-free

**Status:** Accepted (2026-11-25).

**Context:** The Quota settings page is a small extension-hosted iframe. The developer asked whether daisyUI or shadcn-vue would improve its appearance. The current UI is server-rendered HTML strings from a dependency-light TypeScript bundle; the settings bundle is loaded directly by the extension host.

**Decision:** Keep the vanilla TypeScript/CSS UI and improve it with the existing OpenChamber CSS custom properties. Use native controls, shared tokens, and small CSS-only states (`:hover`, `:focus-visible`, `:has`) rather than adding a component framework. Revisit only if the extension gains a build-time component pipeline and a second substantial surface.

**Alternatives rejected:** daisyUI requires Tailwind and a class-based build step; shadcn-vue requires Vue and a component build. Both would add runtime/build dependencies and a second styling system to a two-page extension for a modest visual gain.

**Consequences:** The settings page stays fast to load and consistent with the panel. Visual changes are limited to hand-written CSS, and contributors must follow the shared tokens instead of a component library's defaults.

## ADR-017: Hide unauthenticated providers and report problems in settings

**Status:** Accepted (2026-11-25); refines ADR-010/015's display boundary.

**Context:** A provider with no credential is not a quota source, and an invalid credential is not useful in the compact Quotas panel. Listing either as a normal provider makes the panel noisy and can expose an authentication failure where the user cannot act on it. The developer asked for authentication errors and setup guidance in Quota settings instead.

**Decision:** The Quotas panel lists only providers with an attempted credential that is not failing authentication. `unconfigured` and `not_configured` providers are never listed in the panel or in display settings. Authentication errors are omitted from the panel and shown in a provider status table inside Quota settings. That table lists only providers with an authentication attempt, its setup source, status, and any error message; a generic setup note explains that providers connect through OpenCode. A bridge that has never delivered a reading shows one restart notice rather than six provider rows.

**Alternatives rejected:** Showing unconfigured providers as disabled rows (not actionable and contradicts "never listed"); showing auth errors in the panel (the user cannot fix them there); hiding auth errors everywhere (no diagnosis path); listing every supported provider in settings (no-auth providers must not be listed).

**Consequences:** The panel and display selector no longer offer explicit selection of unconfigured providers; stale `explicitProviderSelections` remain harmless. Settings derives status from the existing snapshot, so no new wire field is needed. Provider rows and error text need to stay accessible in the settings table.

## ADR-018: Make the plugin coordinator lock provider-set-aware

**Status:** Accepted (2026-11-25); fixes the "plugin unavailable after approval" upgrade state.

**Context:** An OpenCode plugin instance takes a per-server coordinator lock so several plugin locations do not duplicate work. After the provider set changed from four to six, an older instance could keep a fresh lock while failing the new six-provider state validation, leaving the new instance unable to coordinate and the panel reporting the plugin as unavailable until OpenCode or OpenChamber restarted.

**Decision:** Store the provider ids in the lock file and validate them. A lock from a different provider set, or a legacy lock without a provider fingerprint, is taken over even when its heartbeat is fresh and its PID is alive. The old instance's token check prevents it from overwriting or deleting the replacement lock. The settings notice tells users to restart OpenCode or OpenChamber only when no bridge reading has arrived.

**Alternatives rejected:** Waiting for the 15-second stale timeout (the old instance keeps beating); lowering the heartbeat timeout (would allow duplicate coordinators); requiring a manual OpenCode restart after every provider change (poor upgrade path).

**Consequences:** Provider-set changes no longer strand the coordinator lock. Code-only changes with the same provider set still rely on OpenCode's normal plugin reload. Tests cover takeover of an old four-provider lock and a legacy lock without the fingerprint.

## ADR-019: Serialize quota coordinator takeover

**Decision:** Serialize lock-file mutation with a short-lived loopback listener keyed by the lock path. Refuse a second live compatible owner and check ownership before fetching or publishing. An incompatible legacy lock can still be replaced.

**Rationale:** Atomic file replacement alone cannot serialize competing claims; a kernel-held guard releases automatically if its process dies. An unavailable guard defers the attempt rather than allowing two owners.

## ADR-020: Disclose plugin access in Extensions settings

**Decision:** Use the host’s Extensions settings to disclose the service and full OpenCode access before approval. The plugin still reads only its six declared providers. The README need not duplicate the permission disclosure.

## ADR-021: Scope quota requirements to OpenCode providers

**Decision (2026-11-27):** Remove custom connections from the requirements, task list, and acceptance criteria. Retire US4/AC1, US4/AC3, and T088. This supersedes ADR-003 and ADR-007 as scope commitments; the existing implementation and stored data are untouched.

**Rationale:** The feature covers credentials managed by OpenCode. Keeping a separate custom-key acceptance track would test functionality outside that scope. Windows ACL verification still covers the local bridge token.
