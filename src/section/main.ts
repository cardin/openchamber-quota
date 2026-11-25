import { connectHost } from "@openchamber/sdk";
import { applyHostReady } from "@openchamber/sdk/ui";
import type { DisplaySelection, Snapshot } from "../core/types.ts";
import { visibleBalances } from "../core/normalize.ts";
import { DEFAULT_SELECTION } from "../core/types.ts";
import {
  isBalanceVisible,
  isProviderVisible,
  isWindowVisible,
  loadSelection,
} from "./preferences.ts";
import { serviceCall } from "./host.ts";
import { SnapshotController } from "./refresh.ts";
import { renderEmpty } from "./view/empty.ts";
import { escapeHtml } from "./view/html.ts";
import { renderProvider } from "./view/window.ts";

const host = connectHost();
const call = serviceCall(host);
const root = document.querySelector<HTMLElement>("#root");
if (!root) throw new Error("Missing #root");

let snapshot: Snapshot | null = null;
let selection: DisplaySelection = { ...DEFAULT_SELECTION };
let started = false;
let disposed = false;
let error = "";
let controller: SnapshotController | null = null;
let resetTimer: ReturnType<typeof setTimeout> | null = null;
let headerControl = false;
let lastHeight = 0;

const refreshIcon = `<svg class="lucide lucide-rotate-cw" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M21 3v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const scheduleReset = (next: Snapshot): void => {
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = null;
  const now = Date.now();
  const upcoming = next.providers
    .flatMap((provider) => provider.windows)
    .map((window) => (window.resetAt ? Date.parse(window.resetAt) : NaN))
    .filter((time) => Number.isFinite(time) && time > now)
    .sort((left, right) => left - right)[0];
  if (!upcoming) return;
  resetTimer = setTimeout(
    () => void controller?.refresh(),
    Math.min(upcoming - now + 1000, 24 * 60 * 60 * 1000),
  );
};

const reportHeight = (): void => {
  const body = document.body;
  if (!body) return;
  const height = Math.ceil(body.getBoundingClientRect().height);
  if (!Number.isFinite(height) || height < 1 || height === lastHeight) return;
  lastHeight = height;
  void host.setHeight(height).catch(() => {
    lastHeight = 0;
  });
};

const scheduleHeightReport = (): void => {
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(reportHeight);
  else reportHeight();
};

const render = (): void => {
  if (disposed) return;
  const now = Date.now();
  const visible = (snapshot?.providers ?? []).flatMap((provider) => {
    if (!isProviderVisible(selection, provider.connectionId)) return [];
    const windows = provider.windows.filter((window) =>
      isWindowVisible(selection, provider.connectionId, window.id),
    );
    const balances = visibleBalances(provider.balances).filter(() =>
      isBalanceVisible(selection, provider.connectionId),
    );
    const hasReportedData =
      provider.windows.length > 0 ||
      provider.caps.length > 0 ||
      provider.balances.length > 0;
    if (hasReportedData && !windows.length && !provider.caps.length && !balances.length) {
      return [];
    }
    return [{ ...provider, windows, balances }];
  });

  const body = !snapshot
    ? `<div class="quota-row quota-row-loading" role="status">Loading quota…</div>`
    : visible.length
      ? visible.map((provider) => renderProvider(provider, selection, now)).join("")
      : renderEmpty((snapshot.providers.length ?? 0) > 0, visible.length > 0);

  const showUsed = selection.quotaDisplay === "used" &&
    visible.some((provider) => provider.state === "ok" && (provider.windows.length > 0 || provider.caps.length > 0));
  root.innerHTML = `${headerControl ? "" : `<button type="button" class="quota-icon-button" data-action="refresh" aria-label="Refresh quota" title="Refresh">${refreshIcon}</button>`}
  ${error ? `<div class="quota-error" role="alert">${escapeHtml(error)}</div>` : ""}
  ${showUsed ? '<div class="quota-meta">Quota used</div>' : ""}
  ${body}`;
  root.classList.toggle("body-refresh", !headerControl);
  scheduleHeightReport();
};

if (typeof ResizeObserver === "function") {
  const observer = new ResizeObserver(scheduleHeightReport);
  observer.observe(root);
}

host.onStatusControl((event) => {
  if (event.id === "refresh") void controller?.refresh().then(render);
});

root.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (target?.dataset.action !== "refresh") return;
  void (async () => {
    if (!controller) return;
    await controller.refresh();
    render();
  })();
});

window.addEventListener("pagehide", (event) => {
  if (event.persisted) return;
  disposed = true;
  controller?.stop();
  if (resetTimer !== null) clearTimeout(resetTimer);
  resetTimer = null;
});

host.onReady((context) => {
  applyHostReady(context, document.documentElement);
  if (started) return;
  started = true;
  void (async () => {
    try {
      if (context.features?.statusControls) {
        try {
          await host.setStatusControls([{ kind: "button", id: "refresh", label: "↻" }]);
          headerControl = true;
        } catch {
          headerControl = false;
        }
      }
      selection = await loadSelection(host.storage);
      if (disposed) return;
      controller = new SnapshotController(call, (next) => {
        snapshot = next;
        scheduleReset(next);
        void loadSelection(host.storage).then((latest) => {
          selection = latest;
          render();
        });
      });
      controller.start();
      render();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "The quota service is unavailable.";
      render();
    }
  })();
});
