import { describe, expect, test } from "bun:test";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";
import { selectedProviderIds, selectedWindowIds } from "../../src/core/normalize.ts";
import {
  loadSelection,
  saveSelection,
  toggleProvider,
  toggleWindow,
} from "../../src/section/preferences.ts";

const memory = () => {
  const values = new Map<string, unknown>();
  return {
    get: async (key: string) => values.get(key),
    set: async (key: string, value: unknown) => {
      values.set(key, value);
    },
  };
};

describe("US2 integration", () => {
  test("first use shows all; unchecking one keeps the rest and persists", async () => {
    const storage = memory();
    const providers = ["tavily", "openrouter"];
    const windows = { tavily: ["plan"], openrouter: ["limit"] };
    const available = [
      { id: "tavily", windows: windows.tavily },
      { id: "openrouter", windows: windows.openrouter },
    ];
    expect(selectedProviderIds(DEFAULT_SELECTION, providers)).toEqual(providers);
    expect(selectedWindowIds(DEFAULT_SELECTION, "tavily", windows.tavily)).toEqual(windows.tavily);

    let selection = toggleProvider(DEFAULT_SELECTION, "tavily", available);
    selection = toggleWindow(selection, "tavily", "plan", available);
    await saveSelection(storage, selection);
    const restored = await loadSelection(storage);
    expect(selectedProviderIds(restored, providers)).toEqual(["openrouter"]);
    expect(selectedWindowIds(restored, "tavily", ["plan", "key"])).toEqual([]);
    expect(selectedWindowIds(restored, "openrouter", ["limit"])).toEqual(["limit"]);
  });
});
