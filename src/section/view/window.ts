import type { Balance, Cap, DisplaySelection, ProviderSnapshot, QuotaWindow } from "../../core/types.ts";
import {
  benchmarkPercent,
  capRemaining,
  capRemainingPercent,
  formatAmount,
  formatRelativeShort,
  formatReset,
  formatResetShort,
  isWindowExpired,
  visibleBalances,
} from "../../core/normalize.ts";
import { barState, stateClass } from "./status.ts";
import { providerIcon } from "./icons.ts";
import { escapeAttr, escapeHtml } from "./html.ts";

const label = (value: string): string => escapeHtml(value);

const providerTitle = (provider: ProviderSnapshot): string =>
  `<h3><span class="quota-provider-icon">${providerIcon(provider.kind)}</span>${label(provider.label)}</h3>`;

export const renderWindow = (
  window: QuotaWindow,
  selection: DisplaySelection,
  now: number,
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
  if (!window.resetAt || !Number.isFinite(Date.parse(window.resetAt))) {
    return `<div class="quota-row quota-row-line quota-row-window quota-window-status quota-window-error" data-window="${escapeAttr(window.id)}">
      <span class="quota-label">${label(window.label)}</span>
      <span class="quota-status-text" role="alert">reset time unavailable</span>
    </div>`;
  }
  if (isWindowExpired(window, now)) {
    return `<div class="quota-row quota-row-line quota-row-window quota-window-status" data-window="${escapeAttr(window.id)}">
      <span class="quota-label">${label(window.label)}</span>
      <span class="quota-status-text" role="status">refreshing…</span>
    </div>`;
  }
  const remaining = window.remainingPercent;
  const rawLimit = window.limit;
  const rawUsed = window.used;
  const rawValue =
    rawLimit && rawUsed
      ? `${Math.max(0, rawLimit.value - rawUsed.value)} / ${rawLimit.value}${
          window.label.toLowerCase().includes(rawLimit.unit.toLowerCase())
            ? ""
            : ` ${rawLimit.unit}`
        }`
      : `${remaining.toFixed(0)}%`;
  const benchmark = benchmarkPercent(window, now);
  const state = barState(remaining, benchmark, selection.cutoffPercent);
  const shortReset = formatResetShort(window.resetAt, selection.resetTime, now);
  const fullReset = formatReset(window.resetAt, selection.resetTime, now);
  const benchmarkMark =
    benchmark === null
      ? ""
      : `<span class="quota-benchmark" style="left:${benchmark.toFixed(2)}%" title="Even-use benchmark ${benchmark.toFixed(0)}%"></span>`;
  return `
    <div class="quota-row quota-row-line quota-row-window" data-window="${escapeAttr(window.id)}">
      <span class="quota-label">${label(window.label)}</span>
      <div class="quota-bar ${stateClass(state)}" role="img" aria-label="${escapeAttr(window.label)} ${remaining.toFixed(0)}% remaining, resets ${escapeAttr(fullReset)}">
        <span class="quota-fill" style="width:${remaining.toFixed(2)}%"></span>
        ${benchmarkMark}
      </div>
      <span class="quota-value">${escapeHtml(rawValue)}</span>
      <span class="quota-reset" title="resets ${escapeAttr(fullReset)}">${escapeHtml(shortReset)}</span>
    </div>`;
};

export const renderCap = (cap: Cap): string => {
  const remaining = capRemaining(cap);
  const percent = capRemainingPercent(cap);
  const value =
    cap.unit === "USD"
      ? `${formatAmount(remaining, cap.unit)} / ${formatAmount(cap.limit, cap.unit)}`
      : cap.label.toLowerCase().includes(cap.unit.toLowerCase())
        ? `${remaining} / ${cap.limit}`
        : `${remaining} / ${cap.limit} ${cap.unit}`;
  return `
    <div class="quota-row quota-row-line quota-row-cap" data-cap="${escapeAttr(cap.id)}" title="no reset">
      <span class="quota-label">${label(cap.label)}</span>
      <div class="quota-bar" role="img" aria-label="${escapeAttr(cap.label)} ${percent.toFixed(0)}% remaining">
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

export const renderProvider = (
  provider: ProviderSnapshot,
  selection: DisplaySelection,
  now: number,
): string => {
  if (provider.state === "error") {
    const retryAt = provider.error?.retryAt ? Date.parse(provider.error.retryAt) : NaN;
    const retry =
      Number.isFinite(retryAt) && retryAt > now
        ? ` Retry in ${formatRelativeShort(provider.error!.retryAt!, now)}.`
        : "";
    return `<section class="quota-provider" data-provider="${escapeAttr(provider.connectionId)}">
      ${providerTitle(provider)}
      <div class="quota-error" role="alert">${label(provider.error?.message ?? "Could not load quota.")}${escapeHtml(retry)}</div>
    </section>`;
  }
  if (provider.state === "loading") {
    return `<section class="quota-provider" data-provider="${escapeAttr(provider.connectionId)}">
      ${providerTitle(provider)}
      <div class="quota-row quota-row-loading" role="status">Loading quota…</div>
    </section>`;
  }

  const windows = provider.windows.length
    ? `<div class="quota-window-rows">${provider.windows.map((window) => renderWindow(window, selection, now)).join("")}</div>`
    : "";
  const caps = provider.caps.map(renderCap).join("");
  const balances = visibleBalances(provider.balances).map(renderBalance).join("");
  const refreshing = provider.refreshing
    ? `<div class="quota-row-loading" role="status">Refreshing…</div>`
    : "";
  const empty =
    !windows && !caps && !balances
      ? `<div class="quota-empty">No quota windows reported.</div>`
      : "";
  return `<section class="quota-provider" data-provider="${escapeAttr(provider.connectionId)}">
    ${providerTitle(provider)}
    ${refreshing}${windows}${caps}${balances}${empty}
  </section>`;
};
