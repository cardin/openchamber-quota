import { describe, expect, test } from "bun:test";
import { ADAPTERS } from "../../src/providers/index.ts";
import { PROVIDER_KINDS } from "../../src/core/types.ts";

describe("provider coverage", () => {
  test("exactly the REQ 2 providers are registered", () => {
    expect(Object.keys(ADAPTERS).sort()).toEqual([...PROVIDER_KINDS].sort());
  });

  test("every adapter has a minimum interval and a fetch", () => {
    for (const adapter of Object.values(ADAPTERS)) {
      expect(adapter.minIntervalMs).toBeGreaterThan(0);
      expect(typeof adapter.fetch).toBe("function");
    }
    expect(ADAPTERS.tavily.minIntervalMs).toBe(10 * 60_000);
    expect(ADAPTERS.openrouter.minIntervalMs).toBe(5 * 60_000);
    expect(ADAPTERS.codex.minIntervalMs).toBe(5 * 60_000);
    expect(ADAPTERS["opencode-go"].minIntervalMs).toBe(5 * 60_000);
    expect(ADAPTERS["opencode-zen"].minIntervalMs).toBe(5 * 60_000);
  });
});
