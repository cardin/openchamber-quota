# Implementation Plan: OpenCode Credential Handoff

**Feature**: `002-opencode-credential-handoff` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

## Summary

Retain the separate Quotas UI for all six provider categories. An OpenCode plugin reads only OpenRouter, OpenCode Go, Zen and Codex credentials, fetches quota inside OpenCode and sends secret-free readings to the existing service. No Usage-area contribution or stored-key fallback. Refresh always means all providers: internal per-provider schedulers decide whether to fetch, return cache or join running work.

Settings and Tavily/custom connections are shared by clients of the same OpenChamber server. Replace browser-local preference authority with a server-owned versioned settings document. No migration of old development records is required because there are no external users yet; do not implement automatic wiping or an upgrade-reset mechanism. Supported state persists normally, and OpenCode logins are untouched. Stale quota remains explicitly historical, including after an old reset time.

## Technical Context

**Language/Version**: Existing TypeScript/Bun toolchain; Node-compatible service and bundled OpenCode plugin.

**Primary Dependencies**: Existing `@openchamber/sdk` 2.7.3, Ajv/ajv-formats and Playwright. T001 verifies plugin credential resolution, setup/cleanup, filesystem and option delivery on the actual supported OpenCode/OpenChamber baseline. No guessed credential API or runtime imports are treated as verified.

**Storage**: `OPENCHAMBER_SERVICE_DATA_DIR` owns supported `connections.json`, `display.json` and `cache.json`, preserved across normal startups/reloads. No storage epoch marker, automatic reset or authoritative host.storage selection. Nonsecret scheduler state is server-bound; descriptor discovery uses protected `<serverId>.json` files, not one shared global file. Tokens are never provider credentials.

**Testing**: Bun unit/contract/integration, TypeScript checks, four bundles, package guest check, Playwright accessibility and targeted live smoke checks. Tests use fixture credentials, never real tokens in logs.

**Target Platform**: Existing OpenChamber web/desktop extension baseline (2.8.0 verified previously, manifest minimum 2.7.3); local OpenCode/plugin/service topology. Remote plugin bridging remains unsupported. Package approval is all requested permissions together, not independent plugin approval. A failed plugin after approval does not disable the service.

**Project Type**: One extension package with status frame, settings frame, loopback service and OpenCode plugin.

**Performance Goals**: Healthy request discovery target: one-second poll plus local transport. Per-provider operation has a ten-second total budget after discovery, including sequential fallback endpoints; one-second publication allowance. Bridge request deadline twelve seconds; UI wait fifteen seconds. Controlled tests verify budgets. Cache-only cycles can finish earlier. Do not claim successful fresh reads during provider outages, rate limits or retry waits.

**Constraints**: No provider-filter refresh input. Complete four-provider bridge result for every cycle. One per-server/provider plugin scheduler for all triggers; manual requests do not bypass limits. Service independently limits Tavily/custom. Keep last successful sample and actual fetchedAt on reuse. HTTPS-only upstream calls, no redirects, 64 KiB bodies, scoped bridge token vs UI-service token. Use explicit server binding; never choose among multiple discovery entries arbitrarily.

**Scale/Scope**: Four built-in OpenCode categories plus configured Tavily and existing/newly permitted custom connections; custom setup remains hidden under ADR-007. Multiple UI clients on one server share settings; distinct servers remain isolated. Multiple plugin contexts on the same server must share one coordinator or fail closed, not double provider calls.

## Constitution Check

The constitution is an unfilled template; no project-specific ratified MUST gates are inferred from examples. Root AGENTS.md governs: preserve accepted ADR history, update approved requirements before implementation, keep intended vs implemented design explicit, test incrementally and reconcile living docs before feature-ending handoff. No full build/indexing is performed for this documentation update. Push/publish still needs explicit approval.

## Project Structure

### Documentation (this feature)

```text
specs/002-opencode-credential-handoff/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/plugin-bridge.md
  quickstart.md
  tasks.md
  reconciliation.md
  checklists/requirements.md
```

### Source Code (repository root, intended)

```text
package.json                         # plugin contribution and fourth bundle; no quota role
src/core/
  bridge.ts                          # ids and timing constants
  bridge-path.ts                     # protected server-specific discovery paths
  http-error.ts                      # transport-independent error/types
  labels.ts
  types.ts                           # existing usage schema plus separate settings types
  snapshot-merge.ts                   # complete cycles, last-success and historical state
src/opencode-plugin/
  index.ts                           # all-trigger scheduler, coordinator and teardown
  credentials.ts                     # selected four credentials; Zen org mapping
  fetch.ts                           # complete four-entry cached/fresh/error result
  http.ts                            # fetch-based transport; cycle abort signal
  bridge.ts                          # bound server discovery, request acknowledgement
  index.js                           # built, self-contained plugin
src/service/
  main.ts                            # load/preserve state, server identity, owned descriptor
  bridge.ts                          # request admission/join, deadlines, result validation
  bridge-descriptor.ts               # atomic write and ownership-checked cleanup
  settings.ts                        # shared display document and conflict-safe patch
  scheduler.ts                       # service-owned Tavily/custom scheduling
  snapshot.ts                        # merged snapshot and cache
  routes.ts                          # all-provider refresh, settings and bridge endpoints
  credentials.ts                     # post-upgrade Tavily/custom only
  http.ts                            # service transport, shared error re-export
src/providers/                       # shared adapters; Codex no CLI auth fallback
src/section/
  main.ts                            # all-provider refresh, shared settings reload
  preferences.ts                     # pure selection ops, revisioned service persistence
  refresh.ts                         # explicit fifteen-second wait
  view/window.ts                     # unconfigured and expired historical sample rendering
  view/selector.ts
  view/connections.ts
src/settings/main.ts                 # shared field patches, no instance-local authority
tests/contract/                      # bridge, all-provider refresh, settings/persistence contracts
tests/unit/                          # selection, deadlines, coordinator, HTTP, stale windows
tests/integration/                   # all-six display, two-client shared state, plugin failure
tests/a11y/accessibility.pw.ts
```

**Structure Decision**: Reuse the existing section/service and adapters. Separate pure errors from node:https so the plugin supplies its own fetch-based transport. New settings storage is server-owned; the old local preference key is no longer read, but no migration or automatic deletion is implemented.

## Phase 0: Research Summary

[research.md](research.md) records user-approved decisions and unresolved feasibility evidence distinctly. T001 verifies scoped integration credential resolution and plugin capabilities without exposing secrets. It also verifies how to bind a plugin to an OpenChamber server and prevent duplicate location plugin instances. Stop implementation if the baseline cannot support these contracts.

## Phase 1: Design Summary

- [data-model.md](data-model.md): canonical field constraints, server sharing, full refresh cycles, fixed deadlines and historical samples.
- [contracts/plugin-bridge.md](contracts/plugin-bridge.md): authentication, complete response/acknowledgement, settings patches and pre-release compatibility scope.
- [quickstart.md](quickstart.md): targeted verification scenarios; not evidence that they already pass.

## Implementation Outline

1. Prove plugin feasibility, scoped credentials, server binding and single-coordinator ownership.
2. Update approved living docs, introduce preserved server-owned settings and separate discovery files per server; omit legacy migration and automatic reset machinery.
3. Implement request ids, all-provider admission/coalescing, ten-second abortable fetch budget and complete result publication. Cache results acknowledge the cycle without updating sample age.
4. Use one authoritative scheduler for every plugin trigger and service schedulers for Tavily/custom. Persist only nonsecret scheduling times.
5. Correct Zen's secret.accountId mapping, implement first-success window initialization and explicit pre-data choices, and render stale expired samples as historical.
6. Test settings concurrency/persistence, full result validation, timer/manual collisions, deadline boundaries, server-safe cleanup and credential secrecy. Run live checks only after automated gates; reconcile with actual outcome.

## Post-Design Constitution Check

No ratified constitution conflict. User-approved changes supersede ADR-006's instance isolation through ADR-011; refresh changes are ADR-012 and the no-migration/no-automatic-wipe clarification is ADR-013. Implementation is still pending. Reconciliation is partial, not complete; no spec deletion, commit or MR publication is authorized by these edits.

## Complexity Tracking

Shared settings need revisioned writes and bridge discovery still needs server identity. Sharing clients' preferences does not authorize merging unrelated servers' data. Pre-release compatibility can break without adding an automated destructive upgrade path.
