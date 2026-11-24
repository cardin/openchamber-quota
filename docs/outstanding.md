# Outstanding

Follow-ups from the Session Panel quota feature. These are not completed acceptance checks.

- **Codex and OpenCode Zen (T047, T067; [REQ 2](REQUIREMENTS.md#req-2)):** Evaluate OAuth, including Console token refresh and organization metadata for Zen. Verify both providers with live accounts before re-enabling setup ([ADR-008](ADR.md#adr-008-defer-codex-and-zen-setup-investigate-oauth-logins)).
- **Custom providers (T068; [REQ 5](REQUIREMENTS.md#req-5)):** Verify setup end to end against a live HTTPS endpoint before re-enabling it ([ADR-007](ADR.md#adr-007-hide-custom-provider-setup-until-it-can-be-verified)). First resolve the schema/parser mismatch and decide whether private endpoints need an explicit opt-in.
- **Windows:** Verify effective permissions on the service data directory and `connections.json`.
- **Coverage limits:** Check other host themes and higher zoom levels as needed. Provider-specific request limits beyond Tavily have not been verified; other adapters use local defaults.
