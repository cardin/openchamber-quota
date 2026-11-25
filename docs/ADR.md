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

**Status:** Accepted (2026-11-23)

**Decision:** Provider adapters convert each API into the common snapshot:

- **Tavily:** plan, key, and PAYG limits become monthly windows reset at 00:00 UTC on the first; PAYG usage without a limit becomes a balance; key usage without a limit is hidden.
- **OpenRouter:** a limited key becomes a window; an unlimited key becomes a spend balance.
- **OpenCode Go:** prefer precise Console used/limit meters; fall back to whole-percent usage from the Go API. This matches the built-in Usage percentages.
- **Codex:** import the Codex CLI login from `~/.codex/auth.json` on user action; no OAuth flow or OpenAI API-key quota path.
- **OpenCode Zen:** use Console usage and budget endpoints; an unaccepted key is an auth error rather than invented data.

**Consequences:** Tavily and OpenCode Go have provider-specific reset and precision rules. Codex and Zen setup is hidden while OAuth support and live acceptance remain future work. The reference quota implementation uses a Console OAuth token and different billing routes for Zen; the current API-key/route path is unverified.

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

**Status:** Accepted (2026-11-24)

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

**Status:** Accepted (2026-11-25)

**Context:** ADR-009's quota-provider role only hands credentials while one of OpenChamber's own usage readouts is visible. The extension's Quotas section must stay current when the built-in Usage area is hidden, and it must not keep a second copy of the four providers' credentials. The Quotas section is also the extension's own UI, so it can show all six providers without adding a duplicate row to OpenChamber's Usage area.

**Decision:** Do not declare OpenChamber's quota-provider role. Ship an OpenCode plugin as part of the extension. The plugin uses only OpenRouter, OpenCode Go, Zen and Codex credentials inside OpenCode, fetches quota there and sends readings only to the service. The service never receives these four credentials; current Tavily/custom keys stay service-owned. Quotas is the only extension display, independent of Usage visibility. Package approval includes service and full-access plugin permissions together.

**Alternatives rejected:** The quota-provider role with the four providers (requires the Usage area visible, adds a duplicate row, hands credentials to the service); a stored-key fallback (duplicates the secret this work removes); service-side store reads (ADR-002/009); manual refresh only (does not keep the four current while Usage is hidden).

**Consequences:** Full-access plugin execution is trusted to obey the four-provider limit; it is not host-enforced. After approval, plugin load/connectivity failure leaves historical quota with a notice and Tavily/custom usable. Package rejection or withdrawal blocks service operation instead. Code/folder-only updates do not promise reapproval; new permissions do. Remote bridging remains unsupported. ADR-011 defines shared settings, ADR-012 defines refresh budgets, and ADR-013 clarifies pre-release compatibility without automatic wiping. This supersedes ADR-009 for credential sourcing; the local service and secret-free snapshot stand. Implementation remains pending.

> Provisional — feature `002-opencode-credential-handoff`: plugin acquisition and actual baseline behavior remain unverified.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## ADR-011: Share Quota settings per OpenChamber server

**Status:** Accepted (2026-11-25); supersedes ADR-006's instance-specific storage scope.

**Context:** The developer wants all clients of one OpenChamber server to use the same Quota settings, not independent selections.

**Decision:** Keep one authoritative server-owned settings document and connection store. Clients apply field changes through the service with revision/conflict handling. Preserve explicit choices, and distinguish provider encounter from first successful window initialization. Separate servers remain distinct; their plugin discovery must not overwrite or ambiguously select another server.

**Alternatives rejected:** Browser instance storage (competing settings); one global descriptor per user (cross-server collisions); defaulting windows on first unavailable entry (permanently empty selections); overriding an explicit hide when data arrives.

> Provisional — feature `002-opencode-credential-handoff`: settings persistence, concurrent editing and server-safe discovery are not implemented yet.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## ADR-012: Refresh all providers through bounded, cache-aware cycles

**Status:** Accepted (2026-11-25); the automatic legacy-wipe clause is superseded by [ADR-013](#adr-013-no-pre-release-migration-obligation-or-automatic-wipe). Refresh and historical-display decisions stand. The original decision below is retained as history, not the current wiping contract.

**Context:** The developer wants one refresh covering all providers, approximately one-second request discovery and ten-second fetch completion. This pre-release upgrade may break the only existing user, the developer.

**Decision:** All triggers share each provider's internal scheduler; rate/retry limits decide fetch, cache or joining running work. Every bridge cycle returns all four entries and acknowledges even cached/error results. Separate discovery, total operation and publication budgets. Historical samples remain visible with age after expiry, without live estimates. Wipe old extension state once instead of migration; never wipe OpenCode logins, and preserve newly configured keys/settings thereafter.

**Alternatives rejected:** Provider-targeted refresh (not desired); manual rate-limit bypass and parallel timer/request loops (duplicate calls); per-endpoint renewed timeouts (unbounded completion); endless refreshing for expired cached windows (misleading); legacy credential migration/backups (rejected).

> Provisional — feature `002-opencode-credential-handoff`: scheduling, timing and historical-render verification are pending; the reset clause is superseded by ADR-013.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->

## ADR-013: No pre-release migration obligation or automatic wipe

**Status:** Accepted (2026-11-25); supersedes ADR-012's automatic legacy-wipe clause.

**Context:** The developer clarified that no one else uses the extension yet. The earlier legacy comment removed the need for backward compatibility; it did not request automatic data-clearing behavior.

**Decision:** Do not build legacy migration or an automatic upgrade-reset mechanism. Preserve supported connections, settings and cache during normal operation. Incompatible development data may be manually cleared in a separate developer action, never automatically as part of this feature. OpenCode logins remain untouched.

**Alternatives rejected:** A storage-epoch wipe on startup/upgrade (unrequested destructive behavior); migration of old development formats (no users require it).

> Provisional — feature `002-opencode-credential-handoff`: supported-state persistence and absence of automatic clearing remain to be verified.
> See `specs/002-opencode-credential-handoff/spec.md`.
<!-- provisional:feature=002-opencode-credential-handoff -->
