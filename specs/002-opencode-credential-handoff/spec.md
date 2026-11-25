# Feature Specification: OpenCode Credential Handoff

**Feature Branch**: `002-opencode-credential-handoff`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Implement REQ-2 from docs/REQUIREMENTS.md, specifically for the non-custom providers that OpenCode already supports."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See all quotas in the Quotas section without key entry (Priority: P1)

A user already has credentials for OpenRouter, OpenCode Go, OpenCode Zen, or OpenAI Codex in OpenCode. They enable the quota extension and approve its OpenCode plugin. The Quotas section shows all six supported providers: the four OpenCode providers without any key entered in Quota settings, plus Tavily and custom providers from their existing keys. The Quotas section is independent of OpenChamber's built-in Usage area, which the user may keep hidden.

**Why this priority**: This is the core value: one credential copy, OAuth-capable providers become usable, and the extension's own Quotas section remains the single quota display even when OpenChamber's Usage area is hidden.

**Independent Test**: With OpenCode holding credentials for the four and no stored keys for them, approve the plugin and confirm all six appear in the Quotas section. Hide OpenChamber's Usage area and confirm the Quotas section still updates.

**Acceptance Scenarios**:

1. **Given** OpenCode holds a credential for a declared provider and the user approved the plugin, **When** the Quotas section refreshes, **Then** that provider's usage is shown without a key being entered in Quota settings.
2. **Given** the extension is enabled, **When** the Quotas section is shown, **Then** OpenRouter, OpenCode Go, OpenCode Zen, and OpenAI Codex appear alongside Tavily and custom providers.
3. **Given** OpenChamber's built-in Usage area is hidden, **When** the Quotas section refreshes, **Then** the four OpenCode providers still update; the Quotas section does not depend on the Usage area.
4. **Given** OpenCode holds no credential for a declared provider, **When** the Quotas section refreshes, **Then** that provider shows a not-configured state with guidance to sign in through OpenCode, and no error or invented data appears.
5. **Given** the extension is enabled, **When** OpenChamber's Usage area is visible, **Then** the extension adds no row or card to it; the Quotas section is the only extension quota display.

---

### User Story 2 - Keep the credentials inside OpenCode (Priority: P1)

OpenChamber asks for approval of the extension's complete permission list, including its service and OpenCode plugin. The plugin's full OpenCode access is disclosed, and the README names the four providers and the read limit before installation. The plugin uses their credentials inside OpenCode and sends only usage readings to the service. The service never receives these four credentials; current Tavily/custom keys remain service-owned.

**Why this priority**: Credential scope and secrecy are the conditions that make the plugin acceptable.

**Independent Test**: Review the plugin grant and the extension's consent text, exercise a refresh, and inspect stored data, logs, snapshots, settings responses, the bridge payload, and rendered content for any credential.

**Acceptance Scenarios**:

1. **Given** the extension is installed or updated, **When** the user reviews the plugin grant, **Then** it discloses full OpenCode access, and the extension's consent text names the four providers and the read limit.
2. **Given** the plugin runs, **When** it reads credentials, **Then** it reads only the four declared providers and does not read other providers' credentials, conversation content, or unrelated OpenCode data.
3. **Given** a reading is requested, **When** it completes, **Then** the credential does not appear in storage, logs, snapshots, settings responses, the panel, or the bridge payload.
4. **Given** the plugin supplies usage for an unlisted provider, **When** the extension handles it, **Then** the reading is rejected and not shown.
5. **Given** the package is approved but its plugin fails to load or cannot reach the service, **When** the Quotas section refreshes, **Then** Tavily and custom providers still work.
6. **Given** the package's permission request is declined or withdrawn, **When** the user opens Quotas, **Then** it states that approval is required; no provider refresh is promised without the service permission.

---

### User Story 3 - Recover from an expired sign-in (Priority: P2)

When OpenCode's credential has expired or been revoked, the user sees an authentication error for that provider in the Quotas section and is told to sign in again through OpenCode. After they do, the next plugin refresh clears the error, even with OpenChamber's Usage area hidden.

**Why this priority**: Sign-ins expire; a silent failure or invented data would mislead users about remaining quota.

**Independent Test**: Simulate an expired credential with Usage hidden, confirm an authentication error naming the provider, supply a valid credential, and confirm usage returns without showing Usage.

**Acceptance Scenarios**:

1. **Given** a declared credential is expired or revoked, **When** usage refreshes, **Then** an authentication error naming the provider is shown, no bars or values are invented for it, and other providers' last known usage is not replaced by empty or invented values.
2. **Given** the user signs in again through OpenCode, **When** the next refresh occurs, **Then** the error clears and usage returns, with Usage still hidden.
3. **Given** the provider is unreachable or times out, **When** usage refreshes, **Then** the error identifies a connectivity failure rather than an authentication failure.

---

### User Story 4 - Keep Tavily and custom providers unchanged (Priority: P2)

Tavily and custom providers use keys entered in Quota settings and appear in Quotas as before. No one else uses this pre-release extension, so backward compatibility and migration of old development records are not required. This does not introduce automatic wiping: normal installation, startup and upgrades preserve supported settings, connections and cache. If old development data is incompatible, the developer may reset it manually; no reset runs as part of this feature. OpenCode logins are untouched. A stored key is never a fallback for the four OpenCode providers.

**Why this priority**: The change must not break the providers OpenCode cannot supply. Backward compatibility for the four is not required.

**Independent Test**: Configure Tavily/custom keys and shared settings in the supported format, restart and reload the extension, and verify persistence without automatic clearing or any change to OpenCode logins. No legacy migration test is required.

**Acceptance Scenarios**:

1. **Given** a Tavily or custom provider with a key in Quota settings, **When** usage refreshes, **Then** it uses that key and stays in the Quotas section.
2. **Given** supported Tavily/custom connections, settings and cache, **When** the extension starts or is reloaded, **Then** that data is preserved without an automatic reset, and OpenCode logins remain unchanged.
3. **Given** the user removes a key-based connection, **When** usage refreshes, **Then** only that provider disappears from the Quotas section.

---

### User Story 5 - Keep working when the plugin is unavailable (Priority: P3)

After package approval, if the plugin fails to load or cannot reach the service, the four keep their last reading with an out-of-date notice. A provider with no previous reading shows the notice alone. A stale resetting window remains visibly historical after its old reset time; it does not show endless refreshing or a newly calculated even-use estimate. Tavily/custom continue to work. Rejecting or disabling the whole package instead prevents service operation.

**Why this priority**: The feature must degrade honestly: a last reading stays useful, but it must never pass for a current one, and a broken plugin must not break the rest of the extension.

**Independent Test**: Simulate plugin load/connectivity failure without withdrawing package approval, confirm historical bars and notice remain while Tavily/custom work, then restore the plugin and clear the notice on the next cycle.

**Acceptance Scenarios**:

1. **Given** the plugin is missing or failed to load, **When** the Quotas section refreshes, **Then** the four keep their last reading with a bridge-unavailable notice (or show the notice alone when there is no reading yet) and do not use a stored key.
2. **Given** OpenCode runs on a different host from the extension service and the bridge cannot reach it, **When** the section refreshes, **Then** the same state is shown and the limitation is documented.
3. **Given** the approved extension service has stopped, **When** the section refreshes, **Then** its post-upgrade cache preserves the last reading, the service restarts on demand, and the plugin reconnects.
4. **Given** the plugin or service returns, **When** the next refresh occurs, **Then** the bridge-unavailable notice clears and usage updates.
5. **Given** a cached resetting window whose reset time has passed, **When** the bridge is unavailable, **Then** Quotas shows the last sampled value and its age as historical, without a live estimate or a refreshing claim.

---

### Edge Cases

- OpenChamber's Usage area is hidden or visible: the Quotas section is independent and keeps refreshing; the extension adds no row to the Usage area.
- The plugin supplies usage for an undeclared provider: it is rejected.
- A declared credential is expired: an authentication error appears; retries back off rather than looping.
- Only some providers have credentials: those update; the others show not configured.
- OpenCode's credential changes: the next refresh picks it up without a restart.
- The extension service restarts: the bridge endpoint is refreshed and the plugin reconnects.
- The extension is paused or removed: the plugin is removed by the host, the service stops, and the Quotas section disappears.
- OpenChamber is remote from OpenCode: the bridge cannot cross hosts; the four keep their last reading with the bridge-unavailable notice.
- Enterprise policy or a remote OpenCode prevents the plugin from running or reaching the service: the extension remains usable and shows the bridge-unavailable notice rather than failing silently.
- A custom provider reports more windows than the Quotas section can show: the existing selection rules and limits apply; no invented windows.
- A provider is encountered before it has a successful reading: its first real windows initialize selection once, but an explicit provider hide or window deselection made earlier is preserved.
- Two windows connected to one OpenChamber server edit settings: both share one authoritative selection; independent field edits do not overwrite one another.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST NOT declare OpenChamber's usage-provider role. It MUST ship an OpenCode plugin that fetches the four OpenCode providers' usage and supplies the extension service with usage readings.
- **FR-002**: Package approval MUST disclose the service permission and plugin's full OpenCode access. The README before installation and Quota settings after approval MUST name the four providers and their read limit. Rejecting the package does not leave an independently approved service. Plugin code/folder updates alone do not promise a new approval dialog; adding permissions requires approval again.
- **FR-003**: The plugin MUST read only the four declared providers' credentials and MUST NOT read other providers' credentials, conversation content, or unrelated OpenCode data.
- **FR-004**: The plugin MUST use the credentials only inside OpenCode to fetch the four providers' usage and MUST send only normalized usage readings to the extension service over an authenticated local channel. Credentials MUST NOT be sent over that channel.
- **FR-005**: The service MUST reject usage readings for providers that are not in the declared list and MUST validate each reading against the snapshot schema.
- **FR-006**: The plugin and service MUST use the same normalization rules for the four providers' windows, caps, and balances, without inventing missing values or resets.
- **FR-007**: Quotas MUST support all six providers independently of Usage visibility. Provider encounter and first successful window initialization MUST be tracked separately, preserving explicit hides and empty window selections.
- **FR-008**: When a credential is expired or rejected, the extension MUST report an authentication error naming the provider, MUST NOT show invented usage for it, and MUST recover after re-authentication.
- **FR-009**: When OpenCode holds no credential for a declared provider, the extension MUST show a not-configured state with guidance to sign in through OpenCode; it MUST NOT show an error or call the provider.
- **FR-010**: Tavily and custom providers MUST continue to use keys entered in Quota settings and MUST appear in the Quotas section alongside the four.
- **FR-011**: The extension MUST add no row or card to OpenChamber's Usage area; the Quotas section is the only extension quota display.
- **FR-012**: This pre-release feature need not migrate or preserve compatibility with old development records. It MUST NOT add automatic data wiping on installation, startup or upgrade. Supported Tavily/custom connections, shared settings and usage cache MUST survive normal restarts/reloads; OpenCode logins MUST remain untouched, and the four MUST never use stored keys as a fallback. Any development-data reset is a separate manual action, not an implementation requirement.
- **FR-013**: After package approval, plugin load/reachability failure MUST keep the four's last reading with an out-of-date notice, without stored-key fallback or service-side credential-store reads. Stale resetting windows MUST remain historical even after their reset time, with no live estimate or false refreshing message. Tavily/custom continue. Package rejection or withdrawal instead requires approval before any service refresh.
- **FR-014**: If OpenCode runs on a different host from the extension service and the local bridge cannot reach it, the extension MUST behave as FR-013 describes and document that independent refresh is unsupported in that topology.
- **FR-015**: Every refresh request MUST cover all providers; provider-specific requests are not supported. Each provider's scheduler MUST choose a new fetch, reuse cached data, or join in-flight work according to its internal minimum interval and `retryAt`. No trigger may bypass that scheduler. A bridge refresh result MUST contain all four providers, including cached, missing and failed entries.
- **FR-016**: Retired; merged into FR-013.
- **FR-017**: All clients connected to the same OpenChamber server MUST share one set of Quota settings and connections. Different servers MUST not overwrite one another's settings or bridge discovery files. No per-window/instance preference store is authoritative.
- **FR-018**: While the local bridge is healthy, request discovery MUST take about one second (one-second polling target); new provider work MUST have a ten-second end-to-end fetch budget, including sequential fallback calls. Completion/publication has a separate bounded allowance. A timeout returns cached data marked stale or a timeout state, never an unbounded wait.

### Key Entities

- **Declared provider**: One of OpenRouter, OpenCode Go, OpenCode Zen, or OpenAI Codex, named in the plugin consent text and the plugin's read limit.
- **Package approval**: Consent to the complete requested permission list, including service and plugin. Code/folder changes alone do not re-prompt; new permissions do.
- **Server settings**: One durable selection document shared by clients of the same OpenChamber server.
- **Bridged usage**: A normalized usage reading the plugin sends to the extension service. It contains no credential.
- **Bridge**: The authenticated local channel the plugin uses to send usage readings. No credential crosses it.
- **Usage reading**: The normalized windows, caps, balances, configured state, and error for a provider.
- **Stored connection**: A supported Tavily/custom configuration and key preserved during normal operation. Old development formats need no migration; they are not automatically deleted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user whose OpenCode holds credentials for every declared provider can see all six providers in the Quotas section without entering any key for the four (zero key-entry steps).
- **SC-002**: With Usage hidden and Quotas visible, the healthy plugin starts an all-provider cycle every five minutes without user action and publishes fresh/cached/error outcomes within SC-012's budget. A cycle does not force a rate-limited provider to make a new HTTP request.
- **SC-003**: Every credential read by the plugin belongs to a declared provider; no credential crosses the bridge or reaches the service (verified by contract checks).
- **SC-004**: Zero new copies of the four OpenCode credentials appear outside OpenCode. Usage payloads, responses, logs and rendered UI contain zero secrets. Current Tavily/custom keys are allowed only in their intended service-owned key store. Legacy development-data migration or deletion is not part of this check.
- **SC-005**: An expired credential produces an authentication error naming the provider on the next reading, with no invented bars or values; usage returns after re-authentication without showing Usage.
- **SC-006**: When the plugin is unavailable, the four keep their last reading with the bridge-unavailable notice, and Tavily/custom checks still pass.
- **SC-007**: Tavily and custom provider checks pass unchanged, and their keys are never requested through the plugin bridge.
- **SC-008**: Supported Tavily/custom connections, shared settings and usage cache remain after normal restart/reload, without an automatic reset; OpenCode logins remain unchanged. No legacy-record migration is required.
- **SC-009**: When more than one declared provider is present, every displayed window and error identifies its provider.
- **SC-010**: The extension adds no row or card to OpenChamber's Usage area; the Quotas section is the only extension quota display.
- **SC-011**: Two clients of the same server see the same saved settings within the normal five-second UI reload interval; concurrent edits to different fields are both retained.
- **SC-012**: Controlled timing tests show discovery within the one-second poll plus transport, fetching bounded to ten seconds after discovery, and result publication/timeout within twelve seconds of request admission. Fresh/cached/in-flight results all acknowledge the all-provider request.

## Assumptions

- Requirement trace: implements REQ 2 / SC-004 and is governed by ADR-010. REQ 1, 3, and 4 behavior for the Quotas section is unchanged; the four OpenCode providers use the same section, windows, caps, and balances model as Tavily/custom.
- The host usage-provider role is not used. The OpenCode plugin bridge is the only source for the four. This drops the host-enforced provider-list approval: the plugin grant is the full-access approval, and the extension's code is trusted to read only the four.
- This is a pre-release upgrade; backward compatibility for existing stored credentials or connections for the four providers is not required.
- The package requests service and plugin permissions together. After approval the plugin uses the four credentials inside OpenCode and shares normalization rules with the service; plugin failure is distinct from package permission refusal.
- T001 must verify that the supported OpenCode plugin runtime resolves only the selected four integration credentials; no successful feasibility proof is claimed yet.
- The plugin and the extension service share a host. When OpenCode is remote, the local bridge cannot cross hosts; that topology shows the bridge-unavailable notice and is documented as unsupported for independent refresh.
- The bridge is local-only and authenticated, and it carries usage readings only; no credential is sent over it or written to disk.
- Refresh is all-provider only. The bridge acknowledges with a complete four-provider result; internal provider rate limits decide whether data is fetched or cached.
- There are no external users yet, so old development formats and instance-local settings need no migration. Supported state is server-shared and preserved normally. The feature contains no automatic wipe; a developer reset requires a separate manual action. OpenCode credentials are never reset.
- OpenChamber's built-in Usage area may be hidden; the extension does not depend on it and adds no row to it.
- After package approval, a failed/unreachable plugin leaves the four on their last reading with a bridge-unavailable notice, without stored-key fallback or service-side credential reads. Rejecting or disabling the whole package instead prevents service operation. Post-upgrade snapshot cache preserves last readings across service restarts.
- ADR-010 supersedes ADR-009 for credential sourcing; ADR-009's service architecture and secret-free snapshot stand.
- Provider APIs, normalization rules, and display preferences from the existing feature remain authoritative for all six providers.
