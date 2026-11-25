import { describe, expect, test } from "bun:test";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";
import { renderCap, renderWindow } from "../../src/section/view/window.ts";
import { NOW, RESET } from "../fixtures/provider.ts";

describe("accessibility", () => {
  test("bars expose a role and an accessible label", () => {
    const window = renderWindow(
      { id: "x", label: "Daily", remainingPercent: 25, resetAt: RESET, durationSeconds: 86_400 },
      DEFAULT_SELECTION,
      NOW,
    );
    expect(window).toContain('role="img"');
    expect(window).toContain("aria-label=");
    expect(window).toContain("25% remaining");
  });

  test("warning and danger use distinct state classes", () => {
    const warning = renderWindow(
      { id: "x", label: "X", remainingPercent: 25, resetAt: RESET, durationSeconds: 86_400 },
      DEFAULT_SELECTION,
      NOW,
    );
    const danger = renderWindow(
      { id: "x", label: "X", remainingPercent: 5, resetAt: RESET, durationSeconds: 86_400 },
      DEFAULT_SELECTION,
      NOW,
    );
    expect(warning).toContain("state-warning");
    expect(danger).toContain("state-danger");
    expect(warning).not.toContain("state-danger");
  });

  test("caps have an accessible label", () => {
    const cap = renderCap({ id: "c", label: "Spend", used: 5, limit: 20, unit: "USD" });
    expect(cap).toContain('role="img"');
    expect(cap).toContain("aria-label=");
  });
});
