# Reconciliation

**Outcome:** `partial` (2026-11-24)

**Gate:** Automated checks pass (101 tests, typecheck, build, package check), but T047 still needs live custom, Codex, and Zen checks and T053 still needs the full quickstart and a separate session-switch check. `complete` is not available. The spec is retained.

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

## Applied changes

- Added `docs/DESIGN.md`, `docs/INTERFACES.md`, `docs/TESTPLAN.md`, `docs/ADR.md`, and `docs/contracts/`.
- Updated REQ 4 and REQ 5 with approved selection persistence, provider/window auto-enable rules, balance hiding, and the fixed custom-provider format.
- Moved canonical JSON Schemas to `docs/contracts/`; updated `src/service/snapshot-schema.ts` and `tests/contract/service-api.test.ts`.
- Marked the new living-doc sections with `provisional:feature=001-session-panel-quota`.

## Unresolved and unverified

- Live custom endpoint, Codex login, and Zen key checks (T047).
- Full quickstart and separate session-switch check (T053).
- Windows credential-file permissions.
- Keyboard focus order and host-theme contrast are spot-checked, not automated.
- Live custom, Codex, and Zen outcomes may change provider normalization or adapter decisions.

## Approval

The new design, interface, ADR, test-plan, and requirements content is normative and needs owner review before the MR that closes the feature. No spec content is deleted at `partial`.

## Re-run

Re-running reconciliation updates these sections in place. Once T047 and T053 pass and the owner approves the manifest, use `complete`: finalize markers, delete the spec in a separate commit, and retarget inbound links to the MR and ADRs.
