import type { Connection } from "../../core/types.ts";
import { escapeAttr, escapeHtml } from "./html.ts";
import { providerIcon } from "./icons.ts";

export const renderConnections = (connections: Connection[]): string => {
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
          <button type="button" data-action="edit-connection" data-id="${escapeAttr(connection.id)}">Edit</button>
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
        <p class="quota-section-note">Connect the providers shown in the Quotas panel.</p>
      </div>
    </div>
    <ul class="quota-connections">${rows || "<li class=\"quota-muted\">No providers configured yet.</li>"}</ul>
    <form data-form="connection" class="quota-form">
      <div class="quota-form-error" data-form-error role="alert"></div>
      <label class="quota-field quota-field-full">Provider
        <select name="kind">
          <option value="tavily">Tavily</option>
          <option value="openrouter">OpenRouter</option>
          <option value="opencode-go">OpenCode Go</option>
        </select>
      </label>
      <label class="quota-field" data-field="label">Label <input name="label" maxlength="60" placeholder="Provider name" /></label>
      <div class="quota-field" data-field="key">
        <label for="quota-api-key">Key</label>
        <div class="quota-key-row">
          <input id="quota-api-key" name="apiKey" type="password" autocomplete="off" placeholder="API key" />
          <button type="button" class="quota-key-toggle" data-action="toggle-key" aria-controls="quota-api-key" aria-pressed="false" aria-label="Show API key" title="Show API key">
            <svg data-icon="show" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
              <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg data-icon="hide" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
              <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
              <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
              <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
              <path d="m2 2 20 20" />
            </svg>
          </button>
        </div>
      </div>
      <label class="quota-field quota-field-full" data-field="endpoint" hidden>Endpoint <input name="endpoint" type="url" placeholder="https://example.com/quota" /></label>
      <p class="quota-form-hint quota-field-full" data-connection-hint></p>
      <span class="quota-form-actions quota-field-full">
        <button type="button" class="quota-primary" data-action="save-connection">Add provider</button>
        <button type="button" data-action="cancel-edit" hidden>Cancel</button>
      </span>
    </form>
  </section>`;
};
