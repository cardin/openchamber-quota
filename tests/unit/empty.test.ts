import { describe, expect, test } from "bun:test";
import type { ProviderSnapshot } from "../../src/core/types.ts";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";
import { renderEmpty } from "../../src/section/view/empty.ts";
import { renderProvider } from "../../src/section/view/window.ts";
import { NOW } from "../fixtures/provider.ts";

describe("empty states", () => {
  test("no configured provider shows the setup hint", () => {
    const html = renderEmpty(false, false);
    expect(html).toContain("No providers configured.");
    expect(html).toContain("Quota settings");
  });

  test("a selection that hides every quota shows the selection hint", () => {
    const html = renderEmpty(true, false);
    expect(html).toContain("All quotas are hidden.");
    expect(html).toContain("Quota settings");
  });

  test("a successful provider with no values shows its provider message", () => {
    const provider: ProviderSnapshot = {
      connectionId: "empty",
      kind: "custom",
      label: "Empty",
      state: "ok",
      windows: [],
      caps: [],
      balances: [],
      refreshing: false,
    };
    const html = renderProvider(provider, DEFAULT_SELECTION, NOW);
    expect(html).toContain("No quota windows reported.");
    expect(html).not.toContain("quota-error");
  });
});
