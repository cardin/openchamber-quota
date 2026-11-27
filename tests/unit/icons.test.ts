import { describe, expect, test } from "bun:test";
import { providerIcon } from "../../src/section/view/icons.ts";

describe("provider icons", () => {
  test("Exa uses the brand logomark", () => {
    const icon = providerIcon("exa");
    expect(icon).toContain('class="quota-exa-mark"');
    expect(icon).toContain('viewBox="0 0 182 182"');
    expect(icon).toContain("M150.5 14.1064");
    expect(icon).not.toContain("<circle");
  });

  test("OpenCode uses the two-tone brand mark", () => {
    for (const kind of ["opencode-go", "opencode-zen"] as const) {
      const icon = providerIcon(kind);
      expect(icon).toContain('viewBox="0 0 300 300"');
      expect(icon).toContain('d="M180 240H60V120H180V240Z"');
      expect(icon).toContain('d="M180 60H60V240H180V60ZM240 300H0V0H240V300Z"');
      expect(icon).toContain('opacity=".45"');
      expect(icon).not.toContain("M22 24H2V0h20z");
    }
  });
});
