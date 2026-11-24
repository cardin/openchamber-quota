import type { DisplaySelection, Snapshot } from "../../core/types.ts";
import { visibleBalances } from "../../core/normalize.ts";
import { escapeAttr, escapeHtml } from "./html.ts";
import { providerIcon } from "./icons.ts";

export const renderSelector = (snapshot: Snapshot, selection: DisplaySelection): string => {
  const providers = snapshot.providers
    .map((provider) => {
      const providerChecked = !selection.saved || selection.providers.includes(provider.connectionId);
      const hasBalances = visibleBalances(provider.balances).length > 0;
      const balancesVisible = !selection.hiddenBalances.includes(provider.connectionId);
      const windows = provider.windows
        .map((window) => {
          const checked =
            !selection.saved ||
            (selection.windows[provider.connectionId] ?? []).includes(window.id);
          return `<label class="quota-check quota-check-window">
            <input type="checkbox" data-window-toggle data-provider="${escapeAttr(provider.connectionId)}" data-window="${escapeAttr(window.id)}" ${checked ? "checked" : ""} />
            ${escapeHtml(window.label)}
          </label>`;
        })
        .join("");
      const balanceToggle = hasBalances
        ? `<label class="quota-check quota-check-window">
            <input type="checkbox" data-balance-toggle data-provider="${escapeAttr(provider.connectionId)}" ${balancesVisible ? "checked" : ""} />
            non-reporting balances
          </label>`
        : "";
      const options = `${windows}${balanceToggle}`;
      return `<div class="quota-select-provider">
        <label class="quota-check quota-provider-choice">
          <input type="checkbox" data-provider-toggle data-provider="${escapeAttr(provider.connectionId)}" ${providerChecked ? "checked" : ""} />
          <span class="quota-select-icon">${providerIcon(provider.kind)}</span>
          <span class="quota-select-label">${escapeHtml(provider.label)}</span>
        </label>
        ${options ? `<div class="quota-select-windows">${options}</div>` : ""}
      </div>`;
    })
    .join("");

  return `<section class="quota-settings-section quota-display-section">
    <div class="quota-section-heading">
      <div>
        <h3>Display</h3>
        <p class="quota-section-note">Choose which providers and windows appear in the Quotas panel.</p>
      </div>
    </div>
    <div class="quota-selector">
      ${providers || `<p class="quota-muted">No configured providers.</p>`}
    </div>
    <div class="quota-preferences">
      <label class="quota-preference">Show quota as
        <select data-quota-display>
          <option value="remaining" ${selection.quotaDisplay === "remaining" ? "selected" : ""}>Remaining</option>
          <option value="used" ${selection.quotaDisplay === "used" ? "selected" : ""}>Used</option>
        </select>
      </label>
      <label class="quota-preference">Danger cutoff
        <input type="number" min="0" max="100" step="1" data-cutoff value="${selection.cutoffPercent}" /> %
      </label>
      <label class="quota-preference">Reset time
        <select data-reset-time>
          <option value="relative" ${selection.resetTime === "relative" ? "selected" : ""}>Relative</option>
          <option value="absolute" ${selection.resetTime === "absolute" ? "selected" : ""}>Absolute</option>
        </select>
      </label>
    </div>
  </section>`;
};
