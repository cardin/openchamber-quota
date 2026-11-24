import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../../src/section/style.css", import.meta.url), "utf8");

describe("panel style contract", () => {
  test("warning and danger bars use their own colors", () => {
    expect(css).toContain("--oc-warning");
    expect(css).toContain("--oc-error");
    expect(css).toMatch(/state-warning \.quota-fill \{[^}]*background-color/);
    expect(css).toMatch(/state-danger \.quota-fill \{[^}]*background-color/);
    expect(css).not.toMatch(/state-warning \.quota-fill \{[^}]*background-image/);
    expect(css).not.toMatch(/state-danger \.quota-fill \{[^}]*background-image/);
  });

  test("window status text starts at the bar column", () => {
    expect(css).toMatch(/quota-status-text\s*\{[^}]*grid-column:\s*2 \/ -1/);
  });
});
