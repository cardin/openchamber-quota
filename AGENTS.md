# Living Design and Change Workflow

## Authority

Records are layered; link rather than duplicate structure across them.

- `docs/`: requirements, design, contracts, verification strategy and decisions.
  Canonical at all times, including while a feature is in flight.
- Feature specs (`specs/<feature>/`, SpecKit or equivalent): change-local working
  record. A proposal against the current docs, never a second contract.
  Restating living-doc content for working context is permitted; where the two
  disagree during a feature, the living doc wins, and the disagreement is a
  finding for human review, not resolved silently.
- Tracker selected in root `README.md`, if any: scope, priorities, ownership,
  dependencies, blockers and delivery status. Tracker content is context, not a
  substitute for approved requirements.
- Git, MR, test/CI and deployment records: implementation, verification and
  release evidence. The MR description is the change record: summary, affected
  requirement IDs, ADR links, test evidence, known gaps, and the spec
  disposition manifest. It must stand alone, because the spec is deleted after
  reconciliation.

## Documents

- `docs/REQUIREMENTS.md`: behaviour, constraints and acceptance criteria.
  Substantive changes require explicit human approval.
- `docs/DESIGN.md`: architecture and responsibilities; distinguish intended
  from implemented design.
- `docs/INTERFACES.md`: contracts and data models; reference canonical schemas.
- `docs/TESTPLAN.md`: verification scenarios, requirement-to-check mapping and
  coverage gaps.
- `docs/ADR.md`: significant decisions and rationale; preserve accepted history
  through superseding decisions. ADRs are written when the decision is
  accepted, not reconstructed at merge.

Create documents as needed. Split large files into matching directories with
`README.md` entry points. Preserve requirement IDs; retire them explicitly,
never renumber. Use MIL-STD-498 as a reference, not a constitution.

Above all, be concise with documentation.

### Provisional markers

Partial reconciliation leaves explicitly marked provisional content. This is
the only allowed form — defined here so any agent, script, or reviewer can
find it without having seen the feature:

> Provisional — feature `checkout-guest`: <what is not final>.
> See `specs/checkout-guest/spec.md`.
<!-- provisional:feature=checkout-guest -->

Rules:

- `feature=` is the spec folder name. One marker per merged section.
- Never invent a variant wording. Never touch another feature's markers.
- `complete` finalizes them (keep content, remove marker). `abandoned`
  retracts them (remove content and marker).
- Find all markers for a feature with:
  `rg "provisional:feature=checkout-guest"`

## Change workflow

For material changes:

1. Read the root README, relevant documents, current plan, implementation and
   tests; consult linked work items when tracking is used.
2. Plan a bounded increment, identifying affected contracts, documentation,
   verification and open decisions.
3. Implement and test incrementally; coordinate shared interface changes with
   affected contributors. Routine engineering decisions need not await the
   lead.
4. Record decisions and approvals when they happen. Accepted significant
   decisions get an ADR at acceptance. Approved intent changes update living
   docs before the affected implementation proceeds. Interface or public
   behaviour changes that other work depends on are merged via
   `living-docs-reconcile` in `partial` mode, without waiting for completion.
   Resolve conflicts with owners rather than rewriting intent to match code.
5. Before opening the MR that ends a feature, run `living-docs-reconcile`
   with the outcome matching the feature's state. Do not open the MR until
   its disposition manifest is complete and reviewed.
6. Update affected documents and tests with the code via that reconciliation.
   Before handoff, reconcile upstream changes and authoritative records, link
   evidence, and report remaining gaps. Apply the team's acceptance criteria
   before advancing delivery status.

## Tracker

Tracking is optional unless selected in README. Record work requiring shared
visibility or independent ownership, not every execution step.

Routine progress, blocker and PR-link updates to existing assigned issues are
allowed. Obtain approval to create issues or change scope, priority, ownership
or closure. Preserve existing references; reconcile stale plans before
updating records. Before a feature spec is deleted, retarget any tracker links
pointing at it to the MR and ADR instead. Report pending updates when access
or approval is missing.

## SpecKit

SpecKit is optional. Its native plan/tasks may serve as the feature spec.
Feature specifications are scoped change proposals, not competing system
contracts or backlogs. Spec content may duplicate living-doc sections for
working context; living docs remain authoritative, and the spec is deleted
after reconciliation, which bounds the duplication.

Keep its constitution aligned with this workflow. Refresh active artifacts
against relevant living-document changes before resuming work; completed
artifacts are handled by `living-docs-reconcile`, not retained by default.
Review living-document consistency explicitly, beyond SpecKit's own analysis.

## living-docs-reconcile

The skill records how every part of a feature spec is dispositioned into the
authoritative records, merges the durable content, and deletes the spec when
the feature completed. Three outcomes:

- `complete`: acceptance criteria verified, tests green, no open decisions.
  Merges content, promotes unrecorded decisions to ADRs, finalizes this
  feature's provisional markers, then deletes the spec in a separate commit
  after the docs merge is approved.
- `partial`: implementation incomplete but interface, requirement or decision
  content is needed now. Merges only approved, stable content using the
  Provisional markers above, and keeps the spec. Re-running updates in place.
- `abandoned`: work stopped, superseded, deferred, or reverted. Writes a
  short ADR with revisit conditions, retracts this feature's provisional
  markers, updates the tracker, and archives the spec rather than deleting it.

If the outcome is ambiguous, use `partial`. Deletion requires the positive
`complete` gate; it is never the fallback. Run the skill for every ending,
not only successful ones.
