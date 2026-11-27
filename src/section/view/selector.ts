import type { DisplaySelection, Snapshot } from "../../core/types.ts";
import { visibleBalances } from "../../core/normalize.ts";
import {
  collapsedItemMode,
  collapsedModeSupport,
  isProviderDisplayable,
  isProviderVisible,
  isWindowVisible,
  normalizeCollapsedMode,
  orderedConnectionIds,
} from "../preferences.ts";
import { escapeAttr, escapeHtml } from "./html.ts";
import { providerIcon } from "./icons.ts";

export const renderSelector = (snapshot: Snapshot, selection: DisplaySelection): string => {
  const displayable = snapshot.providers.filter((provider) =>
    isProviderDisplayable(provider),
  );
  const ordered = orderedConnectionIds(
    displayable.map((provider) => provider.connectionId),
    selection.providerOrder,
  )
    .map((id) => displayable.find((provider) => provider.connectionId === id))
    .filter((provider): provider is (typeof displayable)[number] => provider !== undefined);
  const providers = ordered
    .map((provider, index) => {
      const providerChecked = isProviderVisible(selection, provider.connectionId);
      const balances = visibleBalances(provider.balances);
      const hasBalances = balances.length > 0;
      const balancesVisible = !selection.hiddenBalances.includes(provider.connectionId);
      const availableWindows = provider.windows.filter((window) =>
        isWindowVisible(selection, provider.connectionId, window.id),
      );
      const windows = provider.windows
        .map((window) => {
          const checked = isWindowVisible(selection, provider.connectionId, window.id);
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
      const savedMode =
        selection.collapsedQuota[provider.connectionId] ?? "least-remaining";
      const support = collapsedModeSupport(availableWindows);
      const choices = [
        ...(support.leastRemaining ? [{ value: "least-remaining", label: "Least remaining" }] : []),
        ...(support.earliestReset ? [{ value: "earliest-reset", label: "Earliest reset" }] : []),
        ...availableWindows.map(
          (window) => ({ value: collapsedItemMode("window", window.id), label: window.label }),
        ),
        ...provider.caps.map((cap) => ({ value: collapsedItemMode("cap", cap.id), label: cap.label })),
        ...(balancesVisible
          ? balances.map((balance) => ({ value: collapsedItemMode("balance", balance.id), label: balance.label }))
          : []),
      ];
      const windowMode = normalizeCollapsedMode(savedMode, availableWindows);
      const collapsedMode = choices.find((choice) => choice.value === savedMode)
        ?? choices.find((choice) => choice.value === windowMode)
        ?? choices.find((choice) => /^(cap|balance):/.test(choice.value))
        ?? choices[0];
      const collapsedOptions = choices.map(({ value, label }) =>
        `<option value="${escapeAttr(value)}" ${collapsedMode?.value === value ? "selected" : ""}>${escapeHtml(label)}</option>`,
      ).join("");
      return `<div class="quota-select-provider">
        <div class="quota-select-row">
          <label class="quota-check quota-provider-choice">
            <input type="checkbox" data-provider-toggle data-provider="${escapeAttr(provider.connectionId)}" ${providerChecked ? "checked" : ""} />
            <span class="quota-select-icon">${providerIcon(provider.kind)}</span>
            <span class="quota-select-label">${escapeHtml(provider.label)}</span>
          </label>
          <span class="quota-reorder">
            <button type="button" data-action="move-provider-up" data-provider="${escapeAttr(provider.connectionId)}" aria-label="Move ${escapeAttr(provider.label)} up" title="Move up" ${index === 0 ? "disabled" : ""}>↑</button>
            <button type="button" data-action="move-provider-down" data-provider="${escapeAttr(provider.connectionId)}" aria-label="Move ${escapeAttr(provider.label)} down" title="Move down" ${index === ordered.length - 1 ? "disabled" : ""}>↓</button>
          </span>
        </div>
        ${options ? `<div class="quota-select-windows">${options}</div>` : ""}
        ${
          choices.length > 0
            ? `<label class="quota-check quota-collapsed-choice">Collapsed shows
          <select data-collapsed-quota data-provider="${escapeAttr(provider.connectionId)}">${collapsedOptions}</select>
        </label>`
            : ""
        }
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
      ${providers || `<p class="quota-muted">No signed-in OpenCode providers. Sign in through OpenCode, then refresh.</p>`}
    </div>
    <div class="quota-preferences">
      <label class="quota-preference">Show quota as
        <select data-quota-display>
          <option value="remaining" ${selection.quotaDisplay === "remaining" ? "selected" : ""}>Remaining</option>
          <option value="used" ${selection.quotaDisplay === "used" ? "selected" : ""}>Used</option>
        </select>
      </label>
      <label class="quota-preference">Danger cutoff
        <span class="quota-cutoff-row">
          <input type="number" min="0" max="100" step="1" data-cutoff value="${selection.cutoffPercent}" />
          <span aria-hidden="true">%</span>
        </span>
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
