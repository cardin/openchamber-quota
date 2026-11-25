# Partial reconciliation: OpenCode Credential Handoff

## Gate and approvals

**Outcome: partial.** No implementation or new test evidence exists. The developer approved server-shared settings, all-provider refresh with cache/rate decisions, approximately one-second discovery/ten-second fetching, scheduler coalescing, Zen mapping, package approval correction, first-success selection, expired historical rendering and field citations. The latest clarification removes automatic wiping: no external users means old development formats need no backward compatibility, not a requirement to clear data. Approved intent is reflected in living docs before implementation. No spec deletion, runtime cleanup, commit or publication occurs here.

Supported Tavily/custom connections, shared settings and cache persist normally. Old client-local preferences are not migrated or automatically deleted. Any developer-data cleanup is a separate manual action. T068/T069 are retired; UpgradeState and upgrade.ts are removed from the plan. ADR-013 supersedes ADR-012's earlier wipe clause while retaining decision history. This partial ledger replaces no other feature's markers.

## Disposition manifest and merge ledger

| Artifact/section | Disposition | Classification |
| --- | --- | --- |
| spec.md#functional-requirements | Approved stale/approval/refresh/persistence/settings intent merged to docs/REQUIREMENTS.md REQ 1/2/4 with feature markers; remaining implementation-specific acceptance retained here until checked | Normative, user-approved |
| spec.md#user-scenarios--testing | Retained as acceptance scenarios; intended checks summarized in docs/TESTPLAN.md, not recorded as passes | Verification |
| spec.md#success-criteria | Retained until verified; timing/concurrency/secrecy targets reflected in docs/TESTPLAN.md | Normative, user-approved |
| spec.md#assumptions | Stable product choices reflected in ADR-011/012; baseline feasibility remains unverified | Mixed |
| plan.md#summary--technical-context | Intended architecture merged to docs/DESIGN.md; source layout/implementation outline retained as working proposal | Descriptive |
| research.md#plugin-only-quota-acquisition | ADR-010 retained; feasibility/API/version evidence explicitly unresolved behind T001 | Decision + unverified implementation |
| research.md#server-shared-settings-and-safe-discovery | ADR-011 accepted at the user's decision; concrete binding capability retained as T001 gate | Normative + unverified implementation |
| research.md#all-provider-cycle-with-per-provider-scheduling | ADR-012 accepted; wire/deadline design merged as provisional INTERFACES content | Normative, user-approved |
| research.md#historical-display-and-pre-release-compatibility | REQ 1/2, ADR-012/013 and TESTPLAN; supported-state persistence, no automatic wipe or migration requirement | Normative, user-approved |
| data-model.md | Intended durable settings/bridge/snapshot constraints summarized in docs/INTERFACES.md; exact feature entities retained until schema/code checks | Normative, provisional |
| contracts/plugin-bridge.md | Intended refresh/settings/complete-result/auth/discovery contract in docs/INTERFACES.md; detailed proposal retained | Normative, provisional |
| quickstart.md | Retained as unrun validation guide; verified operational steps will merge to README/test evidence at completion | Verification |
| tasks.md | Retained while executing; eventual execution history discarded/linked as MR evidence at completion | Working record |
| checklists/requirements.md | Retained; completion/coverage claims not substituted for test results | Verification |
| reconciliation.md | Retained as partial merge ledger; final disposition belongs in feature-ending MR after approval | Change record |

## Remaining gates

T001 must verify plugin credentials, version, server selection and coordinator lifecycle on the supported baseline. All implementation tasks remain unchecked. No complete reconciliation until acceptance/tests pass; no MR is opened by this update.
