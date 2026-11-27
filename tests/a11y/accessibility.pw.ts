import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { DEFAULT_SELECTION } from "../../src/core/types.ts";
import { renderConnections } from "../../src/section/view/connections.ts";
import { renderSelector } from "../../src/section/view/selector.ts";
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

test("settings has no manual provider key form", async ({ page }) => {
  await page.setContent(pageFor("light", false));
  await expect(page.locator('input[name="apiKey"]')).toHaveCount(0);
  await expect(page.locator('select[name="kind"]')).toHaveCount(0);
  await expect(page.locator('[data-action="save-connection"]')).toHaveCount(0);
  await expect(page.getByText("Manage provider sign-ins and keys in OpenCode.")).toBeVisible();
});

test("settings provider table shows auth errors without listing unconfigured providers", async ({ page }) => {
  const t = tokens.light;
  const snapshot = {
    version: 1 as const,
    generatedAt: "2026-11-23T12:00:00Z",
    providers: [
      {
        connectionId: "bridge-exa",
        kind: "exa" as const,
        label: "Exa",
        state: "error" as const,
        windows: [],
        caps: [],
        balances: [],
        refreshing: false,
        error: {
          code: "auth" as const,
          message: "Exa needs a Team Management service key in OpenCode to read credits.",
        },
      },
      {
        connectionId: "bridge-opencode-go",
        kind: "opencode-go" as const,
        label: "OpenCode Go",
        state: "unconfigured" as const,
        windows: [],
        caps: [],
        balances: [],
        refreshing: false,
        error: { code: "not_configured" as const, message: "Sign in through OpenCode." },
      },
    ],
  };
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8">
    <style>
      :root {
        --oc-bg:${t.bg}; --oc-fg:${t.fg}; --oc-muted:${t.muted};
        --oc-border:${t.border}; --oc-primary:${t.primary};
        --oc-warning:${t.warning}; --oc-error:${t.error};
        --oc-elevated:${t.elevated}; --oc-hover:${t.hover};
        --oc-font:system-ui,sans-serif; --oc-radius:8px;
      }
      ${sectionCss}${settingsCss}
    </style></head><body><div id="root">${renderConnections([], snapshot)}</div></body></html>`);
  await page.setViewportSize({ width: 360, height: 700 });
  await expect(page.getByRole("table")).toHaveCount(1);
  await expect(page.getByText("Authentication failed")).toBeVisible();
  await expect(page.getByText("Team Management service key")).toBeVisible();
  await expect(page.locator('[data-provider-row="bridge-opencode-go"]')).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(false);
});

test("provider header covers the logo-to-name gap and swaps in the chevron", async ({ page }) => {
  await page.setContent(pageFor("light", true));
  const button = page.locator(".quota-provider-toggle").first();
  await expect(button).toHaveAttribute("aria-expanded", "true");

  await button.hover();
  await expect(button.locator(".quota-provider-chevron")).toBeVisible();
  await expect(button.locator(".quota-provider-logo")).toBeHidden();

  const box = await button.boundingBox();
  const icon = await button.locator(".quota-provider-icon").boundingBox();
  const name = await button.locator(".quota-provider-name").boundingBox();
  expect(box && icon && name).toBeTruthy();
  if (!box || !icon || !name) return;
  const gapX = (icon.x + icon.width + name.x) / 2;
  expect(gapX).toBeGreaterThanOrEqual(box.x);
  expect(gapX).toBeLessThanOrEqual(box.x + box.width);
  await page.evaluate(() => {
    const target = document.querySelector<HTMLButtonElement>(".quota-provider-toggle");
    target?.addEventListener("click", () => {
      target.setAttribute(
        "aria-expanded",
        target.getAttribute("aria-expanded") === "true" ? "false" : "true",
      );
    });
  });
  await page.mouse.click(gapX, name.y + name.height / 2);
  await expect(button).toHaveAttribute("aria-expanded", "false");
});

test("shared display controls and transient/stale statuses are accessible", async ({ page }) => {
  const snapshot = {
    version: 1 as const,
    generatedAt: "2026-11-23T12:00:00Z",
    providers: [
      {
        connectionId: "bridge-openrouter",
        kind: "openrouter" as const,
        label: "OpenRouter",
        state: "error" as const,
        windows: [],
        caps: [],
        balances: [],
        refreshing: false,
        error: {
          code: "network" as const,
          message:
            "OpenRouter did not respond. This message is intentionally long to verify that status text wraps inside the Quotas panel instead of overflowing.",
        },
      },
      {
        connectionId: "bridge-codex",
        kind: "codex" as const,
        label: "OpenAI",
        state: "ok" as const,
        windows: [{
          id: "primary",
          label: "5h",
          remainingPercent: 35,
          resetAt: "2026-11-23T11:59:00Z",
          durationSeconds: 18_000,
        }],
        caps: [],
        balances: [],
        fetchedAt: "2026-11-23T11:00:00Z",
        refreshing: false,
        error: {
          code: "provider_error" as const,
          message: "The OpenCode plugin is unavailable; showing the last reading.",
        },
      },
    ],
  };
  const content = `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <style>${sectionCss}${settingsCss}</style></head><body><div id="root">
      ${renderSelector(snapshot, DEFAULT_SELECTION)}
      ${snapshot.providers.map((provider) => renderProvider(provider, DEFAULT_SELECTION, NOW)).join("")}
    </div></body></html>`;
  await page.setContent(content);
  await page.setViewportSize({ width: 320, height: 700 });

  await expect(page.locator("[data-quota-display]")).toHaveCount(1);
  await expect(page.locator("[data-cutoff]")).toHaveCount(1);
  await expect(page.locator("[data-reset-time]")).toHaveCount(1);
  await expect(page.locator('[data-action="move-provider-up"]')).toHaveCount(2);
  await expect(page.locator("[data-collapsed-quota]")).toHaveCount(1);
  await expect(page.locator('[data-provider="bridge-codex"] .quota-provider-toggle')).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.locator('[data-provider="bridge-codex"] .quota-historical')).toHaveCount(1);
  await expect(page.locator('[data-provider="bridge-codex"] .quota-historical')).toHaveAttribute(
    "data-historical",
    "true",
  );
  await expect(page.locator('[data-provider="bridge-openrouter"] .quota-error')).toContainText(
    "OpenRouter did not respond",
  );
  await expect(page.locator('[data-provider="bridge-openrouter"] .quota-error')).toHaveCSS(
    "white-space",
    "normal",
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(false);
  await expect(page.locator('[data-provider="bridge-openrouter"] .quota-bar')).toHaveCount(0);
  await expect(page.locator('[data-provider="bridge-codex"] .quota-stale')).toContainText(
    "showing the last reading",
  );
  await expect(page.locator('[data-provider="bridge-codex"] .quota-benchmark')).toHaveCount(0);
  await expect(page.locator('[data-provider="bridge-codex"] [role="img"]')).toHaveAttribute(
    "aria-label",
    /last sampled 35% remaining/,
  );
});

test("representative bars render warning, danger, and a benchmark", async ({ page }) => {
  await page.setContent(pageFor("light", true));
  await expect(page.locator(".quota-bar.state-warning")).toHaveCount(1);
  await expect(page.locator(".quota-bar.state-danger")).toHaveCount(1);
  await expect(page.locator(".quota-bar.state-default")).toHaveCount(1);
  await expect(page.locator(".quota-benchmark")).toHaveCount(3);
});
