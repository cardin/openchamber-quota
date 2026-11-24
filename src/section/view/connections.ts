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
          <option value="opencode-zen">OpenCode Zen</option>
          <option value="codex">OpenAI / Codex</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      <label class="quota-field" data-field="label">Label <input name="label" maxlength="60" placeholder="Provider name" /></label>
      <label class="quota-field" data-field="key">Key <input name="apiKey" type="password" autocomplete="off" placeholder="API key" /></label>
      <label class="quota-field quota-field-full" data-field="endpoint" hidden>Endpoint <input name="endpoint" type="url" placeholder="https://example.com/quota" /></label>
      <p class="quota-form-hint quota-field-full" data-connection-hint></p>
      <span class="quota-form-actions quota-field-full">
        <button type="button" class="quota-primary" data-action="save-connection">Add provider</button>
        <button type="button" data-action="cancel-edit" hidden>Cancel</button>
      </span>
    </form>
  </section>`;
};
