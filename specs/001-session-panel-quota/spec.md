# Feature Specification: Session Panel Quota Display

**Feature Branch**: `001-session-panel-quota`

**Created**: 2026-11-19

**Status**: Draft

**Input**: [Living requirements](../../docs/REQUIREMENTS.md). This spec covers REQ 1–4 for the Session Panel quota display. REQ 5 is a product requirement whose assignment to this feature or a follow-up is open. This spec does not amend the living requirements.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Quota Remaining, Even-Use Estimate, and Reset Time (Priority: P1)

As an OpenChamber user, I want to see how much quota I have left, an estimate based on even use, and when the quota resets without leaving my session.

**Why this priority**: Users need to know how much quota they have left and how to pace their use until the reset.

**Independent Test**: Open the Session Panel with one provider and a known quota window selected. Check the colored bar and reset time against known values and verify that the bar distinguishes actual quota from the estimate. Repeat with missing data. The expected estimate value and any color meanings depend on the open decisions below.

**Acceptance Scenarios**:

1. **Given** a selected window with 25% quota remaining, a known reset time, and enough information to estimate even use, **when** the user opens the Session Panel, **then** the window has a colored bar whose actual-quota fill spans one quarter of the bar, conveys the even-use estimate separately from the actual quota remaining, and shows when the window resets.
2. **Given** a selected window with zero quota remaining, a known reset time, and enough information to estimate even use, **when** the window is displayed, **then** the bar shows no remaining quota, still conveys the estimate and reset time, and does not show an error.
3. **Given** a selected window for which the remaining quota, reset time, or both are unavailable, **when** the window is displayed, **then** an error message replaces its bar, even if an estimate is available. Other selected windows with complete data continue to show their colored bars, estimates, and reset times.

### User Story 2 - Choose Providers and Windows to Display (Priority: P2)

As an OpenChamber user, I want to choose which providers and quota windows appear so I can focus on the quotas I use.

**Why this priority**: Providers can report multiple windows, and not every provider or window matters to every user.

**Independent Test**: With two supported providers, one reporting multiple windows, change the provider and window selections and check what the Session Panel displays.

**Acceptance Scenarios**:

1. **Given** two supported providers with displayable quota windows, **when** the user selects one provider and leaves the other unselected, **then** the panel shows the selected provider's selected windows and none from the unselected provider.
2. **Given** a selected provider with two quota windows with complete data and distinct reset times, **when** the user selects both windows, **then** each window shows its own colored bar, estimate, and reset time. **When** the user deselects one, **then** only the other remains visible.

### User Story 3 - See Supported Providers (Priority: P2)

As an OpenChamber user, I want providers with quota data to be available so I can see quotas for the providers I use.

**Why this priority**: Coverage applies to every eligible model provider in the latest OpenChamber version; a first-provider milestone does not satisfy the coverage requirement.

**Independent Test**: Compare the providers supported by the plugin with the model providers and quota availability in the latest OpenChamber version. Check that each eligible provider can be selected and displayed.

**Acceptance Scenarios**:

1. **Given** a model provider in the latest OpenChamber version with a quota window that has complete data, **when** the user selects that provider and window to show, **then** the Session Panel displays its colored bar, even-use estimate, and reset time.
2. **Given** a provider that does not expose quota data, **when** the user reviews supported providers, **then** that provider is not offered for quota display.
3. **Given** an optional external provider is included, **when** the user selects it, **then** its selected windows follow the same display and error rules as any other supported provider. Omitting Tavily does not fail acceptance.

### Edge Cases

- A supported provider with temporarily unavailable values is not the same as a provider that does not expose quota data. A selected, identifiable window with unavailable values follows the error rule in User Story 1.
- If actual quota and reset time are known but the even-use estimate is unavailable, the display behavior is not defined. REQ 1 does not specify that a missing estimate alone should replace the bar with an error.
- A window is not shown when its provider is hidden, even if that window was selected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (REQ 3)**: The quota display MUST appear in OpenChamber's Session Panel.
- **FR-002 (REQ 1)**: Each displayed window MUST use a colored bar to indicate actual quota remaining and the even-use estimate, and MUST show when the window resets. FR-003 applies when actual quota or reset time is unavailable. The meaning of the estimate, the role of color, and the estimate-only fallback are open.
- **FR-003 (REQ 1)**: If remaining quota or reset time is unavailable, an error message MUST replace the affected window's bar without replacing other windows' bars.
- **FR-004 (REQ 2)**: The plugin MUST support every model provider in the latest OpenChamber version that exposes quota data and MUST exclude providers that do not expose quota data. External providers that expose quota data, including Tavily, are optional.
- **FR-005 (REQ 4)**: Users MUST be able to choose which supported providers appear and, for each provider with multiple windows, which windows appear.

### Key Entities *(include if feature involves data)*

- **Provider**: A source of quota data with one or more quota windows.
- **Quota window**: A provider's distinct quota allocation, with remaining quota, an even-use estimate, and reset time when available.
- **Display selection**: The providers and, where applicable, windows the user has chosen to show.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In both the nonzero and zero quota scenarios, the colored bar shows the correct actual quota, the user can distinguish it from the even-use estimate, and the displayed reset time matches the expected time. The expected estimate value can be verified once its definition is agreed.
- **SC-002**: In all three cases (only remaining quota missing, only reset time missing, or both missing), the affected window shows an error and no bar, while a healthy selected window remains visible.
- **SC-003**: With at least two supported providers and at least two windows for one provider, the display matches the user's provider and window selections in every selection scenario.
- **SC-004**: 100% of eligible model providers in the latest OpenChamber version are supported; zero providers that do not expose quota data are offered. Verification records the version and date checked without changing the coverage target.

## Assumptions

- Acceptance scenarios start with known selections so they do not prescribe first-use defaults or preference persistence.
- Planning must confirm that the Session Panel can host the display and inventory provider eligibility for the latest OpenChamber version. If the evidence conflicts with the approved requirements, bring the conflict back for review.
- **Open behavior for planning review:** Which providers and windows are visible on first use; whether selections carry across sessions or restarts; and what to show if no items are selected or a provider's data is unavailable before any window can be identified. These are not decided by this spec.

## Open Decisions

- **REQ 1 — Even-use estimate:** [NEEDS CLARIFICATION: What quantity should the even-use estimate represent for a quota window?] Once defined, specify the expected result for a known example and what the bar should show if the estimate alone is unavailable.
- **REQ 1 — Bar color:** [NEEDS CLARIFICATION: Is color decorative, or should it convey quota status?] If color conveys status, define what determines it before adding color-specific acceptance checks.
- **REQ 5 — Custom provider scope:** [NEEDS CLARIFICATION: Must users be able to add custom providers in this feature, or can that be delivered in a follow-up?] Recommend a follow-up because adding and managing a provider is a separate workflow from choosing which supported providers to display. This does not remove REQ 5 or change REQ 2. Before specifying custom provider support, clarify what qualifies as a custom provider and what users must be able to configure.
