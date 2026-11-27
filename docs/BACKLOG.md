# Backlog

Follow-ups from the Session Panel quota feature. These are not completed acceptance checks.

- **Live plugin load ([REQ 2](REQUIREMENTS.md#req-2), ADR-010):** Load the built plugin in a real OpenChamber-managed OpenCode baseline, confirm the managed-config delivery state, one coordinator across multiple plugin locations, and a complete live six-provider cycle. Automated loop tests use fixtures only.
- **Zen organization id ([REQ 2](REQUIREMENTS.md#req-2)):** Zen resolves `orgID` before `accountId` in code and maps it to `secret.accountId`, but no live Zen credential was available to confirm the stored field name. Verify with a live account.
- **OpenAI ChatGPT sign-in ([REQ 2](REQUIREMENTS.md#req-2)):** Adapter requires the OpenCode OAuth token and account id and sends `ChatGPT-Account-Id`; verify against a live account. API-key-only OpenAI accounts remain explicitly unsupported.
- **Tavily and Exa live credentials ([REQ 2](REQUIREMENTS.md#req-2), ADR-015):** Verify OpenCode `active("tavily")`/`active("exa")` and environment fallbacks, and confirm Tavily usage. Exa credits need a Team Management service key; verify the named error for a normal search key.
- **Windows:** Verify the effective ACLs on the bridge directory and token-bearing descriptor. POSIX 0700/0600 is tested; Windows ACLs are not.
- **Remote OpenCode ([REQ 2](REQUIREMENTS.md#req-2)):** A local descriptor cannot cross hosts. The unsupported topology and its bridge-unavailable notice need a live check.
- **Coverage limits:** Check other host themes and higher zoom levels as needed. Provider-specific request limits beyond documented adapter defaults have not been verified.
