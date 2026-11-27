# Quickstart validation: OpenCode Credential Handoff

This is a run guide for the implemented feature, not current passing evidence.

## Prerequisites

Use the installed Bun/TypeScript tooling and the OpenChamber/OpenCode baseline from T001. Review the permissions in OpenChamber’s Extensions settings before approving the package. Use disposable extension data; never reset OpenCode credential storage.

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

1. **Six providers in Quotas:** sign in through OpenCode, hide the built-in Usage area, and verify the six providers appear and update without extra keys.
2. **All-provider refresh:** use the single Quotas refresh control. Provider-filter requests must return 400. Request twice concurrently and verify the same cycle id. A provider inside its minimum returns cache with unchanged fetchedAt; an eligible provider fetches; both acknowledge the cycle.
3. **Timing:** controlled clock/transport fixtures verify one-second discovery, ten-second provider operation including sequential fallbacks, one-second publication allowance, twelve-second service completion/timeout and fifteen-second UI wait. A timer/manual collision shares in-flight work; `retryAt` cannot be bypassed. Do not interpret an outage's cached result as fresh data.
4. **Complete payload:** remove, duplicate or add a provider in a fixture bridge result: reject the whole payload. Valid results contain all six, fresh or cached/missing/error. A stale request id cannot clear a newer request or replace newer samples.
5. **Missing then configured:** encounter an unavailable provider before its first reading. Once it succeeds, default windows appear once. Explicitly hide it, or save an empty window list before data arrives, and verify that choice remains after success.
6. **Expired credentials vs missing plugin:** a provider 401/403 shows a named sign-in error in Quota settings and omits the provider from Quotas. Plugin failure preserves eligible historical samples with a notice. Package rejection shows approval required.
7. **Expired historical windows:** move time past a cached resetAt with the bridge unavailable. Show the historical value and age, no invented next reset, no live even-use marker and no endless refreshing. Reconnect and verify a fresh sample clears the notice.
8. **Shared server settings:** open two clients of one OpenChamber server. Change Remaining/Used, providers and windows; the other reflects the same settings within five seconds. Simultaneous edits to different fields survive revision conflict/retry. A saved empty selection remains empty. Different servers do not share settings accidentally.
9. **Discovery ownership:** start two distinct server fixtures and verify distinct `<serverId>.json` files. Stop one; the other remains. Replace a descriptor with a new token then stop the old process; it must not delete the replacement. With several entries and no selector, the plugin refuses ambiguous binding. Multiple plugin contexts for one server do not double requests.
10. **Normal persistence:** restart or reload and verify saved settings and cached quota survive without changing OpenCode logins.
11. **Secret scope:** verify provider credentials stay out of descriptors, payloads, logs, cache, settings and UI. The bridge token is allowed only in its protected file and authenticated requests.
12. **Settings/permissions:** Extensions settings discloses service and full plugin access together. Quota settings offers no provider key forms. Code/folder-only updates do not prompt again.

## Model/contract references

See [data-model.md](data-model.md) for exact fields and [plugin-bridge.md](contracts/plugin-bridge.md) for endpoints and deadlines. Readings use the canonical usage JSON schema. Server settings use the new revisioned service contract, not the retired browser preference key.

## Expected limitations

Remote OpenCode cannot use a local descriptor. Inspect the inherited Windows ACLs of a disposable bridge directory and descriptor without exposing the token. New provider/window discovery respects explicit choices, and refresh does not bypass rate limits.
