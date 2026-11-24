# Feature Specification: Session Panel Quota Display

**Feature Branch**: `001-session-panel-quota`

**Created**: 2026-11-19

**Status**: Implemented (host and local verification complete; live provider checks in progress)

**Reconciliation**: [reconciliation.md](reconciliation.md) — partial, 2026-11-24.

**Input**: [Living requirements](../../docs/REQUIREMENTS.md). This spec covers the amended REQ 1–5: the named provider set, the Work Status section, and user-defined providers. It does not amend the living requirements.

## Clarifications

### Session 2026-11-20

- Q: Should users be able to add custom providers in the first Session Panel quota feature, or in a follow-up? → A: Include user-added custom providers in this feature.
- Q: Where should users define the custom providers they want to see in the quota panel? → A: Inside the plugin only. OpenChamber-defined providers cannot be read without a host change.
- Q: What should the even-use estimate on the quota bar tell users? → A: Show what share of the full quota would remain at this point if it were used evenly across the window.
- Q: What should the panel show when actual quota remaining and the reset time are known, but the even-use benchmark can’t be calculated? → A: Show the actual quota bar and reset time; omit the benchmark without a note or error.
- Q: What should the color of the quota bar communicate? → A: Use a danger color below a remaining-quota threshold, regardless of pace; otherwise use a warning color below the even-use benchmark and the default color in other cases.
- Q: What remaining quota level should trigger the danger color? → A: Default to 10% remaining, with one user-configurable cutoff that applies to all windows. Only values strictly below the cutoff trigger danger.
- Q: Which quotas should the Session Panel show before the user has made any selections? → A: Show all available windows from supported providers the user has configured, including any eligible custom providers already set up.
- Q: Where should the panel remember the user’s provider and window selections? → A: Keep one set of selections per OpenChamber instance, shared across sessions and restored after restarts without syncing to other instances.
- Q: What should the panel show when it cannot refresh an entire selected provider? → A: Show one provider-level error and no old bars for that provider. Keep other providers visible.
- Q: If users can define providers in the quota plugin itself, what should they be able to set up? → A: A label, HTTPS endpoint, and key. One fixed quota format, no format picker.
- Q: When should the panel fetch fresh quota data? → A: Fetch on open, refresh periodically while visible, and offer a manual refresh. Determine the automatic interval during planning based on provider limits.
- Q: What should users see while a quota refresh is in progress? → A: Keep bars for windows that have not reset. Show loading when there are no previous values or the window has already reset.
- Q: What should happen when a displayed quota window reaches its reset time between scheduled refreshes? → A: Replace the expired bar with loading and request fresh quota as soon as provider limits allow.
- Q: After users save their choices, should newly available providers and quota window types appear automatically? → A: A newly added provider appears automatically with all its current windows. A newly reported window type for an already configured provider is offered in the selector but stays out of the quota display until enabled. A new cycle of the same window type keeps its selection.
- Q: What should the panel show when there are no quota bars to display, but no request has failed? → A: Show a setup hint if no eligible provider is configured, a selection hint if the user hid everything, or a provider-specific message if a selected provider successfully reports no windows.
### Session 2026-11-23

- Q: Does an added quota tab in OpenChamber’s right-hand rail satisfy “OpenChamber’s Session Panel”? → A: No. The Session Panel means the Work Status panel beside the chat; a rail tab does not satisfy it.
- Q: Should quotas be a new section in Work Status or extend the built-in Usage card? → A: A new Quotas section in Work Status.
- Q: How should the panel get quota data without changing OpenChamber? → A: The plugin owns the data path and supports a named provider set plus user-defined providers. REQ 2 is amended to that set.
- Q: Should prepaid balances, spend caps, and lifetime limits that have no reset be shown? → A: Spend caps and lifetime limits use a bar because they have a remaining and maximum value; prepaid balances are shown as a number without a bar. Neither is given an invented reset.
- Q: How should users tell warning and danger apart? → A: By bar color only; no pattern, separate status label, or icon is required.
- Q: How should the reset time be shown next to a quota bar? → A: Let users choose relative or absolute time, defaulting to relative.
- Q: Should a cap show used or remaining value? → A: Show `limit - used` against `limit` by default. Show used against `limit` when the user chooses Used.
- Q: Where do plugin settings live? → A: The sidebar's Pages section; it is the supported configuration surface.
- Q: Should Tavily's key-usage counter be shown? → A: No. Show Tavily's PAYG usage as a balance when no PAYG limit exists, and as a monthly window when it does. Tavily plan, key-level, and PAYG limits reset at 00:00 UTC on the first of each calendar month.
- Q: Can users hide non-reporting balances? → A: Yes; Quota settings offers a per-provider `non-reporting balances` checkbox, checked by default; unchecking hides them.
- Q: How does absolute reset time read at different distances? → A: Within 24 hours: time only. Within 7 days: weekday and time. 7 days or more: date only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Quota Remaining, Even-Use Estimate, and Reset Time (Priority: P1)

As an OpenChamber user, I want to see how much quota I have left, an estimate based on even use, and when the quota resets without leaving my session.

**Why this priority**: Users need to know how much quota they have left and how to pace their use until the reset.

**Independent Test**: Open the Session Panel halfway through a known quota window. Check that the bar distinguishes actual quota remaining from the 50% even-use benchmark and shows the correct reset time. Switch to Used and check that the fill and value mirror the used quota while the benchmark moves to elapsed use and the warning and reset stay unchanged. Repeat with missing data.

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
13. **Given** a known reset time, **when** the panel first shows it, **then** the relative time is shown by default. **When** the user switches the reset-time display to absolute, **then** the format adapts to distance: time only within 24 hours, weekday and time within 7 days, and date only at 7 or more days.
14. **Given** a window with 25% remaining one-quarter of the way through its duration, **when** the user switches to Used, **then** its bar and value show 75% used and its benchmark moves from 75% remaining to 25% used. The warning and reset time stay unchanged.

### User Story 2 - Choose Providers and Windows to Display (Priority: P2)

As an OpenChamber user, I want to choose which providers and quota windows appear so I can focus on the quotas I use.

**Why this priority**: Providers can report multiple windows, and not every provider or window matters to every user.

**Independent Test**: With two supported providers, one reporting multiple windows, change the provider and window selections and check what the Session Panel displays.

**Acceptance Scenarios**:

1. **Given** two supported providers with displayable quota windows, **when** the user selects one provider and leaves the other unselected, **then** the panel shows the selected provider's selected windows and none from the unselected provider.
2. **Given** a selected provider with two quota windows with complete data and distinct reset times, **when** the user selects both windows, **then** each window shows its own colored bar, estimate, and reset time. **When** the user deselects one, **then** only the other remains visible.
3. **Given** no saved selections and a mix of configured and unconfigured providers, **when** the user first opens the panel, **then** it shows all available windows from supported configured providers, including any eligible custom providers already set up. It does not list unconfigured providers in the quota display.
4. **Given** the user has changed a provider or window selection, **when** they switch sessions or restart the same OpenChamber instance, **then** their selections are restored; another instance's selections are unaffected. An explicitly saved empty selection does not revert to first-use defaults.
5. **Given** the user has saved selections, **when** a newly configured eligible provider becomes available, **then** it appears automatically with all its current windows. **When** a newly reported window type appears for an already configured provider, it is offered in the selector but does not appear until enabled. Resetting an already selected window does not require the user to select it again.
6. **Given** no eligible provider is configured, **when** the user opens the panel, **then** it shows a setup hint. If eligible providers are configured but the user has hidden all providers or windows, it instead shows a hint to change the selection.

### User Story 3 - See Balances and Caps That Do Not Reset (Priority: P2)

As an OpenChamber user, I want to see spend caps, lifetime limits, and prepaid balances even when they do not reset, so I know what room I have left.

**Why this priority**: Some supported providers expose quota-like values without a reset window. Leaving them out would hide useful limits and exclude providers that only report a balance.

**Independent Test**: Display one spend cap, one lifetime limit, and one prepaid balance from synthetic data. Check that caps follow the Remaining/Used setting and use a bar without a reset or benchmark, and the balance is a number only.

**Acceptance Scenarios**:

1. **Given** a spend cap or lifetime limit with a current value and a known maximum but no reset time, **when** it is displayed, **then** it shows a bar for remaining or used versus maximum, following the display setting, with no reset time or even-use benchmark.
2. **Given** a prepaid balance, **when** it is displayed, **then** it shows as a number without a bar, benchmark, or reset time.

### User Story 4 - See Supported Providers (Priority: P2)

As an OpenChamber user, I want providers with quota data to be available, including providers I add myself, so I can see quotas for the providers I use.

**Why this priority**: Coverage applies to the named provider set in REQ 2; a first-provider milestone does not satisfy the coverage requirement.

**Independent Test**: Compare the providers supported by the plugin with the REQ 2 list. Check that each named provider can be selected and displayed.

**Acceptance Scenarios**:

1. **Given** a provider named in REQ 2 with a quota window that has complete data, **when** the user selects that provider and window to show, **then** the Session Panel displays its colored bar, even-use estimate, and reset time.
2. **Given** a provider that does not expose quota data, **when** the user reviews supported providers, **then** that provider is not offered for quota display.
3. **Given** Tavily is named in REQ 2, **when** the user connects it and selects a window, **then** its selected windows follow the same display and error rules as a model provider.
4. **Given** an eligible custom provider with usable quota data, **when** the user includes it and selects it for display, **then** its selected windows follow the same display and error rules as other supported providers.
5. **Given** a custom provider uses the supported format, **when** the user supplies a label, HTTPS endpoint, and key, **then** the plugin adds it without a format picker.

### Edge Cases

- A supported provider with temporarily unavailable values is not the same as a provider that does not expose quota data. An isolated failure in an identifiable window gets a window-level error; failure to load the entire provider gets one provider-level error.
- Insufficient timing information for the even-use benchmark alone does not replace the actual quota bar with an error and is not shown as a zero benchmark.
- A window is not shown when its provider is hidden, even if that window was selected.
- A plugin-defined provider with an unsupported quota format cannot be added for quota display. User-defined mappings for unfamiliar formats are out of scope.
- A cap-like value with a current value but no maximum is shown as a balance number, not a bar.
- A resetting window whose reset time is missing still follows the error rule in FR-003; the cap and balance rules do not excuse a missing reset on a resetting window.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (REQ 3)**: The quota display MUST appear as a new Quotas section in OpenChamber's Work Status panel beside the chat. A rail tab or a separate panel MUST NOT substitute for it. The section MUST load only while the panel is visible and the section is expanded.
- **FR-002 (REQ 1)**: Each displayed resetting window MUST use a colored bar to distinguish actual quota from the even-use benchmark on the same scale, and MUST show when the window resets. In Remaining mode the benchmark is the fraction of the full window still remaining: 100% at the start, 50% halfway through, and 0% at reset. In Used mode it is the elapsed fraction. If only the benchmark cannot be calculated, show the actual quota bar and reset time without the benchmark or a note. FR-003 applies when actual quota or reset time is unavailable.
- **FR-003 (REQ 1)**: If remaining quota or reset time is unavailable for an individual window, an error message MUST replace that window's bar without replacing healthy windows' bars. If loading or refreshing an entire selected provider fails, the panel MUST show one error for that provider and no old bars from it, without hiding healthy providers.
- **FR-004 (REQ 2)**: The plugin MUST support user-defined providers plus OpenAI Codex, OpenCode Go, OpenRouter, Tavily, and OpenCode Zen. It MUST NOT read OpenChamber's credential store. Providers outside this list are not required until added to REQ 2.
- **FR-005 (REQ 4)**: Users MUST be able to choose which supported providers appear, for each provider with multiple windows, which windows appear, and whether a provider's non-reporting balances are hidden. Preserve one set of selections per OpenChamber instance across sessions and restarts. Before any selections are saved, show all available windows from supported configured providers, including eligible custom providers already set up. A saved empty selection is not first use.
- **FR-006 (REQ 5)**: Users MUST be able to add, update, and remove their own custom providers inside the plugin and select them for display. OpenChamber-defined providers are out of scope.
- **FR-007 (REQ 1)**: Use the danger color if actual quota remaining is strictly below the cutoff, regardless of the benchmark. The cutoff defaults to 10% and users can change it through one setting that applies to all windows. Otherwise, use the warning color if the benchmark is known and actual quota remaining is strictly below it; use the default color otherwise.
- **FR-008 (REQ 5)**: Users MUST supply a label, an HTTPS endpoint, and a key for a custom provider. The plugin uses the one supported quota format without offering a format picker.
- **FR-009 (REQ 1)**: Fetch quota for selected providers when the panel opens, periodically while it is visible, and when the user requests a manual refresh. When a displayed window reaches reset, refresh that provider as soon as its limits allow. Verify provider limits during planning to set the automatic interval.
- **FR-010 (REQ 1)**: While a fetch is in progress, keep existing bars only for windows whose reset time has not arrived. Show loading for a first fetch or a window whose reset time has arrived, including while waiting for provider limits to allow a fetch. When the fetch finishes, show the new values, the applicable error, or the empty-state message under FR-012.
- **FR-011 (REQ 4)**: After selections are saved, a newly added eligible provider MUST appear automatically with all its current windows. A newly reported window type for an already configured provider MUST be selectable but MUST NOT appear until the user enables it. Preserve a window type's selection across reset cycles.
- **FR-012 (REQ 1/4)**: Show a setup hint when no eligible providers are configured, a selection hint when the user's selections hide all quotas, and a provider-specific message when a successful response from a selected provider reports no windows. A failed response follows FR-003, not the empty-state rule.
- **FR-013 (REQ 2)**: Show a spend cap or lifetime limit that has a current value and a known maximum as a bar of remaining or used versus maximum, without a reset time or even-use benchmark. Show a prepaid balance as a number without a bar, benchmark, or reset time. Never invent a reset for either. A provider that exposes only values covered by this requirement remains eligible under FR-004.
- **FR-014 (REQ 1)**: Show reset times as relative time by default. Provide one instance-scoped setting to switch to absolute time. In absolute mode, a reset within 24 hours shows only the time; a reset within 7 days shows the weekday and time; a reset 7 or more days away shows the date only. The setting follows the same persistence rules as display selections.
- **FR-015 (REQ 1)**: Provide one instance-scoped setting to switch all window and cap bars and values from Remaining (default) to Used. Colors still follow FR-007 and balances are unchanged.

### Key Entities *(include if feature involves data)*

- **Provider**: A source of quota data that may report no active quota windows.
- **Quota window**: The current cycle of a quota allocation, with remaining quota, an even-use estimate, and reset time when available.
- **Window type**: A recurring quota allocation from a provider, such as a daily window; its selection applies to each reset cycle.
- **Display selection**: The providers and, where applicable, window types the user has chosen to show, scoped to one OpenChamber instance.
- **Display preference**: An instance-scoped display choice, including the quota display mode, danger cutoff, and whether reset times are relative or absolute.
- **Quota format**: A supported way for a provider to report its quota windows and values.
- **Cap**: A non-resetting spend or usage limit with a remaining value and a known maximum.
- **Prepaid balance**: A non-resetting amount that runs down as the user spends it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In both the nonzero and zero quota scenarios, the colored bar shows the correct actual quota and a distinguishable 50% even-use benchmark halfway through the window. The displayed reset time matches the known reset time.
- **SC-002**: Verify window-level errors for missing quota or reset time, one provider-level error and no old bars for a whole-provider failure, and an unchanged actual quota bar and reset time when only the benchmark is unavailable. Unaffected windows and providers remain visible in all cases.
- **SC-003**: With at least two supported providers and at least two windows for one provider, verify first-use defaults, saved selections after switching sessions and restarting the same instance, that a newly added provider appears with its current windows, and that a new window type for an existing provider requires selection while ordinary resets do not.
- **SC-004**: 100% of the providers named in REQ 2 are supported; no unlisted provider is presented as built-in. Verification records the plugin version and the authentication method tested.
- **SC-005**: A user can add one custom provider, see its selected windows, update its label or key, and remove it.
- **SC-006**: Verify color below, at, and above the default 10% cutoff, with the benchmark above, equal to, below, or unavailable relative to actual quota. Verify that changing the cutoff applies to all windows and that danger takes precedence over warning.
- **SC-007**: Verify refresh on open, periodically while visible, manually, and at reset subject to provider limits. Verify that automatic refresh stops while the panel is hidden, unexpired bars remain during refresh, and expired bars are replaced by loading even when provider limits delay the fetch.
- **SC-008**: Verify distinct outcomes for no eligible providers configured, all quotas hidden by selection, and a selected provider reporting no windows. A provider failure remains an error, not an empty state.
- **SC-009**: Verify that a spend cap and a lifetime limit each show a remaining-or-used-versus-maximum bar, following the display setting, with no reset or benchmark, and that a prepaid balance shows a number with no bar. Verify that neither display invents a reset or benchmark.
- **SC-010**: Verify relative reset time on first use, the absolute 24-hour/weekday/date formats after the user switches the setting, and that the choice survives a session switch and restart on the same instance.
- **SC-011**: Verify the default Remaining view, the matching Used values and benchmark after switching, and restoration of the choice on reopening. Verify that switching mode does not change colors, resets, balances, or provider/window selection.

## Assumptions

- Planning must confirm the Work Status section can be hosted on the supported clients and that every REQ 2 provider can be connected and read. If the evidence conflicts with the approved requirements, bring the conflict back for review.
- Living REQ 1 was amended on 2026-11-23 to define the even-use estimate, allow omitting it when only window timing is missing, and cover non-resetting caps and balances. FR-002 and FR-013 now follow it.
- Living REQ 2 was amended on 2026-11-23 to a named provider set: custom providers, Codex, OpenCode Go, OpenRouter, Tavily, and OpenCode Zen. FR-004 and SC-004 follow it.
- OpenChamber-defined custom providers are out of scope. Reading them would require host data the plugin cannot access.

## Resolved Decisions

- **REQ 1 — Refresh and failure states:** Resolved. The section loads the snapshot every 5 seconds, attempts a refresh on mount, every 60 seconds, at reset, and manually. The service enforces provider limits and schedules a retry when an attempt is blocked. Host mount, refresh, and collapse timing were verified in an isolated OpenChamber instance.
- **REQ 1 — Display details:** Resolved. Rows show quota remaining by default, or quota used when configured. Switching mode does not change colors, resets, balances, or the provider/window selection. Reset times are relative by default. The countdown refreshes from the snapshot poll.
- **REQ 2/3 — Host integration and provider coverage:** Resolved for OpenChamber 2.8.0. A local guest service owns provider I/O and credentials. Live Tavily, OpenRouter, and OpenCode Go keys were verified; Zen key support and Codex token lifetime remain verification items. Load/unload timing was verified.
- **REQ 4 — Selection behavior:** Resolved. Removed providers retain their window selection. A newly added provider is auto-enabled with its current windows; a newly reported window type stays opt-in.
- **REQ 5 — Custom provider setup:** Resolved. Add, edit, and remove are in Quota settings; custom labels are unique; one supported format, no mappings.
