# Reconciliation

**Outcome:** `partial` (2026-11-24)

**Gate:** Automated checks pass (105 tests, 4 Playwright accessibility tests, typecheck, build, package check). The full quickstart and session switch are confirmed. Custom, Codex, and Zen setup is hidden; OAuth/live verification is deferred. `complete` is not available. The spec is retained.

## Disposition manifest

| Source | Disposition | Class |
| --- | --- | --- |
| `spec.md#clarifications` | Merged to `docs/ADR.md` (surface, service, custom format, trust, selection) | descriptive |
| `spec.md#US1–US4`, `FR-001–FR-015`, `SC-001–SC-011` | Behavior and acceptance mapped to `docs/REQUIREMENTS.md`, `docs/DESIGN.md`, `docs/TESTPLAN.md`; retained in spec until T047/T053 pass | normative |
| `plan.md#summary`, `#technical-context` | Merged to `docs/DESIGN.md` | descriptive |
| `plan.md#resolved-decisions` | Promoted to `docs/ADR.md` | normative |
| `research.md#alternatives` | Promoted to `docs/ADR.md`; provider evidence summarized in `docs/DESIGN.md` | descriptive |
| `data-model.md` | Merged to `docs/INTERFACES.md` | normative |
| `contracts/service-api.md` | Merged to `docs/INTERFACES.md`; working route prose retained in spec | normative |
| `contracts/*.schema.json` | Moved to `docs/contracts/`; service and contract tests updated | normative |
| `tasks.md` | Execution history; retain until the feature closes, then discard | discard |
| `quickstart.md` | Operational validation; retain until T053 passes | discard after verification |
| `checklists/requirements.md` | Quality checklist; not a contract; contents reflected in `docs/TESTPLAN.md` | discard |
| `verification.md` | Evidence summarized in `docs/TESTPLAN.md`; retain for T047/T053 | evidence |
| API key show/hide eye | Merged to `docs/DESIGN.md`; not present in the original spec, added on user request | descriptive |
| Custom TLS removal | Merged to `docs/DESIGN.md`, `docs/ADR.md`, and `docs/INTERFACES.md` | normative |
| Custom setup deferred | Merged to `docs/REQUIREMENTS.md` REQ 5 and `docs/ADR.md` ADR-007; add-provider option hidden | normative |
| Codex/Zen setup deferred | Merged to `docs/REQUIREMENTS.md` REQ 2 and `docs/ADR.md` ADR-008; add-provider options hidden; OAuth support is T067 | normative |
| Full quickstart (T053) | Passed and recorded in `specs/001-session-panel-quota/verification.md` | evidence |
| Accessibility checks | Contrast and focus evidence merged to `docs/TESTPLAN.md#accessibility-checks`; retained in verification | evidence |
| Codex/Zen reference review | Codex parser aligned; Zen OAuth/route mismatch recorded as a pending finding | evidence |

## Applied changes

- Added `docs/DESIGN.md`, `docs/INTERFACES.md`, `docs/TESTPLAN.md`, `docs/ADR.md`, and `docs/contracts/`.
- Updated REQ 4 and REQ 5 with approved selection persistence, provider/window auto-enable rules, balance hiding, and the fixed custom-provider format.
- Moved canonical JSON Schemas to `docs/contracts/`; updated `src/service/snapshot-schema.ts` and `tests/contract/service-api.test.ts`.
- Hid custom, Codex, and Zen setup and recorded the deferrals in REQ 2/REQ 5 and ADR-007/ADR-008.
- Confirmed the full quickstart and session switch; updated verification and T053.
- Aligned Codex parsing with the reference implementation and recorded the Zen OAuth/route mismatch as deferred.
- Added Playwright contrast/focus coverage and recorded the live host measurements.
- Marked the new living-doc sections with `provisional:feature=001-session-panel-quota`.

## Unresolved and unverified

- OAuth login support for Codex and Zen, including Console token refresh and org metadata (T067); live Codex/Zen checks are deferred.
- Custom-provider setup is hidden pending a live endpoint (T068).
- Windows credential-file permissions.
- Live host contrast beyond the measured themes and higher zoom levels are not covered; the fixture checks are automated.
- Codex and Zen outcomes may change provider normalization or adapter decisions once OAuth is implemented.

## Approval

The new design, interface, ADR, test-plan, and requirements content is normative and needs owner review before the MR that closes the feature. No spec content is deleted at `partial`.

## Re-run

Re-running reconciliation updates these sections in place. Once T067/T068 are addressed, live checks pass, and the owner approves the manifest, use `complete`: finalize markers, delete the spec in a separate commit, and retarget inbound links to the MR and ADRs.
