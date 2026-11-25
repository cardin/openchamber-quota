import { describe, expect, test } from "bun:test";
import { renderBalance, renderCap } from "../../src/section/view/window.ts";

describe("US3 integration", () => {
  test("cap is a bar, balance is a number, neither invents a reset", () => {
    const cap = renderCap({ id: "c", label: "Monthly spend", used: 12.5, limit: 50, unit: "USD" });
    expect(cap).toContain("quota-bar");
    expect(cap).toContain("no reset");
    expect(cap).not.toContain("resets");

    const balance = renderBalance({ id: "b", label: "Credit", value: 25, unit: "USD" });
    expect(balance).not.toContain("quota-bar");
    expect(balance).not.toContain("resets");
    expect(balance).not.toContain("benchmark");
  });
});
