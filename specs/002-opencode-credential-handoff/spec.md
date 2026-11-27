# Feature Specification: OpenCode Credential Handoff

**Feature Branch**: `002-opencode-credential-handoff`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Implement REQ-2 from docs/REQUIREMENTS.md, specifically for the non-custom providers that OpenCode already supports."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See all quotas in the Quotas section without key entry (Priority: P1)

A user approves the extension and sees the quotas for their OpenRouter, OpenCode Go, OpenCode Zen, OpenAI, Tavily or Exa sign-ins without entering keys in Quota settings. Quotas works with OpenChamber’s Usage area hidden.

**Why this priority**: This is the core value: one credential copy, OAuth-capable providers become usable, and the extension's own Quotas section remains the single quota display even when OpenChamber's Usage area is hidden.

**Independent Test**: With OpenCode holding credentials for the six and no stored keys for them, approve the plugin and confirm each signed-in provider appears in the Quotas section. Hide OpenChamber's Usage area and confirm the Quotas section still updates.

**Acceptance Scenarios**:

1. **Given** OpenCode holds a credential for a declared provider and the user approved the plugin, **When** the Quotas section refreshes, **Then** that provider's usage is shown without a key being entered in Quota settings.
2. **Given** the extension is enabled, **When** Quotas is shown, **Then** signed-in providers appear and providers without usable credentials are omitted.
3. **Given** OpenChamber's built-in Usage area is hidden, **When** the Quotas section refreshes, **Then** the six OpenCode providers still update; the Quotas section does not depend on the Usage area.
4. **Given** OpenCode holds no credential for a declared provider, **When** the Quotas section refreshes, **Then** that provider is omitted from Quotas and Quota settings; if no OpenCode provider has a credential, the section shows guidance to sign in through OpenCode, and no error or invented data appears.
5. **Given** the extension is enabled, **When** OpenChamber's Usage area is visible, **Then** the extension adds no row or card to it; the Quotas section is the only extension quota display.

---

### User Story 2 - Keep the credentials inside OpenCode (Priority: P1)

OpenChamber’s Extensions settings asks for approval of the local service and discloses the plugin’s full OpenCode access. The plugin reads only the six declared providers’ credentials inside OpenCode and sends only usage readings to the service.

**Why this priority**: Credential scope and secrecy are the conditions that make the plugin acceptable.

**Independent Test**: Review the plugin grant and the extension's consent text, exercise a refresh, and inspect stored data, logs, snapshots, settings responses, the bridge payload, and rendered content for any credential.

**Acceptance Scenarios**:

1. **Given** the extension is installed or updated, **When** the user reviews the grant in Extensions settings, **Then** it discloses the service permission and full OpenCode access.
2. **Given** the plugin runs, **When** it reads credentials, **Then** it reads only the six declared providers and does not read other providers' credentials, conversation content, or unrelated OpenCode data.
3. **Given** a reading is requested, **When** it completes, **Then** the credential does not appear in storage, logs, snapshots, settings responses, the panel, or the bridge payload.
4. **Given** the plugin supplies usage for an unlisted provider, **When** the extension handles it, **Then** the reading is rejected and not shown.
5. **Given** approval is granted but the plugin is unavailable, **When** Quotas refreshes, **Then** eligible last readings remain visible.
6. **Given** the package's permission request is declined or withdrawn, **When** the user opens Quotas, **Then** it states that approval is required; no provider refresh is promised without the service permission.

---

### User Story 3 - Recover from an expired sign-in (Priority: P2)

When an OpenCode credential has expired or been revoked, Quota settings names the provider and directs the user to sign in again through OpenCode. The provider returns to Quotas after a successful refresh, even with OpenChamber’s Usage area hidden.

**Why this priority**: Sign-ins expire; a silent failure or invented data would mislead users about remaining quota.

**Independent Test**: With Usage hidden, simulate an expired credential, confirm the named error in Quota settings, then restore the sign-in and confirm usage returns to Quotas.

**Acceptance Scenarios**:

1. **Given** a declared credential is expired or revoked, **When** usage refreshes, **Then** Quota settings names the authentication failure, the provider is omitted from Quotas, and other providers keep their readings.
2. **Given** the user signs in again through OpenCode, **When** the next refresh occurs, **Then** the error clears and usage returns, with Usage still hidden.
3. **Given** the provider is unreachable or times out, **When** usage refreshes, **Then** the error identifies a connectivity failure rather than an authentication failure.

---

### User Story 4 - Preserve settings and usage across restarts (Priority: P2)

Normal operation preserves supported settings and usage cache without modifying OpenCode logins or migrating or wiping old development data.

**Acceptance Scenarios**:

US4/AC1 and US4/AC3 are retired.

2. **Given** saved settings and cached quota, **When** the extension restarts or reloads, **Then** both persist and OpenCode logins remain unchanged.

---

### User Story 5 - Keep working when the plugin is unavailable (Priority: P3)

After package approval, if the plugin fails to load or cannot reach the service, eligible last readings remain visible with an out-of-date notice. With no previous reading, show the notice alone. A stale window stays historical after its old reset time, with no live estimate or false refreshing claim. Rejecting or disabling the package prevents service operation.

**Why this priority**: The feature must degrade honestly: a last reading stays useful, but it must never pass for a current one, and a broken plugin must not break the rest of the extension.

**Independent Test**: Simulate a plugin outage after approval. Confirm historical bars and the notice remain, then restore the plugin and confirm the next cycle clears the notice.

**Acceptance Scenarios**:

1. **Given** the plugin is missing or failed to load, **When** the Quotas section refreshes, **Then** the six keep their last reading with a bridge-unavailable notice (or show the notice alone when there is no reading yet) and do not use a stored key.
2. **Given** OpenCode runs on a different host from the extension service and the bridge cannot reach it, **When** the section refreshes, **Then** the same state is shown and the limitation is documented.
3. **Given** the approved extension service has stopped, **When** the section refreshes, **Then** its post-upgrade cache preserves the last reading, the service restarts on demand, and the plugin reconnects.
4. **Given** the plugin or service returns, **When** the next refresh occurs, **Then** the bridge-unavailable notice clears and usage updates.
5. **Given** a cached resetting window whose reset time has passed, **When** the bridge is unavailable, **Then** Quotas shows the last sampled value and its age as historical, without a live estimate or a refreshing claim.

---

### Edge Cases

- OpenChamber's Usage area is hidden or visible: the Quotas section is independent and keeps refreshing; the extension adds no row to the Usage area.
- The plugin supplies usage for an undeclared provider: it is rejected.
- A declared credential is expired: an authentication error appears; retries back off rather than looping.
- Only some providers have credentials: those show; the others are omitted until signed in.
- OpenCode's credential changes: the next refresh picks it up without a restart.
- The extension service restarts: the bridge endpoint is refreshed and the plugin reconnects.
- The extension is paused or removed: the plugin is removed by the host, the service stops, and the Quotas section disappears.
- OpenChamber is remote from OpenCode: the bridge cannot cross hosts; the six keep their last reading with the bridge-unavailable notice.
- Enterprise policy or a remote OpenCode prevents the plugin from running or reaching the service: the extension remains usable and shows the bridge-unavailable notice rather than failing silently.
- A provider is encountered before it has a successful reading: its first real windows initialize selection once, but an explicit provider hide or window deselection made earlier is preserved.
- Two windows connected to one OpenChamber server edit settings: both share one authoritative selection; independent field edits do not overwrite one another.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST NOT declare OpenChamber's usage-provider role. It MUST ship an OpenCode plugin that fetches the six OpenCode-backed providers' usage and supplies the extension service with usage readings.
- **FR-002**: OpenChamber’s Extensions settings MUST disclose the service permission and plugin’s full OpenCode access before package approval. Quota settings points users to OpenCode for sign-in and shows provider status. Rejecting the package blocks the service. New permissions require approval; code or folder updates alone do not.
- **FR-003**: The plugin MUST read only the six declared providers' credentials and MUST NOT read other providers' credentials, conversation content, or unrelated OpenCode data.
- **FR-004**: The plugin MUST use the credentials only inside OpenCode to fetch the six providers' usage and MUST send only normalized usage readings to the extension service over an authenticated local channel. Credentials MUST NOT be sent over that channel.
- **FR-005**: The service MUST reject usage readings for providers that are not in the declared list and MUST validate each reading against the snapshot schema.
- **FR-006**: The plugin and service MUST use the same normalization rules for the six providers' windows, caps, and balances, without inventing missing values or resets.
- **FR-007**: Quotas MUST support all six OpenCode-backed providers independently of built-in Usage visibility. Users MUST be able to reorder providers and collapse each one. Collapse state persists when Quotas or OpenChamber reopens. A collapsed provider shows one configured short summary, including a reported pay-as-you-go reading for Tavily when selected. Least remaining requires at least two percentage windows, and earliest reset requires at least two distinct reset times. Provider encounter and first successful window initialization MUST be tracked separately, preserving explicit hides and empty window selections.
- **FR-008**: When a credential is expired or rejected, the extension MUST NOT list that provider in Quotas and MUST NOT show invented usage. The authentication error naming the provider MUST appear in the Quota settings provider status table, and the provider MUST recover after re-authentication. Providers whose credential was never attempted MUST NOT be listed in Quotas or Quota settings.
- **FR-009**: When OpenCode holds no credential for a declared provider, the extension MUST omit that provider from Quotas; when no OpenCode provider is signed in it MUST show guidance to sign in through OpenCode. It MUST NOT show an error, call the provider, or list the provider in Quota settings.
- **FR-010**: Tavily and Exa MUST use OpenCode credentials. Quota settings MUST NOT accept manual keys for them.
- **FR-011**: The extension MUST add no row or card to OpenChamber's Usage area; the Quotas section is the only extension quota display.
- **FR-012**: Shared settings and usage cache MUST survive normal restarts and reloads. The extension MUST NOT automatically wipe data, modify OpenCode logins, or fall back to service-side provider credentials. Old development data need not be migrated.
- **FR-013**: After approval, a plugin outage MUST keep eligible last readings with an out-of-date notice. Stale windows stay historical, including after reset, without live estimates or false refreshing claims. A plugin that has never connected MUST show one restart notice. Package rejection or withdrawal requires approval before refresh.
- **FR-014**: If OpenCode runs on a different host from the extension service and the local bridge cannot reach it, the extension MUST behave as FR-013 describes and document that independent refresh is unsupported in that topology.
- **FR-015**: Every refresh request MUST cover all providers; provider-specific requests are not supported. Each provider's scheduler MUST choose a new fetch, reuse cached data, or join in-flight work according to its five-minute poll interval, a 30-second manual/event floor, and `retryAt`. Manual refresh may bypass the poll wait but not the floor or `Retry-After`. Repeated failures back off from one to fifteen minutes. No trigger may bypass `Retry-After`. A bridge refresh result MUST contain all six providers, including cached, missing and failed entries.
- **FR-016**: Retired; merged into FR-013.
- **FR-017**: Clients of the same OpenChamber server MUST share Quota settings. Different servers MUST NOT overwrite one another’s settings or bridge discovery files.
- **FR-018**: While the local bridge is healthy, request discovery MUST take about one second (one-second polling target); new provider work MUST have a ten-second end-to-end fetch budget, including sequential fallback calls. Completion/publication has a separate bounded allowance. A timeout returns cached data marked stale or a timeout state, never an unbounded wait.

### Key Entities

- **Declared provider**: One of OpenRouter, OpenCode Go, OpenCode Zen, OpenAI, Tavily, or Exa, named in the plugin consent text and the plugin's read limit.
- **Package approval**: Consent to the complete requested permission list, including service and plugin. Code/folder changes alone do not re-prompt; new permissions do.
- **Server settings**: One durable selection document shared by clients of the same OpenChamber server.
- **Bridged usage**: A normalized usage reading the plugin sends to the extension service. It contains no credential.
- **Bridge**: The authenticated local channel the plugin uses to send usage readings. No credential crosses it.
- **Usage reading**: The normalized windows, caps, balances, configured state, and error for a provider.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user whose OpenCode holds credentials for every declared provider can see all signed-in providers in the Quotas section without entering any key for the six (zero key-entry steps).
- **SC-002**: With Usage hidden and Quotas visible, the healthy plugin starts an all-provider cycle every five minutes without user action and publishes fresh/cached/error outcomes within SC-012's budget. A cycle does not force a rate-limited provider to make a new HTTP request.
- **SC-003**: Every credential read by the plugin belongs to a declared provider; no credential crosses the bridge or reaches the service (verified by contract checks).
- **SC-004**: No copies of the six providers’ credentials appear outside OpenCode. Usage payloads, responses, logs and UI contain no secrets.
- **SC-005**: An expired credential produces an authentication error naming the provider on the next reading, with no invented bars or values; usage returns after re-authentication without showing Usage.
- **SC-006**: When the plugin is unavailable, eligible last readings remain visible with the bridge-unavailable notice.
- **SC-007**: Tavily and Exa keys stay in OpenCode and are never requested through the bridge.
- **SC-008**: Shared settings and usage cache survive normal restart and reload; OpenCode logins stay unchanged.
- **SC-009**: When more than one declared provider is present, every displayed window and error identifies its provider.
- **SC-010**: The extension adds no row or card to OpenChamber's Usage area; the Quotas section is the only extension quota display.
- **SC-011**: Two clients of the same server see the same saved settings within the normal five-second UI reload interval; concurrent edits to different fields are both retained.
- **SC-012**: Controlled timing tests show discovery within the one-second poll plus transport, fetching bounded to ten seconds after discovery, and result publication/timeout within twelve seconds of request admission. Fresh/cached/in-flight results all acknowledge the all-provider request.

## Assumptions

- Requirement trace: implements REQ 2 / SC-004 under ADR-010. REQ 1, 3, and 4 continue to govern Quotas and its display controls.
- The host usage-provider role is not used. The OpenCode plugin bridge is the only source for the six. This drops the host-enforced provider-list approval: the plugin grant is the full-access approval, and the extension's code is trusted to read only the six.
- This is a pre-release upgrade; backward compatibility for existing stored credentials or connections for the six providers is not required.
- The package requests service and plugin permissions together. After approval the plugin uses the six credentials inside OpenCode and shares normalization rules with the service; plugin failure is distinct from package permission refusal.
- T001 must verify that the supported OpenCode plugin runtime resolves only the selected six integration credentials; no successful feasibility proof is claimed yet.
- The plugin and the extension service share a host. When OpenCode is remote, the local bridge cannot cross hosts; that topology shows the bridge-unavailable notice and is documented as unsupported for independent refresh.
- The bridge is local-only and authenticated, and it carries usage readings only; no credential is sent over it or written to disk.
- Refresh is all-provider only. The bridge acknowledges with a complete six-provider result; internal provider rate limits decide whether data is fetched or cached.
- There are no external users yet, so old development formats and instance-local settings need no migration. Supported state is server-shared and preserved normally. The feature contains no automatic wipe; a developer reset requires a separate manual action. OpenCode credentials are never reset.
- OpenChamber's built-in Usage area may be hidden; the extension does not depend on it and adds no row to it.
- After package approval, a failed/unreachable plugin leaves the six on their last reading with a bridge-unavailable notice, without stored-key fallback or service-side credential reads. Rejecting or disabling the whole package instead prevents service operation. Post-upgrade snapshot cache preserves last readings across service restarts.
- ADR-010 supersedes ADR-009 for credential sourcing; ADR-009's service architecture and secret-free snapshot stand.
- Provider APIs, normalization rules, and display preferences remain authoritative for the six providers.
