import { describe, expect, test } from "bun:test";
import type { ProviderSnapshot } from "../../src/core/types.ts";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";
import { renderEmpty } from "../../src/section/view/empty.ts";
import { renderProvider } from "../../src/section/view/window.ts";
import { NOW } from "../fixtures/provider.ts";

describe("empty states", () => {
  test("no configured provider shows the setup hint", () => {
    const html = renderEmpty(false, false);
    expect(html).toContain("No provider data yet.");
    expect(html).toContain("extension service starts");
  });

  test("a selection that hides every quota shows the selection hint", () => {
    const html = renderEmpty(true, false);
    expect(html).toContain("All quotas are hidden.");
    expect(html).toContain("Quota settings");
  });

  test("no signed-in provider shows sign-in guidance instead of hidden selections", () => {
    const html = renderEmpty(true, false, false);
    expect(html).toContain("No signed-in providers.");
    expect(html).toContain("Sign in to a provider in OpenCode");
    expect(html).not.toContain("All quotas are hidden.");
  });

  test("an authentication error sends the user to settings without naming the provider", () => {
    const html = renderEmpty(true, false, false, true);
    expect(html).toContain("A provider needs attention.");
    expect(html).toContain("Quota settings");
    expect(html).not.toContain("Sign in to a provider");
  });

  test("a disconnected plugin gets restart guidance", () => {
    const html = renderEmpty(true, false, false, false, true);
    expect(html).toContain("The OpenCode plugin is not connected.");
    expect(html).toContain("restart OpenCode or OpenChamber");
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
