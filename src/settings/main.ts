import { connectHost } from "@openchamber/sdk";
import { applyHostReady } from "@openchamber/sdk/ui";
import type { Connection, DisplaySelection, Snapshot } from "../core/types.ts";
import { DEFAULT_SELECTION } from "../core/types.ts";
import {
  addProvider,
  loadSelection,
  saveSelection,
  setBalancesHidden,
  setCutoff,
  setQuotaDisplay,
  setResetTime,
  toggleProvider,
  toggleWindow,
} from "../section/preferences.ts";
import { serviceCall } from "../section/host.ts";
import { renderConnections } from "../section/view/connections.ts";
import { renderUsage } from "../section/view/usage.ts";
import { renderSelector } from "../section/view/selector.ts";
import { escapeHtml } from "../section/view/html.ts";
import { providerLabel } from "../core/labels.ts";

const host = connectHost();
const call = serviceCall(host);
const root = document.querySelector<HTMLElement>("#root");
if (!root) throw new Error("Missing #root");

let snapshot: Snapshot | null = null;
let connections: Connection[] = [];
let selection: DisplaySelection = { ...DEFAULT_SELECTION };
let error = "";
let started = false;
let editingId: string | null = null;

const loadConnections = async (): Promise<void> => {
  const response = await call({ method: "GET", path: "/connections" });
  const body = response.body as { connections?: Connection[] };
  connections = Array.isArray(body?.connections) ? body.connections : [];
};

const loadSnapshot = async (): Promise<void> => {
  const response = await call({ method: "GET", path: "/snapshot" });
  if (response.status === 200 && response.body && typeof response.body === "object") {
    snapshot = response.body as Snapshot;
  }
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const refreshQuota = async (waitForId?: string): Promise<void> => {
  await call({ method: "POST", path: "/refresh" });
  const deadline = Date.now() + 10_000;
  do {
    await sleep(waitForId ? 300 : 600);
    await loadSnapshot();
    if (!waitForId) return;
    const provider = snapshot?.providers.find((entry) => entry.connectionId === waitForId);
    if (!provider || !provider.refreshing) return;
  } while (Date.now() < deadline);
};

const availableProviders = () =>
  (snapshot?.providers ?? []).map((provider) => ({
    id: provider.connectionId,
    windows: provider.windows.map((window) => window.id),
  }));

const syncConnectionForm = (): void => {
  const form = root.querySelector<HTMLFormElement>('[data-form="connection"]');
  if (!form) return;
  const kindSelect = form.querySelector<HTMLSelectElement>('select[name="kind"]');
  const kind = kindSelect?.value ?? "tavily";
  if (kindSelect) kindSelect.disabled = editingId !== null;
  const labelInput = form.querySelector<HTMLInputElement>('input[name="label"]');
  if (labelInput) {
    if (!labelInput.value.trim() || labelInput.dataset.auto === "true") {
      labelInput.value = providerLabel(kind);
      labelInput.dataset.auto = "true";
    }
    labelInput.oninput = () => {
      labelInput.dataset.auto = "false";
    };
  }
  const endpoint = form.querySelector<HTMLElement>('[data-field="endpoint"]');
  if (endpoint) endpoint.hidden = kind !== "custom";
  const endpointInput = form.querySelector<HTMLInputElement>('input[name="endpoint"]');
  if (endpointInput) endpointInput.disabled = kind !== "custom";
  const keyInput = form.querySelector<HTMLInputElement>('input[name="apiKey"]');
  if (keyInput) {
    keyInput.disabled = kind === "codex";
    keyInput.placeholder = kind === "codex" ? "Not needed" : "API key";
  }
  const keyToggle = form.querySelector<HTMLButtonElement>('[data-action="toggle-key"]');
  if (keyToggle) {
    const unavailable = kind === "codex";
    keyToggle.hidden = unavailable;
    keyToggle.disabled = unavailable;
    keyToggle.textContent = "Show";
    keyToggle.setAttribute("aria-pressed", "false");
    keyToggle.setAttribute("aria-label", "Show API key");
    if (keyInput) keyInput.type = "password";
  }
  const submit = form.querySelector<HTMLButtonElement>('[data-action="save-connection"]');
  if (submit) submit.textContent = editingId ? "Save changes" : "Add provider";
  const cancel = form.querySelector<HTMLButtonElement>('[data-action="cancel-edit"]');
  if (cancel) cancel.hidden = editingId === null;
  const hint = form.querySelector<HTMLElement>("[data-connection-hint]");
  if (hint) {
    hint.textContent =
      kind === "codex"
        ? "OpenAI / Codex imports ~/.codex/auth.json. Run `codex login` first; no key is needed here."
        : kind === "custom"
          ? "Custom endpoints must use HTTPS and return openchamber-quota-v1."
          : "Paste the API key for this provider.";
  }
};

const fillConnectionForm = (connection: Connection): void => {
  const form = root.querySelector<HTMLFormElement>('[data-form="connection"]');
  if (!form) return;
  const kind = form.querySelector<HTMLSelectElement>('select[name="kind"]');
  if (kind) kind.value = connection.kind;
  const label = form.querySelector<HTMLInputElement>('input[name="label"]');
  if (label) {
    label.value = connection.label;
    label.dataset.auto = "false";
  }
  const endpoint = form.querySelector<HTMLInputElement>('input[name="endpoint"]');
  if (endpoint) endpoint.value = connection.endpoint ?? "";
  const key = form.querySelector<HTMLInputElement>('input[name="apiKey"]');
  if (key) key.value = "";
  syncConnectionForm();
  if (key) {
    key.placeholder =
      connection.kind === "codex" ? "Not needed" : "Leave blank to keep the current key";
  }
};

const reload = async (): Promise<void> => {
  error = "";
  try {
    await loadConnections();
    await refreshQuota();
    render();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "The quota service is unavailable.";
    render();
  }
};

const render = (): void => {
  root.innerHTML = `<header class="quota-settings-header">
    <div>
      <h2>Quota settings</h2>
      <p class="quota-settings-subtitle">Manage providers, usage, and what appears in Work Status.</p>
    </div>
  </header>
  ${error ? `<div class="quota-error" role="alert">${escapeHtml(error)}</div>` : ""}
  ${renderConnections(connections)}
  ${renderUsage(snapshot)}
  ${snapshot ? renderSelector(snapshot, selection) : `<div class="quota-row-loading">Loading quota…</div>`}`;
  syncConnectionForm();
  if (editingId) {
    const connection = connections.find((entry) => entry.id === editingId);
    if (connection) fillConnectionForm(connection);
    else editingId = null;
  }
};

const saveConnection = (form: HTMLFormElement): void => {
  const data = new FormData(form);
  const kind = String(data.get("kind") ?? "");
  const label = String(data.get("label") ?? "").trim();
  const endpoint = String(data.get("endpoint") ?? "").trim();
  const apiKey = String(data.get("apiKey") ?? "");
  const formError = form.querySelector<HTMLElement>("[data-form-error]");
  const show = (message: string): void => {
    if (formError) formError.textContent = message;
  };
  show("");
  if (!label) {
    show("Enter a label.");
    return;
  }
  if (kind === "custom" && !endpoint) {
    show("Enter an HTTPS endpoint.");
    return;
  }
  const existing = editingId
    ? connections.find((entry) => entry.id === editingId)
    : kind !== "custom"
      ? connections.find((entry) => entry.kind === kind)
      : undefined;
  if (kind !== "codex" && !apiKey && !existing) {
    show("Enter the API key.");
    return;
  }
  const payload: Record<string, string> = { kind, label };
  if (endpoint) payload.endpoint = endpoint;
  if (apiKey) payload.apiKey = apiKey;
  const method = existing ? "PUT" : "POST";
  const path = existing ? `/connections/${encodeURIComponent(existing.id)}` : "/connections";
  const submit = form.querySelector<HTMLButtonElement>('[data-action="save-connection"]');
  if (submit) {
    submit.disabled = true;
    submit.textContent = "Saving…";
  }
  void (async () => {
    try {
      const response = await call({ method, path, body: payload });
      if (response.status >= 400) {
        const body = response.body as { error?: { message?: string } };
        show(body.error?.message ?? "Could not add the provider.");
        return;
      }
      const saved = (response.body as { connection?: Connection }).connection;
      const wasNew = !existing;
      editingId = null;
      form.reset();
      await loadConnections();
      render();
      await host.toast({ kind: "success", message: "Provider saved." });
      void refreshQuota(saved?.id)
        .then(async () => {
          if (saved && wasNew && selection.saved) {
            const provider = snapshot?.providers.find(
              (entry) => entry.connectionId === saved.id,
            );
            selection = addProvider(
              selection,
              saved.id,
              provider?.windows.map((window) => window.id) ?? [],
            );
            await saveSelection(host.storage, selection);
          }
          render();
        })
        .catch(async () => {
          if (saved && wasNew && selection.saved) {
            selection = addProvider(selection, saved.id, []);
            await saveSelection(host.storage, selection);
          }
          render();
          await host.toast({
            kind: "error",
            message: "Provider saved, but the first quota refresh failed.",
          });
        });
    } catch (cause) {
      show(cause instanceof Error ? cause.message : "Could not reach the quota service.");
    } finally {
      if (submit && submit.isConnected) {
        submit.disabled = false;
        submit.textContent = editingId ? "Save changes" : "Add provider";
      }
    }
  })();
};

root.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "save-connection") {
    const form = target.closest<HTMLFormElement>('[data-form="connection"]');
    if (form) saveConnection(form);
    return;
  }
  if (action === "toggle-key") {
    const form = target.closest<HTMLFormElement>('[data-form="connection"]');
    const input = form?.querySelector<HTMLInputElement>('input[name="apiKey"]');
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    target.textContent = show ? "Hide" : "Show";
    target.setAttribute("aria-pressed", String(show));
    target.setAttribute("aria-label", show ? "Hide API key" : "Show API key");
    return;
  }
  if (action === "edit-connection" && target.dataset.id) {
    editingId = target.dataset.id;
    render();
    return;
  }
  if (action === "cancel-edit") {
    editingId = null;
    render();
    return;
  }
  if (action === "delete-connection" && target.dataset.id) {
    void (async () => {
      const response = await call({
        method: "DELETE",
        path: `/connections/${encodeURIComponent(target.dataset.id!)}`,
      });
      if (response.status >= 400) {
        error = "Could not remove the provider.";
        render();
        return;
      }
      if (editingId === target.dataset.id) editingId = null;
      await reload();
    })();
    return;
  }
  if (action === "test-connection" && target.dataset.id) {
    void (async () => {
      const response = await call({
        method: "POST",
        path: `/connections/${encodeURIComponent(target.dataset.id!)}/test`,
      });
      const body = response.body as { ok?: boolean; error?: { message?: string } };
      await host.toast({
        kind: body.ok ? "success" : "error",
        message: body.ok ? "Connection works." : body.error?.message ?? "Connection failed.",
      });
    })();
  }
});

root.addEventListener("change", (event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  if (target.matches('select[name="kind"]')) {
    const label = root.querySelector<HTMLInputElement>('input[name="label"]');
    if (label) {
      label.value = "";
      label.dataset.auto = "true";
    }
    syncConnectionForm();
    return;
  }
  if (target.matches("[data-provider-toggle]")) {
    selection = toggleProvider(
      selection,
      target.getAttribute("data-provider")!,
      availableProviders(),
    );
    void saveSelection(host.storage, selection).then(render);
    return;
  }
  if (target.matches("[data-window-toggle]")) {
    selection = toggleWindow(
      selection,
      target.getAttribute("data-provider")!,
      target.getAttribute("data-window")!,
      availableProviders(),
    );
    void saveSelection(host.storage, selection).then(render);
    return;
  }
  if (target.matches("[data-balance-toggle]")) {
    selection = setBalancesHidden(
      selection,
      target.getAttribute("data-provider")!,
      !(target as HTMLInputElement).checked,
    );
    void saveSelection(host.storage, selection).then(render);
    return;
  }
  if (target.matches("[data-cutoff]")) {
    selection = setCutoff(selection, Number(target.value));
    void saveSelection(host.storage, selection).then(render);
    return;
  }
  if (target.matches("[data-quota-display]")) {
    selection = setQuotaDisplay(selection, target.value === "used" ? "used" : "remaining");
    void saveSelection(host.storage, selection).then(render);
    return;
  }
  if (target.matches("[data-reset-time]")) {
    selection = setResetTime(selection, target.value === "absolute" ? "absolute" : "relative");
    void saveSelection(host.storage, selection).then(render);
  }
});

root.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const target = event.target as HTMLElement;
  const form = target.closest<HTMLFormElement>('[data-form="connection"]');
  if (!form || target.tagName === "SELECT" || target.tagName === "BUTTON") return;
  event.preventDefault();
  saveConnection(form);
});

host.onReady((context) => {
  applyHostReady(context, document.documentElement);
  if (started) return;
  started = true;
  void (async () => {
    try {
      selection = await loadSelection(host.storage);
      await Promise.all([loadConnections(), loadSnapshot()]);
      render();
      void refreshQuota()
        .then(render)
        .catch(() => undefined);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "The quota service is unavailable.";
      render();
    }
  })();
});
