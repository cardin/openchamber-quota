import { connectHost } from "@openchamber/sdk";
import { applyHostReady } from "@openchamber/sdk/ui";
import type { Connection, DisplaySelection, SettingsChanges, SettingsEnvelope, Snapshot } from "../core/types.ts";
import { DEFAULT_SELECTION } from "../core/types.ts";
import {
  changesFor,
  isProviderDisplayable,
  isWindowVisible,
  moveProvider,
  setBalancesHidden,
  setCollapsedQuota,
  setCutoff,
  setQuotaDisplay,
  setResetTime,
} from "../section/preferences.ts";
import { serviceCall } from "../section/host.ts";
import { renderConnections } from "../section/view/connections.ts";
import { renderSelector } from "../section/view/selector.ts";
import { escapeHtml } from "../section/view/html.ts";

const host = connectHost();
const call = serviceCall(host);
const root = document.querySelector<HTMLElement>("#root");
if (!root) throw new Error("Missing #root");

let snapshot: Snapshot | null = null;
let connections: Connection[] = [];
let selection: DisplaySelection = { ...DEFAULT_SELECTION };
let revision = 0;
let error = "";
let started = false;
let connectionsGeneration = 0;

const loadConnections = async (): Promise<void> => {
  const generation = connectionsGeneration;
  const response = await call({ method: "GET", path: "/connections" });
  if (generation !== connectionsGeneration) return;
  const body = response.body as { connections?: Connection[] };
  connections = Array.isArray(body?.connections) ? body.connections : [];
};

const loadSnapshot = async (): Promise<void> => {
  const generation = connectionsGeneration;
  const response = await call({ method: "GET", path: "/snapshot" });
  if (generation === connectionsGeneration && response.status === 200 &&
    response.body && typeof response.body === "object") {
    snapshot = response.body as Snapshot;
  }
};

const applyEnvelope = (body: unknown): boolean => {
  const envelope = body as Partial<SettingsEnvelope> | null;
  if (envelope?.version !== 1 || !envelope.selection || typeof envelope.revision !== "number") {
    return false;
  }
  if (envelope.revision >= revision) {
    selection = envelope.selection;
    revision = envelope.revision;
  }
  return true;
};

const loadSettings = async (): Promise<void> => {
  const response = await call({ method: "GET", path: "/settings" });
  if (response.status === 200) applyEnvelope(response.body);
};

const commit = async (build: (base: DisplaySelection) => SettingsChanges): Promise<void> => {
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const changes = build(selection);
      if (Object.keys(changes).length === 0) break;
      const response = await call({
        method: "PATCH",
        path: "/settings",
        body: { expectedRevision: revision, changes },
      });
      if (response.status === 200 && applyEnvelope(response.body)) break;
      if (response.status === 409 && attempt === 0 && applyEnvelope(response.body)) continue;
      error = "Could not save the display settings.";
      break;
    }
  } catch {
    error = "Could not reach the quota service.";
  }
  render();
};

const editDisplay = (edit: (base: DisplaySelection) => DisplaySelection): Promise<void> =>
  commit((base) => changesFor(base, edit(base)));

const loadPage = async (): Promise<void> => {
  await Promise.all([loadSettings(), loadConnections(), loadSnapshot()]);
  render();
};

const refreshQuota = async (): Promise<void> => {
  await call({ method: "POST", path: "/refresh", body: {} });
  await new Promise<void>((resolve) => setTimeout(resolve, 600));
  await loadPage();
};

const showServiceError = (cause: unknown): void => {
  error = cause instanceof Error ? cause.message : "The quota service is unavailable.";
  render();
};

const render = (): void => {
  root.innerHTML = `<header class="quota-settings-header">
    <div>
      <h2>Quota settings</h2>
      <p class="quota-settings-subtitle">Choose providers and windows, reorder them, and set shared display options.</p>
    </div>
  </header>
  ${error ? `<div class="quota-error" role="alert">${escapeHtml(error)}</div>` : ""}
  ${renderConnections(connections, snapshot)}
  ${snapshot ? renderSelector(snapshot, selection) : `<div class="quota-row-loading">Loading quota…</div>`}`;
};

root.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "move-provider-up" || action === "move-provider-down") {
    const providerId = target.dataset.provider;
    if (!providerId) return;
    const delta = action === "move-provider-up" ? -1 : 1;
    void editDisplay((base) => {
      const ids = (snapshot?.providers ?? [])
        .filter(isProviderDisplayable)
        .map((provider) => provider.connectionId);
      return moveProvider(base, providerId, delta, ids);
    });
    return;
  }
  if (action === "delete-connection" && target.dataset.id) {
    const id = target.dataset.id;
    void (async () => {
      const response = await call({
        method: "DELETE",
        path: `/connections/${encodeURIComponent(id)}`,
      });
      if (response.status >= 400) {
        error = "Could not remove the provider.";
        render();
        return;
      }
      error = "";
      connectionsGeneration++;
      connections = connections.filter((connection) => connection.id !== id);
      if (snapshot) snapshot = {
        ...snapshot,
        providers: snapshot.providers.filter((provider) => provider.connectionId !== id),
      };
      render();
    })().catch(showServiceError);
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
  if (target.matches("[data-provider-toggle]")) {
    const id = target.getAttribute("data-provider")!;
    const visible = (target as HTMLInputElement).checked;
    void commit(() => ({ providerVisibility: { [id]: visible } }));
    return;
  }
  if (target.matches("[data-window-toggle]")) {
    const providerId = target.getAttribute("data-provider")!;
    const windowId = target.getAttribute("data-window")!;
    const visible = (target as HTMLInputElement).checked;
    void commit((base) => {
      const selected = new Set(base.windows[providerId] ?? []);
      const provider = snapshot?.providers.find((entry) => entry.connectionId === providerId);
      for (const window of provider?.windows ?? []) {
        if (isWindowVisible(base, providerId, window.id)) selected.add(window.id);
      }
      if (visible) selected.add(windowId);
      else selected.delete(windowId);
      return { windowSelection: { [providerId]: [...selected] } };
    });
    return;
  }
  if (target.matches("[data-balance-toggle]")) {
    const providerId = target.getAttribute("data-provider")!;
    const hidden = !(target as HTMLInputElement).checked;
    void editDisplay((base) => setBalancesHidden(base, providerId, hidden));
    return;
  }
  if (target.matches("[data-collapsed-quota]")) {
    const providerId = target.getAttribute("data-provider")!;
    const mode = target.value;
    void editDisplay((base) => setCollapsedQuota(base, providerId, mode));
    return;
  }
  if (target.matches("[data-cutoff]")) {
    const cutoff = Number(target.value);
    void editDisplay((base) => setCutoff(base, cutoff));
    return;
  }
  if (target.matches("[data-quota-display]")) {
    const mode = target.value === "used" ? "used" : "remaining";
    void editDisplay((base) => setQuotaDisplay(base, mode));
    return;
  }
  if (target.matches("[data-reset-time]")) {
    const mode = target.value === "absolute" ? "absolute" : "relative";
    void editDisplay((base) => setResetTime(base, mode));
  }
});

host.onReady((context) => {
  applyHostReady(context, document.documentElement);
  if (started) return;
  started = true;
  const poll = (): void => {
    void loadPage()
      .then(() => {
        if (!error) return;
        error = "";
        render();
      })
      .catch(showServiceError);
  };
  // Start polling before the first load so a transient failure can recover
  // without reopening the page.
  window.setInterval(poll, 5_000);
  poll();
  void refreshQuota().catch(() => undefined);
});
