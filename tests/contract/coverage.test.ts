import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ADAPTERS } from "../../src/providers/index.ts";
import { PROVIDER_KINDS } from "../../src/core/types.ts";

const root = new URL("../../", import.meta.url);

describe("provider coverage", () => {
  test("exactly the REQ 2 providers are registered", () => {
    expect(Object.keys(ADAPTERS).sort()).toEqual([...PROVIDER_KINDS].sort());
  });

  test("every adapter has a minimum interval and a fetch", () => {
    for (const adapter of Object.values(ADAPTERS)) {
      expect(adapter.minIntervalMs).toBeGreaterThan(0);
      expect(typeof adapter.fetch).toBe("function");
    }
    expect(ADAPTERS.tavily.minIntervalMs).toBe(300_000);
    expect(ADAPTERS.openrouter.minIntervalMs).toBe(300_000);
    expect(ADAPTERS.codex.minIntervalMs).toBe(300_000);
    expect(ADAPTERS["opencode-go"].minIntervalMs).toBe(300_000);
    expect(ADAPTERS["opencode-zen"].minIntervalMs).toBe(300_000);
    expect(ADAPTERS.custom.minIntervalMs).toBe(300_000);
  });

  test("the manifest keeps the surface contributions and adds the OpenCode plugin", async () => {
    const manifest = JSON.parse(await readFile(new URL("package.json", root), "utf8")) as {
      openchamber: {
        contributes: Record<string, unknown> & {
          service?: { provides?: string[] };
        };
      };
    };
    const contributes = manifest.openchamber.contributes;
    expect(contributes.statusSection).toBeDefined();
    expect(contributes.page).toBeDefined();
    expect(contributes.service).toBeDefined();
    expect(contributes.opencodePlugin).toBe("src/opencode-plugin");
    expect(contributes.quota).toBeUndefined();
    expect(contributes.service?.provides).toBeUndefined();
  });

  test("the built plugin is self-contained and uses no node:https or installed packages", async () => {
    const built = await readFile(
      path.join(new URL(".", root).pathname, "src/opencode-plugin/index.js"),
      "utf8",
    );
    expect(built).not.toContain("node:https");
    expect(built).not.toContain("@openchamber/sdk");
    expect(built).not.toContain("require(\"opencode");
    expect(built).toContain("openchamber.quota-display");
    expect(built).toContain("/bridge/state");
    expect(built).toContain("integration");
  });
});
