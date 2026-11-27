export const renderEmpty = (
  hasProviders: boolean,
  hasVisible: boolean,
  hasConfigured = true,
  hasAuthError = false,
  hasBridgeProblem = false,
): string => {
  if (!hasProviders) {
    return `<div class="quota-empty" role="status">
      <strong>No provider data yet.</strong>
      <p>Readings appear after the extension service starts.</p>
    </div>`;
  }
  if (!hasConfigured) {
    if (hasAuthError) {
      return `<div class="quota-empty" role="status">
        <strong>A provider needs attention.</strong>
        <p>Open <strong>Quota settings</strong> (sidebar → Pages) for the authentication error.</p>
      </div>`;
    }
    if (hasBridgeProblem) {
      return `<div class="quota-empty" role="status">
        <strong>The OpenCode plugin is not connected.</strong>
        <p>If you just approved the extension, restart OpenCode or OpenChamber.</p>
      </div>`;
    }
    return `<div class="quota-empty" role="status">
      <strong>No signed-in providers.</strong>
      <p>Sign in to a provider in OpenCode, then refresh.</p>
    </div>`;
  }
  if (!hasVisible) {
    return `<div class="quota-empty" role="status">
      <strong>All quotas are hidden.</strong>
      <p>Adjust the selection in <strong>Quota settings</strong> (sidebar → Pages).</p>
    </div>`;
  }
  return "";
};
