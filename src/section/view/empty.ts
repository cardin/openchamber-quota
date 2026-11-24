export const renderEmpty = (hasProviders: boolean, hasVisible: boolean): string => {
  if (!hasProviders) {
    return `<div class="quota-empty" role="status">
      <strong>No providers configured.</strong>
      <p>Add one in <strong>Quota settings</strong> (sidebar → Pages).</p>
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
