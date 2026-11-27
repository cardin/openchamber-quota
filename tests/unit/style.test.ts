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

  test("provider marks use the 10px panel size and share the header hitbox", () => {
    expect(css).toMatch(/quota-provider-icon \{[^}]*width: 10px;[^}]*height: 10px;/);
    expect(css).toMatch(/quota-provider-icon \{[^}]*left: 0;/);
    expect(css).toMatch(/quota-provider-toggle \{[^}]*margin-left: -20px;[^}]*padding: 0 0 0 20px;/);
    expect(css).toMatch(/quota-provider-toggle \{[^}]*width: calc\(100% \+ 20px\)/);
  });

  test("hovering the provider name swaps the logo for the collapse chevron", () => {
    expect(css).toMatch(/quota-provider-toggle:hover \.quota-provider-logo[^{]*\{[^}]*display: none/);
    expect(css).toMatch(/quota-provider-toggle:hover \.quota-provider-chevron[^{]*\{[^}]*display: inline-flex/);
    expect(css).toMatch(/quota-provider-toggle\[aria-expanded="false"\] \.quota-provider-chevron \{[^}]*transform: rotate\(-90deg\)/);
    expect(css).toMatch(/quota-provider-summary \{[^}]*margin-left: auto/);
  });

  test("refreshing uses an inline animated glyph", () => {
    expect(css).toMatch(/quota-provider-refresh \{[^}]*display: inline-flex/);
    expect(css).toMatch(/quota-spinner \{[^}]*animation: quota-spin/);
    expect(css).toContain("@keyframes quota-spin");
  });

  test("window status text starts at the bar column", () => {
    expect(css).toMatch(/quota-status-text\s*\{[^}]*grid-column:\s*2 \/ -1/);
  });
});
