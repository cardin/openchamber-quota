import { describe, expect, test } from "bun:test";
import {
  addProvider,
  isBalanceVisible,
  isProviderVisible,
  isWindowVisible,
  loadSelection,
  SELECTION_KEY,
  normalizeSelection,
  saveSelection,
  setBalancesHidden,
  setCutoff,
  setQuotaDisplay,
  setResetTime,
  toggleProvider,
  toggleWindow,
} from "../../src/section/preferences.ts";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";

const memory = () => {
  const values = new Map<string, unknown>();
  return {
    get: async (key: string) => values.get(key),
    set: async (key: string, value: unknown) => {
      values.set(key, value);
    },
  };
};

describe("preferences", () => {
  test("defaults to first use", async () => {
    const storage = memory();
    expect(await loadSelection(storage)).toEqual(DEFAULT_SELECTION);
    expect(isProviderVisible(DEFAULT_SELECTION, "anything")).toBe(true);
  });

  test("saves the quota display mode without changing provider or window selection", async () => {
    const storage = memory();
    await storage.set(SELECTION_KEY, { saved: false, quotaDisplay: "unknown" });
    const original = await loadSelection(storage);
    expect(original.quotaDisplay).toBe("remaining");

    await saveSelection(storage, setQuotaDisplay(original, "used"));
    expect(await loadSelection(storage)).toEqual({ ...original, quotaDisplay: "used" });

    const selected = toggleProvider(original, "tavily", [{ id: "tavily", windows: ["plan"] }]);
    await saveSelection(storage, setQuotaDisplay(selected, "used"));
    const restored = await loadSelection(storage);
    expect(restored).toEqual({ ...selected, quotaDisplay: "used" });
    await saveSelection(storage, setQuotaDisplay(restored, "remaining"));
    expect(await loadSelection(storage)).toEqual(selected);
  });

  test("saves selections and persists an empty selection", async () => {
    const storage = memory();
    let selection = toggleProvider(DEFAULT_SELECTION, "tavily");
    selection = toggleWindow(selection, "tavily", "daily");
    await saveSelection(storage, selection);
    const loaded = await loadSelection(storage);
    expect(loaded.saved).toBe(true);
    expect(isProviderVisible(loaded, "tavily")).toBe(true);
    expect(isWindowVisible(loaded, "tavily", "daily")).toBe(true);
    expect(isWindowVisible(loaded, "tavily", "weekly")).toBe(false);

    const empty = { ...loaded, providers: [], windows: {} };
    await saveSelection(storage, empty);
    expect(await loadSelection(storage)).toEqual(empty);
  });

  test("normalizes malformed values", () => {
    expect(normalizeSelection(null)).toEqual(DEFAULT_SELECTION);
    const value = normalizeSelection({
      saved: true,
      providers: ["x", 4],
      windows: { x: ["a", 2] },
      hiddenBalances: ["x", 9],
      cutoffPercent: 200,
      resetTime: "absolute",
    });
    expect(value.providers).toEqual(["x"]);
    expect(value.windows).toEqual({ x: ["a"] });
    expect(value.hiddenBalances).toEqual(["x"]);
    expect(value.cutoffPercent).toBe(100);
    expect(value.resetTime).toBe("absolute");
    expect(value.quotaDisplay).toBe("remaining");
  });

  test("migrates a legacy Tavily provider without a window list to all monthly windows", async () => {
    const storage = memory();
    await storage.set(SELECTION_KEY, {
      saved: true,
      providers: ["tavily"],
      windows: {},
      cutoffPercent: 10,
      resetTime: "relative",
    });
    const loaded = await loadSelection(storage);
    expect(loaded.windows.tavily).toEqual(["plan", "key", "paygo"]);
    expect(await storage.get(SELECTION_KEY)).toMatchObject({
      windows: { tavily: ["plan", "key", "paygo"] },
      tavilyMonthlyWindowsMigrated: true,
    });

    await saveSelection(storage, toggleWindow(loaded, "tavily", "key"));
    expect((await loadSelection(storage)).windows.tavily).toEqual(["plan", "paygo"]);
  });

  test("does not re-enable a deliberately empty Tavily window selection", async () => {
    const storage = memory();
    await storage.set(SELECTION_KEY, {
      saved: true,
      providers: ["tavily"],
      windows: { tavily: [] },
      cutoffPercent: 10,
      resetTime: "relative",
    });
    const loaded = await loadSelection(storage);
    expect(loaded.windows.tavily).toEqual([]);
  });

  test("leaves an existing plan-only choice unchanged", async () => {
    const storage = memory();
    await storage.set(SELECTION_KEY, {
      saved: true,
      providers: ["tavily"],
      windows: { tavily: ["plan"] },
    });
    expect((await loadSelection(storage)).windows.tavily).toEqual(["plan"]);
  });

  test("does not migrate current selections or re-run a completed migration", async () => {
    const storage = memory();
    await saveSelection(storage, toggleProvider(DEFAULT_SELECTION, "tavily"));
    expect((await loadSelection(storage)).windows.tavily).toBeUndefined();
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
    expect(withoutPlan.windows.openrouter).toEqual(["limit"]);
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
    expect(next.windows.openrouter).toEqual(["limit"]);
  });

  test("balances can be hidden per provider without changing provider visibility", () => {
    const hidden = setBalancesHidden(DEFAULT_SELECTION, "tavily", true);
    expect(isBalanceVisible(hidden, "tavily")).toBe(false);
    expect(isBalanceVisible(hidden, "openrouter")).toBe(true);
    expect(hidden.saved).toBe(false);
    const shown = setBalancesHidden(hidden, "tavily", false);
    expect(isBalanceVisible(shown, "tavily")).toBe(true);
  });

  test("cutoff and reset time do not change provider visibility", () => {
    const cutoff = setCutoff(DEFAULT_SELECTION, 20);
    expect(cutoff.cutoffPercent).toBe(20);
    expect(cutoff.saved).toBe(false);
    expect(isProviderVisible(cutoff, "anything")).toBe(true);

    const reset = setResetTime(DEFAULT_SELECTION, "absolute");
    expect(reset.resetTime).toBe("absolute");
    expect(reset.saved).toBe(false);
  });

  test("a newly added provider is enabled without overwriting a retained selection", () => {
    const saved = {
      ...DEFAULT_SELECTION,
      saved: true,
      providers: ["tavily"],
      windows: { tavily: ["plan"] },
    };
    const added = addProvider(saved, "openrouter", ["limit", "weekly"]);
    expect(added.providers).toEqual(["tavily", "openrouter"]);
    expect(added.windows.openrouter).toEqual(["limit", "weekly"]);

    const returning = addProvider(saved, "tavily", ["plan", "key"]);
    expect(returning.windows.tavily).toEqual(["plan"]);
  });
});
