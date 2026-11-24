import type { Snapshot } from "../../core/types.ts";
import { formatAmount, visibleBalances } from "../../core/normalize.ts";
import { escapeHtml } from "./html.ts";

export const renderUsage = (snapshot: Snapshot | null): string => {
  const groups = (snapshot?.providers ?? [])
    .map((provider) => {
      const rows = visibleBalances(provider.balances)
        .map(
          (balance) => `<div class="quota-usage-row">
            <span class="quota-usage-label">${escapeHtml(balance.label)}</span>
            <span class="quota-usage-value">${escapeHtml(formatAmount(balance.value, balance.unit))}</span>
          </div>`,
        )
        .join("");
      return rows
        ? `<div class="quota-usage-group">
            <div class="quota-usage-provider">${escapeHtml(provider.label)}</div>
            ${rows}
          </div>`
        : "";
    })
    .filter(Boolean)
    .join("");

  return `<section class="quota-settings-section quota-usage-section">
    <div class="quota-section-heading">
      <div>
        <h3>Usage</h3>
        <p class="quota-section-note">Non-resetting balances reported by your providers.</p>
      </div>
    </div>
    ${groups || `<p class="quota-muted">${snapshot ? "No non-resetting balances reported." : "Loading usage…"}</p>`}
  </section>`;
};
