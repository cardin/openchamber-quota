import { describe, expect, test } from "bun:test";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";
import { selectedProviderIds, selectedWindowIds } from "../../src/core/normalize.ts";
import { toggleProvider, toggleWindow } from "../../src/section/preferences.ts";

describe("US2 integration", () => {
  test("first use shows all; unchecking one keeps the rest and persists", () => {
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
    expect(selectedProviderIds(selection, providers)).toEqual(["openrouter"]);
    expect(selectedWindowIds(selection, "tavily", ["plan", "key"])).toEqual([]);
    expect(selectedWindowIds(selection, "openrouter", ["limit"])).toEqual(["limit"]);
  });
});
