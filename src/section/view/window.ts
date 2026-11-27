import type { Balance, Cap, DisplaySelection, ProviderSnapshot, QuotaWindow } from "../../core/types.ts";
import {
  benchmarkPercent,
  capRemaining,
  capRemainingPercent,
  formatAge,
  formatAmount,
  formatRelativeShort,
  formatReset,
  formatResetShort,
  isWindowExpired,
  visibleBalances,
} from "../../core/normalize.ts";
import { barState, stateClass } from "./status.ts";
import { providerIcon } from "./icons.ts";
import { collapsedItemMode, isBalanceVisible, normalizeCollapsedMode } from "../preferences.ts";
import { hasStaleNotice, bridgeWaitingMessage } from "../../core/snapshot-merge.ts";
import { escapeAttr, escapeHtml } from "./html.ts";

const label = (value: string): string => escapeHtml(value);

const providerTitle = (
  provider: ProviderSnapshot,
  collapsed: boolean,
  summary = "",
): string => {
  const bodyId = `quota-provider-${provider.connectionId}`;
  return `<h3><button type="button" class="quota-provider-toggle" data-action="toggle-provider" data-provider="${escapeAttr(provider.connectionId)}" aria-expanded="${!collapsed}" aria-controls="${escapeAttr(bodyId)}" title="${collapsed ? "Expand" : "Collapse"} ${escapeAttr(provider.label)}">
    <span class="quota-provider-icon" aria-hidden="true"><span class="quota-provider-logo">${providerIcon(provider.kind)}</span><span class="quota-provider-chevron"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></span><span class="quota-provider-name">${label(provider.label)}</span>${summary}${
      provider.refreshing
        ? `<span class="quota-provider-refresh" role="status" aria-label="Refreshing quota"><span class="quota-spinner" aria-hidden="true"></span></span>`
        : ""
    }
  </button></h3>`;
};

const historicalLabel = (
  fetchedAt: string | undefined,
  now: number,
  expired: boolean,
): string => {
  const age = formatAge(fetchedAt, now);
  return expired ? `Sampled ${age}; the reset time has passed.` : `Sampled ${age}.`;
};

export const renderWindow = (
  window: QuotaWindow,
  selection: DisplaySelection,
  now: number,
  fetchedAt?: string,
  historical = false,
): string => {
  if (window.error) {
    return `<div class="quota-row quota-row-line quota-row-window quota-window-status quota-window-error" data-window="${escapeAttr(window.id)}">
      <span class="quota-label">${label(window.label)}</span>
      <span class="quota-status-text" role="alert">${label(window.error.message)}</span>
    </div>`;
  }
  if (typeof window.remainingPercent !== "number" || !Number.isFinite(window.remainingPercent)) {
    return `<div class="quota-row quota-row-line quota-row-window quota-window-status quota-window-error" data-window="${escapeAttr(window.id)}">
      <span class="quota-label">${label(window.label)}</span>
      <span class="quota-status-text" role="alert">quota unavailable</span>
    </div>`;
  }
  const expired = isWindowExpired(window, now);
  const remaining = window.remainingPercent;
  const mode = selection.quotaDisplay;
  const showUsed = mode === "used";
  const percent = showUsed ? 100 - remaining : remaining;
  const rawLimit = window.limit;
  const rawUsed = window.used;
  const rawValue =
    rawLimit && rawUsed
      ? `${showUsed ? rawUsed.value : Math.max(0, rawLimit.value - rawUsed.value)} / ${rawLimit.value}${
          window.label.toLowerCase().includes(rawLimit.unit.toLowerCase())
            ? ""
            : ` ${rawLimit.unit}`
        }`
      : `${percent.toFixed(0)}%`;

  if (expired || historical) {
    const age = historicalLabel(fetchedAt, now, expired);
    return `
    <div class="quota-row quota-row-line quota-row-window quota-historical" data-window="${escapeAttr(window.id)}" data-historical="true">
      <span class="quota-label">${label(window.label)}</span>
      <div class="quota-bar" role="img" aria-label="${escapeAttr(window.label)} last sampled ${escapeAttr(percent.toFixed(0))}% ${mode}; ${escapeAttr(age)}">
        <span class="quota-fill" style="width:${percent.toFixed(2)}%"></span>
      </div>
      <span class="quota-value">${escapeHtml(rawValue)}</span>
      <span class="quota-reset" title="${escapeAttr(age)}">${expired ? "past" : ""}</span>
    </div>
    <div class="quota-row quota-row-line quota-window-status" role="status">
      <span class="quota-status-text">${escapeHtml(age)}</span>
    </div>`;
  }

  if (!window.resetAt || !Number.isFinite(Date.parse(window.resetAt))) {
    return `<div class="quota-row quota-row-line quota-row-window quota-window-status quota-window-error" data-window="${escapeAttr(window.id)}">
      <span class="quota-label">${label(window.label)}</span>
      <span class="quota-status-text" role="alert">reset time unavailable</span>
    </div>`;
  }
  const benchmark = benchmarkPercent(window, now);
  const state = barState(remaining, benchmark, selection.cutoffPercent);
  const displayBenchmark = showUsed && benchmark !== null ? 100 - benchmark : benchmark;
  const shortReset = formatResetShort(window.resetAt, selection.resetTime, now);
  const fullReset = formatReset(window.resetAt, selection.resetTime, now);
  const benchmarkMark =
    displayBenchmark === null
      ? ""
      : `<span class="quota-benchmark" style="left:${displayBenchmark.toFixed(2)}%" title="Even-use benchmark ${displayBenchmark.toFixed(0)}% ${mode}"></span>`;
  return `
    <div class="quota-row quota-row-line quota-row-window" data-window="${escapeAttr(window.id)}">
      <span class="quota-label">${label(window.label)}</span>
      <div class="quota-bar ${stateClass(state)}" role="img" aria-label="${escapeAttr(window.label)} ${percent.toFixed(0)}% ${mode}, resets ${escapeAttr(fullReset)}">
        <span class="quota-fill" style="width:${percent.toFixed(2)}%"></span>
        ${benchmarkMark}
      </div>
      <span class="quota-value">${escapeHtml(rawValue)}</span>
      <span class="quota-reset" title="resets ${escapeAttr(fullReset)}">${escapeHtml(shortReset)}</span>
    </div>`;
};

export const renderCap = (cap: Cap, mode: DisplaySelection["quotaDisplay"] = "remaining"): string => {
  const amount = mode === "used" ? cap.used : capRemaining(cap);
  const remainingPercent = capRemainingPercent(cap);
  const percent = mode === "used" && cap.limit > 0 ? 100 - remainingPercent : remainingPercent;
  const value =
    cap.unit === "USD"
      ? `${formatAmount(amount, cap.unit)} / ${formatAmount(cap.limit, cap.unit)}`
      : cap.label.toLowerCase().includes(cap.unit.toLowerCase())
        ? `${amount} / ${cap.limit}`
        : `${amount} / ${cap.limit} ${cap.unit}`;
  return `
    <div class="quota-row quota-row-line quota-row-cap" data-cap="${escapeAttr(cap.id)}" title="no reset">
      <span class="quota-label">${label(cap.label)}</span>
      <div class="quota-bar" role="img" aria-label="${escapeAttr(cap.label)} ${percent.toFixed(0)}% ${mode}">
        <span class="quota-fill" style="width:${percent.toFixed(2)}%"></span>
      </div>
      <span class="quota-value">${escapeHtml(value)}</span>
    </div>`;
};

export const renderBalance = (balance: Balance): string => `
  <div class="quota-row quota-row-line quota-row-balance" data-balance="${escapeAttr(balance.id)}">
    <span class="quota-label">${label(balance.label)}</span>
    <span class="quota-value">${escapeHtml(formatAmount(balance.value, balance.unit))}</span>
  </div>`;

const collapsedWindowRow = (
  window: QuotaWindow,
  selection: DisplaySelection,
  now: number,
  historical: boolean,
): string => {
  if (window.error || typeof window.remainingPercent !== "number") {
    return `<div class="quota-row quota-row-line quota-row-collapsed quota-window-error" data-collapsed-window="${escapeAttr(window.id)}">
      <span class="quota-label">${label(window.label)}</span>
      <span class="quota-status-text" role="alert">${label(window.error?.message ?? "unavailable")}</span>
    </div>`;
  }
  const expired = isWindowExpired(window, now);
  const percent = selection.quotaDisplay === "used"
    ? 100 - window.remainingPercent
    : window.remainingPercent;
  const reset = expired ? "past" : historical ? "" : !window.resetAt
    ? "no reset"
    : formatResetShort(window.resetAt, selection.resetTime, now);
  const summary = expired || historical
    ? "last sampled"
    : window.resetAt ? `resets ${formatReset(window.resetAt, selection.resetTime, now)}` : "no reset";
  return `<span class="quota-provider-summary${expired || historical ? " quota-historical" : ""}" data-collapsed-window="${escapeAttr(window.id)}" title="${escapeAttr(window.label)} ${percent.toFixed(0)}% ${selection.quotaDisplay}, ${escapeAttr(summary)}">
    <span class="quota-label">${label(window.label)}</span>
    <span class="quota-value">${percent.toFixed(0)}%</span>
    <span class="quota-reset">${escapeHtml(reset)}</span>
  </span>`;
};

export const collapsedSummary = (
  provider: ProviderSnapshot,
  selection: DisplaySelection,
  now: number,
  mode: string,
): string => {
  if (provider.state === "unconfigured") {
    return `<div class="quota-row quota-row-line quota-window-status" role="status">
      <span class="quota-status-text">${label(provider.error?.message ?? "Sign in through OpenCode, then refresh.")}</span>
    </div>`;
  }
  if (provider.state === "loading") {
    return `<div class="quota-row quota-row-loading" role="status">Loading quota…</div>`;
  }
  if (provider.state === "error") {
    const waiting = provider.error?.message === bridgeWaitingMessage;
    return `<div class="quota-row quota-row-line quota-window-status${waiting ? "" : " quota-error"}" role="${waiting ? "status" : "alert"}">
      <span class="quota-status-text">${label(provider.error?.message ?? "Could not load quota.")}</span>
    </div>`;
  }

  const balances = isBalanceVisible(selection, provider.connectionId)
    ? visibleBalances(provider.balances)
    : [];
  const selectedBalance = balances.find((balance) => collapsedItemMode("balance", balance.id) === mode);
  const selectedCap = provider.caps.find((cap) => collapsedItemMode("cap", cap.id) === mode);

  if (!selectedBalance && !selectedCap) {
    mode = normalizeCollapsedMode(mode, provider.windows);
    const usable = provider.windows.filter(
      (window) => typeof window.remainingPercent === "number" && !window.error,
    );
    let chosen: QuotaWindow | undefined;
    if (mode === "earliest-reset") {
      chosen = usable
        .filter((window) => window.resetAt && Number.isFinite(Date.parse(window.resetAt)))
        .sort((left, right) => Date.parse(left.resetAt!) - Date.parse(right.resetAt!))[0];
    } else if (mode === "least-remaining") {
      chosen = usable.sort(
        (left, right) => (left.remainingPercent ?? 100) - (right.remainingPercent ?? 100),
      )[0];
    } else {
      chosen = provider.windows.find((window) => collapsedItemMode("window", window.id) === mode);
    }
    chosen ??= usable[0];
    if (chosen) return collapsedWindowRow(chosen, selection, now, hasStaleNotice(provider));
  }

  const cap = selectedCap ?? (selectedBalance ? undefined : provider.caps[0]);
  if (cap) {
    const value = selection.quotaDisplay === "used" ? cap.used : capRemaining(cap);
    const amount =
      cap.unit === "USD"
        ? `${formatAmount(value, cap.unit)} / ${formatAmount(cap.limit, cap.unit)}`
        : `${value} / ${cap.limit} ${cap.unit}`;
    return `<span class="quota-provider-summary" data-collapsed-cap="${escapeAttr(cap.id)}">
      <span class="quota-label">${label(cap.label)}</span>
      <span class="quota-value">${escapeHtml(amount)}</span>
    </span>`;
  }
  const balance = selectedBalance ?? balances[0];
  if (balance) {
    const value = formatAmount(balance.value, balance.unit);
    return `<span class="quota-provider-summary" data-collapsed-balance="${escapeAttr(balance.id)}">
      <span class="quota-label" title="${escapeAttr(balance.label)}">${label(balance.label)}</span>
      <span class="quota-value">${escapeHtml(value)}</span>
    </span>`;
  }
  const firstWindow = provider.windows[0];
  if (firstWindow) return collapsedWindowRow(firstWindow, selection, now, hasStaleNotice(provider));
  return `<span class="quota-provider-summary quota-provider-empty"><span class="quota-status-text">No quota windows reported.</span></span>`;
};

const staleNotice = (provider: ProviderSnapshot, now: number): string =>
  provider.error?.code === "provider_error"
    ? `<div class="quota-row quota-row-line quota-window-status quota-stale" role="status">
        <span class="quota-status-text">${escapeHtml(provider.error.message)}${
          provider.fetchedAt ? ` Last sampled ${escapeHtml(formatAge(provider.fetchedAt, now))}.` : ""
        }</span>
      </div>`
    : "";

export const renderProvider = (
  provider: ProviderSnapshot,
  selection: DisplaySelection,
  now: number,
  collapsed = false,
  collapsedMode = "least-remaining",
): string => {
  const sectionId = `quota-provider-${provider.connectionId}`;
  const open = (content: string, summary = ""): string => `<section class="quota-provider" id="${escapeAttr(sectionId)}" data-provider="${escapeAttr(provider.connectionId)}">
    ${providerTitle(provider, collapsed, summary)}
    ${content}
  </section>`;

  if (collapsed) {
    return provider.state === "ok"
      ? open(staleNotice(provider, now), collapsedSummary(provider, selection, now, collapsedMode))
      : open(collapsedSummary(provider, selection, now, collapsedMode));
  }

  if (provider.state === "unconfigured") {
    return open(`<div class="quota-row quota-row-line quota-window-status" role="status">
      <span class="quota-status-text">${label(provider.error?.message ?? "Sign in through OpenCode, then refresh.")}</span>
    </div>`);
  }
  if (
    provider.state === "error" &&
    provider.windows.length === 0 &&
    provider.caps.length === 0 &&
    provider.balances.length === 0 &&
    provider.error?.message === bridgeWaitingMessage
  ) {
    return open(`<div class="quota-row quota-row-line quota-window-status" role="status">
      <span class="quota-status-text">Waiting for the next scheduled refresh.</span>
    </div>`);
  }
  if (provider.state === "error") {
    const retryAt = provider.error?.retryAt ? Date.parse(provider.error.retryAt) : NaN;
    const retry =
      Number.isFinite(retryAt) && retryAt > now
        ? ` Retry in ${formatRelativeShort(provider.error!.retryAt!, now)}.`
        : "";
    return open(`<div class="quota-error" role="alert">${label(provider.error?.message ?? "Could not load quota.")}${escapeHtml(retry)}</div>`);
  }
  if (provider.state === "loading") {
    return open(`<div class="quota-row quota-row-loading" role="status">Loading quota…</div>`);
  }

  const windows = provider.windows.length
    ? `<div class="quota-window-rows">${provider.windows
        .map((window) => renderWindow(window, selection, now, provider.fetchedAt, hasStaleNotice(provider)))
        .join("")}</div>`
    : "";
  const caps = provider.caps.map((cap) => renderCap(cap, selection.quotaDisplay)).join("");
  const balances = visibleBalances(provider.balances).map(renderBalance).join("");
  const notice = staleNotice(provider, now);
  const empty =
    !windows && !caps && !balances && !notice
      ? `<div class="quota-empty">No quota windows reported.</div>`
      : "";
  return open(`${notice}${windows}${caps}${balances}${empty}`);
};
