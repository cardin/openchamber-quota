import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";
import { renderConnections } from "../../src/section/view/connections.ts";
import { renderProvider } from "../../src/section/view/window.ts";
import { NOW, RESET } from "../fixtures/provider.ts";

const sectionCss = readFileSync(new URL("../../src/section/style.css", import.meta.url), "utf8");
const settingsCss = readFileSync(new URL("../../src/settings/style.css", import.meta.url), "utf8");

const tokens = {
  light: {
    bg: "#faf9f7",
    fg: "#262521",
    muted: "#696960",
    border: "rgba(229,225,222,.75)",
    primary: "#b35017",
    warning: "#886914",
    error: "#b7493f",
    elevated: "#f3f2f0",
    hover: "rgba(38,37,33,.08)",
  },
  dark: {
    bg: "#0e0c0b",
    fg: "#ebe7dc",
    muted: "#9a978d",
    border: "rgba(36,35,35,.75)",
    primary: "#da7c47",
    warning: "#c67f13",
    error: "#da5b4a",
    elevated: "#1b1918",
    hover: "rgba(235,231,220,.08)",
  },
} as const;

const pageFor = (theme: keyof typeof tokens, withBars: boolean): string => {
  const t = tokens[theme];
  const bars = withBars
    ? renderProvider(
        {
          connectionId: "fixture",
          kind: "tavily",
          label: "Tavily",
          state: "ok",
          refreshing: false,
          windows: [
            { id: "default", label: "Default", remainingPercent: 90, resetAt: RESET, durationSeconds: 86_400 },
            { id: "warning", label: "Warning", remainingPercent: 25, resetAt: RESET, durationSeconds: 86_400 },
            { id: "danger", label: "Danger", remainingPercent: 5, resetAt: RESET, durationSeconds: 86_400 },
          ],
          caps: [{ id: "cap", label: "Spend", used: 12, limit: 50, unit: "USD" }],
          balances: [{ id: "balance", label: "Credit", value: 11, unit: "USD" }],
        },
        DEFAULT_SELECTION,
        NOW,
      )
    : "";
  return `<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8">
    <style>
      :root {
        --oc-bg:${t.bg}; --oc-fg:${t.fg}; --oc-muted:${t.muted};
        --oc-border:${t.border}; --oc-primary:${t.primary};
        --oc-warning:${t.warning}; --oc-error:${t.error};
        --oc-elevated:${t.elevated}; --oc-hover:${t.hover};
        --oc-font:system-ui,sans-serif; --oc-radius:8px;
      }
      ${sectionCss}
      ${settingsCss}
    </style></head><body><div id="root">
      ${renderConnections([])}
      ${bars}
    </div></body></html>`;
};

const color = (value: string) => {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(",").map(Number);
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
};

const composite = (fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number; a: number }) => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
});

const luminance = (value: { r: number; g: number; b: number }) => {
  const channel = (raw: number) => {
    const v = raw / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(value.r) + 0.7152 * channel(value.g) + 0.0722 * channel(value.b);
};

const contrast = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) => {
  const left = luminance(a);
  const right = luminance(b);
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
};

for (const theme of ["light", "dark"] as const) {
  test(`${theme} theme meets text and bar contrast`, async ({ page }) => {
    await page.setContent(pageFor(theme, true));
    const result = await page.evaluate(() => {
      const parse = (value: string) => {
        const match = value.match(/rgba?\(([^)]+)\)/);
        if (!match) return null;
        const parts = match[1].split(",").map(Number);
        return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
      };
      const style = (selector: string, prop: string) => {
        const element = document.querySelector(selector);
        return element ? getComputedStyle(element)[prop as "color"] : null;
      };
      const body = parse(getComputedStyle(document.body).backgroundColor);
      const section = parse(style(".quota-settings-section", "backgroundColor") ?? "") ?? body;
      const text = (selector: string) => parse(style(selector, "color") ?? "");
      const bars = [...document.querySelectorAll(".quota-bar")].map((bar) => {
        const fill = bar.querySelector(".quota-fill");
        const track = parse(getComputedStyle(bar).backgroundColor);
        return {
          fill: fill ? parse(getComputedStyle(fill).backgroundColor) : null,
          track,
          state: bar.className,
        };
      });
      return {
        body,
        section,
        text: {
          note: text(".quota-section-note"),
          label: text(".quota-field"),
          value: text(".quota-value"),
          reset: text(".quota-reset"),
          button: text(".quota-form button"),
        },
        bars,
      };
    });
    expect(result.body).not.toBeNull();
    const background = result.section ?? result.body!;
    for (const value of Object.values(result.text)) {
      if (!value) continue;
      expect(contrast(composite(value, background), background)).toBeGreaterThanOrEqual(4.5);
    }
    for (const bar of result.bars) {
      if (!bar.fill || !bar.track) continue;
      expect(contrast(composite(bar.fill, background), composite(bar.track, background))).toBeGreaterThanOrEqual(3);
    }
  });
}

test("settings tab order is logical and skips hidden controls", async ({ page }) => {
  await page.setContent(pageFor("light", false));
  await page.locator('select[name="kind"]').focus();
  const order: Array<{ tag: string; name: string | null; action: string | null; hidden: boolean }> = [];
  for (let i = 0; i < 5; i++) {
    order.push(await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return {
        tag: active?.tagName ?? "BODY",
        name: active?.getAttribute("name") ?? null,
        action: active?.getAttribute("data-action") ?? null,
        hidden: active?.hidden ?? false,
      };
    }));
    await page.keyboard.press("Tab");
  }
  expect(order).toEqual([
    { tag: "SELECT", name: "kind", action: null, hidden: false },
    { tag: "INPUT", name: "label", action: null, hidden: false },
    { tag: "INPUT", name: "apiKey", action: null, hidden: false },
    { tag: "BUTTON", name: null, action: "toggle-key", hidden: false },
    { tag: "BUTTON", name: null, action: "save-connection", hidden: false },
  ]);
  await expect(page.locator('select[name="kind"] option[value="custom"]')).toHaveCount(0);
  await expect(page.locator('select[name="kind"] option[value="codex"]')).toHaveCount(0);
  await expect(page.locator('select[name="kind"] option[value="opencode-zen"]')).toHaveCount(0);
});

test("representative bars render warning, danger, and a benchmark", async ({ page }) => {
  await page.setContent(pageFor("light", true));
  await expect(page.locator(".quota-bar.state-warning")).toHaveCount(1);
  await expect(page.locator(".quota-bar.state-danger")).toHaveCount(1);
  await expect(page.locator(".quota-bar.state-default")).toHaveCount(1);
  await expect(page.locator(".quota-benchmark")).toHaveCount(3);
});
