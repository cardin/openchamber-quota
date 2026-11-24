# Architecture Decisions

> Provisional — feature `001-session-panel-quota`: provider coverage and final acceptance remain subject to live custom, Codex, and Zen checks.
> See `specs/001-session-panel-quota/spec.md`.
<!-- provisional:feature=001-session-panel-quota -->

## ADR-001: Use a Work Status section and a Pages settings page

**Status:** Accepted (2026-11-23)

**Context:** OpenChamber exposes extension status sections and full-screen pages. The quota UI must appear beside the chat, not in the right rail, and configuration needs a durable home.

**Decision:** Contribute a `statusSection` titled **Quotas** for display and a `page` titled **Quota settings** under the sidebar's **Pages** entry. The status section stays display-only.

**Alternatives rejected:** A rail tab (wrong surface); extending the built-in Usage card (host-owned); a native host panel (requires changing OpenChamber).

## ADR-002: Own provider I/O in a local guest service

**Status:** Accepted (2026-11-23)

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

**Consequences:** Tavily and OpenCode Go have provider-specific reset and precision rules. Live custom, Codex, and Zen acceptance remain verification items.

## ADR-006: Keep selection and display preferences instance-scoped

**Status:** Accepted (2026-11-23)

**Context:** Users need stable choices across sessions and restarts, but instances must not share selections. Providers and window types appear over time.

**Decision:** Store `quota.display.v1` in `host.storage`. First use shows every configured provider and its windows; an explicitly saved empty selection stays empty. A newly added provider is enabled with its current windows; a newly reported window type stays opt-in. Remaining is the default display mode; Used is a persisted presentation choice. Non-reporting balances are shown unless the user hides them per provider.

**Alternatives rejected:** Host-owned preferences (not exposed to guests); per-session preferences (lose choices); auto-enabling every new window type (unexpected rows).
