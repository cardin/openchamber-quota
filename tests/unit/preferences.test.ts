import { describe, expect, test } from "bun:test";
import {
  addProvider,
  changesFor,
  isBalanceVisible,
  isBridgeUnavailablePlaceholder,
  isProviderDisplayable,
  isProviderVisible,
  isWindowVisible,
  moveProvider,
  normalizeSelection,
  setBalancesHidden,
  setCollapsedQuota,
  setCutoff,
  setQuotaDisplay,
  setResetTime,
  toggleProvider,
  toggleWindow,
} from "../../src/section/preferences.ts";
import { reconcileFirstSuccess } from "../../src/core/selection.ts";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";
import type { ProviderSnapshot } from "../../src/core/types.ts";

const bridgeProvider = (
  id: string,
  state: ProviderSnapshot["state"],
  windows: string[] = [],
): ProviderSnapshot => ({
  connectionId: id,
  kind: id === "bridge-openrouter" ? "openrouter" : "codex",
  label: id,
  state,
  windows: windows.map((window) => ({
    id: window,
    label: window,
    remainingPercent: 50,
    resetAt: "2026-11-24T00:00:00Z",
  })),
  caps: [],
  balances: [],
  refreshing: false,
  ...(state === "ok" ? { fetchedAt: "2026-11-23T12:00:00Z" } : {}),
});

describe("preferences", () => {
  test("defaults to showing everything", () => {
    expect(isProviderVisible(DEFAULT_SELECTION, "anything")).toBe(true);
    expect(normalizeSelection(null)).toEqual(DEFAULT_SELECTION);
  });

  test("unconfigured and auth-error providers are never displayable", () => {
    expect(isProviderDisplayable({ state: "unconfigured" })).toBe(false);
    expect(
      isProviderDisplayable({ state: "unconfigured", error: { code: "not_configured", message: "Sign in." } }),
    ).toBe(false);
    expect(
      isProviderDisplayable({ state: "error", error: { code: "auth", message: "Rejected" } }),
    ).toBe(false);
    expect(isProviderDisplayable({ state: "ok" })).toBe(true);
    expect(
      isProviderDisplayable({ state: "error", error: { code: "network", message: "Offline" } }),
    ).toBe(true);
  });

  test("recognizes legacy and current bridge-unavailable placeholders", () => {
    for (const message of [
      "The OpenCode plugin is not connected. If you just approved the extension, restart OpenCode or OpenChamber.",
      "The OpenCode plugin is unavailable. Approve the package and keep OpenCode running.",
      "The OpenCode plugin is unavailable; showing the last reading.",
    ]) {
      expect(
        isBridgeUnavailablePlaceholder({
          state: "error",
          error: { code: "provider_error", message },
        }),
      ).toBe(true);
    }
    expect(
      isBridgeUnavailablePlaceholder({
        state: "error",
        error: { code: "network", message: "The OpenCode plugin is unavailable." },
      }),
    ).toBe(false);
  });

  test("normalizes malformed values and keeps service tracking", () => {
    const value = normalizeSelection({
      saved: true,
      providers: ["x", 4],
      windows: { x: ["a", 2] },
      hiddenBalances: ["x", 9],
      cutoffPercent: 200,
      resetTime: "absolute",
      encounteredBridgeProviders: ["bridge-codex"],
      initializedBridgeWindows: ["bridge-codex", 3],
      explicitProviderSelections: ["bridge-codex"],
      explicitWindowSelections: ["bridge-codex"],
      providerOrder: ["bridge-codex"],
      collapsedQuota: { "bridge-codex": "earliest-reset" },
      collapsedProviders: ["bridge-codex", "bridge-codex", 4, ""],
    });
    expect(value.providers).toEqual(["x"]);
    expect(value.windows).toEqual({ x: ["a"] });
    expect(value.cutoffPercent).toBe(100);
    expect(value.resetTime).toBe("absolute");
    expect(value.quotaDisplay).toBe("remaining");
    expect(value.encounteredBridgeProviders).toEqual(["bridge-codex"]);
    expect(value.initializedBridgeWindows).toEqual(["bridge-codex"]);
    expect(value.providerOrder).toEqual(["bridge-codex"]);
    expect(value.collapsedQuota).toEqual({ "bridge-codex": "earliest-reset" });
    expect(value.collapsedProviders).toEqual(["bridge-codex"]);
  });

  test("first-use toggles start from every visible item", () => {
    const available = [
      { id: "tavily", windows: ["plan"] },
      { id: "openrouter", windows: ["limit"] },
    ];
    const withoutTavily = toggleProvider(DEFAULT_SELECTION, "tavily", available);
    expect(withoutTavily.providers).toEqual(["openrouter"]);
    expect(withoutTavily.windows).toEqual({ tavily: ["plan"], openrouter: ["limit"] });

    const withoutPlan = toggleWindow(DEFAULT_SELECTION, "tavily", "plan", available);
    expect(withoutPlan.providers).toEqual(["tavily", "openrouter"]);
    expect(withoutPlan.windows.tavily).toEqual([]);
  });

  test("a saved empty selection stays empty", () => {
    const empty = { ...DEFAULT_SELECTION, saved: true, providers: [], windows: {} };
    expect(isProviderVisible(empty, "tavily")).toBe(false);
    expect(isWindowVisible(empty, "tavily", "plan")).toBe(false);
    expect(toggleWindow(empty, "tavily", "plan").windows.tavily).toEqual(["plan"]);
  });

  test("enabling a saved provider adds its current windows", () => {
    const saved = {
      ...DEFAULT_SELECTION,
      saved: true,
      providers: ["openrouter"],
      windows: { openrouter: ["limit"] },
    };
    const next = toggleProvider(saved, "tavily", [
      { id: "tavily", windows: ["plan"] },
      { id: "openrouter", windows: ["limit"] },
    ]);
    expect(next.providers).toEqual(["openrouter", "tavily"]);
    expect(next.windows.tavily).toEqual(["plan"]);
  });

  test("balances can be hidden per provider without hiding providers", () => {
    const hidden = setBalancesHidden(DEFAULT_SELECTION, "tavily", true);
    expect(isBalanceVisible(hidden, "tavily")).toBe(false);
    expect(isBalanceVisible(hidden, "openrouter")).toBe(true);
    expect(hidden.saved).toBe(false);
  });

  test("cutoff and reset time do not save a provider selection", () => {
    expect(setCutoff(DEFAULT_SELECTION, 20).cutoffPercent).toBe(20);
    expect(setResetTime(DEFAULT_SELECTION, "absolute").resetTime).toBe("absolute");
    expect(setQuotaDisplay(DEFAULT_SELECTION, "used").quotaDisplay).toBe("used");
    expect(setCutoff(DEFAULT_SELECTION, 20).saved).toBe(false);
    expect(setResetTime(DEFAULT_SELECTION, "absolute").saved).toBe(false);
    expect(setQuotaDisplay(DEFAULT_SELECTION, "used").saved).toBe(false);
  });

  test("a newly added provider is enabled without overwriting a retained window list", () => {
    const saved = {
      ...DEFAULT_SELECTION,
      saved: true,
      providers: ["tavily"],
      windows: { tavily: ["plan"] },
    };
    const added = addProvider(saved, "openrouter", ["limit", "weekly"]);
    expect(added.providers).toEqual(["tavily", "openrouter"]);
    expect(added.windows.openrouter).toEqual(["limit", "weekly"]);
    expect(addProvider(saved, "tavily", ["plan", "key"]).windows.tavily).toEqual(["plan"]);
  });

  test("changesFor sends only touched fields", () => {
    const next = setQuotaDisplay(DEFAULT_SELECTION, "used");
    expect(changesFor(DEFAULT_SELECTION, next)).toEqual({
      quotaDisplay: "used",
    });
  });

  test("provider order moves visible providers and preserves unavailable positions", () => {
    const available = ["bridge-openrouter", "bridge-opencode-go", "bridge-tavily"];
    const moved = moveProvider(DEFAULT_SELECTION, "bridge-opencode-go", -1, available);
    expect(moved.providerOrder).toEqual([
      "bridge-opencode-go",
      "bridge-openrouter",
      "bridge-tavily",
    ]);
    const withOrder = {
      ...DEFAULT_SELECTION,
      providerOrder: ["bridge-tavily", "bridge-openrouter", "bridge-codex"],
    };
    expect(moveProvider(withOrder, "bridge-openrouter", 1, available).providerOrder).toEqual([
      "bridge-tavily",
      "bridge-opencode-go",
      "bridge-codex",
      "bridge-openrouter",
    ]);
  });

  test("collapsed quota configuration is keyed per provider", () => {
    const next = setCollapsedQuota(DEFAULT_SELECTION, "bridge-codex", "earliest-reset");
    expect(next.collapsedQuota).toEqual({ "bridge-codex": "earliest-reset" });
    expect(changesFor(DEFAULT_SELECTION, next)).toEqual({
      collapsedQuota: { "bridge-codex": "earliest-reset" },
    });
  });

  test("encounter does not initialize windows; first success initializes once", () => {
    const encountered = reconcileFirstSuccess(DEFAULT_SELECTION, [
      bridgeProvider("bridge-codex", "error"),
      bridgeProvider("bridge-openrouter", "unconfigured"),
    ]);
    expect([...encountered.encounteredBridgeProviders].sort()).toEqual([
      "bridge-codex",
      "bridge-openrouter",
    ]);
    expect(encountered.initializedBridgeWindows).toEqual([]);
    expect(encountered.windows).toEqual({});

    const firstSuccess = reconcileFirstSuccess(encountered, [
      bridgeProvider("bridge-codex", "ok", ["5h", "7d"]),
    ]);
    expect(firstSuccess.windows["bridge-codex"]).toEqual(["5h", "7d"]);
    expect(firstSuccess.initializedBridgeWindows).toEqual(["bridge-codex"]);

    const newWindow = reconcileFirstSuccess(firstSuccess, [
      bridgeProvider("bridge-codex", "ok", ["5h", "7d", "30d"]),
    ]);
    expect(newWindow).toBe(firstSuccess);
    expect(newWindow.windows["bridge-codex"]).toEqual(["5h", "7d"]);
  });

  test("an error-only reading does not consume first-success window initialization", () => {
    const errorOnly = bridgeProvider("bridge-codex", "ok");
    errorOnly.windows = [{
      id: "5h",
      label: "5h",
      error: { code: "bad_response", message: "Usage unavailable." },
    }];
    const first = reconcileFirstSuccess(DEFAULT_SELECTION, [errorOnly]);
    expect(first.initializedBridgeWindows).toEqual([]);
    expect(first.windows["bridge-codex"]).toBeUndefined();

    const usable = reconcileFirstSuccess(first, [
      bridgeProvider("bridge-codex", "ok", ["5h", "7d"]),
    ]);
    expect(usable.initializedBridgeWindows).toEqual(["bridge-codex"]);
    expect(usable.windows["bridge-codex"]).toEqual(["5h", "7d"]);
  });

  test("an explicit hide or empty window list before data survives first success", () => {
    const hidden = {
      ...DEFAULT_SELECTION,
      saved: true,
      providers: [],
      explicitProviderSelections: ["bridge-codex", "bridge-openrouter"],
      explicitWindowSelections: ["bridge-openrouter"],
      windows: { "bridge-openrouter": [] },
    };
    const next = reconcileFirstSuccess(hidden, [
      bridgeProvider("bridge-codex", "ok", ["5h"]),
      bridgeProvider("bridge-openrouter", "ok", ["limit"]),
    ]);
    expect(next.providers).toEqual([]);
    expect(next.windows["bridge-openrouter"]).toEqual([]);
    expect(next.windows["bridge-codex"]).toEqual(["5h"]);
  });

  test("a newly encountered provider is default-enabled unless explicitly hidden", () => {
    const saved = {
      ...DEFAULT_SELECTION,
      saved: true,
      providers: ["bridge-openrouter"],
      explicitProviderSelections: ["bridge-codex"],
    };
    const next = reconcileFirstSuccess(saved, [
      bridgeProvider("bridge-codex", "error"),
      bridgeProvider("bridge-openrouter", "ok", ["limit"]),
    ]);
    expect(next.providers).toContain("bridge-openrouter");
    expect(next.providers).not.toContain("bridge-codex");
  });
});
