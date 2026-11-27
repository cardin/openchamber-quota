import { describe, expect, test } from "bun:test";
import { BRIDGE_PROVIDERS, BridgeTiming, bridgeMinimums, MANAGED_KINDS } from "../../src/core/bridge.ts";

describe("bridge constants", () => {
  test("declares the fixed timing budgets", () => {
    expect(BridgeTiming).toEqual({
      fetchIntervalMs: 300_000,
      statePollMs: 1_000,
      fetchTimeoutMs: 10_000,
      publicationAllowanceMs: 1_000,
      refreshTimeoutMs: 12_000,
      sectionWaitMs: 15_000,
      staleAfterMs: 600_000,
    });
    expect("pendingPollMs" in BridgeTiming).toBe(false);
  });

  test("declares six stable provider rows", () => {
    expect(BRIDGE_PROVIDERS.map((row) => row.id)).toEqual([
      "openrouter",
      "opencode-go",
      "opencode",
      "openai",
      "tavily",
      "exa",
    ]);
    expect(BRIDGE_PROVIDERS.map((row) => row.connectionId)).toEqual([
      "bridge-openrouter",
      "bridge-opencode-go",
      "bridge-opencode-zen",
      "bridge-codex",
      "bridge-tavily",
      "bridge-exa",
    ]);
    expect(BRIDGE_PROVIDERS.find((row) => row.id === "openai")?.label).toBe("OpenAI");
    expect(bridgeMinimums()).toEqual({
      openrouter: 300_000,
      "opencode-go": 300_000,
      opencode: 300_000,
      openai: 300_000,
      tavily: 300_000,
      exa: 300_000,
    });
  });

  test("the OpenCode-owned kinds are managed", () => {
    expect([...MANAGED_KINDS].sort()).toEqual([
      "codex",
      "exa",
      "opencode-go",
      "opencode-zen",
      "openrouter",
      "tavily",
    ]);
  });
});
