# Reconciliation

**Outcome:** `complete` (2026-11-25).

**Gate and approval:** At `7d4757d`, typecheck, 107 Bun tests, 4 Playwright accessibility tests, all three bundles, manifest entry checks, and the bundled service smoke test passed. The recorded OpenChamber 2.8.0 host checks, quickstart (T053), and live Tavily/OpenRouter/OpenCode Go API-key results still stand. The OpenCode Go 5-hour fallback has fixture evidence. Codex, Zen, and Custom setup is deferred by approved decisions ADR-007 and ADR-008. The owner reviewed that gap and the [outstanding work](../../docs/outstanding.md), and on 2026-11-25 directed that the feature close with the deferrals recorded rather than held open. This is the human decision the skill requires for SC-004; it does not relabel the deferred live checks as verified. No requirement, schema, or code changed in this reconciliation.

## Disposition manifest

| Source | Disposition | Class |
| --- | --- | --- |
| `spec.md` — clarifications, assumptions, decisions | ADR-001–008 record the accepted decisions, including trust and provider deferrals. Design describes the refresh control, timing, empty states, and bar colours. | Descriptive; no new decision |
| `spec.md` — US1–US3, FR-001–003/005/007/009–015, SC-001–003/006–011 | REQ 1/3/4 are canonical. Design and Interfaces describe behaviour; Test Plan maps acceptance checks and host evidence. | Existing normative content; evidence |
| `spec.md` — US4, FR-004/006/008, SC-004/005 | REQ 2/5 and ADR-003/007/008 remain canonical. Hidden setup and retained connections are documented. Full live verification stays in outstanding work under the owner's closure decision. | Existing normative content; accepted deferral |
| `spec.md` — entities and edge cases | Interfaces and canonical schemas cover the model; Design describes the display and refresh states. | Existing contract; descriptive |
| `plan.md` — summary, technical context, structure, decisions, risks | Merged to Design/ADR; outstanding risks to `docs/outstanding.md`. Scaffold paths and phased planning checks have no durable destination. | Descriptive; discard |
| `research.md` — surface, data path, adapters, trust, normalization | Design, Interfaces, and ADR-001–006 carry durable findings. The research note about private destinations requiring opt-in is not in the living contract or implementation; do not promote it as a requirement. | Descriptive; discarded working detail |
| `research.md` — unknowns | Remaining live-provider, Windows ACL, rate-limit, and coverage questions are in `docs/outstanding.md`. Probe log stays historical. | Evidence; follow-ups |
| `data-model.md` — connections, snapshot, preferences, state | Interfaces and `docs/contracts/` are canonical. The Tavily migration rule was added to Interfaces; speculative shape details are not carried forward. | Existing contract; descriptive |
| `contracts/service-api.md` | Interfaces and `tests/contract/service-api.test.ts` supersede stale draft detail; connection endpoint metadata is distinct from snapshot data. | Existing contract; descriptive |
| `contracts/custom-provider-v1.md` | Interfaces record verified request details; `docs/contracts/custom-provider-v1.schema.json` governs fields. The draft says to ignore unknown fields and the adapter does so, while the canonical schema rejects them. The parser-conformance gap is recorded in outstanding work; no contract change inferred. | Contract retained; gap recorded |
| `tasks.md` | T047, T067, and T068 are carried into `docs/outstanding.md` with their IDs. Completed tasks are execution history and are discarded with the spec. | Follow-ups; discard |
| `quickstart.md` | Root README covers installation and setup; Test Plan carries the reusable host smoke steps. T053 passed. | Descriptive; discard |
| `checklists/requirements.md` | Planning-readiness checklist, not implementation evidence; Test Plan carries verification mapping. | Discard |
| `verification.md` | Test Plan preserves baseline, evidence summary, and accessibility measurements. Deferred live checks and the fixture-only Go fallback are recorded there and in outstanding work. | Evidence; summarized into Test Plan |
| `reconciliation.md` | This ledger and manifest move to the close-out commit record; the spec folder is deleted in the following commit. | Retained in commit history |
| Changes after original spec | Key visibility and accessibility are recorded in Design/Test Plan; TLS removal in ADR-004 and Interfaces; the Go per-window fallback in Design/Test Plan. | Existing decisions; descriptive evidence |

## Unresolved and unverified

- **Deferred live checks:** Codex and Zen OAuth/live checks (T047, T067) and live Custom verification (T068) remain in [outstanding work](../../docs/outstanding.md). They are accepted follow-ups under the owner's closure decision, not completed coverage.
- **Contract:** The Custom parser accepts inputs the canonical schema rejects, including unknown fields. Also unresolved: whether private destinations need an explicit opt-in.
- **Verification:** The OpenCode Go fallback is fixture-tested only; Windows ACLs, broader theme coverage, higher zoom levels, and provider request limits beyond Tavily are unverified.

## Closure

The provisional markers were finalized in `docs/ADR.md`, `docs/DESIGN.md`, `docs/INTERFACES.md`, and `docs/TESTPLAN.md`. Inbound links were retargeted to the living docs and outstanding work. No tracker was selected in the README, so no tracker update was needed. The spec folder is deleted in a separate commit after the docs merge.
