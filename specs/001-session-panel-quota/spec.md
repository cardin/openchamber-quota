# Feature Specification: Session Panel Quota Display

**Feature Branch**: `001-session-panel-quota`

**Created**: 2026-11-19

**Status**: Draft

**Input**: [Living requirements](../../docs/REQUIREMENTS.md). This spec covers REQ 1–5 for the Session Panel quota display, including user-added custom providers. This spec does not amend the living requirements.

## Clarifications

### Session 2026-11-20

- Q: Should users be able to add custom providers in the first Session Panel quota feature, or in a follow-up? → A: Include user-added custom providers in this feature.
- Q: Where should users define the custom providers they want to see in the quota panel? → A: Prefer both OpenChamber-defined and plugin-defined custom providers if supporting both is simple. If not, bring the choice of one source back for approval.
- Q: What should the even-use estimate on the quota bar tell users? → A: Show what share of the full quota would remain at this point if it were used evenly across the window.
- Q: What should the panel show when actual quota remaining and the reset time are known, but the even-use benchmark can’t be calculated? → A: Show the actual quota bar and reset time; omit the benchmark without a note or error.
- Q: What should the color of the quota bar communicate? → A: Use a danger color below a remaining-quota threshold, regardless of pace; otherwise use a warning color below the even-use benchmark and the default color in other cases.
- Q: What remaining quota level should trigger the danger color? → A: Default to 10% remaining, with one user-configurable cutoff that applies to all windows. Only values strictly below the cutoff trigger danger.
- Q: Which quotas should the Session Panel show before the user has made any selections? → A: Show all available windows from supported providers the user has configured, including any eligible custom providers already set up.
- Q: Where should the panel remember the user’s provider and window selections? → A: Keep one set of selections per OpenChamber instance, shared across sessions and restored after restarts without syncing to other instances.
- Q: What should the panel show when it cannot refresh an entire selected provider? → A: Show one provider-level error and no old bars for that provider. Keep other providers visible.
- Q: If users can define providers in the quota plugin itself, what should they be able to set up? → A: Let users supply connection details for a provider that uses a supported quota format. If there is only one supported format, use it without offering a format selection.
- Q: When should the panel fetch fresh quota data? → A: Fetch on open, refresh periodically while visible, and offer a manual refresh. Determine the automatic interval during planning based on provider limits.
- Q: What should users see while a quota refresh is in progress? → A: Keep bars for windows that have not reset. Show loading when there are no previous values or the window has already reset.
- Q: What should happen when a displayed quota window reaches its reset time between scheduled refreshes? → A: Replace the expired bar with loading and request fresh quota as soon as provider limits allow.
- Q: After users save their choices, should newly available providers and quota window types appear automatically? → A: No. Offer them in the selector, but keep them out of the quota display until enabled. A new cycle of the same window type keeps its selection.
- Q: What should the panel show when there are no quota bars to display, but no request has failed? → A: Show a setup hint if no eligible provider is configured, a selection hint if the user hid everything, or a provider-specific message if a selected provider successfully reports no windows.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Quota Remaining, Even-Use Estimate, and Reset Time (Priority: P1)

As an OpenChamber user, I want to see how much quota I have left, an estimate based on even use, and when the quota resets without leaving my session.

**Why this priority**: Users need to know how much quota they have left and how to pace their use until the reset.

**Independent Test**: Open the Session Panel halfway through a known quota window. Check that the bar distinguishes actual quota remaining from the 50% even-use benchmark and shows the correct reset time. Repeat with missing data.

**Acceptance Scenarios**:

1. **Given** a selected quota window halfway through its full duration with 25% actual quota remaining, **when** the user opens the Session Panel, **then** the colored bar shows 25% actual quota remaining and a distinct 50% even-use benchmark on the same scale, and the panel shows when the window resets.
2. **Given** a selected quota window halfway through its full duration with zero actual quota remaining, **when** the window is displayed, **then** the bar shows no actual quota remaining and a distinct 50% even-use benchmark, the reset time is shown, and there is no error.
3. **Given** a selected window for which the remaining quota, reset time, or both are unavailable, **when** the window is displayed, **then** an error message replaces its bar, even if an estimate is available. Other selected windows with complete data continue to show their colored bars, estimates, and reset times.
4. **Given** a selected window with known actual quota remaining and reset time but insufficient timing information for the even-use benchmark, **when** the window is displayed, **then** the bar shows actual quota remaining and the reset time is shown, with no benchmark, note, or error.
5. **Given** the default 10% cutoff and known actual quota and reset time, **when** actual quota is 9%, **then** the bar uses the danger color whether the benchmark is higher, lower, equal, or unavailable. At exactly 10%, the bar is not in danger.
6. **Given** known actual quota and reset time and quota at or above the danger cutoff, **when** actual quota is below the benchmark, **then** the bar uses the warning color. At or above the benchmark, or if the benchmark is unavailable, it uses the default color.
7. **Given** multiple displayed windows with 15% actual quota remaining and known reset times, **when** the user raises the shared cutoff from 10% to 20%, **then** each of those windows uses the danger color.
8. **Given** two selected providers and one of them has previously displayed quota windows, **when** a refresh fails for that entire provider, **then** one provider-level error replaces all its bars and the other provider remains visible. If a provider fails on first load and no windows are known, show the same provider-level error.
9. **Given** a configured provider selected for display, **when** the user opens the panel, leaves it visible for an automatic refresh interval, or requests a manual refresh, **then** the panel fetches fresh quota. No periodic refresh is triggered while the panel is hidden.
10. **Given** a refresh is in progress, **when** the panel displays a window with previous values and a future reset time, **then** it keeps that bar visible. For a first fetch or a window that has already reset, it shows loading instead of an old bar until the refresh returns data or an error.
11. **Given** a displayed window reaches its reset time before the next scheduled refresh, **when** the reset time arrives, **then** loading replaces the expired bar and the panel refreshes the provider at the earliest time its limits allow.
12. **Given** a selected provider, **when** a successful response reports no quota windows, **then** the panel shows a message for that provider, not a loading state or an error. Other providers remain visible.

### User Story 2 - Choose Providers and Windows to Display (Priority: P2)

As an OpenChamber user, I want to choose which providers and quota windows appear so I can focus on the quotas I use.

**Why this priority**: Providers can report multiple windows, and not every provider or window matters to every user.

**Independent Test**: With two supported providers, one reporting multiple windows, change the provider and window selections and check what the Session Panel displays.

**Acceptance Scenarios**:

1. **Given** two supported providers with displayable quota windows, **when** the user selects one provider and leaves the other unselected, **then** the panel shows the selected provider's selected windows and none from the unselected provider.
2. **Given** a selected provider with two quota windows with complete data and distinct reset times, **when** the user selects both windows, **then** each window shows its own colored bar, estimate, and reset time. **When** the user deselects one, **then** only the other remains visible.
3. **Given** no saved selections and a mix of configured and unconfigured providers, **when** the user first opens the panel, **then** it shows all available windows from supported configured providers, including any eligible custom providers already set up. It does not list unconfigured providers in the quota display.
4. **Given** the user has changed a provider or window selection, **when** they switch sessions or restart the same OpenChamber instance, **then** their selections are restored; another instance's selections are unaffected. An explicitly saved empty selection does not revert to first-use defaults.
5. **Given** the user has saved selections, **when** a newly configured eligible provider or a newly reported window type becomes available, **then** it is offered in the selector but does not appear in the quota display until enabled. Resetting an already selected window does not require the user to select it again.
6. **Given** no eligible provider is configured, **when** the user opens the panel, **then** it shows a setup hint. If eligible providers are configured but the user has hidden all providers or windows, it instead shows a hint to change the selection.

### User Story 3 - See Supported Providers (Priority: P2)

As an OpenChamber user, I want providers with quota data to be available, including providers I add myself, so I can see quotas for the providers I use.

**Why this priority**: Coverage applies to every eligible model provider in the latest OpenChamber version; a first-provider milestone does not satisfy the coverage requirement.

**Independent Test**: Compare the providers supported by the plugin with the model providers and quota availability in the latest OpenChamber version. Check that each eligible provider can be selected and displayed.

**Acceptance Scenarios**:

1. **Given** a model provider in the latest OpenChamber version with a quota window that has complete data, **when** the user selects that provider and window to show, **then** the Session Panel displays its colored bar, even-use estimate, and reset time.
2. **Given** a provider that does not expose quota data, **when** the user reviews supported providers, **then** that provider is not offered for quota display.
3. **Given** an optional external provider is included, **when** the user selects it, **then** its selected windows follow the same display and error rules as any other supported provider. Omitting Tavily does not fail acceptance.
4. **Given** an eligible custom provider with usable quota data, **when** the user includes it and selects it for display, **then** its selected windows follow the same display and error rules as other supported providers.
5. **Given** plugin-defined providers are supported, **when** the user supplies connection details for a provider with a supported quota format, **then** they can select that format if more than one is supported. If only one format is supported, the plugin uses it without offering a format selection.

### Edge Cases

- A supported provider with temporarily unavailable values is not the same as a provider that does not expose quota data. An isolated failure in an identifiable window gets a window-level error; failure to load the entire provider gets one provider-level error.
- Insufficient timing information for the even-use benchmark alone does not replace the actual quota bar with an error and is not shown as a zero benchmark.
- A window is not shown when its provider is hidden, even if that window was selected.
- A plugin-defined provider with an unsupported quota format cannot be added for quota display. User-defined mappings for unfamiliar formats are out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (REQ 3)**: The quota display MUST appear in OpenChamber's Session Panel.
- **FR-002 (REQ 1)**: Each displayed window MUST use a colored bar to distinguish actual quota remaining from the even-use benchmark on the same scale, and MUST show when the window resets. The benchmark is the fraction of the full window still remaining: 100% at the start, 50% halfway through, and 0% at reset. If only the benchmark cannot be calculated, show the actual quota bar and reset time without the benchmark or a note. FR-003 applies when actual quota or reset time is unavailable.
- **FR-003 (REQ 1)**: If remaining quota or reset time is unavailable for an individual window, an error message MUST replace that window's bar without replacing healthy windows' bars. If loading or refreshing an entire selected provider fails, the panel MUST show one error for that provider and no old bars from it, without hiding healthy providers.
- **FR-004 (REQ 2)**: The plugin MUST support every model provider in the latest OpenChamber version that exposes quota data and MUST exclude providers that do not expose quota data. External providers that expose quota data, including Tavily, are optional.
- **FR-005 (REQ 4)**: Users MUST be able to choose which supported providers appear and, for each provider with multiple windows, which windows appear. Preserve one set of selections per OpenChamber instance across sessions and restarts. Before any selections are saved, show all available windows from supported configured providers, including eligible custom providers already set up. A saved empty selection is not first use.
- **FR-006 (REQ 5)**: Users MUST be able to include their own custom providers that expose quota data and select them for display. Both OpenChamber-defined and plugin-defined providers are preferred if supporting both is simple. If planning finds that supporting both would materially increase complexity, get approval on which source to support first. The setup details remain open.
- **FR-007 (REQ 1)**: Use the danger color if actual quota remaining is strictly below the cutoff, regardless of the benchmark. The cutoff defaults to 10% and users can change it through one setting that applies to all windows. Otherwise, use the warning color if the benchmark is known and actual quota remaining is strictly below it; use the default color otherwise.
- **FR-008 (REQ 5)**: If plugin-defined providers are supported, users MUST be able to supply connection details for their own providers using a supported quota format. Offer a format selection only when more than one format is supported.
- **FR-009 (REQ 1)**: Fetch quota for selected providers when the panel opens, periodically while it is visible, and when the user requests a manual refresh. When a displayed window reaches reset, refresh that provider as soon as its limits allow. Verify provider limits during planning to set the automatic interval.
- **FR-010 (REQ 1)**: While a fetch is in progress, keep existing bars only for windows whose reset time has not arrived. Show loading for a first fetch or a window whose reset time has arrived, including while waiting for provider limits to allow a fetch. When the fetch finishes, show the new values, the applicable error, or the empty-state message under FR-012.
- **FR-011 (REQ 4)**: After selections are saved, make eligible providers and window types that become available for the first time selectable but do not add them to the quota display until the user enables them. Preserve a window type's selection across reset cycles.
- **FR-012 (REQ 1/4)**: Show a setup hint when no eligible providers are configured, a selection hint when the user's selections hide all quotas, and a provider-specific message when a successful response from a selected provider reports no windows. A failed response follows FR-003, not the empty-state rule.

### Key Entities *(include if feature involves data)*

- **Provider**: A source of quota data that may report no active quota windows.
- **Quota window**: The current cycle of a quota allocation, with remaining quota, an even-use estimate, and reset time when available.
- **Window type**: A recurring quota allocation from a provider, such as a daily window; its selection applies to each reset cycle.
- **Display selection**: The providers and, where applicable, window types the user has chosen to show, scoped to one OpenChamber instance.
- **Quota format**: A supported way for a provider to report its quota windows and values.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In both the nonzero and zero quota scenarios, the colored bar shows the correct actual quota and a distinguishable 50% even-use benchmark halfway through the window. The displayed reset time matches the known reset time.
- **SC-002**: Verify window-level errors for missing quota or reset time, one provider-level error and no old bars for a whole-provider failure, and an unchanged actual quota bar and reset time when only the benchmark is unavailable. Unaffected windows and providers remain visible in all cases.
- **SC-003**: With at least two supported providers and at least two windows for one provider, verify first-use defaults, saved selections after switching sessions and restarting the same instance, and that new providers or window types require selection while ordinary resets do not.
- **SC-004**: 100% of eligible model providers in the latest OpenChamber version are supported; zero providers that do not expose quota data are offered. Verification records the version and date checked without changing the coverage target.
- **SC-005**: For each supported custom provider source, a user can add one eligible provider and see its selected windows in the Session Panel. If plugin-defined providers are supported, verify that format selection is absent when one format is supported and available when more than one is supported.
- **SC-006**: Verify color below, at, and above the default 10% cutoff, with the benchmark above, equal to, below, or unavailable relative to actual quota. Verify that changing the cutoff applies to all windows, and that danger takes precedence over warning.
- **SC-007**: Verify refresh on open, periodically while visible, manually, and at reset subject to provider limits. Verify that automatic refresh stops while the panel is hidden, unexpired bars remain during refresh, and expired bars are replaced by loading even when provider limits delay the fetch.
- **SC-008**: Verify distinct outcomes for no eligible providers configured, all quotas hidden by selection, and a selected provider reporting no windows. A provider failure remains an error, not an empty state.

## Assumptions

- Planning must confirm that the Session Panel can host the display and inventory provider eligibility for the latest OpenChamber version. If the evidence conflicts with the approved requirements, bring the conflict back for review.
- Living REQ 1 lists the even-use estimate for each displayed window but does not specify what to show if it alone is unavailable. Reconcile the agreed fallback in FR-002 with the living requirement before implementing it.

## Open Decisions

- **REQ 1 — Refresh and failure states:** Verify provider limits to set the automatic interval and decide whether recovery needs anything beyond manual and periodic refresh.
- **REQ 1 — Display details:** Decide whether reset time is absolute, relative, or both; how quota values are rounded and labeled; and how users distinguish warning and danger without relying on color.
- **REQ 2/3 — Host integration and provider coverage:** Verify which OpenChamber release defines the eligibility check, whether it includes configured providers and multiple accounts, what counts as exposed quota data when only some fields are available, and whether the Session Panel can host the feature. Bring any conflict with the living requirements back for review.
- **REQ 4 — Selection behavior:** Decide whether saved choices are retained for providers and window types that are removed and later return.
- **REQ 5 — Custom provider setup:** Planning must verify the cost and constraints of supporting both sources and identify the quota formats the plugin can support. Clarify the connection details and credentials each source needs, how users update or remove a provider, how users recognize failed setup, and how to handle duplicates if both sources are supported.
