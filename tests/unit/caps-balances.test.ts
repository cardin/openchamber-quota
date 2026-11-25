import { describe, expect, test } from "bun:test";
import { capOrBalance, capRemaining, capRemainingPercent } from "../../src/core/normalize.ts";
import { renderCap, renderBalance } from "../../src/section/view/window.ts";

describe("caps and balances", () => {
  test("remaining cap clamps and balance preserves debt", () => {
    const unused = { id: "a", label: "A", used: 0, limit: 10, unit: "USD" };
    expect(capRemaining(unused)).toBe(10);
    expect(capRemainingPercent(unused)).toBe(100);
    const over = { id: "a", label: "A", used: 20, limit: 10, unit: "USD" };
    expect(capRemaining(over)).toBe(0);
    expect(capRemainingPercent(over)).toBe(0);
    const html = renderBalance({ id: "b", label: "Debt", value: -2, unit: "USD" });
    expect(html).toContain("-");
    expect(html).not.toContain("quota-bar");
  });

  test("cap bar shows remaining and maximum without reset", () => {
    const html = renderCap({ id: "c", label: "Spend", used: 5, limit: 20, unit: "USD" });
    expect(html).toContain("width:75.00%");
    expect(html).toContain("$15.00 / $20.00");
    expect(html).toContain("75% remaining");
    expect(html).toContain("no reset");
    expect(html).not.toContain("quota-benchmark");
  });

  test("a cap without a maximum becomes a balance", () => {
    const value = capOrBalance({ id: "c", label: "Used", used: 5, limit: null, unit: "USD" });
    expect(value).toHaveProperty("value", 5);
    expect(value).not.toHaveProperty("limit");
  });
});
