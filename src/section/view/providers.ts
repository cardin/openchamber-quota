import type { ProviderSnapshot, Snapshot } from "../../core/types.ts";
import {
  hasAuthenticationAttempt,
  isBridgeUnavailablePlaceholder,
} from "../preferences.ts";
import { escapeHtml } from "./html.ts";
import { providerIcon } from "./icons.ts";

type ProviderRowStatus = {
  label: string;
  tone: "ok" | "warning" | "error" | "loading";
  detail: string;
};

const statusFor = (provider: ProviderSnapshot): ProviderRowStatus => {
  if (provider.error?.code === "auth") {
    return {
      label: "Authentication failed",
      tone: "error",
      detail: provider.error.message,
    };
  }
  if (provider.state === "error") {
    return {
      label: "Error",
      tone: "error",
      detail: provider.error?.message ?? "The provider request failed.",
    };
  }
  if (provider.state === "loading") {
    return {
      label: "Checking",
      tone: "loading",
      detail: "Waiting for the first reading.",
    };
  }
  if (provider.error) {
    return {
      label: "Stale reading",
      tone: "warning",
      detail: provider.error.message,
    };
  }
  return {
    label: "Connected",
    tone: "ok",
    detail: "",
  };
};

const setupFor = (provider: ProviderSnapshot): string => {
  if (provider.kind === "custom") return "Custom connection";
  if (provider.kind === "tavily" || provider.kind === "exa") {
    return "OpenCode key or environment";
  }
  return "OpenCode sign-in";
};

export const renderProviderStatus = (snapshot: Snapshot): string => {
  const rows = snapshot.providers.filter((provider) => hasAuthenticationAttempt(provider));
  const bridgeProblem = snapshot.providers.some((provider) =>
    isBridgeUnavailablePlaceholder(provider),
  );
  const body = rows
    .map((provider) => {
      const status = statusFor(provider);
      return `<tr data-provider-row="${escapeHtml(provider.connectionId)}">
        <td data-label="Provider">
          <span class="quota-provider-cell">
            <span class="quota-connection-icon">${providerIcon(provider.kind)}</span>
            <span>${escapeHtml(provider.label)}</span>
          </span>
        </td>
        <td data-label="Setup">${escapeHtml(setupFor(provider))}</td>
        <td data-label="Status">
          <span class="quota-provider-status quota-provider-status-${status.tone}">${escapeHtml(status.label)}</span>
        </td>
        <td data-label="Details" class="quota-provider-detail${status.tone === "error" ? " quota-provider-detail-error" : ""}">${escapeHtml(status.detail)}</td>
      </tr>`;
    })
    .join("");

  return `<div class="quota-provider-status-block">
    <h4>Provider status</h4>
    <p class="quota-section-note">See what’s connected and what needs attention.</p>
    ${
      bridgeProblem
        ? `<p class="quota-provider-notice" role="status">The OpenCode plugin is not connected yet. If you just approved the extension, restart OpenCode or OpenChamber.</p>`
        : ""
    }
    ${
      rows
        ? `<div class="quota-provider-table-wrap">
            <table class="quota-provider-table">
              <thead><tr><th>Provider</th><th>Setup</th><th>Status</th><th>Details</th></tr></thead>
              <tbody>${body}</tbody>
            </table>
          </div>`
        : `<p class="quota-muted">No providers connected yet.</p>`
    }
  </div>`;
};
