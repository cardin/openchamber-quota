# Partial reconciliation: OpenCode Credential Handoff

## Gate and approvals

**Outcome: partial.** Phase 9 and Phase 10 corrections pass automated checks and the isolated OpenCode 2.4.2 smoke in [TESTPLAN](../../docs/TESTPLAN.md). OpenChamber-managed delivery, real-account quota reads, and Windows ACLs remain unverified.

The developer approved server-shared settings, all-provider refresh with cache/rate decisions, approximately one-second discovery/ten-second fetching, scheduler coalescing, Zen mapping, package approval correction, first-success selection, expired historical rendering and field citations. ADR-014 records the verified OpenAI/Zen credential source. The developer extended the scope to Tavily and Exa through OpenCode (ADR-015), confirmed five-minute polling with a 30-second manual floor and failure backoff, and asked for the compact hover/collapsed UI plus a framework-free settings restyle (ADR-016). A later review moved authentication errors into a settings status table, hid unconfigured providers everywhere, added applicable-only collapsed modes, and required the coordinator lock to survive provider-set upgrades (ADR-017/018). No unapproved intent change was found in the diff.

Shared settings and cache persist normally. Old client-local preferences are not migrated or automatically deleted. [ADR-021](../../docs/ADR.md#adr-021-scope-quota-requirements-to-opencode-providers) removes custom connections from current acceptance scope. T068, T069 and T088 are retired.

## Disposition manifest and merge ledger

| Artifact/section | Disposition | Classification |
| --- | --- | --- |
| spec.md#functional-requirements | Merged to docs/REQUIREMENTS.md REQ 1/2/4 with provisional markers. FR-001..FR-015, FR-017 and FR-018 have implementation and automated evidence; FR-013/FR-014 live topology and FR-018 live timing remain unverified. | Normative, user-approved |
| spec.md#user-scenarios--testing | Retained as acceptance scenarios; automated checks summarized in docs/TESTPLAN.md. Live scenarios 1, 6, 7, 8, 9 and 12 remain TODO. | Verification |
| spec.md#success-criteria | SC-001..SC-012 mapped to automated checks in docs/TESTPLAN.md; live provider and host outcomes remain unverified. | Normative, user-approved |
| spec.md#assumptions | ADR-010/011/012/013/014/015/016/017/018 capture the stable choices. T001 verified the V2 API, credential shapes and sole-descriptor binding on OpenCode 2.4.1; a live plugin load remains. | Mixed |
| plan.md#summary--technical-context | Implemented architecture merged to docs/DESIGN.md. Source layout matches the plan; timing and coordinator details are recorded there. | Descriptive |
| research.md#plugin-only-quota-acquisition | ADR-010 retained; T001 findings and remaining live gaps recorded in research.md and TESTPLAN.md. | Decision + verified/unverified evidence |
| research.md#all-provider-cycle-with-per-provider-scheduling | ADR-012 accepted; wire/deadline design merged to docs/INTERFACES.md and tested with fixtures. | Normative, user-approved |
| research.md#server-shared-settings-and-safe-discovery | ADR-011 accepted; display.json, revision patches, descriptor files and server lock implemented and tested. | Normative + verified implementation |
| research.md#historical-display-and-pre-release-compatibility | REQ 1/2, ADR-012/013 and TESTPLAN; supported-state persistence, no automatic wipe or migration requirement. | Normative, user-approved |
| research.md#T001-feasibility-findings | Merged to ADR-014, DESIGN.md, INTERFACES.md and TESTPLAN.md as verified baseline plus open live gaps. | Evidence |
| data-model.md | Durable settings/bridge/snapshot constraints merged to docs/INTERFACES.md; the six-provider bridge ids, Tavily/Exa credential rows and five-minute timing are included. Exact field constraints remain canonical here until the feature completes. | Normative, provisional |
| contracts/plugin-bridge.md | Refresh/settings/complete-result/auth/discovery contract merged to docs/INTERFACES.md; automated contract checks pass. | Normative, provisional |
| quickstart.md | Automated and loopback scenarios recorded in docs/TESTPLAN.md. Live OpenCode/OpenAI/Zen/Windows scenarios remain unrun. | Verification |
| tasks.md | Retain execution history for the MR description. T088 is retired by ADR-021; T089–T098 added and closed by the 2026-11-28 convergence pass; T080 remains open for live acceptance, including the Windows bridge ACL. | Working record |
| checklists/requirements.md | Retained; completion/coverage claims are not substituted for live test results. | Verification |
| reconciliation.md | Retained as the partial merge ledger; final disposition belongs in the feature-ending MR after approval. | Change record |

## Implementation evidence (2026-11-25)

- `bun run typecheck`, 221 Bun tests and 7 Playwright accessibility checks pass.
- Four bundles build; `openchamber-guest-check .` accepts the package.
- The built plugin loads from a folder with no installed packages, default-exports `{ id, setup }`, imports only runtime builtins and contains no `node:https`.
- Loopback service smoke: descriptor publish/cleanup, route-group token isolation, all-provider admission, complete six-entry bridge acknowledgement, settings revision, `/quota` absence.
- Automated checks cover full/partial/missing/duplicate bridge payloads, obsolete request ids, cached acknowledgement, timeout retention, shared timing budgets, scheduler minimum/retryAt, first-success selection, secret redaction, historical expiry, applicable collapsed modes, provider-status visibility and provider-set lock takeover.

## Implementation evidence (2026-11-28)

- `bun run typecheck`, 250 Bun tests, 10 Playwright checks, four bundles and the guest check pass.
- New fixtures cover immediate schedule persistence across reload, 503 `Retry-After`, provider-aligned autonomous polls, restored-history labeling, error-only window initialization, auth-to-connectivity transitions, hidden-window collapsed choices, descriptor-lock serialization, transient settings recovery and two connected settings clients.

## Remaining gates

- Live OpenCode plugin load and managed-config delivery on the supported OpenChamber baseline.
- Live upgrade from a running four-provider plugin build to the six-provider build, confirming coordinator-lock takeover without an OpenCode restart.
- Live six-provider cycle; Zen `orgID` and OpenAI account-id behavior with real accounts.
- Live Tavily `integration.connection.active("tavily")`/environment resolution and usage; live Exa team credit access with a Team Management service key, including the named error for a normal search key.
- Windows ACL inspection of the bridge directory and descriptor, remote-OpenCode unsupported topology, and a live two-client settings check.
- No complete reconciliation until these checks pass; no MR is opened by this update.
