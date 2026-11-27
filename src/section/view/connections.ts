import type { Connection, Snapshot } from "../../core/types.ts";
import { escapeAttr, escapeHtml } from "./html.ts";
import { providerIcon } from "./icons.ts";
import { renderProviderStatus } from "./providers.ts";

export const renderConnections = (
  connections: Connection[],
  snapshot?: Snapshot | null,
): string => {
  const rows = connections
    .map(
      (connection) => `<li class="quota-connection">
        <div class="quota-connection-main">
          <span class="quota-connection-icon">${providerIcon(connection.kind)}</span>
          <span class="quota-connection-label">${escapeHtml(connection.label)}</span>
          <span class="quota-kind-chip">${connection.kind === "custom" ? "Custom" : "Built-in"}</span>
          ${connection.endpoint ? `<span class="quota-connection-endpoint">${escapeHtml(connection.endpoint)}</span>` : ""}
        </div>
        <div class="quota-connection-actions">
          <button type="button" data-action="test-connection" data-id="${escapeAttr(connection.id)}">Test</button>
          <button type="button" class="quota-danger" data-action="delete-connection" data-id="${escapeAttr(connection.id)}">Remove</button>
        </div>
      </li>`,
    )
    .join("");

  return `<section class="quota-settings-section quota-providers-section">
    <div class="quota-section-heading">
      <div>
        <h3>Providers</h3>
        <p class="quota-section-note">Manage provider sign-ins and keys in OpenCode.</p>
      </div>
    </div>
    ${snapshot ? renderProviderStatus(snapshot) : ""}
    ${rows ? `<ul class="quota-connections">${rows}</ul>` : ""}
  </section>`;
};
