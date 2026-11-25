# Quickstart validation: OpenCode Credential Handoff

This is a run guide for the implemented feature, not current passing evidence.

## Prerequisites

Use the repository's installed Bun/TypeScript tooling, verified OpenChamber web/desktop baseline and the plugin-capable OpenCode baseline established in T001. Read the README permission disclosures before approving the whole package. Use disposable extension data for persistence/discovery tests; never reset OpenCode credential storage. No automatic upgrade-reset scenario is required.

## Automated checks

```bash
bun run typecheck
bun test
bun run build
openchamber-guest-check .
bun run test:a11y
```

Expected four bundles, no quota-role contribution, and all implemented contract/unit/integration/accessibility checks passing. Target small related test groups before the final full gates.

## Scenarios

1. **All quota sources in Quotas:** with the four OpenCode logins and configured Tavily/custom, show all sources in Quotas; hide the built-in Usage area and confirm automatic updates. No extension item is added to Usage and no extra key is entered for the four.
2. **All-provider refresh:** use the single Quotas refresh control. Provider-filter requests must return 400. Request twice concurrently and verify the same cycle id. A provider inside its minimum returns cache with unchanged fetchedAt; an eligible provider fetches; both acknowledge the cycle.
3. **Timing:** controlled clock/transport fixtures verify one-second discovery, ten-second provider operation including sequential fallbacks, one-second publication allowance, twelve-second service completion/timeout and fifteen-second UI wait. A timer/manual collision shares in-flight work; `retryAt` cannot be bypassed. Do not interpret an outage's cached result as fresh data.
4. **Complete payload:** remove, duplicate or add a provider in a fixture bridge result: reject the whole payload. Valid results contain all four, fresh or cached/missing/error. A stale request id cannot clear a newer request or replace newer samples.
5. **Missing then configured:** encounter an unavailable provider before its first reading. Once it succeeds, default windows appear once. Explicitly hide it, or save an empty window list before data arrives, and verify that choice remains after success.
6. **Expired credentials vs missing plugin:** a provider 401/403 shows a named sign-in error, not zero quota. Plugin failure after package approval preserves historical last-success bars with an out-of-date notice; no history shows notice alone. Package rejection instead says approval required and does not promise Tavily/custom refresh.
7. **Expired historical windows:** move time past a cached resetAt with the bridge unavailable. Show the historical value and age, no invented next reset, no live even-use marker and no endless refreshing. Reconnect and verify a fresh sample clears the notice.
8. **Shared server settings:** open two clients of one OpenChamber server. Change Remaining/Used, providers and windows; the other reflects the same settings within five seconds. Simultaneous edits to different fields survive revision conflict/retry. A saved empty selection remains empty. Different servers do not share settings accidentally.
9. **Discovery ownership:** start two distinct server fixtures and verify distinct `<serverId>.json` files. Stop one; the other remains. Replace a descriptor with a new token then stop the old process; it must not delete the replacement. With several entries and no selector, the plugin refuses ambiguous binding. Multiple plugin contexts for one server do not double requests.
10. **Normal persistence:** configure supported Tavily/custom keys, shared settings and cached usage. Restart/reload and verify they survive with OpenCode logins unchanged and no automatic wipe. Old development formats need no migration tests; any manual developer cleanup is outside this feature.
11. **Secret scope:** the four OpenCode credential sentinels must be absent from descriptor, payload, logs, usage cache, settings and rendered UI. New Tavily/custom keys may exist only in their intended `connections.json`; no key is returned/logged. Protected descriptor token is allowed in its file/authenticated request only. Do not print real secrets for this check.
12. **Settings/permissions:** the package requests service and plugin together; no independent plugin rejection is offered. Four-provider key forms are absent. Current Tavily and existing custom connection controls retain normal behavior. Code/folder-only plugin updates are not expected to prompt again.

## Model/contract references

See [data-model.md](data-model.md) for exact fields and [plugin-bridge.md](contracts/plugin-bridge.md) for endpoints and deadlines. Readings use the canonical usage JSON schema. Server settings use the new revisioned service contract, not the retired browser preference key.

## Expected limitations

Plugin implementation/API/server binding remain T001 gates. Remote OpenCode cannot use a local descriptor directly. Inherited Windows ACLs must be inspected on a disposable file without exposing tokens. Custom setup stays hidden until separately verified. New provider/window discovery respects explicit choices; an all-provider refresh does not force rate-limited upstream calls.
